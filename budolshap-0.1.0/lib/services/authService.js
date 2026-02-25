/**
 * Auth Service
 * Service layer for authentication operations
 * Phase 6: Extracted as independent service boundary
 */

import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { generateToken } from '@/lib/token';
import { COOKIE_OPTIONS } from '@/lib/auth';
import { sendEmail } from '@/lib/email';

/**
 * Register new user
 * @param {object} userData - User registration data
 * @param {string} userData.name - User name
 * @param {string} userData.email - User email
 * @param {string} userData.password - User password
 * @param {string} userData.accountType - Account type (BUYER, SELLER)
 * @returns {Promise<object>} Created user (without password)
 */
export async function registerUser(userData) {
    const { name, email, password, accountType = 'BUYER' } = userData;

    if (!name || !email || !password) {
        throw new Error('Name, email, and password are required');
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email }
    });

    if (existingUser) {
        throw new Error('Email already registered');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate email verification token
    const { generateEmailToken } = await import('@/lib/auth');
    const emailVerifyToken = generateEmailToken();

    // Create user
    const user = await prisma.user.create({
        data: {
            id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name,
            email,
            password: hashedPassword,
            accountType,
            emailVerifyToken
        },
        select: {
            id: true,
            name: true,
            email: true,
            accountType: true,
            emailVerified: true,
            isAdmin: true,
            createdAt: true
        }
    });

    // Send verification email
    try {
        const { sendVerificationEmail } = await import('@/lib/email');
        await sendVerificationEmail(email, emailVerifyToken, name);
    } catch (emailError) {
        console.error('[AuthService] Failed to send verification email:', emailError);
        // Don't fail registration if email fails
    }

    return user;
}

/**
 * Authenticate user
 * @param {object} credentials - Login credentials
 * @param {string} credentials.email - User email
 * @param {string} credentials.password - User password
 * @returns {Promise<object>} User and token
 */
export async function authenticateUser(credentials) {
    const { email, password } = credentials;

    if (!email || !password) {
        throw new Error('Email and password are required');
    }

    // Find user
    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        throw new Error('Invalid credentials');
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
        throw new Error('Invalid credentials');
    }

    // Generate token
    const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.isAdmin ? 'ADMIN' : (user.accountType === 'SELLER' ? 'SELLER' : 'BUYER')
    });

    // Return user (without password) and token
    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            accountType: user.accountType,
            isAdmin: user.isAdmin,
            emailVerified: user.emailVerified
        },
        token
    };
}

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Promise<object>} User object
 */
export async function getUserById(userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            accountType: true,
            emailVerified: true,
            isAdmin: true,
            isMember: true,
            image: true,
            createdAt: true,
            updatedAt: true
        }
    });

    if (!user) {
        throw new Error('User not found');
    }

    return user;
}

/**
 * Get user by email
 * @param {string} email - User email
 * @returns {Promise<object>} User object
 */
export async function getUserByEmail(email) {
    const user = await prisma.user.findUnique({
        where: { email },
        select: {
            id: true,
            name: true,
            email: true,
            accountType: true,
            emailVerified: true,
            isAdmin: true,
            isMember: true,
            image: true,
            createdAt: true,
            updatedAt: true
        }
    });

    return user;
}

/**
 * Verify email
 * @param {string} token - Email verification token
 * @returns {Promise<object>} Updated user
 */
export async function verifyEmail(token) {
    try {
        const { verifyToken } = await import('@/lib/token');
        const decoded = verifyToken(token);

        if (!decoded || !decoded.email) {
            throw new Error('Invalid verification token');
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email: decoded.email }
        });

        if (!user) {
            throw new Error('User not found');
        }

        if (user.emailVerified) {
            return { message: 'Email already verified', user };
        }

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: true,
                emailVerifyToken: null
            },
            select: {
                id: true,
                name: true,
                email: true,
                emailVerified: true
            }
        });

        return { message: 'Email verified successfully', user: updatedUser };
    } catch (error) {
        throw new Error('Invalid or expired verification token');
    }
}

/**
 * Request password reset
 * @param {string} email - User email
 * @returns {Promise<object>} Success message
 */
export async function requestPasswordReset(email) {
    if (!email) {
        throw new Error('Email is required');
    }

    // Find user
    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        // Don't reveal if user exists
        return { message: 'If the email exists, a reset link has been sent' };
    }

    // Generate reset token
    const resetToken = generateToken({ id: user.id }, '1h');
    const resetTokenExpiry = new Date(new Date().getTime() + 60 * 60 * 1000); // 1 hour

    // Update user with reset token
    await prisma.user.update({
        where: { id: user.id },
        data: {
            resetToken,
            resetTokenExpiry
        }
    });

    // Send reset email
    try {
        const { sendPasswordResetEmail } = await import('@/lib/email');
        await sendPasswordResetEmail(email, resetToken, user.name);
    } catch (emailError) {
        console.error('[AuthService] Failed to send reset email:', emailError);
        throw new Error('Failed to send reset email');
    }

    return { message: 'If the email exists, a reset link has been sent' };
}

/**
 * Reset password
 * @param {string} token - Reset token
 * @param {string} newPassword - New password
 * @returns {Promise<object>} Success message
 */
export async function resetPassword(token, newPassword) {
    if (!token || !newPassword) {
        throw new Error('Token and new password are required');
    }

    try {
        const { verifyToken } = await import('@/lib/token');
        const decoded = verifyToken(token);

        if (!decoded || !decoded.id) {
            throw new Error('Invalid reset token');
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { id: decoded.id }
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Check if token is expired
        if (user.resetTokenExpiry && new Date() > user.resetTokenExpiry) {
            throw new Error('Reset token has expired');
        }

        // Check if token matches
        if (user.resetToken !== token) {
            throw new Error('Invalid reset token');
        }

        // Hash new password
        const hashedPassword = await hashPassword(newPassword);

        // Update user
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null
            }
        });

        return { message: 'Password reset successfully' };
    } catch (error) {
        throw new Error('Invalid or expired reset token');
    }
}

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {object} updateData - Update data
 * @returns {Promise<object>} Updated user
 */
export async function updateUserProfile(userId, updateData) {
    const { name, image } = updateData;

    const data = {};
    if (name) data.name = name;
    if (image !== undefined) data.image = image;

    const user = await prisma.user.update({
        where: { id: userId },
        data,
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            accountType: true,
            emailVerified: true,
            isAdmin: true,
            updatedAt: true
        }
    });

    return user;
}

/**
 * Change password
 * @param {string} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<object>} Success message
 */
export async function changePassword(userId, currentPassword, newPassword) {
    if (!currentPassword || !newPassword) {
        throw new Error('Current password and new password are required');
    }

    // Get user
    const user = await prisma.user.findUnique({
        where: { id: userId }
    });

    if (!user) {
        throw new Error('User not found');
    }

    // Verify current password
    const isValid = await verifyPassword(currentPassword, user.password);
    if (!isValid) {
        throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
        where: { id: userId },
        data: {
            password: hashedPassword
        }
    });

    return { message: 'Password changed successfully' };
}
