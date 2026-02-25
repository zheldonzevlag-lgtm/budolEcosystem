import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateResetToken } from '@/lib/auth'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(request) {
    try {
        const body = await request.json()
        const { email } = body

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            )
        }

        // Find user
        let user
        try {
            user = await prisma.user.findUnique({
                where: { email }
            })
        } catch (dbQueryError) {
            console.error('Database query error:', dbQueryError)
            
            // Check for connection errors
            if (dbQueryError.message?.includes('connect') || 
                dbQueryError.message?.includes('ECONNREFUSED') ||
                dbQueryError.code === 'P1001' ||
                dbQueryError.code === 'P1000') {
                return NextResponse.json(
                    { 
                        error: 'Database connection error',
                        details: 'Cannot connect to database. Please check your DATABASE_URL in .env file and ensure MySQL is running.',
                        help: 'Make sure WAMP MySQL service is running and DATABASE_URL is correct.'
                    },
                    { status: 500 }
                )
            }
            
            // Check for schema errors
            if (dbQueryError.message?.includes('Unknown column') || 
                dbQueryError.message?.includes('Table') ||
                dbQueryError.code === 'P2001') {
                return NextResponse.json(
                    { 
                        error: 'Database schema error',
                        details: 'Database schema is missing required fields. Please run: npx prisma migrate dev',
                        migrationFile: 'migration_auth.sql',
                        help: 'Run the migration to add the required columns to the User table.'
                    },
                    { status: 500 }
                )
            }
            
            throw dbQueryError
        }

        // Don't reveal if user exists or not (security best practice)
        if (!user) {
            return NextResponse.json({
                message: 'If an account with that email exists, a password reset link has been sent.'
            })
        }

        // Generate reset token
        const resetToken = generateResetToken()
        const resetTokenExpiry = new Date(new Date().getTime() + 60 * 60 * 1000) // 1 hour

        // Update user with reset token
        try {
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    resetToken,
                    resetTokenExpiry
                }
            })
        } catch (dbError) {
            console.error('Database update error:', dbError)
            console.error('Full error:', JSON.stringify(dbError, null, 2))
            
            // Check if it's a field missing error
            if (dbError.code === 'P2025') {
                return NextResponse.json(
                    { 
                        error: 'User not found',
                        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
                    },
                    { status: 404 }
                )
            }
            
            // Check for missing columns
            if (dbError.message?.includes('Unknown column') || 
                dbError.message?.includes('resetToken') ||
                dbError.code === 'P2001') {
                return NextResponse.json(
                    { 
                        error: 'Database schema error',
                        details: 'Please run the migration. Execute: npx prisma migrate dev or run migration_auth.sql in phpMyAdmin',
                        migrationFile: 'migration_auth.sql',
                        help: 'The resetToken and resetTokenExpiry columns are missing from the User table.'
                    },
                    { status: 500 }
                )
            }
            
            // Check for connection errors
            if (dbError.message?.includes('connect') || 
                dbError.message?.includes('ECONNREFUSED') ||
                dbError.code === 'P1001') {
                return NextResponse.json(
                    { 
                        error: 'Database connection error',
                        details: 'Cannot connect to database. Please check your DATABASE_URL in .env file and ensure MySQL is running.',
                        help: 'Make sure WAMP MySQL service is running and DATABASE_URL is correct.'
                    },
                    { status: 500 }
                )
            }
            
            throw dbError
        }

        // Send reset email (non-blocking - don't fail if email fails)
        try {
            await sendPasswordResetEmail(email, resetToken, user.name)
        } catch (emailError) {
            console.error('Email sending error (non-fatal):', emailError)
            // Continue even if email fails
        }
        
        // If email is not configured, include the reset link in the response
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            const encodedToken = encodeURIComponent(resetToken)
            const resetUrl = `${appUrl}/reset-password?token=${encodedToken}`
            return NextResponse.json({
                message: 'Password reset link generated. Check server console for the link.',
                resetLink: resetUrl,
                note: 'Email not configured. Link provided for testing.'
            })
        }

        return NextResponse.json({
            message: 'If an account with that email exists, a password reset link has been sent to your email.'
        })
    } catch (error) {
        console.error('Forgot password error:', error)
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            meta: error.meta,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        })
        
        // Provide more specific error messages
        let errorMessage = 'Failed to process request'
        let errorDetails = null
        
        if (error.code === 'P2002') {
            errorMessage = 'Database constraint violation'
            errorDetails = 'A unique constraint failed'
        } else if (error.code === 'P2025') {
            errorMessage = 'Record not found'
            errorDetails = 'The requested record does not exist'
        } else if (error.message?.includes('Unknown column')) {
            errorMessage = 'Database schema error'
            errorDetails = 'Please run the migration: migration_auth.sql or npx prisma migrate dev'
        } else if (error.message?.includes('connect') || error.message?.includes('ECONNREFUSED')) {
            errorMessage = 'Database connection error'
            errorDetails = 'Cannot connect to database. Please check your DATABASE_URL and ensure MySQL is running.'
        } else if (process.env.NODE_ENV === 'development') {
            errorDetails = error.message
        }
        
        return NextResponse.json(
            { 
                error: errorMessage,
                details: errorDetails
            },
            { status: 500 }
        )
    }
}
