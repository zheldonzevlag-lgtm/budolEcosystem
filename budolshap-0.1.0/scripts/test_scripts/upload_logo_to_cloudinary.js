import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Always use env vars — never hardcode secrets
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('Missing Cloudinary env vars. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env');
    process.exit(1);
}

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const defaultLogoPath = path.join(process.cwd(), 'public/assets/budolShap/budolShap_logo_transparent-1.png');
const logoPath = process.argv[2] || defaultLogoPath;
const publicId = process.argv[3] || 'budolshap_logo_transparent';

async function uploadLogo() {
    try {
        console.log('Uploading logo from:', logoPath);
        const result = await cloudinary.uploader.upload(logoPath, {
            folder: 'budolshap/assets',
            public_id: publicId,
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
