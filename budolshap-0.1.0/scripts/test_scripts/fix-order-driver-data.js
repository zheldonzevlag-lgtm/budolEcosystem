require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');

name: 'Test Driver 34567',
    phone: '09171234567',
        plateNumber: 'VP-1234',
            vehicleType: 'Van',
                photo: null,
                    rating: 5.0
        };

console.log('Injecting manual driver info:', manualDriverInfo);

const order = await prisma.order.findUnique({
    where: { id: internalOrderId }
});

if (!order) {
    console.error('Internal order not found!');
    return;
}

const currentShipping = order.shipping || {};
const updatedShipping = {
    ...currentShipping,
    driver: manualDriverInfo
};

await prisma.order.update({
    where: { id: internalOrderId },
    data: { shipping: updatedShipping }
});

console.log('Database updated successfully with manual driver data!');

    } catch (error) {
    console.error('Error:', error);
} finally {
    await prisma.$disconnect();
}
}

fixOrder();
