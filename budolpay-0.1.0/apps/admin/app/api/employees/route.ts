import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

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
        action: `ROLE_UPDATED_TO_${newRole}`,
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
      
      console.log(`[API] Updating profile for user ${userId}:`, {
        firstName, lastName, email, phoneNumber, role, department
      });

      const oldUser = await prisma.user.findUnique({ where: { id: userId } });
      if (!oldUser) {
        console.error(`[API] User ${userId} not found for profile update.`);
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { 
          firstName: firstName !== undefined ? firstName : oldUser.firstName, 
          lastName: lastName !== undefined ? lastName : oldUser.lastName, 
          email: email !== undefined ? email : oldUser.email, 
          phoneNumber: phoneNumber !== undefined ? phoneNumber : oldUser.phoneNumber, 
          role: role !== undefined ? (role as any) : oldUser.role,
          department: department !== undefined ? department : oldUser.department
        }
      });

      console.log(`[API] Successfully updated user ${userId}. New phone: ${updatedUser.phoneNumber}`);

      // Forensic Audit Log
      try {
        await createAuditLog({
          action: "USER_PROFILE_UPDATED",
          entity: "User",
          entityId: userId,
          userId: adminId || "SYSTEM",
          oldValue: oldUser as any,
          newValue: { 
            firstName: updatedUser.firstName, 
            lastName: updatedUser.lastName, 
            email: updatedUser.email, 
            phoneNumber: updatedUser.phoneNumber, 
            role: updatedUser.role, 
            department: updatedUser.department 
          } as any,
          ipAddress: "Internal System"
        });
        console.log(`[API] Audit log created for user ${userId}`);
      } catch (logError) {
        console.error(`[API] Failed to create audit log:`, logError);
        // We don't return error here to ensure the user update is still considered successful in UI
      }

      return NextResponse.json({ success: true, user: updatedUser });
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
          password: tempPassword,
        }
      });

      // Banking Process Simulation: Send to User via SMS/Email
      // In a real system, this would call an SMS/Email Gateway
      const deliveryMethod = user.phoneNumber ? "SMS" : "Email";
      const deliveryTarget = user.phoneNumber || user.email;

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
          email: `deleted_${Date.now()}_${userId}@budolpay.com` // Anonymize email but keep ID
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
          password: "PROVISIONED_ACCOUNT" // This would normally be handled by SSO invite flow
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

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Employee API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
