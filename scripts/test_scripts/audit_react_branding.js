const fs = require('fs');
const path = require('path');

const COMPONENTS_DIR = path.join(__dirname, '../../budolshap-0.1.0/components');
const APP_DIR = path.join(__dirname, '../../budolshap-0.1.0/app');

const filesToCheck = [
    'OrderItem.jsx',
    'OrderDetailsCard.jsx',
    'OrderHeader.jsx',
    'TrackingTimeline.jsx',
    'OrderSummary.jsx',
    'OrderItemsList.jsx',
    'payment/QRCodeModal.jsx'
];

const appFilesToCheck = [
    'store/orders/page.jsx',
    'admin/orders/page.jsx',
    'payment/qr/page.jsx'
];

console.log('--- Branding Component Usage Audit ---');

function checkFile(filePath, fileName) {
    if (!fs.existsSync(filePath)) {
        console.log(`[MISSING] ${fileName}`);
        return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const hasImport = content.includes("import BudolPayText from");
    const idUsageCount = (content.match(/order\.id/g) || []).length + 
                        (content.match(/selectedOrder\.id/g) || []).length +
                        (content.match(/verifyingOrder\.id/g) || []).length +
                        (content.match(/order\.id\.slice/g) || []).length +
                        (content.match(/paymentIntentId/g) || []).length;
    
    // Check for IDs inside JSX that are NOT wrapped in BudolPayText
    // We look for {order.id} etc. that are NOT preceded by "text=", "$", or "key="
    const unwrappedIds = (content.match(/(?<!text=)(?<!\$)(?<!key=)\{(order|selectedOrder|verifyingOrder)(\?\.)?id(\?\.)?(slice)?/g) || []).length;
    const bookingIdUsageCount = (content.match(/bookingId/g) || []).length +
                                (content.match(/refNumber/g) || []).length;
    const componentUsageCount = (content.match(/<BudolPayText/g) || []).length;

    console.log(`\nFile: ${fileName}`);
    console.log(`- Import: ${hasImport ? '✅' : '❌'}`);
    try {
        console.log(`- BudolPayText usages: ${componentUsageCount}`);
    } catch (e) {
        console.log(`- Error counting usages: ${e.message}`);
    }
    
    if (unwrappedIds > 0) {
        console.log(`- Warning: ${unwrappedIds} unwrapped IDs found in JSX!`);
    }
    
    if (componentUsageCount === 0 && (idUsageCount > 0 || bookingIdUsageCount > 0)) {
        console.log(`- Warning: IDs found (${idUsageCount + bookingIdUsageCount}) but no BudolPayText usage!`);
    }
}

filesToCheck.forEach(file => {
    checkFile(path.join(COMPONENTS_DIR, file), file);
});

appFilesToCheck.forEach(file => {
    checkFile(path.join(APP_DIR, file), file);
});

console.log('\n--- Audit Complete ---');
