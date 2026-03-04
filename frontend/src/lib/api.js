const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = {
  async get(path) {
    const res = await fetch(`${BASE_URL}${path}`);
    if (!res.ok) throw new Error((await res.json()).error || res.statusText);
    return res.json();
  },

  async post(path, body) {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error((await res.json()).error || res.statusText);
    return res.json();
  },

  async delete(path) {
    const res = await fetch(`${BASE_URL}${path}`, { method: 'DELETE' });
    if (!res.ok) throw new Error((await res.json()).error || res.statusText);
    return res.json();
  },

  async uploadFile(file, onProgress) {
    const formData = new FormData();
    formData.append('file', file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${BASE_URL}/upload`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 400) reject(new Error(data.error || 'Upload failed'));
        else resolve(data);
      };

      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.send(formData);
    });
  },

  /**
   * SSE-based chat streaming
   * Returns a controller to abort the stream
   */
  chatStream(message, history, callbacks) {
    const controller = new AbortController();
    const { onToken, onDone, onError, onStart } = callbacks;

    fetch(`${BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history }),
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Chat request failed');
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                // Determine event type from prior line context
                // SSE format: "event: X\ndata: Y"
              } catch { }
            } else if (line.startsWith('event: ')) {
              const eventType = line.slice(7).trim();
              // Next line will be the data
              const nextLine = lines[lines.indexOf(line) + 1];
              if (nextLine?.startsWith('data: ')) {
                try {
                  const data = JSON.parse(nextLine.slice(6));
                  if (eventType === 'token' && onToken) onToken(data.token);
                  if (eventType === 'done' && onDone) onDone(data);
                  if (eventType === 'error' && onError) onError(new Error(data.message));
                  if (eventType === 'start' && onStart) onStart(data);
                } catch { }
              }
            }
          }
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError' && onError) onError(err);
      });

    // Better SSE parsing with EventSource-like approach using fetch + ReadableStream
    return controller;
  },
};

/**
 * Better SSE implementation using fetch + manual event parsing
 */
export function streamChat(message, history, callbacks) {
  const { onToken, onDone, onError, onStart } = callbacks;
  const controller = new AbortController();

  // Start the async process but return the controller immediately
  (async () => {
    try {
      const res = await fetch(`${BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      if (!res.body) throw new Error('ReadableStream not supported');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events from buffer
        const eventChunks = buffer.split('\n\n');
        buffer = eventChunks.pop() || '';

        for (const chunk of eventChunks) {
          if (!chunk.trim()) continue;

          const lines = chunk.split('\n');
          let eventType = 'message';
          let data = null;

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              try {
                data = JSON.parse(line.slice(6));
              } catch {
                data = line.slice(6);
              }
            }
          }

          if (data !== null) {
            if (eventType === 'token' && onToken) onToken(data.token || '');
            if (eventType === 'done' && onDone) onDone(data);
            if (eventType === 'error' && onError) onError(new Error(data.message || 'Stream error'));
            if (eventType === 'start' && onStart) onStart(data);
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError' && onError) {
        onError(err);
      }
    }
  })();

  return controller;
}
