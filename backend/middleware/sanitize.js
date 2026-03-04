/**
 * Input sanitization and validation middleware
 */

/**
 * Sanitize string by removing dangerous characters
 */
function sanitizeString(str, maxLength = 4000) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/<[^>]*>/g, '') // strip HTML tags
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // strip control chars
    .trim()
    .slice(0, maxLength);
}

/**
 * Sanitize chat request body
 */
export function sanitizeChatInput(req, res, next) {
  if (req.body.message) {
    req.body.message = sanitizeString(req.body.message, 2000);
  }

  if (req.body.history && Array.isArray(req.body.history)) {
    req.body.history = req.body.history
      .slice(-20) // cap history
      .map((m) => ({
        role: sanitizeString(m.role, 20),
        content: sanitizeString(m.content, 4000),
      }));
  }

  next();
}

/**
 * Sanitize search request body
 */
export function sanitizeSearchInput(req, res, next) {
  if (req.body.query) {
    req.body.query = sanitizeString(req.body.query, 1000);
  }
  next();
}

/**
 * Rate limiting headers (basic implementation)
 */
export function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, url } = req;
    const { statusCode } = res;
    // Logger is available in controllers; this just adds basic tracking
    if (duration > 5000) {
      console.warn(`Slow request: ${method} ${url} ${statusCode} ${duration}ms`);
    }
  });
  next();
}
