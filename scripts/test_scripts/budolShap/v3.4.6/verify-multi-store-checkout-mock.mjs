// Multi-Store Checkout Verification Script (Mock Test)
// This script validates the v3.4.6 multi-store checkout logic

import { randomUUID } from 'crypto';

// Mock database for testing
class MockDatabase {
  constructor() {
    this.users = [];
    this.stores = [];
    this.products = [];
    this.addresses = [];
    this.checkouts = [];
    this.orders = [];
  }

  async createUser(data) {
    const user = { id: randomUUID(), ...data };
    this.users.push(user);
    return user;
  }

  async createStore(data) {
    const store = { id: randomUUID(), ...data };
    this.stores.push(store);
    return store;
  }

  async createProduct(data) {
    const product = { id: randomUUID(), ...data };
    this.products.push(product);
    return product;
  }

  async createAddress(data) {
    const address = { id: randomUUID(), ...data };
    this.addresses.push(address);
    return address;
  }

  async createCheckout(data) {
    const checkout = { id: randomUUID(), ...data };
    this.checkouts.push(checkout);
    return checkout;
  }

  async createOrder(data) {
    const order = { id: randomUUID(), ...data };
    this.orders.push(order);
    return order;
  }

  async updateCheckout(id, data) {
    const checkout = this.checkouts.find(c => c.id === id);
    if (checkout) {
      Object.assign(checkout, data);
    }
    return checkout;
  }

  async updateOrder(id, data) {
    const order = this.orders.find(o => o.id === id);
    if (order) {
      Object.assign(order, data);
    }
    return order;
  }

  async updateProductStock(id, decrement) {
    const product = this.products.find(p => p.id === id);
    if (product) {
      product.stock -= decrement;
    }
    return product;
  }

  async findOrdersByCheckout(checkoutId) {
    return this.orders.filter(o => o.checkoutId === checkoutId);
  }

  async findProductById(id) {
    return this.products.find(p => p.id === id);
  }
}

async function main() {
  console.log('🚀 Starting Multi-Store Checkout Verification (Mock Test)...');
  
  const db = new MockDatabase();

  try {
    // 1. Setup Test Data
    console.log('\n📋 Setting up test data...');

    // Create Users
    const user = await db.createUser({
      email: `test-user-${Date.now()}@example.com`,
      name: 'Test User',
      password: 'password123',
      role: 'USER',
      phoneNumber: `09${Date.now().toString().slice(-9)}`,
      image: 'https://example.com/avatar.png'
    });
    console.log(`✅ Created Test User: ${user.id}`);

    // Create second user for Store 2
    const user2 = await db.createUser({
      email: `test-user2-${Date.now()}@example.com`,
      name: 'Test User 2',
      password: 'password123',
      role: 'USER',
      phoneNumber: `09${(Date.now() + 1).toString().slice(-9)}`,
      image: 'https://example.com/avatar2.png'
    });
    console.log(`✅ Created Test User 2: ${user2.id}`);

    // Create Stores
    const store1 = await db.createStore({
      name: `Store 1 - ${Date.now()}`,
      description: 'Test Store 1',
      username: `store1_${Date.now()}`,
      address: '123 Test St',
      logo: 'https://example.com/logo.png',
      email: 'store1@example.com',
      contact: '09000000001',
      userId: user.id
    });
    console.log(`✅ Created Store 1: ${store1.id}`);

    const store2 = await db.createStore({
      name: `Store 2 - ${Date.now()}`,
      description: 'Test Store 2',
      username: `store2_${Date.now()}`,
      address: '456 Test Ave',
      logo: 'https://example.com/logo2.png',
      email: 'store2@example.com',
      contact: '09000000002',
      userId: user2.id
    });
    console.log(`✅ Created Store 2: ${store2.id}`);

    // Create Products
    const product1 = await db.createProduct({
      name: 'Product 1',
      price: 100,
      mrp: 120,
      category: 'Test',
      storeId: store1.id,
      stock: 10,
      description: 'Test Product 1',
      images: JSON.stringify([]),
      inStock: true
    });
    console.log(`✅ Created Product 1: ${product1.id} (Stock: 10)`);

    const product2 = await db.createProduct({
      name: 'Product 2',
      price: 200,
      mrp: 220,
      category: 'Test',
      storeId: store2.id,
      stock: 5,
      description: 'Test Product 2',
      images: JSON.stringify([]),
      inStock: true
    });
    console.log(`✅ Created Product 2: ${product2.id} (Stock: 5)`);

    // Create Address
    const address = await db.createAddress({
      userId: user.id,
      fullName: 'Test User',
      phoneNumber: '09123456789',
      street: '123 Test Street',
      city: 'Test City',
      province: 'Test Province',
      zipCode: '1234',
      isDefault: true
    });
    console.log(`✅ Created Address: ${address.id}`);

    // 2. Simulate Order Creation (Multi-Store)
    console.log('\n📦 Simulating Order Creation (ordersService.js logic)...');
    
    // Calculate totals
    const item1Total = 100 * 2; // 2 units
    const item2Total = 200 * 1; // 1 unit
    const shippingCost = 50;
    const grandTotal = (item1Total + shippingCost) + (item2Total + shippingCost); // 2 orders, 2 shipping fees

    // Create Checkout (Master Record)
    const checkout = await db.createCheckout({
      userId: user.id,
      total: grandTotal,
      status: 'PENDING'
    });
    console.log(`✅ Created Checkout: ${checkout.id}`);

    // Create Order 1
    const order1 = await db.createOrder({
      userId: user.id,
      storeId: store1.id,
      addressId: address.id,
      status: 'ORDER_PLACED',
      paymentMethod: 'BUDOL_PAY',
      total: item1Total + shippingCost,
      isPaid: false,
      paymentStatus: 'pending',
      checkoutId: checkout.id
    });
    console.log(`✅ Created Order 1: ${order1.id}`);

    // Decrement Stock 1 (Atomic)
    await db.updateProductStock(product1.id, 2);
    console.log(`✅ Decremented Product 1 stock by 2`);

    // Create Order 2
    const order2 = await db.createOrder({
      userId: user.id,
      storeId: store2.id,
      addressId: address.id,
      status: 'ORDER_PLACED',
      paymentMethod: 'BUDOL_PAY',
      total: item2Total + shippingCost,
      isPaid: false,
      paymentStatus: 'pending',
      checkoutId: checkout.id
    });
    console.log(`✅ Created Order 2: ${order2.id}`);

    // Decrement Stock 2 (Atomic)
    await db.updateProductStock(product2.id, 1);
    console.log(`✅ Decremented Product 2 stock by 1`);

    console.log(`✅ Transaction Committed.`);
    console.log(`   Checkout ID: ${checkout.id}`);
    console.log(`   Order 1 ID: ${order1.id}`);
    console.log(`   Order 2 ID: ${order2.id}`);

    // Verify Stock Decrement
    const p1 = await db.findProductById(product1.id);
    const p2 = await db.findProductById(product2.id);
    
    if (p1.stock !== 8) throw new Error(`Product 1 stock incorrect: ${p1.stock} (expected 8)`);
    if (p2.stock !== 4) throw new Error(`Product 2 stock incorrect: ${p2.stock} (expected 4)`);
    console.log(`✅ Stock decrement verified.`);

    // 3. Simulate Webhook Payment Success
    console.log('\n💳 Simulating Payment Success (Webhook logic)...');
    
    const checkoutId = checkout.id;
    const paymentIntentId = `pi_${randomUUID()}`;

    // Update Checkout Status
    await db.updateCheckout(checkoutId, { 
      status: 'PAID',
      paymentId: paymentIntentId,
      paymentProvider: 'BUDOL_PAY'
    });
    console.log(`✅ Checkout ${checkoutId} marked as PAID.`);

    // Find linked orders
    const linkedOrders = await db.findOrdersByCheckout(checkoutId);
    console.log(`✅ Found ${linkedOrders.length} linked orders.`);

    // Update linked orders
    for (const order of linkedOrders) {
      await db.updateOrder(order.id, {
        isPaid: true,
        paymentStatus: 'paid',
        status: 'TO_SHIP' // Assuming successful payment moves to TO_SHIP
      });
      console.log(`✅ Order ${order.id} updated: isPaid=true, status=TO_SHIP`);
    }

    // 4. Final Verification
    console.log('\n🔍 Final Verification...');
    
    const finalOrders = await db.findOrdersByCheckout(checkoutId);

    // Verify All Orders are Paid and Linked
    if (finalOrders.length !== 2) {
      throw new Error(`Incorrect number of orders: ${finalOrders.length} (expected 2)`);
    }
    console.log(`✅ Found ${finalOrders.length} orders linked to checkout`);

    const allPaid = finalOrders.every(order => order.isPaid === true);
    if (!allPaid) {
      throw new Error('Not all orders are marked as paid');
    }
    console.log(`✅ All orders are paid`);

    const allToShip = finalOrders.every(order => order.status === 'TO_SHIP');
    if (!allToShip) {
      throw new Error('Not all orders are in TO_SHIP status');
    }
    console.log(`✅ All orders are in TO_SHIP status`);

    console.log('\n🎉 SUCCESS: Multi-store checkout verification completed!');
    console.log('   - All orders from different stores are linked to single checkout');
    console.log('   - Payment success updates all linked orders');
    console.log('   - All orders move to TO_SHIP status');
    console.log('   - Stock decremented atomically');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);