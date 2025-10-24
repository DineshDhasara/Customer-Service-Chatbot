const promptProcessor = require('../services/promptProcessor');

test('detects greeting', async () => {
  const res = await promptProcessor.process({ sessionId: 's1', message: 'Hello there' });
  expect(res.intent).toBe('greeting');
  expect(res.confidence).toBeGreaterThan(0);
});

test('finds order status with id', async () => {
  const res = await promptProcessor.process({ sessionId: 's2', message: 'Where is my order ORD1001?' });
  expect(res.intent).toBe('order_status');
  expect(res.metadata.order).toBeDefined();
  expect(res.reply).toContain('ORD1001');
});

test('fallback for unknown', async () => {
  const res = await promptProcessor.process({ sessionId: 's3', message: 'blah blah unknown' });
  expect(res.intent).toBe('fallback' || expect.any(String));
  expect(res.reply).toBeDefined();
});
