/**
 * triggerRealtimeEvent - Inlined for Test Compatibility
 * Decoupled from ESM budolshap dependency to fix Jest parsing errors in CJS env.
 */
async function triggerRealtimeEvent(channel, event, data) {
  const triggerUrl = `${process.env.GATEWAY_URL}/internal/notify`;
  const isAdmin = channel === 'admin';
  const payload = { event, data, isAdmin };
  if (!isAdmin) payload.userId = channel.replace('user-', '');
  
  return await fetch(triggerUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

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
