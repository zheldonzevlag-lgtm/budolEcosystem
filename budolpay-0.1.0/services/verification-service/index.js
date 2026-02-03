const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { prisma } = require('@budolpay/database');
const { sendVerificationSuccess } = require('@budolpay/notifications');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), override: true });

const app = express();
const PORT = process.env.PORT || 8006;

// Configure Multer for KYC uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads/'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// KYC Verification Logic (Aliased as /upload for mobile app compatibility)
app.post(['/verify', '/upload'], upload.single('document'), async (req, res) => {
  try {
    const { userId, type, faceTemplate, documentType } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Store document record in DB if a file was uploaded
    if (req.file) {
      // For local development, we want the admin to see this via the gateway or direct service URL
      // If using gateway (8080), the path should be /verification/uploads/...
      const remoteUrl = `/verification/uploads/${req.file.filename}`;
      
      await prisma.verificationDocument.create({
        data: {
          userId,
          type: type || 'ID_DOCUMENT',
          documentType: documentType || 'GOVERNMENT_ID',
          status: 'PENDING',
          remoteUrl: remoteUrl,
          faceTemplate: faceTemplate || null,
          ocrData: {
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size
          }
        }
      });
    }

    const updateData = {};

    // Logic from v485 Developer Manual
    if (type === 'SELFIE' && faceTemplate) {
      updateData.faceTemplate = faceTemplate;
      updateData.isFaceVerified = true;
      updateData.kycStatus = 'VERIFIED'; // Changed from 'APPROVED' per compliance
      updateData.kycTier = 'FULLY_VERIFIED';
    } else {
      updateData.kycStatus = 'PENDING';
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    if (updateData.kycStatus === 'VERIFIED') {
      await sendVerificationSuccess(updatedUser.email);
    }

    res.status(201).json({
      success: true,
      status: updateData.kycStatus,
      tier: updateData.kycTier
    });
  } catch (error) {
    console.error('Verification Error:', error);
    res.status(500).json({ error: 'Verification failed', details: error.message });
  }
});

app.get('/status/:userId', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.userId },
      select: { kycStatus: true, kycTier: true, isFaceVerified: true }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

app.listen(PORT, () => {
  console.log(`BudolPay KYC Verification Service running on port ${PORT}`);
});
