import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.js';
import { getAIProvider } from './config/aiProvider.js';
import logger from './config/logger.js';

const PORT = parseInt(process.env.PORT) || 3001;

async function bootstrap() {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Initialize AI provider (validates config early)
    getAIProvider();

    // 3. Start server
    app.listen(PORT, () => {
      logger.info(`🧠 Cerebro backend running on http://localhost:${PORT}`);
      logger.info(`📡 AI Provider: ${(process.env.AI_PROVIDER || 'openai').toUpperCase()}`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}

bootstrap();

