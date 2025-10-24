const express = require('express');
const router = express.Router();
const demoOrders = require('../data/demoOrders.json');

router.get('/:orderId', (req, res) => {
  const { orderId } = req.params;
  const order = demoOrders.find(o => o.id === orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

module.exports = router;
