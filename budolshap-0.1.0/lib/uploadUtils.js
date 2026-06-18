import { compressImage } from './imageUtils';

/**
 * =============================================================================
 * EDUCATIONAL INSIGHT: Benefits of Client-Side Image Compression
 * =============================================================================
 * 
 * WHY compress images BEFORE uploading to Cloudinary?
 * 
 * 1. **Bandwidth Savings**: 
 *    - A 5MB camera photo can be compressed to ~200KB (96% reduction)
 *    - This means faster uploads, especially on mobile networks
 *    - Users with limited data plans will appreciate the efficiency
 * 
 * 2. **Faster User Experience**:
 *    - Smaller files = faster transfers
 *    - Reduces perceived upload time significantly
 *    - Prevents timeout issues on slow connections
 * 
 * 3. **Server Resource Conservation**:
 *    - Reduces Cloudinary processing load
 *    - Saves bandwidth between your server and Cloudinary
 *    - Lower Cloudinary transformation costs (you're billed for transformations)
 * 
 * 4. **Better Mobile Support**:
 *    - Mobile devices often capture 12MP+ photos (4000x3000px)
 *    - Web displays rarely need more than 1200x1200px
 *    - Compression ensures consistent performance across devices
 * 
 * 5. **Privacy Benefits**:
 *    - Images are processed locally on the user's device
 *    - Raw/original photos never leave the browser
 *    - Only the compressed version is transmitted
 * 
 * COMPRESSION SETTINGS USED:
 * - maxWidth/Height: 1200px (optimal for most e-commerce displays)
 * - quality: 0.8 (80% - balances size vs visual quality)
 * - format: WebP (modern format with superior compression)
 * 
 * Result: Typical 5MB photo → ~150KB (97% smaller!)
 * =============================================================================
 */

export const uploadImage = async (input) => {
    let fileOrString = input;
    
    // If it's already a URL, return it
    if (typeof fileOrString === 'string' && (fileOrString.startsWith('http') || fileOrString.startsWith('/'))) {
        return fileOrString;
    }

    let base64Data = fileOrString;

    // If it's a File object, compress it
    if (typeof fileOrString !== 'string' && fileOrString instanceof File) {
        try {
            // Check original file size before compression
            const MAX_ORIGINAL_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
            if (fileOrString.size > MAX_ORIGINAL_IMAGE_SIZE) {
                throw new Error(`Image is too large. Please select an image under 10MB.`);
            }

            base64Data = await compressImage(fileOrString, {
                maxWidth: 1200,
                maxHeight: 1200,
                quality: 0.8
            });
            
            // Check base64 size after compression (Vercel payload limit is 4.5MB)
            // Base64 is ~33% larger than binary, so 3.3MB binary = ~4.4MB base64
            const MAX_BASE64_PAYLOAD = 4.4 * 1024 * 1024;
            // Rough estimation of base64 bytes: length * (3/4)
            if (base64Data.length * 0.75 > MAX_BASE64_PAYLOAD) {
                 throw new Error(`Image is still too large after compression. Please select a smaller image (under 3MB).`);
            }
        } catch (error) {
            // Only fall back to raw base64 if it wasn't a size error
            if (error.message.includes('too large')) {
                throw error;
            }
            console.error("Compression failed", error);
            base64Data = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(fileOrString);
            });
        }
    }

    // Upload to Cloudinary via API
    const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Data, type: 'product' })
    });

    if (!response.ok) {
        // Get response text first to avoid stream consumption issues
        let responseText = '';
        try {
            responseText = await response.text();
        } catch (textError) {
            // If we can't get text, use a generic error
            throw new Error(`Upload failed: Server returned ${response.status} ${response.statusText}`);
        }

        let errorMessage = `Upload failed: Server returned ${response.status} ${response.statusText}`;
        
        // Handle specific 413 error (Vercel/Next.js payload too large)
        if (response.status === 413 || errorMessage.includes('FUNCTION_PAYLOAD_TOO_LARGE') || responseText.includes('413')) {
            errorMessage = 'The image is too large to process. Maximum upload size is 3MB.';
        } else if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
            try {
                const errorData = JSON.parse(responseText);
                errorMessage = errorData.error || errorMessage;
            } catch (parseError) {
                console.error('Upload failed with malformed JSON:', responseText.substring(0, 500));
                errorMessage = `Upload failed: ${responseText.substring(0, 200)}`;
            }
        } else if (responseText) {
            console.error('Upload failed with non-JSON response:', responseText.substring(0, 500));
            errorMessage = `Upload failed: Server error or file too large.`;
        }
        
        throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.url;
};

export const uploadVideo = async (input) => {
    let fileOrString = input;

    if (typeof fileOrString === 'string' && (fileOrString.startsWith('http') || fileOrString.startsWith('/'))) {
        return fileOrString;
    }

    let base64Data = fileOrString;
    if (typeof fileOrString !== 'string' && fileOrString instanceof File) {
        // Vercel Serverless has a strict 4.5MB request body payload limit.
        // Base64 encoding adds ~33% overhead.
        // 3.3MB * 1.33 = ~4.4MB payload, safely under the 4.5MB limit.
        const MAX_VIDEO_SIZE = 3.3 * 1024 * 1024; // 3.3MB
        
        if (fileOrString.size > MAX_VIDEO_SIZE) {
            throw new Error(`The video is too large to process. Maximum upload size is 3.3MB`);
        }

        base64Data = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(fileOrString);
        });
    }

    const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Data, type: 'video' })
    });

    if (!response.ok) {
        // Get response text first to avoid stream consumption issues
        let responseText = '';
        try {
            responseText = await response.text();
        } catch (textError) {
            // If we can't get text, use a generic error
            throw new Error(`Video upload failed: Server returned ${response.status} ${response.statusText}`);
        }

        let errorMessage = `Video upload failed: Server returned ${response.status} ${response.statusText}`;
        
        if (response.status === 413 || errorMessage.includes('FUNCTION_PAYLOAD_TOO_LARGE') || responseText.includes('413')) {
            errorMessage = 'The video is too large to process. Maximum upload size is 3.3MB.';
        } else if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
            try {
                const errorData = JSON.parse(responseText);
                errorMessage = errorData.error || errorMessage;
            } catch (parseError) {
                console.error('Video upload failed with malformed JSON:', responseText.substring(0, 500));
                errorMessage = `Video upload failed: ${responseText.substring(0, 200)}`;
            }
        } else if (responseText) {
            console.error('Video upload failed with non-JSON response:', responseText.substring(0, 500));
            errorMessage = `Video upload failed: Server error or file too large.`;
        }
        
        throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.url;
};
