import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { config } from './config/index.js';
import githubRoutes from './routes/github.routes.js';
import analyzeRoutes from './routes/analyze.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import { emailService } from './services/email.service.js';

const app = express();

// Mongoose settings
mongoose.set('bufferCommands', false);

// Middlewares
app.use(cors({
  origin: (origin, callback) => {
    // Allow all requests including Cloudflare tunnels and local dev
    callback(null, true);
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mongoConnected: mongoose.connection.readyState === 1,
    smtpConfigured: emailService.isSmtpConfigured(),
    senderEmail: config.senderEmail,
    port: config.port,
  });
});

// Mail Service Status & Test Endpoints
app.get('/api/mail/verify', async (req, res) => {
  const status = await emailService.verifyConnection();
  res.json(status);
});

app.post('/api/mail/test', async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Recipient email is required' });
  }
  const result = await emailService.sendTestEmail({ recipientEmail: email.trim() });
  res.json(result);
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
  const maskedUri = config.mongoUri.replace(/:[^:@]*@/, ':***@');
  try {
    console.log(`Connecting to MongoDB at ${maskedUri}...`);
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✓ Successfully connected to MongoDB Atlas');
  } catch (err: any) {
    console.warn('! MongoDB connection failed. Running with in-memory resilient fallback store:', err.message);
  }

  app.listen(config.port, () => {
    console.log(`✓ MergeMemo AI Server running on http://localhost:${config.port}`);
    console.log(`✓ Brevo SMTP configured: ${emailService.isSmtpConfigured() ? config.smtpServer : 'Disabled'}`);
  });
}

startServer();
