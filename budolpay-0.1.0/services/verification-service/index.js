/**
 * @file index.js
 * @description KYC Verification Service for BudolPay
 * @purpose Handles document upload, face verification, and KYC status updates.
 *          This is a self-contained service for Vercel serverless deployment —
 *          all dependencies are direct (no monorepo workspace imports).
 * @compliance BSP Circular 808, NPC Data Privacy Act, PCI DSS
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');
const cloudinary = require('cloudinary').v2;
const { createWorker } = require('tesseract.js');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), override: true });

const app = express();
const PORT = process.env.PORT || 8006;

// ── Cloudinary Configuration ──────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Prisma Client ─────────────────────────────────────────────────────────────
// Initialize with fallback to avoid crash during Vercel build-time static pass
// BudolPay Schema Isolation Logic
// Ensures the client always targets the 'budolpay' schema to avoid collisions
const getIsolatingUrl = () => {
  const url = process.env.DATABASE_URL;
  if (!url || url.trim().length === 0) {
    return 'postgresql://postgres:postgres@localhost:5432/budolpay?schema=budolpay';
  }
  
  const trimmedUrl = url.trim();
  // If it already has a schema specified, respect it (unless it's public)
  if (trimmedUrl.includes('schema=budolpay')) return trimmedUrl;
  
  // Force budolpay schema if it's pointing to public or has no schema
  const baseUrl = trimmedUrl.split('?')[0];
  const params = new URLSearchParams(trimmedUrl.split('?')[1] || '');
  params.set('schema', 'budolpay');
  
  return `${baseUrl}?${params.toString()}`;
};

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: getIsolatingUrl(),
    },
  },
});

// ── Minimal Email Notification ────────────────────────────────────────────────
// Inlined from @budolpay/notifications to remove workspace dependency
const sendVerificationSuccessEmail = async (to, firstName) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    await transporter.sendMail({
      from: `"budolPay" <${process.env.EMAIL_USER || 'no-reply@budolpay.com'}>`,
      to,
      subject: 'Account Verified - budolPay',
      html: `<p>Hi ${firstName || 'there'}, your account has been successfully verified. You can now use all BudolPay features.</p>`,
    });
    console.log(`[Verification] Verification success email sent to ${to}`);
  } catch (err) {
    // Non-fatal: log but don't block the KYC flow
    console.error(`[Verification] Failed to send email: ${err.message}`);
  }
};

// ── Multer File Upload ─────────────────────────────────────────────────────────
// Vercel serverless functions have a read-only filesystem except /tmp
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = process.env.VERCEL === '1' ? '/tmp/uploads/' : path.join(__dirname, 'uploads/');
    if (process.env.VERCEL === '1') {
      const fs = require('fs');
      if (!fs.existsSync('/tmp/uploads')) {
        fs.mkdirSync('/tmp/uploads', { recursive: true });
      }
    }
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

app.use(cors());
app.use(express.json());

// ── Health Check ───────────────────────────────────────────────────────────────
app.get(['/health', '/api/health'], (req, res) => {
  res.json({ status: 'ok', service: 'verification-service', timestamp: new Date().toISOString() });
});

/**
 * Heuristic parser for identity documents
 */
const parseIdentityFromText = (text) => {
  const data = {};
  const cleanText = text.replace(/\s+/g, ' ');

  // Common ID patterns (e.g. Philippine UMID, Driver License, Passport)
  const idMatch = text.match(/\b\d{4}-\d{4}-\d{4}-\d{4}\b/) || 
                  text.match(/\b[A-Z]\d{2}-\d{2}-\d{6}\b/) || 
                  text.match(/\b[A-Z]\d{7,9}\b/);
  if (idMatch) data.id_number = idMatch[0];

  // Name extraction (very heuristic)
  const nameMatch = text.match(/(?:NAME|FULL NAME)[:\s]+([A-Z\s]{3,})/i) || 
                    text.match(/([A-Z]{3,}\s[A-Z]{3,})/);
  if (nameMatch && !data.id_number?.includes(nameMatch[1])) {
    data.full_name = nameMatch[1].trim();
  }

  // Date of Birth
  const dobMatch = text.match(/(?:BIRTH|DOB|DATE OF BIRTH)[:\s]+(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i) || 
                   text.match(/(\d{4}[\/\-]\d{2}[\/\-]\d{2})/);
  if (dobMatch) data.birth_date = dobMatch[1];

  data.extracted_at = new Date().toISOString();
  data.source = "Tesseract.js Engine";
  
  return data;
};

// ── KYC Upload Handler ─────────────────────────────────────────────────────────
// Aliased as /upload AND /verify for mobile app compatibility
app.post(['/verify', '/upload', '/api/upload', '/api/verify'], upload.single('document'), async (req, res) => {
  try {
    const { userId, type, faceTemplate, documentType } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Store document record in DB if a file was uploaded
    if (req.file) {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-').slice(0, 5);
      const userName = `${user.firstName || 'Unknown'} ${user.lastName || 'User'}`.replace(/\s+/g, ' ').trim();
      const folderPath = `home/budolpay/kyc/${userName} ${dateStr} ${timeStr}`;
      
      console.log(`[Verification] Processing file: ${req.file.originalname} for user ${userName} in ${folderPath}`);
      
      // 1. Upload to Cloudinary for persistent storage
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: folderPath,
        resource_type: 'auto',
        public_id: `${type}_${Date.now()}`
      });
      
      const remoteUrl = result.secure_url;
      console.log(`[Verification] Cloudinary upload success: ${remoteUrl}`);

      // 2. Perform OCR Analysis
      let extractedData = {};
      if (type.includes('ID')) {
        try {
          console.log(`[Verification] Starting OCR extraction for ${req.file.originalname}...`);
          const worker = await createWorker('eng');
          const { data: { text } } = await worker.recognize(req.file.path);
          await worker.terminate();
          
          extractedData = parseIdentityFromText(text);
          console.log(`[Verification] OCR Success:`, extractedData);
        } catch (ocrError) {
          console.error(`[Verification] OCR Extraction failed:`, ocrError);
          // Fallback to metadata
        }
      }

      // 3. Prepare binary fallback (optional but good for compliance)
      const fs = require('fs');
      const blobData = fs.readFileSync(req.file.path);

      await prisma.verificationDocument.create({
        data: {
          userId,
          type: type || 'ID_DOCUMENT',
          documentType: documentType || 'GOVERNMENT_ID',
          status: 'PENDING',
          remoteUrl,
          blobData,
          faceTemplate: faceTemplate || null,
          ocrData: {
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size,
            cloudinary_id: result.public_id,
            ...extractedData
          },
        },
      });

      // 3. Cleanup temporary file
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.warn(`[Verification] Failed to delete temp file: ${err.message}`);
      }
    }

    const updateData = {};

    if (type === 'SELFIE' || type === 'FACE') {
      updateData.isFaceVerified = true;
      updateData.faceTemplate = faceTemplate || 'verified';
    } else if (type === 'PROFILE_PICTURE') {
      if (req.file) {
        updateData.avatarUrl = `/uploads/${req.file.filename}`;
      }
    } else {
      // ID Document upload
      updateData.kycStatus = 'PENDING';
    }

    // Full verification tier logic
    if (updateData.isFaceVerified || updateData.kycStatus === 'VERIFIED') {
      updateData.kycStatus = 'VERIFIED';
      updateData.kycTier = 'FULLY_VERIFIED';
    } else {
      updateData.kycStatus = updateData.kycStatus || 'PENDING';
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Send verification notification if fully verified (non-blocking)
    if (type !== 'PROFILE_PICTURE' && updateData.kycStatus === 'VERIFIED') {
      sendVerificationSuccessEmail(updatedUser.email, updatedUser.firstName).catch(() => {});
    }

    res.status(201).json({
      success: true,
      status: type === 'PROFILE_PICTURE' ? 'UPDATED' : updateData.kycStatus,
      tier: updatedUser.kycTier,
      avatarUrl: updatedUser.avatarUrl,
    });
  } catch (error) {
    console.error('[Verification] Error:', error);
    res.status(500).json({ error: 'Verification failed', details: error.message });
  }
});

// ── KYC Status ─────────────────────────────────────────────────────────────────
app.get(['/status/:userId', '/api/status/:userId'], async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.userId },
      select: { kycStatus: true, kycTier: true, isFaceVerified: true },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

// ── Server Start (only when run directly, not as serverless function) ──────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[Verification] Service running on port ${PORT}`);
  });
}

module.exports = app;
