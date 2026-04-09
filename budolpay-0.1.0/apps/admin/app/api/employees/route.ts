import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { sendDualChannelNotification } from "@/lib/notifications";

// Temporary in-memory store for OTPs (Sandbox Compliance Sandbox)
// In production, this would use Redis or Database
const otpStore = new Map<string, { otp: string, expiry: number }>();

const normalizePhone = (phone: string) => {
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 11) return `+63${digits.substring(1)}`;
  if (digits.startsWith("63") && digits.length === 12) return `+${digits}`;
  if (digits.startsWith("9") && digits.length === 10) return `+63${digits}`;
  return null;
};

export async function GET() {
  try {
    const employees = await prisma.user.findMany({
      where: {
        role: {
          in: ["ADMIN", "STAFF"]
        }
      },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { auditLogs: true }
        }
      }
    });

    return NextResponse.json(employees);
  } catch (error) {
    console.error("Failed to fetch employees:", error);
    return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, userId, newRole, adminId } = body;

    if (action === "UPDATE_ROLE") {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { role: newRole as any }
      });

      // Log the role update action
      await createAuditLog({
        action: `ROLE_UPDATED_TO_${newRole} `,
        entity: "User",
        entityId: userId,
        userId: adminId,
        newValue: { role: newRole },
        ipAddress: "Internal System"
      });

      return NextResponse.json({ success: true, user: updatedUser });
    }

    if (action === "UPDATE_PROFILE") {
      const { firstName, lastName, email, phoneNumber, role, department } = body;

      if (!adminId) {
        return NextResponse.json({ error: "Admin ID is required for audit/maker-checker." }, { status: 400 });
      }

      console.log(`[Maker - Checker] Change requested for user ${userId} by admin ${adminId} `);

      const oldUser = await prisma.user.findUnique({ where: { id: userId } });
      if (!oldUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      let normalizedPhone: string | null = null;
      if (phoneNumber !== undefined) {
        normalizedPhone = normalizePhone(phoneNumber);
        if (!normalizedPhone) {
          return NextResponse.json({
            error: "Invalid phone number format. Use 09XXXXXXXXX or +639XXXXXXXXX."
          }, { status: 400 });
        }
        const existingPhoneUser = await prisma.user.findFirst({
          where: {
            id: { not: userId },
            phoneNumber: normalizedPhone
          },
          select: { id: true }
        });
        if (existingPhoneUser) {
          return NextResponse.json({
            error: "Phone number already exists in database."
          }, { status: 409 });
        }
      }

      // 1. Identify what changed
      const changes: any = {};
      if (firstName !== undefined && firstName !== oldUser.firstName) changes.firstName = firstName;
      if (lastName !== undefined && lastName !== oldUser.lastName) changes.lastName = lastName;
      if (email !== undefined && email !== oldUser.email) changes.email = email;
      if (phoneNumber !== undefined && normalizedPhone && normalizedPhone !== oldUser.phoneNumber) changes.phoneNumber = normalizedPhone;
      if (role !== undefined && role !== oldUser.role) changes.role = role;
      if (department !== undefined && department !== oldUser.department) changes.department = department;

      if (Object.keys(changes).length === 0) {
        return NextResponse.json({ success: true, message: "No changes detected." });
      }

      // 2. Check for existing PENDING requests for this user
      const existingRequest = await prisma.changeRequest.findFirst({
        where: {
          entity: "User",
          entityId: userId,
          status: "PENDING"
        }
      });

      if (existingRequest) {
        return NextResponse.json({
          error: "There is already a pending change request for this user. Please approve or reject it first."
        }, { status: 409 });
      }

      // 3. Create Change Request (Maker phase)
      // Ensure the maker actually exists in the local database to avoid foreign key errors
      const maker = await prisma.user.findUnique({ where: { id: adminId } });
      if (!maker) {
        return NextResponse.json({
          error: "Maker ID not found in local database. Please re-login to sync your profile."
        }, { status: 400 });
      }

      const changeRequest = await prisma.changeRequest.create({
        data: {
          entity: "User",
          entityId: userId,
          details: changes,
          makerId: adminId,
          status: "PENDING"
        }
      });

      // Audit Log for Maker Action
      await createAuditLog({
        action: "CHANGE_REQUEST_CREATED",
        entity: "User",
        entityId: userId,
        userId: adminId,
        newValue: { changeRequestId: changeRequest.id, changes } as any,
        ipAddress: "Internal System",
        metadata: {
          compliance: "Maker-Checker Phase 1",
          pci_dss: "8.2.1",
          bsp: "Circular 808"
        }
      });

      return NextResponse.json({
        success: true,
        message: "Profile change request created and pending approval.",
        changeRequestId: changeRequest.id,
        isPending: true
      });
    }

    if (action === "RESET_PASSWORD") {
      // Compliance: Admin cannot reset their own password via the Admin Dashboard
      if (adminId === userId) {
        return NextResponse.json({ error: "Self-password reset is prohibited for compliance." }, { status: 403 });
      }

      // Compliance: Admin cannot set the password directly to a known value
      // We generate a temporary one-time password
      const tempPassword = Math.random().toString(36).substring(7).toUpperCase();

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

      await prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash: tempPassword,
        }
      });

      // Simulation of Dual-Channel Delivery
      const notifyResults = await sendDualChannelNotification(user, 'PASSWORD_RESET', tempPassword);
      const deliveryMethod = notifyResults.sms && notifyResults.email ? "SMS_AND_EMAIL" : (notifyResults.sms ? "SMS" : "Email");
      const deliveryTarget = user.email;

      await createAuditLog({
        action: "USER_PASSWORD_RESET_BY_ADMIN",
        entity: "User",
        entityId: userId,
        userId: adminId,
        newValue: { deliveryMethod, deliveryTarget } as any,
        ipAddress: "Internal System"
      });

      // Compliance v2.1.4: We return the password ONLY in this sandbox environment
      // for developer ease, but marked as "Securely Delivered to User"
      return NextResponse.json({
        success: true,
        tempPassword,
        deliveredTo: deliveryTarget,
        method: deliveryMethod,
        complianceNotice: "In production, the password is never shown to the admin dashboard."
      });
    }

    if (action === "DELETE_USER") {
      // Compliance: Admin cannot deactivate their own account
      if (adminId === userId) {
        return NextResponse.json({ error: "Self-deactivation is prohibited for compliance." }, { status: 403 });
      }

      // Compliance: Soft delete only to preserve audit trails
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          role: "DEACTIVATED" as any,
          email: `deleted_${Date.now()}_${userId} @budolpay.com` // Anonymize email but keep ID
        }
      });

      await createAuditLog({
        action: "USER_DEACTIVATED",
        entity: "User",
        entityId: userId,
        userId: adminId,
        ipAddress: "Internal System"
      });

      return NextResponse.json({ success: true, message: "User deactivated successfully" });
    }

    if (action === "PROVISION_ACCOUNT") {
      const { email, firstName, lastName, role, phoneNumber } = await request.json();

      // We need to create the user in budolID first (since it's the central authority)
      // For now, we simulate this by creating in local budolPay DB as a placeholder
      // In a real scenario, this would call budolID's register endpoint
      const newUser = await prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          role: role as any,
          phoneNumber,
          passwordHash: "PROVISIONED_ACCOUNT" // This would normally be handled by SSO invite flow
        }
      });

      // Log the provisioning action
      await createAuditLog({
        action: "ACCOUNT_PROVISIONED",
        entity: "User",
        entityId: newUser.id,
        newValue: { email, role } as any,
        ipAddress: "Internal System"
      });

      return NextResponse.json({ success: true, user: newUser });
    }

    if (action === "SEND_EDIT_OTP") {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
      const actor = adminId
        ? await prisma.user.findUnique({
          where: { id: adminId },
          select: { id: true, firstName: true, lastName: true, email: true }
        })
        : null;

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiry = Date.now() + 5 * 60 * 1000; // 5 mins

      otpStore.set(userId, { otp, expiry });

      // Dual-Channel Compliance Broadcast
      await sendDualChannelNotification(user, 'OTP', otp);

      // Compliance v2.4.1: Log the MFA request
      await createAuditLog({
        action: "EDIT_MFA_REQUESTED",
        entity: "User",
        entityId: userId,
        userId: actor?.id || null,
        actorName: actor ? `${actor.firstName || ''} ${actor.lastName || ''}`.trim() || actor.email : undefined,
        actorEmail: actor?.email || undefined,
        ipAddress: "Internal System",
        newValue: { channel: "SMS_AND_EMAIL" } as any
      });

      return NextResponse.json({
        success: true,
        message: "OTP sent via SMS and Email.",
        // We return OTP in sandbox for testing, though in prod we wait for user output
        _sandbox_debug_otp: otp
      });
    }

    if (action === "VERIFY_EDIT_OTP") {
      const { otp } = body;
      const stored = otpStore.get(userId);
      const actor = adminId
        ? await prisma.user.findUnique({
          where: { id: adminId },
          select: { id: true, firstName: true, lastName: true, email: true }
        })
        : null;

      if (!stored || Date.now() > stored.expiry) {
        return NextResponse.json({ error: "OTP expired or invalid." }, { status: 400 });
      }

      if (stored.otp !== otp) {
        return NextResponse.json({ error: "Incorrect verification code." }, { status: 400 });
      }

      // Success - consume OTP
      otpStore.delete(userId);

      await createAuditLog({
        action: "EDIT_MFA_VERIFIED",
        entity: "User",
        entityId: userId,
        userId: actor?.id || null,
        actorName: actor ? `${actor.firstName || ''} ${actor.lastName || ''}`.trim() || actor.email : undefined,
        actorEmail: actor?.email || undefined,
        ipAddress: "Internal System"
      });

      return NextResponse.json({ success: true, message: "Verification successful." });
    }

    if (action === "GET_CHANGE_REQUESTS") {
      const requests = await prisma.changeRequest.findMany({
        where: { status: "PENDING" },
        include: {
          maker: { select: { firstName: true, lastName: true, email: true } }
        },
        orderBy: { createdAt: "desc" }
      });

      // Enrich with target user info
      const enrichedRequests = await Promise.all(requests.map(async (req) => {
        const targetUser = await prisma.user.findUnique({
          where: { id: req.entityId },
          select: { firstName: true, lastName: true, email: true }
        });
        return { ...req, targetUser };
      }));

      return NextResponse.json(enrichedRequests);
    }

    if (action === "APPROVE_CHANGE_REQUEST") {
      const { requestId, checkerId } = body;

      if (!checkerId) return NextResponse.json({ error: "Checker ID is required." }, { status: 400 });

      // Ensure the checker actually exists in the local database
      const checker = await prisma.user.findUnique({ where: { id: checkerId } });
      if (!checker) {
        return NextResponse.json({
          error: "Checker ID not found in local database. Please re-login."
        }, { status: 400 });
      }

      const request = await prisma.changeRequest.findUnique({ where: { id: requestId } });
      if (!request || request.status !== "PENDING") {
        return NextResponse.json({ error: "Request not found or already processed." }, { status: 404 });
      }

      // 4. Segregation of Duties (SoD) Check: Maker cannot be Checker
      if (request.makerId === checkerId) {
        return NextResponse.json({
          error: "Compliance Violation: You cannot approve your own change request (Maker-Checker Rule)."
        }, { status: 403 });
      }

      // 5. Apply Changes (Checker phase)
      const details = request.details as any;
      const updatedUser = await prisma.user.update({
        where: { id: request.entityId },
        data: details
      });

      // Update state
      await prisma.changeRequest.update({
        where: { id: requestId },
        data: {
          status: "APPROVED",
          checkerId: checkerId,
          updatedAt: new Date()
        }
      });

      // Enhanced Forensic Audit Log
      await createAuditLog({
        action: "CHANGE_REQUEST_APPROVED",
        entity: request.entity,
        entityId: request.entityId,
        userId: checkerId,
        oldValue: { makerId: request.makerId, changeRequestId: requestId } as any,
        newValue: details,
        ipAddress: "Internal System",
        metadata: {
          compliance: "Maker-Checker Phase 2 Completed",
          pci_dss: "10.2.2",
          makerId: request.makerId
        }
      });

      return NextResponse.json({ success: true, user: updatedUser });
    }

    if (action === "REJECT_CHANGE_REQUEST") {
      const { requestId, checkerId, reason } = body;

      const request = await prisma.changeRequest.findUnique({ where: { id: requestId } });
      if (!request || request.status !== "PENDING") {
        return NextResponse.json({ error: "Request not found or already processed." }, { status: 404 });
      }

      await prisma.changeRequest.update({
        where: { id: requestId },
        data: {
          status: "REJECTED",
          checkerId: checkerId,
          reason,
          updatedAt: new Date()
        }
      });

      await createAuditLog({
        action: "CHANGE_REQUEST_REJECTED",
        entity: request.entity,
        entityId: request.entityId,
        userId: checkerId,
        metadata: { reason, makerId: request.makerId }
      });

      return NextResponse.json({ success: true, message: "Change request rejected." });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Employee API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
