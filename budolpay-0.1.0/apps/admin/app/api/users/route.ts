import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendKycSuccess, sendOTP } from "@budolpay/notifications";
import { getNowUTC } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const kycStatus = searchParams.get("kycStatus");

    let where = {};
    if (kycStatus && kycStatus !== "ALL") {
      where = { kycStatus };
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        wallet: true,
        verificationDocs: true,
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { action, userId, status, documentId, rotation } = await request.json();

    if (action === "UPDATE_KYC_STATUS") {
      let kycTier: any = "BASIC";
      if (status === "VERIFIED") {
        kycTier = "FULLY_VERIFIED";
      } else if (status === "PENDING") {
        kycTier = "SEMI_VERIFIED";
      }

      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiresAt = new Date(getNowUTC().getTime() + 10 * 60 * 1000);

      const oldUser = await prisma.user.findUnique({ where: { id: userId } });

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { 
          kycStatus: status as any,
          kycTier: kycTier,
          otpCode: status === "VERIFIED" ? otpCode : undefined,
          otpExpiresAt: status === "VERIFIED" ? otpExpiresAt : undefined,
        },
        include: {
          wallet: true,
          verificationDocs: {
            orderBy: { createdAt: "desc" },
          },
        },
      });

      // Log the KYC status change
      await prisma.auditLog.create({
        data: {
          action: "KYC_STATUS_UPDATED",
          entity: "User",
          entityId: userId,
          oldValue: { kycStatus: oldUser?.kycStatus, kycTier: oldUser?.kycTier } as any,
          newValue: { kycStatus: updatedUser.kycStatus, kycTier: updatedUser.kycTier } as any,
          ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
          metadata: {
            compliance: {
              pci_dss: "10.2.2",
              bsp: "Circular 808"
            }
          }
        }
      });

      if (status === "VERIFIED") {
        try {
          // Notify user about KYC success and send OTP for final verification
          await sendKycSuccess(updatedUser.email, updatedUser.firstName || 'User', 'BOTH');
          await sendOTP(updatedUser.email, otpCode, 'EMAIL');

          if (updatedUser.phoneNumber) {
            await sendOTP(updatedUser.phoneNumber, otpCode, 'SMS');
          }
        } catch (notifError) {
          console.error('[KYC Notification Error]', notifError);
        }
      }

      return NextResponse.json({ success: true, user: updatedUser });
    }

    if (action === "UPDATE_DOCUMENT_ROTATION") {
      const oldDoc = await prisma.verificationDocument.findUnique({ where: { id: documentId } });
      const updatedDoc = await prisma.verificationDocument.update({
        where: { id: documentId },
        data: { rotation: rotation },
      });

      // Log the rotation update
      await prisma.auditLog.create({
        data: {
          action: "DOCUMENT_ROTATION_UPDATED",
          entity: "VerificationDocument",
          entityId: documentId,
          oldValue: { rotation: oldDoc?.rotation } as any,
          newValue: { rotation: updatedDoc.rotation } as any,
          ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
          metadata: {
            compliance: {
              pci_dss: '10.2.2',
              bsp: 'Circular 808'
            }
          }
        }
      });

      return NextResponse.json({ success: true, document: updatedDoc });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("User API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
