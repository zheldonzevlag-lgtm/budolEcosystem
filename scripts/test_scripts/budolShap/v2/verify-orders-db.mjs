import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from budolshap-0.1.0 - absolute path is safer
const envPath = path.resolve(__dirname, '../../../../budolshap-0.1.0/.env');
dotenv.config({ path: envPath });

// Import PrismaClient from the specific workspace
const prismaClientPath = path.resolve(__dirname, '../../../../budolshap-0.1.0/node_modules/@prisma/client/index.js');
const { PrismaClient } = require(prismaClientPath);

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

async function verifyOrders() {
    console.log("🧪 Starting Database Verification for Orders and Transactions...");
    console.log("ENV Path:", envPath);
    console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Defined" : "UNDEFINED");
    console.log("Prisma Order Model:", prisma.order ? "Available" : "MISSING");

    try {
        if (!prisma.order) {
            throw new Error("Order model is missing from Prisma client. Did you run prisma generate?");
        }

        // 1. Check Orders
        console.log("\n--- Checking Recent Orders ---");
        const recentOrders = await prisma.order.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { email: true, name: true } },
                store: { select: { name: true } },
                orderItems: {
                    include: {
                        product: { select: { name: true } }
                    }
                }
            }
        });

        if (recentOrders.length === 0) {
            console.log("⚠️ No orders found in the database.");
        } else {
            console.log(`✅ Found ${recentOrders.length} recent orders:`);
            recentOrders.forEach(order => {
                console.log(`- Order ID: ${order.id}`);
                console.log(`  User: ${order.user?.name || 'N/A'} (${order.user?.email || 'N/A'})`);
                console.log(`  Store: ${order.store?.name || 'N/A'}`);
                console.log(`  Total: ₱${order.total.toFixed(2)} (Shipping: ₱${order.shippingCost.toFixed(2)})`);
                console.log(`  Status: ${order.status}`);
                console.log(`  Paid: ${order.isPaid ? '✅ YES' : '❌ NO'}`);
                console.log(`  Payment Method: ${order.paymentMethod}`);
                console.log(`  Payment Status: ${order.paymentStatus}`);
                console.log(`  Created At: ${new Date(order.createdAt).toLocaleString()}`);
                console.log(`  Items (${order.orderItems.length}):`);
                order.orderItems.forEach(item => {
                    console.log(`    * ${item.product?.name || 'Unknown Product'} x${item.quantity} (₱${item.price.toFixed(2)})`);
                });
                console.log('  -------------------');
            });
        }

        // 2. Check Transactions
        console.log("\n--- Checking Recent Transactions ---");
        try {
            // Check if Transaction model exists in this schema
            if (prisma.transaction) {
                const recentTransactions = await prisma.transaction.findMany({
                    take: 10,
                    orderBy: { createdAt: 'desc' }
                });

                if (recentTransactions.length === 0) {
                    console.log("⚠️ No transactions found in the database.");
                } else {
                    console.log(`✅ Found ${recentTransactions.length} recent transactions:`);
                    recentTransactions.forEach(tx => {
                        console.log(`- Tx ID: ${tx.id}`);
                        console.log(`  Type: ${tx.type}`);
                        console.log(`  Amount: ₱${tx.amount.toFixed(2)}`);
                        console.log(`  Status: ${tx.status}`);
                        console.log(`  Reference: ${tx.referenceId || 'N/A'}`);
                        console.log('  -------------------');
                    });
                }
            } else {
                console.log("ℹ️ Transaction model is not available in this schema.");
            }
        } catch (e) {
            console.log("ℹ️ Could not query transactions:", e.message);
        }

        console.log("\n🎉 Database verification complete.");

    } catch (error) {
        console.error("\n❌ Verification Failed!");
        console.error("Error Message:", error.message);
        console.error("Stack Trace:", error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

verifyOrders();
