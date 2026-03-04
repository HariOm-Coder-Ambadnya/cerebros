import { ragService } from '../services/ragService.js';
import { embeddingService } from '../services/embeddingService.js';
import { vectorService } from '../services/vectorService.js';
import logger from '../config/logger.js';

/**
 * POST /api/chat (SSE)
 * RAG-powered streaming chat using Server-Sent Events
 */
export async function chat(req, res) {
  const { message, history = [] } = req.body;
  logger.debug(`Chat request received with message: "${message}"`);

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  res.flushHeaders();

  // Send initial comment to keep connection alive during retrieval
  res.write(': \n\n');

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  let closed = false;
  req.on('close', () => {
    closed = true;
    logger.debug('Client disconnected from SSE stream');
  });

  try {
    // Validate history format
    const validHistory = Array.isArray(history)
      ? history.filter(
        (m) =>
          m &&
          typeof m.role === 'string' &&
          typeof m.content === 'string' &&
          ['user', 'assistant', 'system'].includes(m.role)
      )
      : [];

    sendEvent('start', { status: 'retrieving' });

    const { answer, sources } = await ragService.chat(
      message.trim(),
      validHistory,
      (token) => {
        if (!closed) {
          sendEvent('token', { token });
        }
      }
    );

    if (!closed) {
      sendEvent('done', { sources, fullAnswer: answer });
      res.end();
    }
  } catch (err) {
    logger.error('Chat SSE error:', err);
    if (!closed) {
      sendEvent('error', { message: err.message || 'An error occurred' });
      res.end();
    }
  }
}

/**
 * POST /api/search
 * Pure semantic search without LLM generation
 */
export async function semanticSearch(req, res) {
  const { query, topK = 5 } = req.body;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    const queryEmbedding = await embeddingService.embed(query.trim(), 'RETRIEVAL_QUERY');
    const results = await vectorService.search(queryEmbedding, Math.min(topK, 10));

    res.json({
      query,
      results: results.map((r) => ({
        documentName: r.documentName,
        content: r.content,
        score: r.score,
        metadata: r.metadata,
      })),
    });
  } catch (err) {
    logger.error('Semantic search error:', err);
    res.status(500).json({ error: 'Search failed', details: err.message });
  }
}
