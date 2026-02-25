const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkAuditLogs() {
    try {
        console.log("🔍 Checking Audit Logs...")
        const logs = await prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: { user: { select: { email: true } } }
        })

        if (logs.length === 0) {
            console.log("⚠️ No audit logs found yet. Try logging in and out of the app first.")
        } else {
            console.log(`✅ Found ${logs.length} recent logs:`)
            logs.forEach(log => {
                console.log(`[${log.createdAt.toISOString()}] ${log.action} | User: ${log.user.email} | IP: ${log.ipAddress || 'N/A'} | Device: ${log.device || 'N/A'}`)
            })
        }
    } catch (error) {
        console.error("❌ Error fetching logs:", error)
    } finally {
        await prisma.$disconnect()
    }
}

checkAuditLogs()
