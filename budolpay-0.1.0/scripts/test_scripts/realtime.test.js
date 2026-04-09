const { triggerRealtimeEvent } = require('../../../budolshap-0.1.0/lib/realtime');

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true }),
  })
);

describe('Realtime Trigger', () => {
  beforeEach(() => {
    fetch.mockClear();
    process.env.GATEWAY_URL = 'http://localhost:8080';
    process.env.BUDOLPAY_API_KEY = 'test_key';
  });

  it('should format admin channel payload correctly', async () => {
    await triggerRealtimeEvent('admin', 'TEST_EVENT', { foo: 'bar' });
    
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/internal/notify',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          event: 'TEST_EVENT',
          data: { foo: 'bar' },
          isAdmin: true
        })
      })
    );
  });

  it('should format user channel payload correctly', async () => {
    await triggerRealtimeEvent('user-123', 'USER_EVENT', { hello: 'world' });
    
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/internal/notify',
      expect.objectContaining({
        body: JSON.stringify({
          event: 'USER_EVENT',
          data: { hello: 'world' },
          isAdmin: false,
          userId: '123'
        })
      })
    );
  });
});
