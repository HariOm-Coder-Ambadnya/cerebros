import { getCollection } from '../config/db.js';
import { embeddingService } from './embeddingService.js';
import logger from '../config/logger.js';

const COLLECTION_NAME = 'documents';
const VECTOR_INDEX_NAME = 'vector_index';

/**
 * VectorService
 * Single responsibility: store and retrieve vectors from MongoDB Atlas
 */
class VectorService {
  _collection() {
    return getCollection(COLLECTION_NAME);
  }

  /**
   * Store document chunks with embeddings
   * @param {Array<{content: string, embedding: number[], documentName: string, metadata: object}>} chunks
   */
  async storeChunks(chunks) {
    if (!chunks || chunks.length === 0) return;

    const collection = this._collection();
    const docs = chunks.map((chunk) => ({
      documentName: chunk.documentName,
      content: chunk.content,
      embedding: chunk.embedding,
      metadata: chunk.metadata || {},
      createdAt: new Date(),
    }));

    const result = await collection.insertMany(docs);
    logger.info(`Stored ${result.insertedCount} chunks for document: ${chunks[0].documentName}`);
    return result;
  }

  /**
   * Semantic search using cosine similarity via Atlas Vector Search
   * @param {number[]} queryEmbedding
   * @param {number} topK
   * @returns {Promise<Array>}
   */
  async search(queryEmbedding, topK = 6) {
    const collection = this._collection();

    logger.debug(`Executing search with query embedding of length: ${queryEmbedding.length}`);
    const pipeline = [
      {
        $vectorSearch: {
          index: VECTOR_INDEX_NAME,
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: topK * 10, // Examine more candidates for better recall
          limit: topK,
        },
      },
      {
        $project: {
          _id: 1,
          documentName: 1,
          content: 1,
          metadata: 1,
          score: { $meta: 'vectorSearchScore' },
        },
      },
    ];

    const results = await collection.aggregate(pipeline).toArray();
    logger.debug(`Vector search returned ${results.length} results`);
    return results;
  }

  /**
   * List all unique documents ingested
   */
  async listDocuments() {
    const collection = this._collection();
    return collection
      .aggregate([
        {
          $group: {
            _id: '$documentName',
            chunkCount: { $sum: 1 },
            createdAt: { $first: '$createdAt' },
          },
        },
        { $sort: { createdAt: -1 } },
        {
          $project: {
            _id: 0,
            name: '$_id',
            chunkCount: 1,
            createdAt: 1,
          },
        },
      ])
      .toArray();
  }

  /**
   * Delete all chunks for a given document
   */
  async deleteDocument(documentName) {
    const collection = this._collection();
    const result = await collection.deleteMany({ documentName });
    logger.info(`Deleted ${result.deletedCount} chunks for: ${documentName}`);
    return result.deletedCount;
  }

  /**
   * Get document stats
   */
  async getStats() {
    const collection = this._collection();
    const [total, documents] = await Promise.all([
      collection.countDocuments(),
      this.listDocuments(),
    ]);
    return { totalChunks: total, documentCount: documents.length, documents };
  }
}

export const vectorService = new VectorService();

// ─── MongoDB Atlas Vector Index Definition ────────────────────────────────────
// IMPORTANT: numDimensions MUST match the embedding model output dimension.
// Current setup: text-embedding-004 (Gemini) → 768 dimensions
//
// Create/update this in Atlas UI: Database → Search Indexes → Create Search Index
// Choose "Atlas Vector Search" (JSON editor) and paste:
//
// {
//   "name": "vector_index",
//   "type": "vectorSearch",
//   "definition": {
//     "fields": [
//       {
//         "type": "vector",
//         "path": "embedding",
//         "numDimensions": 768,
//         "similarity": "cosine"
//       },
//       {
//         "type": "filter",
//         "path": "documentName"
//       }
//     ]
//   }
// }
//
// Dimension reference (set GEMINI_EMBEDDING_DIMENSIONS accordingly):
//   - text-embedding-004 (Gemini): 768
//   - gemini-embedding-001:       3072
//   - text-embedding-3-small:     1536
//   - text-embedding-3-large:     3072
