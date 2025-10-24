import React from 'react';

export default function Message({ from, text, ts }) {
  const isUser = from === 'user';
  const bubbleClass = isUser
    ? 'ml-auto bg-userbg text-white'
    : 'mr-auto bg-botbg text-white';

  return (
    <div className={`max-w-[80%] my-2 p-3 rounded-lg ${bubbleClass}`}>
      <div className="whitespace-pre-wrap">{text}</div>
      <div className="text-xs text-gray-500 mt-1 text-right">{new Date(ts).toLocaleTimeString()}</div>
    </div>
  );
}
