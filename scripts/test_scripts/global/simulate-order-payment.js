async function createOrder() {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlNDA2NmU4MC0xZjMzLTRmNmQtYmVhZi0zNmY0MTg2YjYzNzAiLCJlbWFpbCI6ImNsYXJrLmtlbnRAYnVkb2xzaGFwLmNvbSIsImlhdCI6MTc2NzM4MzI4OSwiZXhwIjoxNzY3OTg4MDg5fQ.lUI1OVt6A2-qxjMyN3Rcl1DymCbUN2Sdz97so8l6lMg';
  const baseUrl = 'http://localhost:3001';
  
  const orderData = {
    userId: 'e4066e80-1f33-4f6d-beaf-36f4186b6370',
    orderItems: [
      {
        productId: 'cmjvq780m000cgpvsjs1ut0o9',
        quantity: 1,
        price: 1,
        storeId: 'cmjvpxfo30005gpvs6mybi12t'
      }
    ],
    addressId: 'cmjxadm930001gp7ct42r5s2u',
    paymentMethod: 'QRPH', // We want to test QRPH
    total: 1,
    shippingCost: 0
  };

  try {
    console.log('Creating order...');
    const response = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Cookie': `budolshap_token=${token}`
      },
      body: JSON.stringify(orderData)
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Order creation failed: ${JSON.stringify(errorData)}`);
    }

    const orders = await response.json();
    const orderId = Array.isArray(orders) ? orders[0].id : orders.id;
    console.log('Order created successfully!');
    console.log('Order ID:', orderId);
    
    // Now initiate payment
    console.log('\nInitiating payment checkout...');
    const checkoutData = {
      amount: 100, // 1.00 PHP in centavos
      orderId: orderId,
      method: 'QRPH',
      provider: 'budolpay',
      description: `Order #${orderId} - QRPH`,
      billing: {
        name: 'Clark Kent',
        email: 'clark.kent@budolshap.com',
        phone: '09123456789',
        address: {
          line1: '123 Main St',
          line2: 'San Lorenzo',
          city: 'Metropolis',
          state: 'New York',
          postal_code: '10001',
          country: 'PH'
        }
      }
    };
    
    const checkoutResponse = await fetch(`${baseUrl}/api/payment/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Cookie': `budolshap_token=${token}`
      },
      body: JSON.stringify(checkoutData)
    });
    
    const checkoutResult = await checkoutResponse.json();
    console.log('Checkout response:');
    console.log(JSON.stringify(checkoutResult, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

createOrder();
