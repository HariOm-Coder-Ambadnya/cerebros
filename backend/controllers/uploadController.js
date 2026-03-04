import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import pdfParse from 'pdf-parse';
import fs from 'fs/promises';
import path from 'path';
import { embeddingService } from '../services/embeddingService.js';
import { vectorService } from '../services/vectorService.js';
import logger from '../config/logger.js';

const CHUNK_SIZE = parseInt(process.env.CHUNK_SIZE) || 800;
const CHUNK_OVERLAP = parseInt(process.env.CHUNK_OVERLAP) || 150;

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: CHUNK_SIZE,
  chunkOverlap: CHUNK_OVERLAP,
  separators: ['\n\n', '\n', '. ', ' ', ''],
});

/**
 * Extract text from uploaded file
 */
async function extractText(filePath, mimetype) {
  const buffer = await fs.readFile(filePath);

  if (mimetype === 'application/pdf') {
    const data = await pdfParse(buffer);
    return data.text;
  }

  // .txt and other text files
  return buffer.toString('utf-8');
}

/**
 * POST /api/upload
 * Ingestion pipeline: extract → chunk → embed → store
 */
export async function uploadDocument(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { originalname, path: filePath, mimetype, size } = req.file;
  logger.info(`Processing upload: ${originalname} (${(size / 1024).toFixed(1)}KB)`);

  try {
    // 1. Extract text
    const rawText = await extractText(filePath, mimetype);
    if (!rawText.trim()) {
      return res.status(422).json({ error: 'Could not extract text from file' });
    }
    logger.debug(`Extracted ${rawText.length} characters from ${originalname}`);

    // 2. Chunk
    const chunks = await splitter.splitText(rawText);
    logger.debug(`Split into ${chunks.length} chunks (size=${CHUNK_SIZE}, overlap=${CHUNK_OVERLAP})`);

    // 3. Embed each chunk
    const embeddings = await embeddingService.embedBatch(chunks);

    // 4. Prepare documents
    const documentName = path.parse(originalname).name;
    const docs = chunks.map((content, i) => ({
      documentName,
      content,
      embedding: embeddings[i],
      metadata: {
        originalFilename: originalname,
        chunkIndex: i,
        totalChunks: chunks.length,
        charCount: content.length,
        uploadedAt: new Date().toISOString(),
      },
    }));

    // 5. Store in MongoDB
    await vectorService.storeChunks(docs);

    // Cleanup temp file
    await fs.unlink(filePath).catch(() => {});

    res.json({
      success: true,
      document: documentName,
      stats: {
        originalFilename: originalname,
        extractedChars: rawText.length,
        chunksCreated: chunks.length,
        chunkSize: CHUNK_SIZE,
        chunkOverlap: CHUNK_OVERLAP,
      },
    });
  } catch (err) {
    logger.error('Upload processing error:', err);
    await fs.unlink(filePath).catch(() => {});
    res.status(500).json({ error: 'Failed to process document', details: err.message });
  }
}

/**
 * GET /api/documents
 * List all ingested documents
 */
export async function listDocuments(req, res) {
  try {
    const docs = await vectorService.listDocuments();
    res.json({ documents: docs });
  } catch (err) {
    logger.error('List documents error:', err);
    res.status(500).json({ error: 'Failed to list documents' });
  }
}

/**
 * DELETE /api/documents/:name
 */
export async function deleteDocument(req, res) {
  const { name } = req.params;
  if (!name) return res.status(400).json({ error: 'Document name required' });

  try {
    const deletedCount = await vectorService.deleteDocument(decodeURIComponent(name));
    res.json({ success: true, deletedChunks: deletedCount });
  } catch (err) {
    logger.error('Delete document error:', err);
    res.status(500).json({ error: 'Failed to delete document' });
  }
}

/**
 * GET /api/stats
 */
export async function getStats(req, res) {
  try {
    const stats = await vectorService.getStats();
    res.json(stats);
  } catch (err) {
    logger.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to get stats' });
  }
}
