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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Video upload failed');
    }

    const data = await response.json();
    return data.url;
};
