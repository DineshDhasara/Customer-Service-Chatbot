import React, { useEffect, useState, useRef } from 'react';
import Message from './Message';
import MetaBar from './MetaBar';
import { v4 as uuidv4 } from 'uuid';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

export default function Chat() {
  const [messages, setMessages] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pb-chat')) || [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState('');
  const [sessionId] = useState(() => uuidv4());
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef();

  useEffect(() => {
    localStorage.setItem('pb-chat', JSON.stringify(messages));
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    // on mount add welcome if empty
    if (messages.length === 0) {
      const welcome = {
        id: uuidv4(),
        from: 'bot',
        text: 'Hi! I am your prompt-based assistant. How can I help today?',
        ts: Date.now()
      };
      setMessages([welcome]);
    }
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { id: uuidv4(), from: 'user', text: input, ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // simulate typing delay
      await new Promise(res => setTimeout(res, 500));
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: userMsg.text })
      });
      const data = await res.json();
      const botMsg = {
        id: uuidv4(),
        from: 'bot',
        text: data.reply,
        ts: Date.now()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [...prev, { id: uuidv4(), from: 'bot', text: 'Error contacting server. Try again.', ts: Date.now() }]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    localStorage.removeItem('pb-chat');
    setMessages([]);
  };

  const requestHuman = async () => {
    try {
      const res = await fetch(`${API_BASE}/ticket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, issue: messages.slice(-1)[0]?.text || 'Need human support' })
      });
      const t = await res.json();
      setMessages(prev => [...prev, { id: uuidv4(), from: 'bot', text: `Human support requested. Ticket ${t.ticketId} created (status: ${t.status})`, ts: Date.now() }]);
    } catch {
      setMessages(prev => [...prev, { id: uuidv4(), from: 'bot', text: 'Unable to create ticket. Try later.', ts: Date.now() }]);
    }
  };

  return (
    <div>
      <MetaBar sessionId={sessionId} />
      <div className="h-[60vh] overflow-auto p-3 border rounded-lg mb-3 bg-[#050708]">
        {messages.map(m => <Message key={m.id} from={m.from} text={m.text} ts={m.ts} />)}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2 items-start">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type a message... (Enter to send, Shift+Enter newline)"
          className="flex-1 p-3 rounded-md bg-[#0f1720] text-white"
          rows={2}
          aria-label="Chat input"
        />
        <div className="flex flex-col gap-2">
          <button onClick={sendMessage} className="px-4 py-2 rounded-md bg-primary text-black" aria-label="Send">Send</button>
          <button onClick={requestHuman} className="px-4 py-2 rounded-md border border-primary text-primary" aria-label="Request human">Request human support</button>
          <button onClick={clearChat} className="px-4 py-2 rounded-md text-gray-400">Clear chat</button>
        </div>
      </div>

      {loading && <div className="text-gray-400 text-sm mt-2">Typing…</div>}
    </div>
  );
}
