import { Router, Request, Response } from 'express';
import fs from 'fs';
import { reportService } from '../services/report.service.js';
import { emailService } from '../services/email.service.js';

const router = Router();

// List all reports with search and filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const { search, repo, state } = req.query;
    const reports = await reportService.getAllReports({
      search: search as string,
      repo: repo as string,
      state: state as string,
    });
    return res.json(reports);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch reports' });
  }
});

// Get single report by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const report = await reportService.getReportById(id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    return res.json(report);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch report' });
  }
});

// Download / stream PDF
router.get('/:id/pdf', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const report = await reportService.getReportById(id);
    if (!report || !report.pdfPath || !fs.existsSync(report.pdfPath)) {
      return res.status(404).json({ error: 'PDF file not available for this report' });
    }

    const filename = `MergeMemo-${report.pr.repo}-${report.pr.number}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

    const fileStream = fs.createReadStream(report.pdfPath);
    return fileStream.pipe(res);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to stream PDF' });
  }
});

// Email existing report
router.post('/:id/email', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email address is required' });
    }

    const report = await reportService.getReportById(id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const result = await emailService.sendReportEmail({
      recipientEmail: email,
      reportDoc: report,
      pdfPath: report.pdfPath,
    });

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to email report' });
  }
});

export default router;
