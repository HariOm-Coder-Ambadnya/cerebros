import { useState, useRef, useEffect } from 'react';
import {
  Send, Square, Trash2, Brain, User,
  FileText, Sparkles, Search, ChevronDown
} from 'lucide-react';
import { useChat } from '../hooks/useChat';

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const isStreaming = message.streaming;
  const hasError = message.error;

  return (
    <div className={`flex gap-3 animate-slide-up ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
        isUser
          ? 'bg-[var(--accent)] text-white'
          : 'bg-gradient-to-br from-cerebro-400 to-cerebro-700 text-white'
      }`}>
        {isUser ? (
          <User className="w-4 h-4" />
        ) : (
          <Brain className="w-4 h-4" />
        )}
      </div>

      {/* Content */}
      <div className={`max-w-[78%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-[var(--accent)] text-white rounded-tr-sm'
            : hasError
            ? 'bg-red-500/10 border border-red-500/20 text-red-400 rounded-tl-sm'
            : 'bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] rounded-tl-sm'
        }`}>
          {message.content ? (
            <div className="whitespace-pre-wrap">
              {message.content}
              {isStreaming && <span className="typing-cursor ml-0.5" />}
            </div>
          ) : isStreaming ? (
            <div className="flex items-center gap-2 py-1 text-[var(--text-muted)]">
              <Sparkles className="w-4 h-4 animate-pulse text-[var(--accent)]" />
              <span className="text-xs">Composing answer...</span>
            </div>
          ) : null}
        </div>

        {/* Sources */}
        {!isUser && message.sources && message.sources.length > 0 && !isStreaming && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {message.sources.map((src) => (
              <span
                key={src}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-[var(--accent-light)] text-[var(--accent)] font-medium border border-[var(--accent)]/20"
              >
                <FileText className="w-3 h-3" />
                {src}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RetrievingIndicator() {
  return (
    <div className="flex gap-3 animate-fade-in">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cerebro-400 to-cerebro-700 flex items-center justify-center shrink-0 mt-0.5">
        <Brain className="w-4 h-4 text-white" />
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-[var(--bg-secondary)] border border-[var(--border)]">
        <div className="flex items-center gap-2 text-[var(--text-muted)]">
          <Search className="w-4 h-4 text-[var(--accent)] animate-pulse" />
          <span className="text-xs">Searching knowledge base...</span>
          <div className="flex gap-1 ml-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]"
                style={{ animation: `pulse 1.5s ease-in-out ${i * 0.2}s infinite` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const SUGGESTIONS = [
  "Summarize the key points from the documents",
  "What are the main requirements mentioned?",
  "Find any technical specifications",
  "What decisions were made and why?",
];

export function ChatPage() {
  const { messages, isStreaming, isRetrieving, sendMessage, stopStream, clearMessages } = useChat();
  const [input, setInput] = useState('');
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const bottomRef = useRef(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isRetrieving]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = () => {
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowScrollBtn(distFromBottom > 120);
    };
    el.addEventListener('scroll', handler);
    return () => el.removeEventListener('scroll', handler);
  }, []);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
    inputRef.current?.focus();
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="h-16 border-b border-[var(--border)] flex items-center justify-between px-6 bg-[var(--bg-secondary)] shrink-0">
        <div>
          <h1 className="font-display font-bold text-lg text-[var(--text-primary)]">Intelligence Chat</h1>
          <p className="text-xs text-[var(--text-muted)]">RAG-powered answers from your documents</p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearMessages}
            disabled={isStreaming}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-[var(--text-muted)] hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-40"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Clear chat</span>
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-5 relative">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cerebro-400 to-cerebro-800 flex items-center justify-center shadow-lg shadow-cerebro-500/25 animate-float">
                <Brain className="w-9 h-9 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--accent)] flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>
            <h2 className="font-display font-bold text-2xl text-[var(--text-primary)] mb-2">
              Ask Cerebro
            </h2>
            <p className="text-[var(--text-muted)] text-sm max-w-sm mb-8">
              Ask questions about your uploaded documents. Cerebro will search and answer with citations.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => { setInput(s); inputRef.current?.focus(); }}
                  className="text-left px-4 py-3 rounded-xl text-sm bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all duration-200 hover:bg-[var(--accent-light)]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isRetrieving && <RetrievingIndicator />}

        {showScrollBtn && (
          <button
            onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="fixed bottom-24 right-6 w-9 h-9 rounded-full bg-[var(--accent)] text-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform z-20"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 pb-6 pt-3 border-t border-[var(--border)] bg-[var(--bg-secondary)] shrink-0">
        <div className={`flex gap-3 items-end p-3 rounded-2xl border transition-all duration-200 bg-[var(--bg-primary)] ${
          isStreaming ? 'border-[var(--accent)]/50 shadow-[0_0_0_3px_var(--accent-glow)]' : 'border-[var(--border)] focus-within:border-[var(--accent)] focus-within:shadow-[0_0_0_3px_var(--accent-glow)]'
        }`}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask anything about your documents..."
            disabled={isStreaming}
            rows={1}
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none outline-none min-h-[24px] max-h-[120px] leading-6 font-body"
            style={{ fieldSizing: 'content' }}
          />
          {isStreaming ? (
            <button
              onClick={stopStream}
              className="w-9 h-9 rounded-xl bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors shrink-0"
              title="Stop generation"
            >
              <Square className="w-4 h-4 fill-white" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="w-9 h-9 rounded-xl bg-[var(--accent)] hover:bg-cerebro-600 text-white flex items-center justify-center transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 hover:scale-105 active:scale-95"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="text-center text-xs text-[var(--text-muted)] mt-2">
          Shift+Enter for new line · Answers cite source documents
        </p>
      </div>
    </div>
  );
}
