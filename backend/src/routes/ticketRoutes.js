const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

router.post('/', (req, res) => {
  const { sessionId, issue } = req.body || {};
  // simulate ticket creation
  const ticketId = `TCK-${Math.random().toString(36).substring(2,8).toUpperCase()}`;
  console.log(`[ticket] session:${sessionId} issue:${issue}`);
  return res.json({ ticketId, status: 'open' });
});

module.exports = router;
