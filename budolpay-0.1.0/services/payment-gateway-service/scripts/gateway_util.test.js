const { generateSecureReferenceId } = require('../api/index');

describe('Gateway Utility - generateSecureReferenceId', () => {
  it('should generate a reference ID starting with JON-', () => {
    const ref = generateSecureReferenceId();
    expect(ref).toMatch(/^JON-\d{8}\d{6}-[A-Z0-9]{8}$/);
  });

  it('should generate unique reference IDs', () => {
    const ref1 = generateSecureReferenceId();
    const ref2 = generateSecureReferenceId();
    expect(ref1).not.toBe(ref2);
  });
});
