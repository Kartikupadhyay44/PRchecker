import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Attempt to load .env from workspace root or server directory
const rootEnv = path.resolve(process.cwd(), '.env');
const serverEnv = path.resolve(process.cwd(), 'server', '.env');

if (fs.existsSync(rootEnv)) {
  dotenv.config({ path: rootEnv });
} else if (fs.existsSync(serverEnv)) {
  dotenv.config({ path: serverEnv });
} else {
  dotenv.config();
}

const storageDir = path.resolve(process.cwd(), 'storage', 'pdfs');
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

export const config = {
  port: parseInt(process.env.BACKEND_PORT || process.env.PORT || '3000', 10),
  mongoUri: process.env.MONGODB_URL || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mergememo',
  jwtSecret: process.env.JWT_SECRET || 'mergememo-secret-key',
  nodeEnv: process.env.NODE_ENV || 'development',
  // SMTP Email Configuration (Brevo, Sendgrid, etc.)
  smtpServer: process.env.SMTP_SERVER || process.env.SMTP_HOST || '',
  smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  senderEmail: process.env.SENDER_EMAIL || process.env.RESEND_FROM_EMAIL || 'reports@mergememo.ai',
  // OpenAI & GitHub tokens
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  githubToken: process.env.GITHUB_TOKEN || '',
  // Legacy Resend compatibility
  resendApiKey: process.env.RESEND_API_KEY || '',
  resendFromEmail: process.env.RESEND_FROM_EMAIL || process.env.SENDER_EMAIL || 'reports@mergememo.ai',
  storageDir,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  isDev: process.env.NODE_ENV !== 'production',
  chromePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
};
