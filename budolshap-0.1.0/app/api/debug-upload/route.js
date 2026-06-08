import { NextResponse } from 'next/server'

// Debug route to isolate upload 500 errors without hitting Cloudinary
export const runtime = 'nodejs'

export async function POST(request) {
    try {
        const contentType = request.headers.get('content-type') || ''

        // Step 1: Can we parse the body?
        let body
        try {
            body = await request.json()
        } catch (e) {
            return NextResponse.json({ step: 'body-parse', error: e.message }, { status: 400 })
        }

        // Step 2: Do we have an image field?
        if (!body.image) {
            return NextResponse.json({ step: 'validation', error: 'No image field' }, { status: 400 })
        }

        // Step 3: Can we import cloudinary?
        let cloudinary
        try {
            const mod = await import('@/lib/cloudinary')
            cloudinary = mod.default
        } catch (e) {
            return NextResponse.json({ step: 'cloudinary-import', error: e.message }, { status: 500 })
        }

        // Step 4: Is cloudinary configured?
        const config = cloudinary.config()
        const hasConfig = !!(config.cloud_name && config.api_key && config.api_secret)

        return NextResponse.json({
            ok: true,
            contentType,
            imageLength: body.image?.length,
            imagePrefix: body.image?.substring(0, 50),
            cloudinaryConfigured: hasConfig,
            cloudName: config.cloud_name || 'MISSING',
            envVars: {
                NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ? 'SET' : 'MISSING',
                CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? 'SET' : 'MISSING',
                CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? 'SET' : 'MISSING',
            }
        })
    } catch (error) {
        return NextResponse.json({ step: 'unknown', error: error.message, stack: error.stack }, { status: 500 })
    }
}
