import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

const storageDir = path.resolve(process.cwd(), 'storage', 'pdfs');
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

export const config = {
  port: parseInt(process.env.PORT || '5001', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mergememo',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  githubToken: process.env.GITHUB_TOKEN || '',
  resendApiKey: process.env.RESEND_API_KEY || '',
  resendFromEmail: process.env.RESEND_FROM_EMAIL || 'reports@mergememo.ai',
  storageDir,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  isDev: process.env.NODE_ENV !== 'production',
  chromePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
};
