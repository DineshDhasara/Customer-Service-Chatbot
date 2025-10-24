import React from 'react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Chat from '../components/Chat';

global.fetch = vi.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ reply: 'Hello from bot', intent: 'greeting', confidence: 0.9, metadata: {} }),
  })
);

describe('Chat component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders and sends a message, shows bot reply', async () => {
    render(<Chat />);
    const input = screen.getByPlaceholderText(/Type a message/i);
    fireEvent.change(input, { target: { value: 'Hi' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('Hello from bot')).toBeInTheDocument();
  });
});
