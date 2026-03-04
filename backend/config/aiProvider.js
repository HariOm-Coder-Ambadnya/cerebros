import logger from './logger.js';

class GroqProvider {
  constructor() {
    this._embeddingModel = 'intfloat/e5-small-v2';
    this._chatModel = process.env.GROQ_CHAT_MODEL || 'llama-3.1-8b-instant';
  }

  // Free HuggingFace embeddings via inference API
  async generateEmbedding(text) {
    const hfKey = process.env.HUGGINGFACE_API_KEY;

    const res = await fetch(
      `https://router.huggingface.co/hf-inference/models/${this._embeddingModel}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${hfKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: [text]
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`HuggingFace embedding error: ${err}`);
    }

    const data = await res.json();
    return data[0];
  }

}

class OpenAIProvider {
  constructor() { this._embedder = null; this._chat = null; }
  async _getEmbedder() {
    if (this._embedder) return this._embedder;
    const { OpenAIEmbeddings } = await import('@langchain/openai');
    this._embedder = new OpenAIEmbeddings({ apiKey: process.env.OPENAI_API_KEY, model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small' });
    return this._embedder;
  }
  async _getChat() {
    if (this._chat) return this._chat;
    const { ChatOpenAI } = await import('@langchain/openai');
    this._chat = new ChatOpenAI({ apiKey: process.env.OPENAI_API_KEY, model: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini', streaming: true });
    return this._chat;
  }
  async generateEmbedding(text) { return (await this._getEmbedder()).embedQuery(text); }
  async generateChatCompletion(messages, streamCallback) {
    const chat = await this._getChat();
    const { HumanMessage, SystemMessage, AIMessage } = await import('@langchain/core/messages');
    const lc = messages.map(m => m.role === 'system' ? new SystemMessage(m.content) : m.role === 'assistant' ? new AIMessage(m.content) : new HumanMessage(m.content));
    const stream = await chat.stream(lc);
    let out = '';
    for await (const chunk of stream) { if (chunk.content) { out += chunk.content; streamCallback(chunk.content); } }
    return out;
  }
}

class GeminiProvider {
  constructor() {
    this._embeddingModel = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001';
    this._chatModel = process.env.GEMINI_CHAT_MODEL || 'gemini-1.5-flash';
  }

  async generateEmbedding(text, taskType = 'RETRIEVAL_DOCUMENT') {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: this._embeddingModel });

    const result = await model.embedContent({
      content: { parts: [{ text }] },
      taskType: taskType,
      outputDimensionality: 768
    });

    const embedding = result.embedding?.values;
    if (!embedding) throw new Error('Gemini embedContent returned no embedding values');
    return embedding;
  }

  async generateChatCompletion(messages, streamCallback) {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: this._chatModel });

    const systemMsg = messages.find(m => m.role === 'system');
    const chatHistory = messages
      .filter(m => m.role !== 'system' && m !== messages[messages.length - 1])
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const lastUserMsg = messages[messages.length - 1].content;

    const chat = model.startChat({
      history: chatHistory,
      systemInstruction: systemMsg ? { parts: [{ text: systemMsg.content }] } : undefined,
    });

    const result = await chat.sendMessageStream(lastUserMsg);
    let out = '';
    for await (const chunk of result.stream) {
      const token = chunk.text();
      if (token) {
        out += token;
        streamCallback(token);
      }
    }
    return out;
  }
}

class AnthropicProvider {
  constructor() { this._embedder = null; this._chat = null; }
  async _getEmbedder() {
    if (this._embedder) return this._embedder;
    const { OpenAIEmbeddings } = await import('@langchain/openai');
    this._embedder = new OpenAIEmbeddings({ apiKey: process.env.OPENAI_API_KEY, model: 'text-embedding-3-small' });
    return this._embedder;
  }
  async _getChat() {
    if (this._chat) return this._chat;
    const { ChatAnthropic } = await import('@langchain/anthropic');
    this._chat = new ChatAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY, model: process.env.ANTHROPIC_CHAT_MODEL || 'claude-3-haiku-20240307', streaming: true });
    return this._chat;
  }
  async generateEmbedding(text) { return (await this._getEmbedder()).embedQuery(text); }
  async generateChatCompletion(messages, streamCallback) {
    const chat = await this._getChat();
    const { HumanMessage, SystemMessage, AIMessage } = await import('@langchain/core/messages');
    const lc = messages.map(m => m.role === 'system' ? new SystemMessage(m.content) : m.role === 'assistant' ? new AIMessage(m.content) : new HumanMessage(m.content));
    const stream = await chat.stream(lc);
    let out = '';
    for await (const chunk of stream) { if (chunk.content) { out += chunk.content; streamCallback(chunk.content); } }
    return out;
  }
}

const PROVIDER_MAP = {
  groq: GroqProvider,
  openai: OpenAIProvider,
  gemini: GeminiProvider,
  anthropic: AnthropicProvider,
};

let _instance = null;

export function getAIProvider() {
  if (_instance) return _instance;
  const providerKey = (process.env.AI_PROVIDER || 'groq').toLowerCase();
  const ProviderClass = PROVIDER_MAP[providerKey];
  if (!ProviderClass) throw new Error(`Unknown AI_PROVIDER: "${providerKey}". Valid: ${Object.keys(PROVIDER_MAP).join(', ')}`);
  _instance = new ProviderClass();
  logger.info(`🤖 AI Provider initialized: ${providerKey.toUpperCase()}`);
  return _instance;
}
