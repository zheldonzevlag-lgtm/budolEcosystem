import { NextResponse } from 'next/server'
import cloudinary from '@/lib/cloudinary'
import { getAuthFromCookies } from '@/lib/auth'

export const maxDuration = 300; // Increase timeout to 300 seconds (5 minutes)

const normalizeFolderName = (name) => {
    if (!name) return 'unknown-user'
    return name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        || 'unknown-user'
}

// Cache known folders to avoid redundant Cloudinary API calls across uploads
const knownFolders = new Set()

const ensureFolderPath = async (folderPath) => {
    if (knownFolders.has(folderPath)) return
    try {
        await cloudinary.api.create_folder(folderPath)
    } catch (error) {
        if (error?.error?.http_code !== 409) {
            console.warn(`[Upload] Failed to create folder ${folderPath}:`, error?.message || error)
        }
    }
    knownFolders.add(folderPath)
}

export async function POST(request) {
    const startTime = Date.now();
    console.log('[Upload] Received upload request at:', new Date().toISOString());

    // Get user session for folder naming
    let user = null;
    try {
        user = await getAuthFromCookies();
    } catch (e) {
        console.warn('[Upload] Failed to get user session:', e);
    }

    try {
        const body = await request.json();
        const { image, removeBackground, type } = body;
        const uploadType = type === 'video' ? 'video' : 'image';

        // Detect if the image is an SVG
        const isSVG = image && (image.startsWith('data:image/svg') || image.includes('data:image/svg+xml'));
        console.log('[Upload] Image payload received. length:', image?.length, 'isSVG:', isSVG);

        if (!image) {
            console.log('[Upload] No image provided in request body');
            return NextResponse.json(
                { error: 'No image provided' },
                { status: 400 }
            )
        }

        // Validate size (max 10MB for images, 50MB for videos)
        const base64Size = image.length * 0.75 // Convert base64 length to bytes
        const maxSize = uploadType === 'video' ? 50 * 1024 * 1024 : 10 * 1024 * 1024

        if (base64Size > maxSize) {
            console.log(`[Upload] File too large: ${(base64Size / 1024 / 1024).toFixed(2)}MB`);
            return NextResponse.json(
                { error: uploadType === 'video' ? 'Video too large. Maximum size is 50MB' : 'Image too large. Maximum size is 10MB' },
                { status: 413 }
            )
        }

        const displayName = normalizeFolderName(user?.name)
        const now = new Date();
        const date = now.toISOString().split('T')[0];
        const time = now.toTimeString().split(' ')[0].replace(/:/g, '-');

        let folder;
        if (type === 'profile') {
            folder = `budolshap/assets/profile_images/${displayName}/${displayName}-${date}-${time}`;
        } else if (uploadType === 'video') {
            folder = `budolshap/assets/product_videos/${displayName}/${displayName}-${date}-${time}`;
        } else {
            folder = `budolshap/assets/products/${displayName}/${displayName}-${date}-${time}`;
        }
        await ensureFolderPath(folder)

        // Upload to Cloudinary with optimization settings
        console.log(`[Upload] Uploading ${uploadType} to Cloudinary folder: ${folder}...`);
        const cloudinaryStartTime = Date.now();

        const uploadOptions = {
            folder: folder,
            resource_type: uploadType,
            timeout: 300000, // 5 minutes timeout for Cloudinary SDK
            chunk_size: 6000000, // 6MB chunks for large uploads
        }

        if (uploadType === 'image' && !isSVG) {
            uploadOptions.quality = 'auto'
            uploadOptions.fetch_format = 'auto'
            uploadOptions.width = type === 'profile' ? 500 : 1200
            uploadOptions.height = type === 'profile' ? 500 : 1200
            uploadOptions.crop = 'limit'
        }

        if (removeBackground && uploadType === 'image' && !isSVG) {
            uploadOptions.transformation = [
                { effect: "background_removal" }
            ]
            uploadOptions.fetch_format = "png"
        }

        // Use upload_large for videos to handle chunking better
        let uploadResponse;
        if (uploadType === 'video') {
            uploadResponse = await cloudinary.uploader.upload_large(image, uploadOptions);
        } else {
            uploadResponse = await cloudinary.uploader.upload(image, uploadOptions);
        }
        const cloudinaryDuration = Date.now() - cloudinaryStartTime;
        console.log(`[Upload] Cloudinary upload successful in ${cloudinaryDuration}ms:`, uploadResponse.secure_url);

        const totalDuration = Date.now() - startTime;
        console.log(`[Upload] Total request duration: ${totalDuration}ms`);

        return NextResponse.json({
            url: uploadResponse.secure_url,
            publicId: uploadResponse.public_id,
        })
    } catch (error) {
        const totalDuration = Date.now() - startTime;
        console.error(`[Upload] Error in upload route after ${totalDuration}ms:`, error);

        // Return more specific error message if available
        let errorMessage = error.message || 'Unknown upload error';
        if (error.http_code === 413) errorMessage = 'File is too large for the runtime limit.';

        return NextResponse.json(
            { error: `Upload failed: ${errorMessage}` },
            { status: error.status || 500 }
        )
    }
}
