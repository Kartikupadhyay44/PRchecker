import { randomUUID } from 'crypto';
import { githubService } from './github.service.js';
import { aiService } from './ai.service.js';
import { pdfService } from './pdf.service.js';
import { emailService } from './email.service.js';
import { ReportModel } from '../models/Report.js';
import { ReportDocument, GenerationStage, StageUpdate } from '../types/index.js';

// In-memory reports store fallback
const memoryReports = new Map<string, ReportDocument>();

export class ReportService {
  // Active progress listeners for real-time SSE streaming
  private progressListeners = new Map<string, (update: StageUpdate) => void>();

  public onProgress(jobId: string, listener: (update: StageUpdate) => void) {
    this.progressListeners.set(jobId, listener);
  }

  public removeProgressListener(jobId: string) {
    this.progressListeners.delete(jobId);
  }

  private emitProgress(jobId: string, stage: GenerationStage, label: string, progress: number, detail?: string) {
    const update: StageUpdate = {
      stage,
      label,
      progress,
      detail,
      timestamp: new Date().toISOString(),
    };
    const listener = this.progressListeners.get(jobId);
    if (listener) {
      listener(update);
    }
  }

  public async generateReport(params: {
    jobId: string;
    prUrl: string;
    issueUrl?: string;
    email?: string;
    customGithubToken?: string;
    customOpenAiKey?: string;
    customResendKey?: string;
  }): Promise<ReportDocument> {
    const { jobId, prUrl, issueUrl, email, customGithubToken, customOpenAiKey, customResendKey } = params;

    // Stage 1: Fetching GitHub data
    this.emitProgress(jobId, 'fetching_github', 'Fetching GitHub metadata & discussions', 15, 'Validating PR URL...');
    const parsedPR = githubService.parseUrl(prUrl);
    if (!parsedPR || parsedPR.type !== 'pull') {
      throw new Error('Invalid GitHub Pull Request URL. Format: https://github.com/owner/repo/pull/123');
    }

    let parsedIssue: { owner: string; repo: string; type: 'pull' | 'issues'; number: number } | null = null;
    if (issueUrl) {
      parsedIssue = githubService.parseUrl(issueUrl);
    }

    this.emitProgress(
      jobId,
      'fetching_github',
      'Fetching GitHub metadata & discussions',
      25,
      `Connecting to ${parsedPR.owner}/${parsedPR.repo} #${parsedPR.number}`
    );

    const prData = await githubService.getPRDetails(parsedPR.owner, parsedPR.repo, parsedPR.number, customGithubToken);

    let issueData: any = null;
    if (parsedIssue) {
      this.emitProgress(
        jobId,
        'fetching_github',
        'Fetching linked issue data',
        35,
        `Retrieved issue #${parsedIssue.number}`
      );
      try {
        issueData = await githubService.getIssueDetails(
          parsedIssue.owner,
          parsedIssue.repo,
          parsedIssue.number,
          customGithubToken
        );
      } catch (err: any) {
        console.warn('Issue fetch failed:', err.message);
      }
    }

    // Stage 2: Reading code changes
    this.emitProgress(
      jobId,
      'reading_code',
      'Reading code changes and commit diffs',
      45,
      `Inspected ${prData.files.length} changed files (+${prData.additions}/-${prData.deletions})`
    );

    // Stage 3: Analyzing implementation
    this.emitProgress(
      jobId,
      'analyzing_implementation',
      'Analyzing implementation and architecture',
      60,
      'Synthesizing root cause, design decisions, and test validation...'
    );

    const reportContent = await aiService.generateReport({
      prData: {
        ...prData,
        owner: parsedPR.owner,
        repo: parsedPR.repo,
      },
      issueData,
      customApiKey: customOpenAiKey,
    });

    // Stage 4: Preparing documentation
    this.emitProgress(
      jobId,
      'preparing_documentation',
      'Preparing documentation & meeting prep',
      75,
      'Structuring executive summary and standup script...'
    );

    const reportId = randomUUID();
    const reportDoc: ReportDocument = {
      id: reportId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pr: {
        number: prData.number,
        title: prData.title,
        url: prData.url,
        repo: parsedPR.repo,
        org: parsedPR.owner,
        author: prData.author,
        authorAvatar: prData.authorAvatar,
        state: prData.state,
        additions: prData.additions,
        deletions: prData.deletions,
        changedFiles: prData.changedFiles,
        baseBranch: prData.baseBranch,
        headBranch: prData.headBranch,
        mergedAt: prData.mergedAt,
      },
      issue: issueData
        ? {
            number: issueData.number,
            title: issueData.title,
            url: issueData.url,
            state: issueData.state,
            author: issueData.author,
            body: issueData.body,
          }
        : null,
      report: reportContent,
    };

    // Stage 5: Generating PDF
    this.emitProgress(jobId, 'generating_pdf', 'Generating high-resolution technical PDF', 85, 'Rendering styles and pages...');
    try {
      const pdfResult = await pdfService.generateReportPDF(reportDoc);
      reportDoc.pdfPath = pdfResult.pdfPath;
      reportDoc.pdfUrl = pdfResult.pdfUrl;
    } catch (err: any) {
      console.warn('PDF generation notice:', err.message);
    }

    // Stage 6: Sending email (if provided)
    if (email && email.trim()) {
      this.emitProgress(jobId, 'sending_email', 'Sending report via email', 95, `Dispatching to ${email.trim()}...`);
      try {
        const emailResult = await emailService.sendReportEmail({
          recipientEmail: email.trim(),
          reportDoc,
          pdfPath: reportDoc.pdfPath,
          customApiKey: customResendKey,
        });

        reportDoc.emailDelivery = {
          recipient: email.trim(),
          sent: emailResult.sent,
          sentAt: new Date().toISOString(),
          error: emailResult.error,
          messageId: emailResult.messageId,
        };
      } catch (err: any) {
        reportDoc.emailDelivery = {
          recipient: email.trim(),
          sent: false,
          error: err.message,
        };
      }
    }

    // Save to Database
    try {
      await ReportModel.create({
        reportId: reportDoc.id,
        ...reportDoc,
      });
    } catch (dbErr: any) {
      console.warn('MongoDB save fallback to memory:', dbErr.message);
      memoryReports.set(reportDoc.id, reportDoc);
    }
    memoryReports.set(reportDoc.id, reportDoc);

    this.emitProgress(jobId, 'completed', 'Analysis completed successfully', 100, 'Your intelligence report is ready.');

    return reportDoc;
  }

  public async getReportById(id: string): Promise<ReportDocument | null> {
    try {
      const dbDoc = await ReportModel.findOne({ reportId: id });
      if (dbDoc) {
        return {
          id: dbDoc.reportId,
          createdAt: dbDoc.createdAt ? String(dbDoc.createdAt) : new Date().toISOString(),
          updatedAt: dbDoc.updatedAt ? String(dbDoc.updatedAt) : new Date().toISOString(),
          pr: dbDoc.pr as any,
          issue: dbDoc.issue as any,
          report: dbDoc.report as any,
          pdfUrl: dbDoc.pdfUrl,
          pdfPath: dbDoc.pdfPath,
          emailDelivery: dbDoc.emailDelivery as any,
        };
      }
    } catch {
      // Ignore
    }

    return memoryReports.get(id) || null;
  }

  public async getAllReports(query?: { search?: string; repo?: string; state?: string }): Promise<ReportDocument[]> {
    let reports: ReportDocument[] = [];

    try {
      const dbDocs = await ReportModel.find().sort({ createdAt: -1 }).limit(50);
      if (dbDocs && dbDocs.length > 0) {
        reports = dbDocs.map((doc: any) => ({
          id: doc.reportId,
          createdAt: doc.createdAt ? String(doc.createdAt) : new Date().toISOString(),
          updatedAt: doc.updatedAt ? String(doc.updatedAt) : new Date().toISOString(),
          pr: doc.pr as any,
          issue: doc.issue as any,
          report: doc.report as any,
          pdfUrl: doc.pdfUrl,
          pdfPath: doc.pdfPath,
          emailDelivery: doc.emailDelivery as any,
        }));
      }
    } catch {
      // Memory fallback
    }

    if (reports.length === 0) {
      reports = Array.from(memoryReports.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    // Apply filtering
    if (query?.search) {
      const s = query.search.toLowerCase();
      reports = reports.filter(
        (r) =>
          r.pr.title.toLowerCase().includes(s) ||
          r.pr.repo.toLowerCase().includes(s) ||
          r.pr.org.toLowerCase().includes(s) ||
          r.pr.author.toLowerCase().includes(s) ||
          r.report.executiveSummary.toLowerCase().includes(s)
      );
    }

    if (query?.repo) {
      reports = reports.filter((r) => r.pr.repo.toLowerCase() === query.repo!.toLowerCase());
    }

    if (query?.state && query.state !== 'all') {
      reports = reports.filter((r) => r.pr.state.toLowerCase() === query.state!.toLowerCase());
    }

    return reports;
  }
}

export const reportService = new ReportService();
