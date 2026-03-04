import { useState, useRef, useCallback } from 'react';
import { streamChat } from '../lib/api';

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRetrieving, setIsRetrieving] = useState(false);
  const abortRef = useRef(null);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isStreaming) return;

    const userMessage = { role: 'user', content: text.trim(), id: Date.now() };
    const assistantId = Date.now() + 1;

    setMessages((prev) => [
      ...prev,
      userMessage,
      { role: 'assistant', content: '', sources: [], id: assistantId, streaming: true },
    ]);

    setIsRetrieving(true);

    const history = messages.map(({ role, content }) => ({ role, content }));
    let accumulatedContent = '';

    const controller = streamChat(text.trim(), history, {
      onStart: () => {
        setIsRetrieving(false);
        setIsStreaming(true);
      },
      onToken: (token) => {
        accumulatedContent += token;
        setIsRetrieving(false);
        setIsStreaming(true);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: accumulatedContent, streaming: true } : m
          )
        );
      },
      onDone: ({ sources = [] }) => {
        setIsStreaming(false);
        setIsRetrieving(false);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: accumulatedContent, sources, streaming: false }
              : m
          )
        );
      },
      onError: (err) => {
        setIsStreaming(false);
        setIsRetrieving(false);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                ...m,
                content: `⚠️ Error: ${err.message}`,
                streaming: false,
                error: true,
              }
              : m
          )
        );
      },
    });

    abortRef.current = controller;
  }, [messages, isStreaming]);

  const stopStream = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
    setIsRetrieving(false);
    setMessages((prev) =>
      prev.map((m) => (m.streaming ? { ...m, streaming: false } : m))
    );
  }, []);

  const clearMessages = useCallback(() => {
    if (!isStreaming) setMessages([]);
  }, [isStreaming]);

  return {
    messages,
    isStreaming,
    isRetrieving,
    sendMessage,
    stopStream,
    clearMessages,
  };
}
