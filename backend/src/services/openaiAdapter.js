/**
 * Optional OpenAI adapter file.
 * This is a stub. If you want to integrate real LLMs, fill in with proper calls.
 * For portfolio purposes, this file shows how you'd plug in an LLM but defaults to mock.
 */

module.exports = {
  async generate({ systemPrompt, userPrompt, maxTokens = 300 }) {
    // In mock mode, just return a placeholder
    return { text: `Mock LLM response to: ${userPrompt}` };
  }
};
