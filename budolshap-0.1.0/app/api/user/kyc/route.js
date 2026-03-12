import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

export async function POST(req) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.userId || user.id || user.sub
    const { tier, details } = await req.json()

    // Get client info for compliance auditing
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'

    // Update user KYC status and details
    // Documents are stored as base64 in kycDetails for this version
    // Compliance: BSP/AMLA requires retention for 5 years
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        kycStatus: 'PENDING',
        kycDetails: {
          tier,
          ...details,
          submittedAt: new Date().toISOString(),
          retentionExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 5)).toISOString(), // 5-year retention
          auditInfo: { ip, userAgent }
        }
      }
    })

    // Log the activity with compliance metadata
    await prisma.auditLog.create({
      data: {
        userId: userId,
        action: 'KYC_SUBMISSION',
        metadata: { 
          tier, 
          fullName: details.fullName,
          compliance: { ip, userAgent, timestamp: new Date().toISOString() }
        }
      }
    })

    return NextResponse.json({ 
      message: 'KYC submission received', 
      status: updatedUser.kycStatus 
    })

  } catch (error) {
    console.error('KYC API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function GET(req) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.userId || user.id || user.sub
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        metadata: true,
        accountType: true,
        role: true,
        isAdmin: true
      }
    })

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get KYC info from metadata
    const metadata = userData.metadata || {};
    let kycStatus = metadata.kycStatus || 'NOT_STARTED';
    let kycDetails = metadata.kycDetails || null;

    // Role-Based Data Masking for KYC Results
    // Only Admin can see full OCR details (fullName, idNumber, ocrLines)
    const isAdmin = userData.isAdmin || userData.accountType === 'ADMIN' || userData.role === 'ADMIN';
    
    if (!isAdmin && kycDetails) {
      // Create a shallow copy to mask sensitive fields
      const maskedDetails = { ...kycDetails };
      
      // Mask OCR extracted data if it exists
      if (maskedDetails.fullName) maskedDetails.fullName = '*** PROTECTED ***';
      if (maskedDetails.idNumber) maskedDetails.idNumber = '*** PROTECTED ***';
      if (maskedDetails.ocrLines) maskedDetails.ocrLines = [];
      
      kycDetails = maskedDetails;
    }

    return NextResponse.json({
      kycStatus: kycStatus,
      kycDetails: kycDetails
    });

  } catch (error) {
    console.error('KYC Status Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}