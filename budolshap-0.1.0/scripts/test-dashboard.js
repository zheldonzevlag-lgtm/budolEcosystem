
import { PrismaClient } from '@prisma/client';
import { startOfWeek, endOfWeek, subDays, format } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Testing Security Dashboard Logic...');

        // 1. Calculate Threat Mitigation Trend (Last 7 days)
        const today = new Date();
        
        const trends = [];
        const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

        for (let i = 0; i < 7; i++) {
            const date = subDays(today, 6 - i);
            const dayName = format(date, 'EEE').toUpperCase();
            
            console.log(`Processing day: ${dayName} (${date.toISOString()})`);

            // Count threats (FAILURE/WARNING logs)
            const threatsCount = await prisma.auditLog.count({
                where: {
                    createdAt: {
                        gte: new Date(date.setHours(0,0,0,0)),
                        lt: new Date(date.setHours(23,59,59,999))
                    },
                    status: { in: ['FAILURE', 'WARNING'] }
                }
            });

            // Count blocked (Specific actions like SPAM_ATTEMPT, BLOCKED_IP)
            const blockedCount = await prisma.auditLog.count({
                where: {
                    createdAt: {
                        gte: new Date(date.setHours(0,0,0,0)),
                        lt: new Date(date.setHours(23,59,59,999))
                    },
                    action: { in: ['SPAM_ATTEMPT', 'DDOS_MITIGATED', 'BLOCKED_ACCESS'] }
                }
            });

            trends.push({
                day: dayName,
                threats: threatsCount,
                blocked: blockedCount
            });
        }
        
        console.log('Trends calculated:', trends);

        // 2. Vulnerability Scan Status (Mocked or from DB if we had a scans table)
        const vulnStatus = {
            lastScan: subDays(new Date(), 0).toISOString(), // Today
            critical: 0,
            integrity: 100
        };

        // 3. AI Analyst Findings (Mocked or generated from recent logs)
        const recentIssues = await prisma.auditLog.findMany({
            where: { status: 'FAILURE' },
            orderBy: { createdAt: 'desc' },
            take: 5
        });
        
        console.log('Recent issues found:', recentIssues.length);

        let aiFinding = "System is stable. No critical anomalies detected in the last 24 hours.";
        if (recentIssues.length > 0) {
            aiFinding = `Detected ${recentIssues.length} recent failed actions. Most activity involves ${recentIssues[0].action}. Recommended review of recent ${recentIssues[0].entity || 'system'} access.`;
        }

        const data = {
            compliance: {
                aiSpamGuard: { status: 'Enabled', type: 'NEURAL' },
                encryption: { status: 'Active', type: 'AES-256' },
                rbac: { status: 'Enforced', type: 'STRICT' },
                ssl: { status: 'Active', type: 'STRONG' },
                ids: { status: 'Monitoring', type: 'REAL-TIME' }
            },
            trends,
            vulnerability: vulnStatus,
            aiFindings: {
                text: aiFinding,
                model: 'V4.0 SECURITY MODEL'
            }
        };

        console.log('Final Data:', JSON.stringify(data, null, 2));

    } catch (error) {
        console.error('Error executing dashboard logic:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
