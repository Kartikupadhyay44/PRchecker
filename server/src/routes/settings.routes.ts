import { Router, Request, Response } from 'express';
import { UserSettingsModel } from '../models/UserSettings.js';

const router = Router();

// In-memory fallback
let memorySettings = {
  userId: 'default',
  githubUsername: 'shadcn',
  preferredEmail: '',
  theme: 'dark',
  customOpenAiKey: '',
  customGithubToken: '',
  customResendKey: '',
  autoSendEmail: false,
  includeDiffsInReport: true,
};

// Get settings
router.get('/', async (req: Request, res: Response) => {
  try {
    const doc = await UserSettingsModel.findOne({ userId: 'default' });
    if (doc) {
      return res.json(doc);
    }
  } catch {
    // Ignore db error
  }
  return res.json(memorySettings);
});

// Update settings
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      githubUsername,
      preferredEmail,
      theme,
      customOpenAiKey,
      customGithubToken,
      customResendKey,
      autoSendEmail,
      includeDiffsInReport,
    } = req.body;

    memorySettings = {
      ...memorySettings,
      githubUsername: githubUsername !== undefined ? githubUsername : memorySettings.githubUsername,
      preferredEmail: preferredEmail !== undefined ? preferredEmail : memorySettings.preferredEmail,
      theme: theme || memorySettings.theme,
      customOpenAiKey: customOpenAiKey !== undefined ? customOpenAiKey : memorySettings.customOpenAiKey,
      customGithubToken: customGithubToken !== undefined ? customGithubToken : memorySettings.customGithubToken,
      customResendKey: customResendKey !== undefined ? customResendKey : memorySettings.customResendKey,
      autoSendEmail: autoSendEmail !== undefined ? autoSendEmail : memorySettings.autoSendEmail,
      includeDiffsInReport: includeDiffsInReport !== undefined ? includeDiffsInReport : memorySettings.includeDiffsInReport,
    };

    try {
      const updated = await UserSettingsModel.findOneAndUpdate(
        { userId: 'default' },
        { ...memorySettings },
        { upsert: true, new: true }
      );
      return res.json(updated);
    } catch {
      return res.json(memorySettings);
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to update settings' });
  }
});

import { emailService } from '../services/email.service.js';
import path from 'path';
import fs from 'fs';

// Send verification test email
router.post('/test-email', async (req: Request, res: Response) => {
  try {
    const { email, attachPdf } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid recipient email address is required' });
    }

    let pdfPath: string | undefined;
    if (attachPdf !== false) {
      // Find any existing sample PDF
      const pdfs = [
        path.resolve(process.cwd(), 'server', 'storage', 'pdfs', 'mergememo-report-ui-12360-1792614922848.pdf'),
        path.resolve(process.cwd(), 'storage', 'pdfs', 'mergememo-report-ui-12360-1792614922848.pdf'),
      ];
      for (const p of pdfs) {
        if (fs.existsSync(p)) {
          pdfPath = p;
          break;
        }
      }
    }

    const result = await emailService.sendTestEmail({
      recipientEmail: email.trim(),
      pdfPath,
    });

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to send test email' });
  }
});

export default router;
