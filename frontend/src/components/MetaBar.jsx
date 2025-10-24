import React from 'react';

export default function MetaBar({ sessionId }) {
  return (
    <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
      <div>Session ID: <span className="text-white">{sessionId}</span></div>
      <div>Chat saved locally</div>
    </div>
  );
}
