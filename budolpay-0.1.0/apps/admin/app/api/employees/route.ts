import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    const { action, userId, newRole, adminId } = await request.json();

    if (action === "UPDATE_ROLE") {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { role: newRole as any }
      });

      // Log the role update action
      await prisma.auditLog.create({
        data: {
          action: `ROLE_UPDATED_TO_${newRole}`,
          entity: "User",
          entityId: userId,
          userId: adminId,
          newValue: { role: newRole } as any,
          ipAddress: "Internal System"
        }
      });

      return NextResponse.json({ success: true, user: updatedUser });
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
      await prisma.auditLog.create({
        data: {
          action: "ACCOUNT_PROVISIONED",
          entity: "User",
          entityId: newUser.id,
          newValue: { email, role } as any,
          ipAddress: "Internal System"
        }
      });

      return NextResponse.json({ success: true, user: newUser });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Employee API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
