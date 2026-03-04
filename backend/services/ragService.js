import { embeddingService } from './embeddingService.js';
import { vectorService } from './vectorService.js';
import { llmService } from './llmService.js';
import logger from '../config/logger.js';

const TOP_K = parseInt(process.env.TOP_K_RESULTS) || 6;

/**
 * RAGService
 * Single responsibility: orchestrate retrieval + augmentation + generation
 */
class RAGService {
  /**
   * Build a RAG system prompt with injected context
   * @param {Array} chunks - retrieved document chunks
   * @returns {string}
   */
  _buildSystemPrompt(chunks) {
    const contextBlock = chunks
      .map(
        (c, i) =>
          `[Source ${i + 1}: "${c.documentName}"]\n${c.content}`
      )
      .join('\n\n---\n\n');

    return `You are Cerebro, an expert AI assistant for a Team Intelligence Hub.
Your job is to answer questions using ONLY the provided document context below.

RULES:
1. Answer ONLY based on the provided context. Do not use external knowledge.
2. If the answer is not found in the context, respond with: "I don't have enough information in the uploaded documents to answer this question."
3. Always cite the source document name(s) you used at the end of your answer using this format:
   📎 Sources: "Document Name 1", "Document Name 2"
4. Be concise but thorough. Use bullet points for lists.
5. If multiple documents contain relevant info, synthesize them coherently.

---CONTEXT START---
${contextBlock}
---CONTEXT END---`;
  }

  /**
   * Perform semantic search and return relevant chunks
   * @param {string} query
   * @returns {Promise<Array>}
   */
  async retrieve(query) {
    const queryEmbedding = await embeddingService.embed(query, 'RETRIEVAL_QUERY');
    return vectorService.search(queryEmbedding, TOP_K);
  }

  /**
   * Full RAG pipeline with streaming
   * @param {string} query - user's question
   * @param {Array} conversationHistory - prior messages [{role, content}]
   * @param {Function} onToken - streaming callback
   * @returns {Promise<{answer: string, sources: string[]}>}
   */
  async chat(query, conversationHistory = [], onToken) {
    const startTime = Date.now();

    // 1. Retrieve relevant chunks
    const chunks = await this.retrieve(query);
    logger.debug(`Retrieved ${chunks.length} chunks in ${Date.now() - startTime}ms`);

    if (chunks.length === 0) {
      const noDocsMsg =
        "I don't have any documents to search through. Please upload some documents first.";
      onToken?.(noDocsMsg);
      return { answer: noDocsMsg, sources: [] };
    }

    // 2. Build messages
    const systemPrompt = this._buildSystemPrompt(chunks);
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-6), // Keep last 3 exchanges for context
      { role: 'user', content: query },
    ];

    // 3. Stream completion
    const answer = await llmService.streamCompletion(messages, onToken);

    // 4. Extract unique sources
    const sources = [...new Set(chunks.map((c) => c.documentName))];

    logger.info(`RAG chat completed in ${Date.now() - startTime}ms | Sources: ${sources.join(', ')}`);

    return { answer, sources };
  }
}

export const ragService = new RAGService();
