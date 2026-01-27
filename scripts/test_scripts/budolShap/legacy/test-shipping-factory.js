const { getShippingProvider } = require('../../services/shippingFactory');

console.log('Testing shippingFactory import...');
console.log('getShippingProvider type:', typeof getShippingProvider);

try {
    const lalamove = getShippingProvider('lalamove');
    console.log('Lalamove instance created successfully');
    console.log('Lalamove type:', typeof lalamove);
    console.log('Lalamove.getQuote type:', typeof lalamove.getQuote);
    console.log('SUCCESS: All imports and instantiation working!');
} catch (error) {
    console.error('ERROR:', error.message);
    console.error('Stack:', error.stack);
}
