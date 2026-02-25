
/**
 * Compress an image file using HTML5 Canvas
 * @param {File} file - The image file to compress
 * @param {Object} options - Compression options
 * @param {number} options.maxWidth - Maximum width in pixels (default: 800)
 * @param {number} options.maxHeight - Maximum height in pixels (default: 800)
 * @param {number} options.quality - Image quality (0 to 1, default: 0.7)
 * @param {string} options.type - Image mime type (default: 'image/webp')
 * @returns {Promise<string>} - A promise that resolves to the compressed base64 string
 */
export const compressImage = (file, options = {}) => {
    return new Promise((resolve, reject) => {
        const {
            maxWidth = 800,
            maxHeight = 800,
            quality = 0.7,
            type = 'image/webp'
        } = options;

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height *= maxWidth / width));
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width *= maxHeight / height));
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Compress
                const dataUrl = canvas.toDataURL(type, quality);
                resolve(dataUrl);
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};

/**
 * Check if a base64 string exceeds a size limit (in bytes)
 * @param {string} base64String 
 * @param {number} limitBytes 
 * @returns {boolean}
 */
export const isBase64LargerThan = (base64String, limitBytes) => {
    // Base64 length is approx 4/3 of original size
    const sizeInBytes = (base64String.length * 3) / 4;
    return sizeInBytes > limitBytes;
};

/**
 * Validate if a string is a valid image URL or base64 string
 * @param {string} image 
 * @returns {boolean}
 */
export const isValidImage = (image) => {
    if (!image) return false;
    
    // Handle image object { id, url }
    if (typeof image === 'object' && image.url) {
        return isValidImage(image.url);
    }

    if (typeof image !== 'string') return false;
    
    // Check if it's a URL
    if (image.startsWith('http://') || image.startsWith('https://')) return true;
    // Check if it's a base64 string with a valid MIME type
    if (image.startsWith('data:image/')) {
        const mimeType = image.split(';')[0].split(':')[1];
        const validMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml'];
        return validMimeTypes.includes(mimeType);
    }
    // Check if it's a relative path (e.g. /uploads/...)
    if (image.startsWith('/')) return true;
    return false;
};

export const isValidVideo = (video) => {
    if (!video) return false;
    if (typeof video === 'object' && video.url) {
        return isValidVideo(video.url);
    }
    if (typeof video !== 'string') return false;
    if (video.startsWith('http://') || video.startsWith('https://')) return true;
    if (video.startsWith('data:video/')) {
        const mimeType = video.split(';')[0].split(':')[1];
        const validMimeTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-matroska'];
        return validMimeTypes.includes(mimeType);
    }
    if (video.startsWith('/')) return true;
    return false;
};
