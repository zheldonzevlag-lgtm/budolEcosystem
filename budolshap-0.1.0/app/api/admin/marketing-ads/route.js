import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAdmin } from '@/lib/adminAuth';

export async function GET(request) {
    const { authorized, errorResponse } = await requireAdmin(request)
    if (!authorized) return errorResponse

    try {
        const adsDirectory = path.join(process.cwd(), 'public', 'marketing-ads');

        // Create directory if it doesn't exist
        if (!fs.existsSync(adsDirectory)) {
            fs.mkdirSync(adsDirectory, { recursive: true });
        }

        const files = fs.readdirSync(adsDirectory);

        // Filter for common image types and remove any hidden files
        const adFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext);
        });

        return NextResponse.json({ files: adFiles });
    } catch (error) {
        console.error('Failed to list marketing ads:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
