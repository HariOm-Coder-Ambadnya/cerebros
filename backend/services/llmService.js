import { getAIProvider } from '../config/aiProvider.js';
import logger from '../config/logger.js';

/**
 * LLMService
 * Single responsibility: manage chat completions with streaming support
 */
class LLMService {
  _getProvider() {
    return getAIProvider();
  }

  /**
   * Stream a chat completion token-by-token via callback
   * @param {Array<{role: string, content: string}>} messages
   * @param {Function} onToken - called with each token string
   * @returns {Promise<string>} full response
   */
  async streamCompletion(messages, onToken) {
    const provider = this._getProvider();
    logger.debug(`Streaming completion with ${messages.length} messages`);
    return provider.generateChatCompletion(messages, onToken);
  }
}

export const llmService = new LLMService();
