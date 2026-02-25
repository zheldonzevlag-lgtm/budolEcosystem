
import { prisma } from '../../lib/prisma.js';
import { startOfWeek, subDays, format } from 'date-fns';

async function testDashboardQuery() {
    try {
        console.log('Testing Security Dashboard Query...');
        
        const today = new Date();
        const trends = [];
        
        for (let i = 0; i < 7; i++) {
            const date = subDays(today, 6 - i);
            const dayName = format(date, 'EEE').toUpperCase();
            
            console.log(`Processing ${dayName} (${date.toISOString()})...`);
            
            // Safe date range calculation
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            
            console.log(`  Range: ${startOfDay.toISOString()} - ${endOfDay.toISOString()}`);

            const threatsCount = await prisma.auditLog.count({
                where: {
                    createdAt: {
                        gte: startOfDay,
                        lt: endOfDay
                    },
                    status: { in: ['FAILURE', 'WARNING'] }
                }
            });
            
            console.log(`  Threats: ${threatsCount}`);
        }
        
        console.log('Query successful!');
    } catch (error) {
        console.error('Query failed:', error);
        console.error(error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

testDashboardQuery();
