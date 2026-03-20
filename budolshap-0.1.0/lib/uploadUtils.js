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
            base64Data = await compressImage(fileOrString, {
                maxWidth: 1200,
                maxHeight: 1200,
                quality: 0.8
            });
        } catch (error) {
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
        body: JSON.stringify({ image: base64Data })
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
        
        // Try to parse as JSON if the response looks like JSON
        if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
            try {
                const errorData = JSON.parse(responseText);
                errorMessage = errorData.error || errorMessage;
            } catch (parseError) {
                // JSON parsing failed, use the raw text (truncated to prevent huge errors)
                console.error('Upload failed with malformed JSON:', responseText.substring(0, 500));
                errorMessage = `Upload failed: ${responseText.substring(0, 200)}`;
            }
        } else if (responseText) {
            // Non-JSON response (likely HTML error page)
            console.error('Upload failed with non-JSON response:', responseText.substring(0, 500));
            errorMessage = `Upload failed: ${responseText.substring(0, 200)}`;
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
        
        // Try to parse as JSON if the response looks like JSON
        if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
            try {
                const errorData = JSON.parse(responseText);
                errorMessage = errorData.error || errorMessage;
            } catch (parseError) {
                // JSON parsing failed, use the raw text (truncated to prevent huge errors)
                console.error('Video upload failed with malformed JSON:', responseText.substring(0, 500));
                errorMessage = `Video upload failed: ${responseText.substring(0, 200)}`;
            }
        } else if (responseText) {
            // Non-JSON response (likely HTML error page or timeout)
            console.error('Video upload failed with non-JSON response:', responseText.substring(0, 500));
            errorMessage = `Video upload failed: ${responseText.substring(0, 200)}`;
        }
        
        throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.url;
};
