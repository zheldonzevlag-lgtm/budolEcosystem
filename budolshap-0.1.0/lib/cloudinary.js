import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

/**
 * Extracts the public ID from a Cloudinary URL
 * @param {string} url - The Cloudinary image URL
 * @returns {string|null} - The public ID or null if not found
 */
export const extractPublicId = (url) => {
    try {
        if (!url || !url.includes('cloudinary.com')) return null;
        
        // Example URL: https://res.cloudinary.com/demo/image/upload/v1570979139/folder/sample.jpg
        // Split by 'upload/'
        const parts = url.split('/upload/');
        if (parts.length < 2) return null;
        
        // Get everything after 'upload/'
        let path = parts[1];
        
        // Remove version if present (v123456/)
        if (path.startsWith('v')) {
            const versionEnd = path.indexOf('/');
            if (versionEnd !== -1) {
                path = path.substring(versionEnd + 1);
            }
        }
        
        // Remove file extension
        const lastDot = path.lastIndexOf('.');
        if (lastDot !== -1) {
            path = path.substring(0, lastDot);
        }
        
        // Decode URI component in case of spaces/special chars
        return decodeURIComponent(path);
    } catch (error) {
        console.error('Error extracting public ID:', error);
        return null;
    }
};

/**
 * Deletes an image from Cloudinary
 * @param {string} url - The Cloudinary image URL
 * @returns {Promise<boolean>} - True if deleted successfully
 */
export const deleteCloudinaryAsset = async (url, resourceType = 'image') => {
    const publicId = extractPublicId(url);
    if (!publicId) {
        console.warn(`[Cloudinary] Could not extract public ID from URL: ${url}`);
        return false;
    }
    
    try {
        console.log(`[Cloudinary] Deleting ${resourceType}: ${publicId}`);
        const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        
        if (result.result === 'ok') {
            console.log(`[Cloudinary] Successfully deleted: ${publicId}`);
            return true;
        } else {
            console.warn(`[Cloudinary] Deletion result not ok:`, result);
            return false;
        }
    } catch (error) {
        console.error(`[Cloudinary] Failed to delete asset: ${publicId}`, error);
        return false;
    }
};

export const deleteCloudinaryImage = async (url) => {
    return deleteCloudinaryAsset(url, 'image');
};

export default cloudinary
