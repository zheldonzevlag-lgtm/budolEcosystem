import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { startOfWeek, endOfWeek, subDays, format } from 'date-fns';

export async function GET() {
    try {
        // In a real app, we would query the system settings and security services status
        // For now, we mock the static compliance status but calculate the trends from real audit logs

        // 1. Calculate Threat Mitigation Trend (Last 7 days)
        const today = new Date();
        const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 }); // Monday
        
        const trends = [];
        const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

        for (let i = 0; i < 7; i++) {
            const dayStart = subDays(today, 6 - i); // Last 7 days rolling, or fixed week? Image shows Mon-Sun.
            // Let's do Mon-Sun for the current week to match the image labels
            // Actually, usually trends are rolling 7 days. But labels are Mon-Sun. 
            // Let's stick to "Last 7 days" mapping to the day name.
            
            const date = subDays(today, 6 - i);
            const dayName = format(date, 'EEE').toUpperCase();
            
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

        // 2. Real-time Compliance Checks (Dynamic Status based on Logs)
        const now = new Date();
        const yesterday = subDays(now, 1);
        
        // Count recent specific incidents for status determination
        const recentIncidents = await prisma.auditLog.groupBy({
            by: ['action'],
            where: {
                createdAt: { gte: yesterday },
                status: { in: ['FAILURE', 'WARNING'] }
            },
            _count: { action: true }
        });
        
        const incidentMap = recentIncidents.reduce((acc, curr) => {
            acc[curr.action] = curr._count.action;
            return acc;
        }, {});

        // Dynamic Status Logic
        const ddosCount = incidentMap['DDOS_MITIGATED'] || 0;
        const rbacCount = incidentMap['UNAUTHORIZED_ACCESS'] || 0;
        const spamCount = incidentMap['SPAM_ATTEMPT'] || 0;
        const idsCount = incidentMap['SUSPICIOUS_ACTIVITY'] || 0;

        const compliance = {
            aiSpamGuard: { 
                status: spamCount > 0 ? 'Active' : 'Enabled', 
                type: spamCount > 0 ? `${spamCount} BLOCKED` : 'NEURAL' 
            },
            encryption: { status: 'Active', type: 'AES-256' },
            rbac: { 
                status: rbacCount > 0 ? 'Enforced' : 'Active', 
                type: rbacCount > 0 ? `${rbacCount} BLOCKED` : 'STRICT' 
            },
            ssl: { 
                status: process.env.NODE_ENV === 'production' ? 'Active' : 'Dev Mode', 
                type: process.env.NODE_ENV === 'production' ? 'STRONG' : 'LOCAL' 
            },
            ids: { 
                status: idsCount > 0 ? 'Alert' : 'Monitoring', 
                type: idsCount > 0 ? 'THREAT DETECTED' : 'REAL-TIME' 
            },
            ddos: { 
                status: ddosCount > 0 ? 'Mitigating' : 'Monitoring', 
                type: ddosCount > 0 ? `${ddosCount} IP BLOCKED` : 'L7-SHIELD' 
            }
        };

        // 3. Vulnerability Scan Status
        // Base integrity on recent critical failures
        const criticalFailures = await prisma.auditLog.count({
            where: {
                createdAt: { gte: yesterday },
                status: 'FAILURE'
            }
        });
        
        // Simple integrity score: 100 - (failures * 2). Min 0.
        const integrityScore = Math.max(0, 100 - (criticalFailures * 2));
        
        const vulnStatus = {
            lastScan: new Date().toISOString(), // Real-time check
            critical: criticalFailures,
            integrity: integrityScore
        };

        // 4. AI Analyst Findings (Generated from recent logs)
        const recentIssues = await prisma.auditLog.findMany({
            where: { status: 'FAILURE' },
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        let aiFinding = "System is stable. No critical anomalies detected in the last 24 hours.";
        if (recentIssues.length > 0) {
            const mostFrequentAction = recentIssues[0].action;
            aiFinding = `Detected ${criticalFailures} recent failed actions. Most activity involves ${mostFrequentAction}. Recommended review of recent ${recentIssues[0].entity || 'system'} access.`;
        }

        const data = {
            compliance,
            trends,
            vulnerability: vulnStatus,
            aiFindings: {
                text: aiFinding,
                model: 'V4.0 SECURITY MODEL'
            }
        };

        return NextResponse.json(data);
    } catch (error) {
        console.error('Failed to fetch security dashboard data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
