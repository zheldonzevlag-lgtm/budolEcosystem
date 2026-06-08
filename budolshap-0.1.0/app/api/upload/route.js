import { NextResponse } from 'next/server'

// Why: Explicitly set Node.js runtime so Cloudinary SDK (which needs
// native Buffer/Node APIs) works correctly on Vercel serverless.
export const runtime = 'nodejs'

// Why: Increase timeout for large image uploads / Cloudinary processing
export const maxDuration = 300

// Why: Cache created folders to avoid redundant Cloudinary API round-trips
const knownFolders = new Set()

/**
 * Normalize a name to a safe folder path segment.
 * Why: Cloudinary folder names cannot contain special chars; user names can.
 */
const normalizeFolderName = (name) => {
    if (!name) return 'unknown-user'
    return name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        || 'unknown-user'
}

/**
 * Ensure a Cloudinary folder exists, suppress 409 (already exists).
 * Why: Cloudinary throws if folder already exists; we swallow that error safely.
 */
const ensureFolderPath = async (cloudinary, folderPath) => {
    if (knownFolders.has(folderPath)) return
    try {
        await cloudinary.api.create_folder(folderPath)
    } catch (error) {
        // 409 = folder already exists — not a real error
        if (error?.error?.http_code !== 409) {
            console.warn(`[Upload] Failed to create folder ${folderPath}:`, error?.message || error)
        }
    }
    knownFolders.add(folderPath)
}

/**
 * Resolve the current user's name from request cookies/headers.
 * Why: We dynamically import auth to avoid bcryptjs crashing at module-init
 * time on Vercel's serverless cold-start. bcryptjs has native bindings that
 * can fail during static analysis / early evaluation.
 */
async function resolveUser(request) {
    try {
        // Dynamic import prevents bcryptjs from being evaluated at module-load time
        const { verifyToken } = await import('@/lib/token.js')
        const { cookies } = await import('next/headers')

        // Try cookies first (browser sessions)
        try {
            const cookieStore = await cookies()
            const token = cookieStore.get('budolshap_token')?.value || cookieStore.get('token')?.value
            if (token) {
                const decoded = verifyToken(token)
                if (decoded) return decoded
            }
        } catch (_) {
            // cookies() can throw outside of a request context — ignore
        }

        // Fallback: Authorization header (API clients / mobile apps)
        const authHeader = request.headers.get('authorization')
        if (authHeader?.startsWith('Bearer ')) {
            const { verifyToken: vt } = await import('@/lib/token.js')
            const decoded = vt(authHeader.substring(7))
            if (decoded) return decoded
        }
    } catch (e) {
        console.warn('[Upload] Could not resolve user (non-fatal):', e.message)
    }
    return null
}

export async function POST(request) {
    const startTime = Date.now()
    console.log('[Upload] Received request at:', new Date().toISOString())

    try {
        // ── 1. Dynamically import Cloudinary to avoid cold-start crashes ──
        let cloudinary
        try {
            const mod = await import('@/lib/cloudinary')
            cloudinary = mod.default
        } catch (e) {
            console.error('[Upload] Failed to import cloudinary:', e.message)
            return NextResponse.json({ error: 'Upload service unavailable' }, { status: 503 })
        }

        // ── 2. Resolve user (optional — only used for folder naming) ──
        const user = await resolveUser(request)
        console.log('[Upload] User resolved:', user ? (user.name || user.id || 'unknown') : 'anonymous')

        // ── 3. Parse request body (JSON only — FormData is disabled for Vercel) ──
        let image, removeBackground, type
        const contentType = request.headers.get('content-type') || ''

        if (contentType.includes('multipart/form-data')) {
            // Why: FormData multipart parsing crashes Vercel Node runtime.
            // All clients must send base64 JSON. We reject FormData explicitly
            // with a helpful error so developers know what to fix.
            console.warn('[Upload] Rejected multipart/form-data — must use JSON base64')
            return NextResponse.json(
                { error: 'multipart/form-data is not supported. Please send a JSON body with a base64-encoded "image" field.' },
                { status: 415 }
            )
        }

        try {
            const body = await request.json()
            image = body.image
            removeBackground = body.removeBackground
            type = body.type
        } catch (e) {
            console.error('[Upload] Failed to parse JSON body:', e.message)
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
        }

        // ── 4. Validate payload ──
        if (!image) {
            console.log('[Upload] No image provided')
            return NextResponse.json({ error: 'No image provided' }, { status: 400 })
        }

        const uploadType = type === 'video' ? 'video' : 'image'
        const isSVG = typeof image === 'string' && image.startsWith('data:image/svg')

        console.log(`[Upload] Type=${uploadType}, SVG=${isSVG}, payloadLength=${image.length}`)

        // ── 5. Size guard (10MB images / 50MB videos) ──
        const estimatedBytes = image.length * 0.75
        const maxBytes = uploadType === 'video' ? 50 * 1024 * 1024 : 10 * 1024 * 1024
        if (estimatedBytes > maxBytes) {
            const sizeMB = (estimatedBytes / 1024 / 1024).toFixed(2)
            console.log(`[Upload] File too large: ${sizeMB}MB`)
            return NextResponse.json(
                { error: uploadType === 'video' ? 'Video too large (max 50MB)' : `Image too large: ${sizeMB}MB (max 10MB)` },
                { status: 413 }
            )
        }

        // ── 6. Build Cloudinary folder path ──
        const displayName = normalizeFolderName(user?.name)
        const now = new Date()
        const date = now.toISOString().split('T')[0]
        const time = now.toTimeString().split(' ')[0].replace(/:/g, '-')

        let folder
        if (type === 'profile') {
            folder = `assets/media_library/folder/budolshap/assets/profile_images/${displayName}/${displayName}-${date}-${time}`
        } else if (uploadType === 'video') {
            folder = `assets/media_library/folder/budolshap/assets/product_videos/${displayName}/${displayName}-${date}-${time}`
        } else if (type === 'store') {
            folder = `assets/media_library/folder/budolshap/assets/stores/${displayName}/${displayName}-${date}-${time}`
        } else if (type === 'category') {
            folder = `assets/media_library/folder/budolshap/assets/categories/${displayName}/${displayName}-${date}-${time}`
        } else if (type === 'order' || type === 'return') {
            folder = `assets/media_library/folder/budolshap/assets/orders/${displayName}/${displayName}-${date}-${time}`
        } else {
            folder = `assets/media_library/folder/budolshap/assets/products/${displayName}/${displayName}-${date}-${time}`
        }

        await ensureFolderPath(cloudinary, folder)

        // ── 7. Build Cloudinary upload options ──
        const uploadOptions = {
            folder,
            resource_type: uploadType,
            timeout: 300000,      // 5 min Cloudinary SDK timeout
            chunk_size: 6000000,  // 6MB chunks for large files
        }

        if (uploadType === 'image' && !isSVG) {
            uploadOptions.quality = 'auto'
            uploadOptions.fetch_format = 'auto'
            uploadOptions.width = type === 'profile' ? 500 : 1200
            uploadOptions.height = type === 'profile' ? 500 : 1200
            uploadOptions.crop = 'limit'
        }

        if (removeBackground && uploadType === 'image' && !isSVG) {
            uploadOptions.transformation = [{ effect: 'background_removal' }]
            uploadOptions.fetch_format = 'png'
        }

        // ── 8. Upload to Cloudinary ──
        console.log(`[Upload] Uploading to Cloudinary folder: ${folder}`)
        const t0 = Date.now()

        let uploadResponse
        if (uploadType === 'video') {
            uploadResponse = await cloudinary.uploader.upload_large(image, uploadOptions)
        } else {
            uploadResponse = await cloudinary.uploader.upload(image, uploadOptions)
        }

        console.log(`[Upload] Cloudinary done in ${Date.now() - t0}ms: ${uploadResponse.secure_url}`)
        console.log(`[Upload] Total: ${Date.now() - startTime}ms`)

        return NextResponse.json({
            url: uploadResponse.secure_url,
            publicId: uploadResponse.public_id,
        })

    } catch (error) {
        console.error(`[Upload] Unhandled error after ${Date.now() - startTime}ms:`, error?.message, error?.stack)
        return NextResponse.json(
            { error: `Upload failed: ${error?.message || 'Unknown error'}` },
            { status: error?.status || 500 }
        )
    }
}
