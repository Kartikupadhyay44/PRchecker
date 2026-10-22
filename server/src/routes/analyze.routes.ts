import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { reportService } from '../services/report.service.js';

const router = Router();

// Store active job results
const activeJobs = new Map<string, { status: 'running' | 'done' | 'error'; result?: any; error?: string }>();

// SSE Endpoint for real-time progress updates
router.get('/progress/:jobId', (req: Request, res: Response) => {
  const jobId = req.params.jobId as string;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send initial connected event
  res.write(`data: ${JSON.stringify({ stage: 'connected', progress: 0, label: 'Pipeline initialized' })}\n\n`);

  const listener = (update: any) => {
    res.write(`data: ${JSON.stringify(update)}\n\n`);
  };

  reportService.onProgress(jobId, listener);

  req.on('close', () => {
    reportService.removeProgressListener(jobId);
  });
});

// Start analysis pipeline
router.post('/start', async (req: Request, res: Response) => {
  try {
    const { prUrl, issueUrl, email, customGithubToken, customOpenAiKey, customResendKey } = req.body;

    if (!prUrl || typeof prUrl !== 'string') {
      return res.status(400).json({ error: 'Valid GitHub Pull Request URL is required' });
    }

    const jobId = randomUUID();
    activeJobs.set(jobId, { status: 'running' });

    // Return jobId immediately so frontend can subscribe to SSE
    res.json({ jobId });

    // Execute background generation asynchronously
    (async () => {
      try {
        const report = await reportService.generateReport({
          jobId,
          prUrl,
          issueUrl,
          email,
          customGithubToken,
          customOpenAiKey,
          customResendKey,
        });
        activeJobs.set(jobId, { status: 'done', result: report });
      } catch (err: any) {
        console.error(`Generation error for job ${jobId}:`, err);
        activeJobs.set(jobId, { status: 'error', error: err.message || 'Generation failed' });
      }
    })();
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to initialize report generation' });
  }
});

// Check job status / get finished report
router.get('/status/:jobId', (req: Request, res: Response) => {
  const jobId = req.params.jobId as string;
  const job = activeJobs.get(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  return res.json(job);
});

export default router;
