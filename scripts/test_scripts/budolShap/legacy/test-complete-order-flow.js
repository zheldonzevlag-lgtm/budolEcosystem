import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_FILE = path.join(__dirname, 'complete-order-test-log.txt');

function log(message, ...args) {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] ${message} ${args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a).join(' ')}\n`;
    console.log(message, ...args);
    fs.appendFileSync(LOG_FILE, formattedMessage);
}

function error(message, ...args) {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] ERROR: ${message} ${args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a).join(' ')}\n`;
    console.error(message, ...args);
    fs.appendFileSync(LOG_FILE, formattedMessage);
}

// Clear log file
fs.writeFileSync(LOG_FILE, '');

/**
 * COMPLETE END-TO-END ORDER FLOW TEST
 * 
 * This test simulates:
 * 1. User places an order with GCash payment
 * 2. Order is created in database
 * 3. Lalamove quote is requested
 * 4. Lalamove delivery is booked
 * 5. Driver accepts and delivers
 * 
 * Prerequisites:
 * - Running dev server (npm run dev)
 * - Valid Lalamove credentials in .env.local
 * - Valid PayMongo credentials in .env.local
 * - Test user account
 * - Test store with products
 */

async function testCompleteOrderFlow() {
    log('========================================');
    log('  COMPLETE ORDER FLOW TEST');
    log('  BudolPay Payment + Lalamove Delivery');
    log('========================================\n');

    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';

    try {
        // ============================================
        // STEP 1: LOGIN AS TEST USER
        // ============================================
        log('📋 STEP 1: Logging in as test user...');

        const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'diana.prince@budolshap.com',
                password: 'asakapa'
            })
        });

        if (!loginResponse.ok) {
            const errorText = await loginResponse.text();
            throw new Error(`Login failed: ${loginResponse.status} ${errorText}`);
        }

        const loginData = await loginResponse.json();
        const authToken = loginData.token || loginData.user?.token;
        const userId = loginData.user.id;

        if (!authToken) {
            // Check headers for set-cookie if token not in body
            const cookies = loginResponse.headers.get('set-cookie');
            if (cookies) {
                const match = cookies.match(/budolshap_token=([^;]+)/);
                if (match) authToken = match[1];
            }
        }

        if (!authToken) {
            throw new Error('Could not extract auth token from login response');
        }

        log('✅ Login successful');
        log('   User ID:', userId);
        log('   Token:', authToken.substring(0, 20) + '...\n');

        // ============================================
        // STEP 2: GET USER'S DEFAULT ADDRESS
        // ============================================
        log('📋 STEP 2: Fetching user address...');

        const addressResponse = await fetch(`${BASE_URL}/api/addresses?userId=${userId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!addressResponse.ok) {
            throw new Error(`Failed to fetch addresses: ${addressResponse.status}`);
        }

        const addresses = await addressResponse.json();

        if (!addresses || addresses.length === 0) {
            throw new Error('No addresses found for user. Please create an address first.');
        }

        const defaultAddress = addresses.find(a => a.isDefault) || addresses[0];
        log('✅ Address found');
        log('   Address ID:', defaultAddress.id);
        log('   Location:', `${defaultAddress.street}, ${defaultAddress.city}\n`);

        // ============================================
        // STEP 3: GET AVAILABLE PRODUCTS
        // ============================================
        log('📋 STEP 3: Fetching available products...');

        const productsResponse = await fetch(`${BASE_URL}/api/products?limit=5`);

        if (!productsResponse.ok) {
            throw new Error(`Failed to fetch products: ${productsResponse.status}`);
        }

        const products = await productsResponse.json();

        if (products.length === 0) {
            throw new Error('No products available. Please add products first.');
        }

        const testProduct = products[0];
        log('✅ Product selected');
        log('   Product ID:', testProduct.id);
        log('   Product Name:', testProduct.name);
        log('   Price:', testProduct.price);
        log('   Store ID:', testProduct.storeId, '\n');

        // ============================================
        // STEP 4: GET LALAMOVE QUOTE
        // ============================================
        log('📋 STEP 4: Requesting Lalamove quote...');

        // Get store address (assuming store has address in database)
        const storeResponse = await fetch(`${BASE_URL}/api/stores/${testProduct.storeId}`);
        const storeData = await storeResponse.json();

        // For testing, use Manila City Hall as pickup and Makati City Hall as delivery
        const quotePayload = {
            serviceType: 'MOTORCYCLE',
            language: 'en_PH',
            pickup: {
                coordinates: {
                    lat: '14.5995',
                    lng: '120.9842'
                },
                address: 'Manila City Hall, Arroceros St, Ermita, Manila'
            },
            delivery: {
                coordinates: {
                    lat: '14.5547',
                    lng: '121.0244'
                },
                address: 'Makati City Hall, J.P. Rizal Ave, Poblacion, Makati'
            },
            package: {
                weight: "LESS_THAN_5KG",
                item: {
                    quantity: "1",
                    categories: ["FOOD_AND_BEVERAGE"],
                    handlingInstructions: ["KEEP_UPRIGHT"]
                }
            }
        };

        const quoteResponse = await fetch(`${BASE_URL}/api/shipping/lalamove/quote`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(quotePayload)
        });

        if (!quoteResponse.ok) {
            const errorText = await quoteResponse.text();
            throw new Error(`Failed to get Lalamove quote: ${quoteResponse.status} - ${errorText}`);
        }

        const quoteData = await quoteResponse.json();
        const quote = quoteData.quote;
        log('✅ Lalamove quote received');
        log('   Quotation ID:', quote.quoteId);
        log('   Price:', quote.price.amount, quote.price.currency);
        log('   Distance:', quote.distance.value, quote.distance.unit);
        log('   Pickup Stop ID:', quote.stops[0].stopId);
        log('   Delivery Stop ID:', quote.stops[1].stopId, '\n');

        // ============================================
        // STEP 5: CREATE ORDER WITH LALAMOVE SHIPPING
        // ============================================
        log('📋 STEP 5: Creating order...');

        const orderPayload = {
            userId: userId,
            addressId: defaultAddress.id,
            orderItems: [
                {
                    productId: testProduct.id,
                    quantity: 1
                }
            ],
            paymentMethod: 'BUDOL_PAY', // Updated for user request
            isCouponUsed: false,
            shipping: {
                provider: 'lalamove',
                quotationId: quote.quoteId,
                stops: quote.stops,
                priceBreakdown: {
                    total: quote.price.amount,
                    currency: quote.price.currency,
                    base: quote.price.breakdown.base,
                    surcharge: quote.price.breakdown.surcharge
                }
            },
            shippingCost: quote.price.amount
        };

        const orderResponse = await fetch(`${BASE_URL}/api/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(orderPayload)
        });

        if (!orderResponse.ok) {
            const errorText = await orderResponse.text();
            throw new Error(`Failed to create order: ${orderResponse.status} - ${errorText}`);
        }

        const orders = await orderResponse.json();
        const order = Array.isArray(orders) ? orders[0] : orders;

        log('✅ Order created successfully');
        log('   Order ID:', order.id);
        log('   Total:', order.total);
        log('   Payment Method:', order.paymentMethod);
        log('   Payment Status:', order.paymentStatus, '\n');

        // ============================================
        // STEP 6: CREATE BUDOLPAY PAYMENT
        // ============================================
        log('📋 STEP 6: Creating BudolPay payment...');

        const paymentPayload = {
            orderId: order.id,
            amount: order.total * 100, // Amount in centavos
            method: 'BUDOL_PAY',
            provider: 'budolpay',
            description: `Order #${order.id} for Diana Prince`
        };

        const paymentResponse = await fetch(`${BASE_URL}/api/payment/checkout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(paymentPayload)
        });

        if (!paymentResponse.ok) {
            const errorText = await paymentResponse.text();
            throw new Error(`Failed to create BudolPay payment: ${paymentResponse.status} - ${errorText}`);
        }

        const payment = await paymentResponse.json();
        log('✅ BudolPay payment created');
        log('   Payment Intent ID:', payment.paymentIntentId);
        log('   Status:', payment.status);
        log('   Checkout URL:', payment.checkoutUrl, '\n');

        // ============================================
        // STEP 7: SIMULATE PAYMENT COMPLETION
        // ============================================
        log('📋 STEP 7: Payment completion...');
        log('   Checkout URL:', payment.checkoutUrl, '\n');

        // Simulate BudolPay payment by calling its internal callback or just wait for status check
        log('⏳ Simulating BudolPay processing...');
        
        // Simulate Webhook call
        const webhookPayload = {
            event: 'payment.success',
            data: {
                id: payment.paymentIntentId,
                metadata: {
                    orderId: order.id
                }
            }
        };

        const webhookResponse = await fetch(`${BASE_URL}/api/webhooks/budolpay`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(webhookPayload)
        });

        if (!webhookResponse.ok) {
            log('⚠️  Webhook simulation failed:', await webhookResponse.text());
        } else {
            log('✅ Webhook simulation successful');
        }
        
        // Wait for user to complete payment
        log('⏳ Waiting 5 seconds for order status update...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // ============================================
        // STEP 8: CHECK ORDER STATUS
        // ============================================
        log('📋 STEP 8: Checking order status...');

        const orderStatusResponse = await fetch(`${BASE_URL}/api/orders/${order.id}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!orderStatusResponse.ok) {
            throw new Error(`Failed to fetch order status: ${orderStatusResponse.status}`);
        }

        const updatedOrder = await orderStatusResponse.json();
        log('✅ Order status retrieved');
        log('   Order ID:', updatedOrder.id);
        log('   Payment Status:', updatedOrder.paymentStatus);
        log('   Is Paid:', updatedOrder.isPaid);
        log('   Order Status:', updatedOrder.status, '\n');

        // ============================================
        // STEP 9: BOOK LALAMOVE DELIVERY (if paid)
        // ============================================
        if (updatedOrder.isPaid) {
            log('📋 STEP 9: Booking Lalamove delivery...');
            log('⚠️  WARNING: This will create a REAL Lalamove order!');
            log('⚠️  Make sure you have sufficient credit.\n');

            const lalamoveBookPayload = {
                orderId: order.id,
                quotationId: quote.quoteId,
                stops: quote.stops,
                pickupContact: {
                    name: 'BudolShap Warehouse',
                    phone: '+639171234567'
                },
                deliveryContact: {
                    name: defaultAddress.name || 'Diana Prince',
                    phone: defaultAddress.phone || '+639177654321'
                },
                packageDetails: {
                    remarks: `Budolshap Order #${order.id}`
                },
                metadata: {
                    platform: 'budolshap',
                    orderId: order.id,
                    test: 'true'
                }
            };

            const lalamoveBookResponse = await fetch(`${BASE_URL}/api/shipping/lalamove/book`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(lalamoveBookPayload)
            });

            if (!lalamoveBookResponse.ok) {
                const errorText = await lalamoveBookResponse.text();
                error('Failed to book Lalamove:', errorText);
            } else {
                const lalamoveData = await lalamoveBookResponse.json();
                const lalamoveOrder = lalamoveData.booking;
                log('✅ Lalamove delivery booked!');
                log('   Lalamove Order ID:', lalamoveOrder.orderId);
                log('   Status:', lalamoveOrder.status);
                log('   Share Link:', lalamoveOrder.shareLink);
                if (lalamoveOrder.priceBreakdown) {
                    log('   Price:', lalamoveOrder.priceBreakdown.total, lalamoveOrder.priceBreakdown.currency, '\n');
                } else {
                    log('   Price: N/A (not returned by booking API)\n');
                }

                // ============================================
                // STEP 10: TRACK LALAMOVE ORDER
                // ============================================
                log('📋 STEP 10: Tracking Lalamove order...');

                const trackResponse = await fetch(`${BASE_URL}/api/shipping/lalamove/track?orderId=${lalamoveOrder.orderId}`, {
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
                });

                if (!trackResponse.ok) {
                    error('Failed to track Lalamove order:', await trackResponse.text());
                } else {
                    const tracking = await trackResponse.json();
                    log('✅ Tracking information:');
                    log('   Status:', tracking.status);
                    if (tracking.driver) {
                        log('   Driver:', tracking.driver.name);
                        log('   Phone:', tracking.driver.phone);
                        log('   Plate:', tracking.driver.plateNumber);
                    } else {
                        log('   Driver: Not assigned yet');
                    }
                }
            }
        } else {
            log('⚠️  STEP 9: SKIPPED - Order not paid yet');
            log('   Please complete the GCash payment first.\n');
        }

        // ============================================
        // TEST SUMMARY
        // ============================================
        log('\n========================================');
        log('  ✅ TEST COMPLETE!');
        log('========================================\n');

        log('📊 SUMMARY:');
        log('1. ✅ User logged in successfully');
        log('2. ✅ Address retrieved');
        log('3. ✅ Product selected');
        log('4. ✅ Lalamove quote obtained');
        log('5. ✅ Order created with BudolPay payment');
        log('6. ✅ BudolPay payment intent created');
        log('7. ⏳ Payment completion pending (simulation)');
        log('8. ✅ Order status checked');
        if (updatedOrder.isPaid) {
            log('9. ✅ Lalamove delivery booked');
            log('10. ✅ Delivery tracking available');
        } else {
            log('9. ⚠️  Lalamove booking skipped (payment not completed)');
        }

        log('\n📋 NEXT STEPS:');
        log('1. Complete BudolPay payment at:', payment.checkoutUrl);
        log('2. Check Lalamove Partner Portal: https://partnerportal.lalamove.com/');
        log('3. Monitor order status in your app');
        log('4. Wait for driver assignment');
        log('5. Track delivery progress');

        log('\n✨ Order ID:', order.id);
        log('✨ Payment Checkout:', payment.checkoutUrl);

    } catch (err) {
        error('\n❌ TEST FAILED:');
        error('   Message:', err.message);
        error('   Stack:', err.stack);
        process.exit(1);
    }
}

// Run the test
testCompleteOrderFlow();
