const express = require('express');
const router = express.Router();
const promptProcessor = require('../services/promptProcessor');

router.post('/', async (req, res) => {
  const { sessionId, message } = req.body || {};
  if (!message) return res.status(400).json({ success: false, message: 'Message is required.' });

  try {
    // process message through promptProcessor
    const result = await promptProcessor.process({ sessionId, message });
    return res.json({
      reply: result.reply,
      intent: result.intent,
      confidence: result.confidence,
      metadata: result.metadata || {}
    });
  } catch (err) {
    console.error('Chat error', err);
    res.status(500).json({ reply: 'Server error', error: err.message });
  }
});

module.exports = router;
