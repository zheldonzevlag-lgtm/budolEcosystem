// Test script to verify shipping fee display functionality
// This script tests the order object structure and calculations

const testOrder = {
  id: "TEST-ORDER-123",
  total: 524.00,
  shippingCost: 50.00,
  paymentMethod: "GCASH",
  isPaid: true
};

console.log("=== Testing Shipping Fee Display ===");
console.log("Order ID:", testOrder.id);
console.log("Total:", testOrder.total);
console.log("Shipping Cost:", testOrder.shippingCost);

// Calculate subtotal (total - shipping)
const subtotal = testOrder.total - (testOrder.shippingCost || 0);
console.log("Subtotal:", subtotal);

// Format for display
const formatCurrency = (amount) => {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

console.log("\n=== Display Format ===");
console.log("Subtotal:", formatCurrency(subtotal));
console.log("Shipping Fee:", formatCurrency(testOrder.shippingCost || 0));
console.log("Total Amount:", formatCurrency(testOrder.total));

// Test edge cases
console.log("\n=== Edge Cases ===");

// Test with zero shipping
const zeroShippingOrder = {
  id: "TEST-ORDER-456",
  total: 474.00,
  shippingCost: 0,
  paymentMethod: "COD",
  isPaid: true
};

const zeroShippingSubtotal = zeroShippingOrder.total - (zeroShippingOrder.shippingCost || 0);
console.log("Zero Shipping - Subtotal:", formatCurrency(zeroShippingSubtotal));
console.log("Zero Shipping - Shipping Fee:", formatCurrency(zeroShippingOrder.shippingCost || 0));

// Test with undefined shipping
const undefinedShippingOrder = {
  id: "TEST-ORDER-789",
  total: 474.00,
  shippingCost: undefined,
  paymentMethod: "MAYA",
  isPaid: true
};

const undefinedShippingSubtotal = undefinedShippingOrder.total - (undefinedShippingOrder.shippingCost || 0);
console.log("Undefined Shipping - Subtotal:", formatCurrency(undefinedShippingSubtotal));
console.log("Undefined Shipping - Shipping Fee:", formatCurrency(undefinedShippingOrder.shippingCost || 0));

console.log("\n=== Test Complete ===");