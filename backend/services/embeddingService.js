import { getAIProvider } from '../config/aiProvider.js';
import logger from '../config/logger.js';

/**
 * EmbeddingService
 * Single responsibility: convert text → vector embeddings
 * Delegates to the configured AI provider.
 */
class EmbeddingService {
  constructor() {
    this._provider = null;
  }

  _getProvider() {
    if (!this._provider) {
      this._provider = getAIProvider();
    }
    return this._provider;
  }

  /**
   * Generate embedding for a single text string
   * @param {string} text
   * @returns {Promise<number[]>}
   */
  async embed(text, taskType = 'RETRIEVAL_DOCUMENT') {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid input: text must be a non-empty string');
    }

    const sanitized = text.trim().slice(0, 8000); // Safety cap for token limits
    return this._getProvider().generateEmbedding(sanitized, taskType);
  }

  /**
   * Batch embed multiple texts
   * @param {string[]} texts
   * @returns {Promise<number[][]>}
   */
  async embedBatch(texts) {
    if (!Array.isArray(texts) || texts.length === 0) {
      throw new Error('embedBatch requires a non-empty array of strings');
    }

    logger.debug(`Embedding batch of ${texts.length} chunks`);

    // Sequential with small delay to respect rate limits
    const results = [];
    for (const text of texts) {
      results.push(await this.embed(text));
    }
    return results;
  }
}

// Singleton
export const embeddingService = new EmbeddingService();
