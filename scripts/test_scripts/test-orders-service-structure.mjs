
import fs from 'fs';
import path from 'path';

const filePath = 'd:/IT Projects/budolEcosystem/budolshap-0.1.0/lib/services/ordersService.js';

function verifyFile() {
    console.log(`--- Verifying Orders Service File: ${filePath} ---`);
    
    if (!fs.existsSync(filePath)) {
        console.error('❌ File does not exist.');
        process.exit(1);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    
    const requiredExports = [
        'export async function getOrders',
        'export async function getOrderById',
        'export async function createOrder',
        'export async function updateOrderStatus',
        'export async function linkPaymentToOrder',
        'export async function findOrderByPaymentIntent'
    ];

    let missing = 0;
    requiredExports.forEach(exp => {
        if (content.includes(exp)) {
            console.log(`✅ Found: ${exp}`);
        } else {
            console.error(`❌ Missing: ${exp}`);
            missing++;
        }
    });

    // Check imports
    const requiredImports = [
        "import { prisma } from '@/lib/prisma'",
        "import { Prisma } from '@prisma/client'",
        "import { triggerRealtimeEvent } from '@/lib/realtime'",
        "import { creditPendingBalance } from '@/lib/escrow'"
    ];

    requiredImports.forEach(imp => {
        if (content.includes(imp)) {
            console.log(`✅ Found import: ${imp}`);
        } else {
            console.error(`❌ Missing import: ${imp}`);
            missing++;
        }
    });

    if (missing === 0) {
        console.log('\n✅ All checks passed! The file structure is correct.');
    } else {
        console.error(`\n❌ ${missing} checks failed.`);
        process.exit(1);
    }
}

verifyFile();
