# 🧠 Cerebro — Team Intelligence Hub

> A production-ready, centralized AI document intelligence system powered by RAG (Retrieval-Augmented Generation), MongoDB Atlas Vector Search, and a fully provider-agnostic AI layer.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Setup Instructions](#setup-instructions)
5. [Environment Variables](#environment-variables)
6. [MongoDB Vector Index Setup](#mongodb-vector-index-setup)
7. [How RAG Works](#how-rag-works)
8. [Design Decisions](#design-decisions)
9. [API Reference](#api-reference)
10. [Streaming Implementation](#streaming-implementation)
11. [Switching AI Providers](#switching-ai-providers)

---

## Overview

Cerebro allows teams to upload `.pdf` and `.txt` documents, automatically chunk and embed the content, then query across that knowledge base using natural language. All answers are grounded in uploaded documents and include source citations.

**Key capabilities:**
- Drag-and-drop document upload with progress tracking
- Automatic chunking + vectorization pipeline
- Semantic search using cosine similarity
- Streaming RAG chat with SSE (Server-Sent Events)
- Source citations on every answer
- Full light/dark mode UI
- Swappable AI providers via environment variable

---

## Architecture

```
cerebro/
├── backend/
│   ├── controllers/
│   │   ├── uploadController.js     # Ingestion pipeline: extract → chunk → embed → store
│   │   └── chatController.js       # SSE streaming chat + semantic search endpoints
│   ├── services/
│   │   ├── embeddingService.js     # Text → vector conversion (delegates to AI provider)
│   │   ├── vectorService.js        # MongoDB Atlas Vector Search CRUD
│   │   ├── ragService.js           # RAG orchestration: retrieve → augment → generate
│   │   └── llmService.js           # Chat completion with streaming
│   ├── config/
│   │   ├── db.js                   # MongoDB connection singleton
│   │   ├── aiProvider.js           # AI provider abstraction + factory
│   │   └── logger.js               # Winston structured logger
│   ├── routes/index.js             # Express route definitions
│   ├── middleware/
│   │   ├── uploadMiddleware.js     # Multer config, file validation
│   │   └── sanitize.js             # Input sanitization
│   ├── app.js                      # Express app, CORS, middleware
│   └── server.js                   # Bootstrap: DB connect, AI init, listen
│
├── frontend/
│   └── src/
│       ├── context/ThemeContext.jsx # Dark/light mode
│       ├── hooks/
│       │   ├── useChat.js           # Streaming chat state management
│       │   └── useDocuments.js      # Document list management
│       ├── lib/api.js               # HTTP + SSE client
│       ├── components/Sidebar.jsx   # Navigation
│       └── pages/
│           ├── ChatPage.jsx         # Main RAG chat UI
│           └── UploadPage.jsx       # Document management UI
│
├── mongo-vector-index.json          # Atlas vector index definition
└── README.md
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Tailwind CSS, Lucide Icons |
| Backend | Node.js (ESM), Express 4 |
| Database | MongoDB Atlas |
| Vector Search | Atlas Vector Search (cosine similarity) |
| AI Orchestration | LangChain.js |
| Chunking | RecursiveCharacterTextSplitter |
| PDF Parsing | pdf-parse |
| Streaming | Server-Sent Events (SSE) |
| Logging | Winston |

---

## Setup Instructions

### Prerequisites
- Node.js 20+
- MongoDB Atlas account (free tier works)
- API key for your chosen AI provider

### 1. Clone and install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment

```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
```

### 3. Create MongoDB Vector Index

See [MongoDB Vector Index Setup](#mongodb-vector-index-setup) below.

### 4. Start the servers

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open http://localhost:5173

---

## Environment Variables

See `backend/.env.example` for the full list. Key variables:

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `AI_PROVIDER` | `openai` \| `gemini` \| `anthropic` \| `azure` |
| `OPENAI_API_KEY` | Required if AI_PROVIDER=openai or anthropic |
| `GOOGLE_API_KEY` | Required if AI_PROVIDER=gemini |
| `ANTHROPIC_API_KEY` | Required if AI_PROVIDER=anthropic |
| `CHUNK_SIZE` | Characters per chunk (default: 800) |
| `CHUNK_OVERLAP` | Overlap between chunks (default: 150) |
| `TOP_K_RESULTS` | Chunks to retrieve per query (default: 6) |

---

## MongoDB Vector Index Setup

**Important:** You must create this index before the app can perform vector searches.

### Via Atlas UI (Recommended)
1. Open your cluster → **Browse Collections** → `cerebro.documents`
2. Click **Search Indexes** → **Create Search Index**
3. Choose **Atlas Vector Search** (JSON editor)
4. Paste this definition:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 1536,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "documentName"
    }
  ]
}
```

5. Name it **`vector_index`** → Create

> ⚠️ **numDimensions must match your embedding model:**
> - `text-embedding-3-small` (OpenAI): **1536**
> - `text-embedding-004` (Gemini): **768**  
> - `text-embedding-3-large` (OpenAI): **3072**

---

## How RAG Works

```
User Query
    │
    ▼
[Embedding Service]
Generate query vector using same model as ingestion
    │
    ▼
[Vector Service - MongoDB Atlas]
$vectorSearch pipeline
Find top-K most similar chunks by cosine similarity
    │
    ▼
[RAG Service]
Build system prompt with retrieved chunks as context
Inject: "Answer ONLY using this context, cite sources"
    │
    ▼
[LLM Service - Streaming]
Stream token-by-token via SSE to frontend
    │
    ▼
[Frontend]
Typewriter effect, source badges below answer
```

### Why Retrieval-Augmented Generation?

LLMs hallucinate when asked about specific documents they haven't seen. RAG solves this by:
1. Finding the exact relevant passages at query time
2. Injecting them into the LLM context window
3. Instructing the LLM to only use that context

This produces accurate, grounded, citable answers.

---

## Design Decisions

### Why chunk size 800 with 150 overlap?

**800 characters** (~200 tokens) is the sweet spot for:
- Fitting meaningfully complete thoughts (a paragraph)  
- Staying well under embedding model limits
- Providing enough context for the LLM to reason from
- Not being so large that retrieval becomes imprecise

**150 character overlap** prevents cutting ideas mid-sentence. Without overlap, a concept split across a chunk boundary would be unretrievable.

`RecursiveCharacterTextSplitter` tries `\n\n` → `\n` → `. ` → ` ` in order, preserving semantic boundaries before falling back to character splits.

### Why cosine similarity?

Cosine similarity measures the **angle** between two vectors, not their magnitude. This makes it:
- **Magnitude-invariant**: A short sentence and a long paragraph about the same topic score similarly
- **Semantic-aligned**: Embedding models are trained to place semantically related concepts close in angle
- **Normalized**: Scores are always between -1 and 1, predictable across documents

Alternatives like Euclidean distance penalize vectors of different magnitudes — problematic for text of varying lengths.

### Why the AI Provider abstraction?

Different teams use different AI vendors. The `AIProvider` interface decouples business logic from vendor specifics. Switching from OpenAI to Gemini requires only changing `AI_PROVIDER=gemini` — no code changes. This also future-proofs the system as new providers emerge.

### Why SSE over WebSockets?

SSE is:
- **Simpler**: Standard HTTP, works through proxies and firewalls naturally
- **One-directional**: Streaming is one-way (server → client); that's all we need
- **Reconnectable**: Built-in reconnection in browsers
- **Lighter**: No handshake overhead, no bidirectional channel maintenance

WebSockets would be overkill for token streaming.

---

## API Reference

### Upload Document
```http
POST /api/upload
Content-Type: multipart/form-data

file: <.pdf or .txt file>
```

Response:
```json
{
  "success": true,
  "document": "requirements-v2",
  "stats": {
    "extractedChars": 12450,
    "chunksCreated": 18,
    "chunkSize": 800,
    "chunkOverlap": 150
  }
}
```

### List Documents
```http
GET /api/documents
```

### Chat (SSE Streaming)
```http
POST /api/chat
Content-Type: application/json

{
  "message": "What are the authentication requirements?",
  "history": [
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": "..."}
  ]
}
```

Response stream (SSE):
```
event: start
data: {"status":"retrieving"}

event: token
data: {"token":"The"}

event: token
data: {"token":" authentication"}

...

event: done
data: {"sources":["requirements-v2","api-spec"],"fullAnswer":"..."}
```

### Semantic Search (no LLM)
```http
POST /api/search
Content-Type: application/json

{
  "query": "payment processing flow",
  "topK": 5
}
```

### Delete Document
```http
DELETE /api/documents/:name
```

---

## Streaming Implementation

### Backend (SSE)
```javascript
// Set SSE headers
res.setHeader('Content-Type', 'text/event-stream');
res.setHeader('Cache-Control', 'no-cache');
res.setHeader('Connection', 'keep-alive');
res.flushHeaders();

// Stream tokens
const sendEvent = (event, data) =>
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

// LangChain streaming
const stream = await chatModel.stream(messages);
for await (const chunk of stream) {
  sendEvent('token', { token: chunk.content });
}

sendEvent('done', { sources });
res.end();
```

### Frontend (fetch + ReadableStream)
```javascript
const res = await fetch('/api/chat', { method: 'POST', body: JSON.stringify({message, history}) });
const reader = res.body.getReader();

while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  // Parse SSE events from buffer chunks
  // Call onToken() for each token
}
```

The frontend uses `fetch` + `ReadableStream` rather than `EventSource` because `EventSource` only supports GET requests — our chat sends a POST body with message history.

---

## Switching AI Providers

Change one line in `.env`:

```bash
# Use Gemini
AI_PROVIDER=gemini
GOOGLE_API_KEY=AIza...

# Use Anthropic (uses OpenAI for embeddings)
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...  # needed for embeddings

# Use Azure OpenAI
AI_PROVIDER=azure
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_ENDPOINT=https://myresource.openai.azure.com/
```

> **Important:** If you switch embedding providers, you must re-ingest all documents. Vectors from different models are incompatible and cannot be compared.
#   c e r e b r o s  
 