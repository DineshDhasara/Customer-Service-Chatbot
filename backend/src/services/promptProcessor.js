/**
 * promptProcessor.js
 *
 * Core prompt-based logic (pure JS function).
 * Responsibilities:
 * - Detect intent using keywords, regex, and simple token overlap scoring.
 * - Perform slot filling using demoOrders (if orderId present).
 * - Return { reply, intent, confidence, metadata }.
 *
 * This is intentionally simple so it's readable in an interview.
 */

const intents = require('../data/intents.json');
const templates = require('../data/responseTemplates.json');
const demoOrders = require('../data/demoOrders.json');

// Helper: normalize
function normalize(s) {
  return (s || '').toLowerCase().replace(/[^\w\s]/g, '').trim();
}

// Helper: token overlap score
function tokenOverlap(a, b) {
  const toksA = new Set(normalize(a).split(/\s+/).filter(Boolean));
  const toksB = new Set(normalize(b).split(/\s+/).filter(Boolean));
  if (toksA.size === 0 || toksB.size === 0) return 0;
  let common = 0;
  toksA.forEach(t => { if (toksB.has(t)) common++; });
  return common / Math.max(toksA.size, toksB.size);
}

// Find orderId in text (simple regex)
function findOrderId(text) {
  const match = text.match(/ORD[0-9]{3,6}|[0-9]{5,}/i);
  return match ? match[0].toUpperCase() : null;
}

// Fill template slots
function fillTemplate(template, slots = {}) {
  let out = template;
  Object.keys(slots).forEach(k => {
    out = out.replace(new RegExp(`\\{${k}\\}`, 'g'), slots[k]);
  });
  return out;
}

async function process({ sessionId, message }) {
  const text = normalize(message);
  // Step 1: exact keyword matching and token overlap scoring
  let best = { intent: 'fallback', score: 0 };

  for (const it of intents) {
    // check keywords
    const kwScore = it.keywords.reduce((acc, kw) => {
      if (!kw) return acc;
      return acc + (text.includes(kw) ? 1 : 0);
    }, 0);
    // compute overlap with utterances
    const utteranceScores = (it.utterances || []).map(u => tokenOverlap(text, u));
    const utterMax = utteranceScores.length ? Math.max(...utteranceScores) : 0;
    const totalScore = kwScore + utterMax;
    if (totalScore > best.score) {
      best = { intent: it.name, score: totalScore };
    }
  }

  // If no keywords matched strongly, try fuzzy token overlap across intent names
  if (best.score === 0) {
    for (const it of intents) {
      const overlap = tokenOverlap(text, it.utterances.join(' '));
      if (overlap > best.score) best = { intent: it.name, score: overlap };
    }
  }

  // Confidence normalization (simple)
  let confidence = Math.min(1, best.score / 2 + 0.1); // heuristic

  // Extract slots
  const orderId = findOrderId(message);
  let metadata = { sessionId };
  // Build reply based on intent templates
  let reply = templates.fallback || "Sorry, I didn't get that.";

  if (best.intent === 'order_status' && orderId) {
    const order = demoOrders.find(o => o.id === orderId);
    if (order) {
      reply = fillTemplate(templates.order_status, {
        orderId: order.id,
        status: order.status,
        deliveryDate: order.deliveryDate
      });
      metadata.order = order;
      confidence = Math.max(confidence, 0.8);
    } else {
      reply = `I couldn't find order ${orderId}. Please check the order id or ask without id.`;
      confidence = 0.5;
    }
  } else if (best.intent === 'order_status') {
    reply = "Please share your order id (e.g., ORD1001) so I can check the status.";
  } else if (best.intent === 'refund') {
    reply = fillTemplate(templates.refund, { orderId: orderId || '{orderId}' });
  } else if (best.intent === 'greeting') {
    reply = templates.greeting;
  } else if (best.intent === 'complaint') {
    reply = templates.complaint;
  } else if (best.intent === 'human_escalation') {
    // simulate ticket creation
    const ticketId = `TCK-${Math.random().toString(36).substring(2,8).toUpperCase()}`;
    reply = fillTemplate(templates.human_escalation, { ticketId });
    metadata.ticketId = ticketId;
    confidence = 0.9;
  } else if (best.intent === 'thanks') {
    reply = "You're welcome! Anything else I can help with?";
  } else {
    // fallback
    reply = templates.fallback;
    confidence = Math.min(confidence, 0.4);
  }

  // Logging decisions for transparency (helpful in portfolio)
  console.log(`[promptProcessor] session:${sessionId} message:"${message}" -> intent:${best.intent} confidence:${confidence.toFixed(2)}`);

  return {
    reply,
    intent: best.intent,
    confidence,
    metadata
  };
}

module.exports = { process, _internals: { tokenOverlap, normalize, findOrderId } };
