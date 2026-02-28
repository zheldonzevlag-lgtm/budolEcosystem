
describe('Hero Price Logic', () => {
    test('should calculate minimum price among products, excluding zero prices', () => {
        const products = [
            { id: 1, price: 0 },
            { id: 2, price: 100 },
            { id: 3, price: 50 },
            { id: 4, price: 0 }
        ];

        const validPrices = products
            .map(product => Number(product.price))
            .filter(price => price > 0);

        const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;

        expect(minPrice).toBe(50);
    });

    test('should return 0 if no products have price > 0', () => {
        const products = [
            { id: 1, price: 0 },
            { id: 2, price: 0 }
        ];

        const validPrices = products
            .map(product => Number(product.price))
            .filter(price => price > 0);

        const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;

        expect(minPrice).toBe(0);
    });

    test('should return 0 if products array is empty', () => {
        const products = [];

        const validPrices = products
            .map(product => Number(product.price))
            .filter(price => price > 0);

        const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;

        expect(minPrice).toBe(0);
    });
});
