import { getCategoryLucideIcon } from '../components/CategoryIcons';
import * as Lucide from 'lucide-react';

describe('CategoryIcons Logic', () => {
    test('returns exact match for electronics', () => {
        const Icon = getCategoryLucideIcon('electronics', 'Electronics');
        expect(Icon).toBe(Lucide.Tv);
    });

    test('returns partial match for phones', () => {
        const Icon = getCategoryLucideIcon('mobile-phones', 'Mobile Phones');
        expect(Icon).toBe(Lucide.Smartphone);
    });

    test('returns fallback for unknown slug', () => {
        const Icon = getCategoryLucideIcon('mystery-item', 'Mystery');
        expect(Icon).toBe(Lucide.Package);
    });

    test('returns correct icon for fashion', () => {
        const Icon = getCategoryLucideIcon('fashion', 'Fashion');
        expect(Icon).toBe(Lucide.ShoppingBag);
    });
});
