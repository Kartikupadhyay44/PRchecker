import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { config } from './config/index.js';
import githubRoutes from './routes/github.routes.js';
import analyzeRoutes from './routes/analyze.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import settingsRoutes from './routes/settings.routes.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mongoConnected: mongoose.connection.readyState === 1,
  });
});

// Mount Routes
app.use('/api/github', githubRoutes);
app.use('/api/analyze', analyzeRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/settings', settingsRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// Connect to MongoDB & Start Server
async function startServer() {
  try {
    console.log(`Connecting to MongoDB at ${config.mongoUri}...`);
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log('✓ Successfully connected to MongoDB');
  } catch (err: any) {
    console.warn('! MongoDB connection failed. Running with in-memory resilient fallback store:', err.message);
  }

  app.listen(config.port, () => {
    console.log(`✓ MergeMemo AI Server running on http://localhost:${config.port}`);
  });
}

startServer();
