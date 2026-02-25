import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load env vars
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// Manually set if missing (using the ones found in fix-cloudinary-env.js as fallback/verification)
// This ensures it works even if .env is missing or not loaded correctly by dotenv in this script context
if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
    cloudinary.config({
        cloud_name: 'dasfwpg7x',
        api_key: '537684148625265',
        api_secret: 'USb6SDEDehMLyw9_HlFC1wDqlDE'
    });
} else {
    cloudinary.config({
        cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logoPath = path.join(process.cwd(), 'public/assets/budolShap/budolShap_logo_transparent-1.png');

async function uploadLogo() {
    try {
        console.log('Uploading logo from:', logoPath);
        const result = await cloudinary.uploader.upload(logoPath, {
            folder: 'budolshap/assets',
            public_id: 'budolshap_logo_transparent',
            overwrite: true,
            resource_type: 'image'
        });
        console.log('Upload successful!');
        console.log('Secure URL:', result.secure_url);
        return result.secure_url;
    } catch (error) {
        console.error('Upload failed:', error);
    }
}

uploadLogo();
