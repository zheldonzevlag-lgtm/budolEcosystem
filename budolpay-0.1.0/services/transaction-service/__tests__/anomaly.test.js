const { calculateAnomalyScore } = require('../riskEngine');

// Mock Prisma for history (not used by pure function but kept for structure)
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    transaction: { findMany: jest.fn() }
  }))
}));

describe('AI-Driven Behavioral Baselining (EWMA)', () => {
  test('Consistent User: Low Risk Score', () => {
    // 5 transactions of 1000 PHP
    const history = Array(5).fill({ amount: 1000 });
    const amount = 1100;
    
    const result = calculateAnomalyScore(amount, history);
    expect(result.score).toBeLessThan(30);
    expect(result.method).toBe('DEVIATION_EWMA');
  });

  test('Sudden Spike: High Risk Score', () => {
    const history = Array(10).fill({ amount: 1000 });
    const amount = 10000;
    
    const result = calculateAnomalyScore(amount, history);
    expect(result.score).toBeGreaterThan(80);
    expect(result.baseline).toBeCloseTo(1000);
  });

  test('Cold Start: Fallback to System Median', () => {
    const history = []; // Empty or < 3
    const amount = 15000;
    
    const result = calculateAnomalyScore(amount, history);
    expect(result.score).toBeGreaterThanOrEqual(50);
    expect(result.method).toBe('COLD_START_MEDIAN');
  });

  test('Tiered Response: Critical Anomaly (Score >= 90)', () => {
    const history = Array(20).fill({ amount: 500 });
    const amount = 25000;
    
    const result = calculateAnomalyScore(amount, history);
    expect(result.score).toBeGreaterThanOrEqual(90);
  });
});
