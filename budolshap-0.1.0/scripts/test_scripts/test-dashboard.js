
import { PrismaClient } from '@prisma/client';
import { startOfWeek, endOfWeek, subDays, format } from 'date-fns';

const prisma = new PrismaClient();

async function testDashboard() {
    console.log('Testing Security Dashboard Logic...');

    try {
        // 1. Calculate Threat Mitigation Trend (Last 7 days)
        const today = new Date();
        const trends = [];
        
        console.log(`Today: ${today.toISOString()}`);

        for (let i = 0; i < 7; i++) {
            const date = subDays(today, 6 - i);
            const dayName = format(date, 'EEE').toUpperCase();
            
            const startOfDay = new Date(date);
            startOfDay.setHours(0,0,0,0);
            
            const endOfDay = new Date(date);
            endOfDay.setHours(23,59,59,999);

            console.log(`Checking ${dayName} (${startOfDay.toISOString()} - ${endOfDay.toISOString()})`);
            
            // Count threats (FAILURE/WARNING logs)
            const threatsCount = await prisma.auditLog.count({
                where: {
                    createdAt: {
                        gte: startOfDay,
                        lt: endOfDay
                    },
                    status: { in: ['FAILURE', 'WARNING'] }
                }
            });

            // Count blocked (Specific actions like SPAM_ATTEMPT, BLOCKED_IP)
            const blockedCount = await prisma.auditLog.count({
                where: {
                    createdAt: {
                        gte: startOfDay,
                        lt: endOfDay
                    },
                    action: { in: ['SPAM_ATTEMPT', 'DDOS_MITIGATED', 'BLOCKED_ACCESS'] }
                }
            });

            trends.push({
                day: dayName,
                threats: threatsCount,
                blocked: blockedCount
            });
            
            console.log(`  Threats: ${threatsCount}, Blocked: ${blockedCount}`);
        }

        console.log('Trends Data:', JSON.stringify(trends, null, 2));

        // 3. AI Analyst Findings
        const recentIssues = await prisma.auditLog.findMany({
            where: { status: 'FAILURE' },
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        console.log(`Recent Issues Found: ${recentIssues.length}`);
        if (recentIssues.length > 0) {
            console.log('Most recent issue:', recentIssues[0]);
        }

        console.log('Test Complete. Dashboard logic seems functional.');

    } catch (error) {
        console.error('Test Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testDashboard();
