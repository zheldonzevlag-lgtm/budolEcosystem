/**
 * Quick Integration Test
 * Verifies status mapper integration across components
 * Run with: npm test lib/shipping/integration.test.js
 */

import { normalizeStatus, UNIVERSAL_STATUS, getStatusLabel, isActiveStatus, isTerminalStatus } from './statusMapper.js';

describe('Integration Tests: Status Mapper', () => {
    
    describe('Status Mapper Functions', () => {
        // logic: ASSIGNING_DRIVER -> UNIVERSAL_STATUS.TO_SHIP (which is 'PROCESSING')
        // logic: PICKED_UP -> UNIVERSAL_STATUS.SHIPPING (which is 'SHIPPED')

        it('should map ASSIGNING_DRIVER to TO_SHIP (order)', () => {
             expect(normalizeStatus('ASSIGNING_DRIVER', 'lalamove', false)).toBe(UNIVERSAL_STATUS.TO_SHIP);
        });

        it('should map ON_GOING to TO_SHIP (order)', () => {
             expect(normalizeStatus('ON_GOING', 'lalamove', false)).toBe(UNIVERSAL_STATUS.TO_SHIP);
        });

        it('should map PICKED_UP to SHIPPING (order)', () => {
             expect(normalizeStatus('PICKED_UP', 'lalamove', false)).toBe(UNIVERSAL_STATUS.SHIPPING);
        });

        it('should map COMPLETED to DELIVERED (order)', () => {
             expect(normalizeStatus('COMPLETED', 'lalamove', false)).toBe(UNIVERSAL_STATUS.DELIVERED);
        });

        it('should map ASSIGNING_DRIVER to TO_PICKUP (return)', () => {
             expect(normalizeStatus('ASSIGNING_DRIVER', 'lalamove', true)).toBe(UNIVERSAL_STATUS.TO_PICKUP);
        });

        it('should map PICKED_UP to SHIPPING (return)', () => {
             expect(normalizeStatus('PICKED_UP', 'lalamove', true)).toBe('PICKED_UP');
        });
    });

    describe('Status Labels', () => {
        it('should label TO_SHIP correctly', () => {
            expect(getStatusLabel(UNIVERSAL_STATUS.TO_SHIP, false)).toBe('To Ship');
        });

        it('should label TO_PICKUP correctly', () => {
             expect(getStatusLabel(UNIVERSAL_STATUS.TO_PICKUP, true)).toBe('To Pick Up');
        });

        it('should label SHIPPING correctly', () => {
             expect(getStatusLabel(UNIVERSAL_STATUS.SHIPPING, false)).toBe('Shipping');
        });

         it('should label SHIPPING (return) correctly', () => {
             expect(getStatusLabel(UNIVERSAL_STATUS.SHIPPING, true)).toBe('Shipping to Seller');
        });
    });

    describe('Active Status Detection', () => {
        it('should detect TO_SHIP as active', () => {
            expect(isActiveStatus(UNIVERSAL_STATUS.TO_SHIP)).toBe(true);
        });

        it('should detect SHIPPING as active', () => {
            expect(isActiveStatus(UNIVERSAL_STATUS.SHIPPING)).toBe(true);
        });

        it('should detect DELIVERED as inactive', () => {
            expect(isActiveStatus(UNIVERSAL_STATUS.DELIVERED)).toBe(false);
        });
    });

    describe('Terminal Status Detection', () => {
        it('should detect COMPLETED as terminal', () => {
            expect(isTerminalStatus(UNIVERSAL_STATUS.COMPLETED)).toBe(true);
        });
         it('should detect CANCELLED as terminal', () => {
            expect(isTerminalStatus(UNIVERSAL_STATUS.CANCELLED)).toBe(true);
        });
        it('should detect TO_SHIP as non-terminal', () => {
            expect(isTerminalStatus(UNIVERSAL_STATUS.TO_SHIP)).toBe(false);
        });
    });

    describe('Universal Status Constants', () => {
        it('should have defined constants', () => {
            expect(UNIVERSAL_STATUS.TO_SHIP).toBeDefined();
            expect(UNIVERSAL_STATUS.SHIPPING).toBeDefined();
            expect(UNIVERSAL_STATUS.DELIVERED).toBeDefined();
            expect(UNIVERSAL_STATUS.TO_PICKUP).toBeDefined();
        });
    });
});
