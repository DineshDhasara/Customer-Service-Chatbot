import React from 'react';
import Chat from './components/Chat';

export default function App() {
  return (
    <div className="min-h-screen bg-black text-white p-4">
      <header className="max-w-3xl mx-auto mb-6">
        <h1 className="text-3xl font-semibold">Prompt-based Customer Service Chatbot</h1>
        <p className="text-gray-400">Dark-themed demo showcasing prompt-based NLU and prompt templating.</p>
      </header>

      <main className="max-w-3xl mx-auto">
        <div className="bg-[#071014] rounded-2xl shadow-lg p-4">
          <Chat />
        </div>
      </main>
    </div>
  );
}
