import { Resend } from 'resend';
import fs from 'fs';
import { config } from '../config/index.js';
import { ReportDocument } from '../types/index.js';

export class EmailService {
  private getClient(customKey?: string): Resend | null {
    const key = customKey !== undefined ? customKey : config.resendApiKey;
    if (!key) return null;
    return new Resend(key);
  }

  public async sendReportEmail(params: {
    recipientEmail: string;
    reportDoc: ReportDocument;
    pdfPath?: string;
    customApiKey?: string;
  }): Promise<{ sent: boolean; messageId?: string; error?: string }> {
    const { recipientEmail, reportDoc, pdfPath, customApiKey } = params;
    const client = this.getClient(customApiKey);

    const subject = `MergeMemo AI Report: ${reportDoc.pr.repo} #${reportDoc.pr.number} — ${reportDoc.pr.title}`;

    const textBody = `
Hello,

Your requested technical PR intelligence report for ${reportDoc.pr.repo} #${reportDoc.pr.number} is ready.

Title: ${reportDoc.pr.title}
Author: @${reportDoc.pr.author}
Impact: +${reportDoc.pr.additions} / -${reportDoc.pr.deletions} lines across ${reportDoc.pr.changedFiles} files.

Executive Summary:
${reportDoc.report.executiveSummary}

Key Changes:
${reportDoc.report.technicalImplementation.overview}

The complete executive PDF report is attached for your review.

Best regards,
MergeMemo AI Platform
    `.trim();

    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #0f172a; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 20px;">
          <div style="background: #4f46e5; color: white; width: 28px; height: 28px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-family: monospace;">&lambda;</div>
          <span style="font-size: 16px; font-weight: bold; color: #0f172a;">MergeMemo AI</span>
        </div>
        <h2 style="font-size: 18px; font-weight: 700; margin-bottom: 6px; color: #0f172a;">${reportDoc.pr.repo} #${reportDoc.pr.number} — ${reportDoc.pr.title}</h2>
        <p style="font-size: 13px; color: #64748b; margin-top: 0;">Authored by <strong>@${reportDoc.pr.author}</strong> &bull; +${reportDoc.pr.additions} / -${reportDoc.pr.deletions} lines across ${reportDoc.pr.changedFiles} files</p>
        <div style="background: #f8fafc; border-left: 4px solid #4f46e5; padding: 12px 16px; border-radius: 6px; margin: 20px 0;">
          <h4 style="margin: 0 0 6px 0; font-size: 12px; text-transform: uppercase; color: #4338ca; letter-spacing: 0.05em;">Executive Summary</h4>
          <p style="margin: 0; font-size: 13.5px; line-height: 1.55; color: #1e1b4b;">${reportDoc.report.executiveSummary}</p>
        </div>
        <p style="font-size: 13px; color: #334155; line-height: 1.5;">The complete executive PDF report is attached for your review and technical meetings.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 11px; color: #94a3b8; margin: 0;">MergeMemo AI &bull; GitHub PR Intelligence & Documentation Platform</p>
      </div>
    `;

    if (!client) {
      console.log(`[Email Mock Delivery] Simulated email dispatch to ${recipientEmail} for PR #${reportDoc.pr.number}.`);
      return {
        sent: true,
        messageId: `sim_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      };
    }

    try {
      let attachments: any[] = [];
      if (pdfPath && fs.existsSync(pdfPath)) {
        const fileBuffer = fs.readFileSync(pdfPath);
        attachments = [
          {
            filename: `MergeMemo-${reportDoc.pr.repo}-PR-${reportDoc.pr.number}.pdf`,
            content: fileBuffer,
          },
        ];
      }

      const emailPayload: any = {
        from: config.resendFromEmail,
        to: recipientEmail,
        subject,
        text: textBody,
        html: htmlBody,
      };

      if (attachments.length > 0) {
        emailPayload.attachments = attachments;
      }

      const { data, error } = await client.emails.send(emailPayload);

      if (error) {
        return {
          sent: false,
          error: error.message,
        };
      }

      return {
        sent: true,
        messageId: data?.id,
      };
    } catch (err: any) {
      console.error('Resend delivery exception:', err);
      return {
        sent: false,
        error: err.message || 'Unknown email delivery error',
      };
    }
  }

  public async sendTestEmail(params: {
    recipientEmail: string;
    pdfPath?: string;
    customApiKey?: string;
  }): Promise<{ sent: boolean; messageId?: string; error?: string; responseData?: any }> {
    const { recipientEmail, pdfPath, customApiKey } = params;
    const client = this.getClient(customApiKey);

    if (!client) {
      return {
        sent: false,
        error: 'Resend API key is not configured in RESEND_API_KEY.',
      };
    }

    try {
      let attachments: any[] = [];
      if (pdfPath && fs.existsSync(pdfPath)) {
        const fileBuffer = fs.readFileSync(pdfPath);
        attachments = [
          {
            filename: 'MergeMemo-Verified-Report.pdf',
            content: fileBuffer,
          },
        ];
      }

      const payload: any = {
        from: config.resendFromEmail,
        to: recipientEmail,
        subject: 'MergeMemo AI — Resend API Integration Verification',
        text: 'This is a verification email from MergeMemo AI confirming that the Resend API integration and PDF attachments are functioning properly.',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 20px;">
              <div style="background: #4f46e5; color: white; width: 32px; height: 32px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-family: monospace;">&lambda;</div>
              <span style="font-size: 18px; font-weight: bold; color: #0f172a;">MergeMemo AI</span>
            </div>
            <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0;">Resend Integration Verified &bull; Live Test</h2>
            <p style="font-size: 14px; color: #334155; line-height: 1.6;">
              Congratulations! Your Resend API key and email integration with <strong>MergeMemo AI</strong> are working successfully.
            </p>
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 14px 16px; border-radius: 8px; margin: 20px 0;">
              <div style="color: #166534; font-weight: 600; font-size: 13px; margin-bottom: 4px;">✓ Sender Address: <span style="font-family: monospace; font-weight: normal;">${config.resendFromEmail}</span></div>
              <div style="color: #166534; font-weight: 600; font-size: 13px; margin-bottom: 4px;">✓ Recipient Address: <span style="font-family: monospace; font-weight: normal;">${recipientEmail}</span></div>
              <div style="color: #166534; font-weight: 600; font-size: 13px;">✓ Attachment: <span style="font-weight: normal;">${attachments.length > 0 ? 'Verified PDF attached' : 'No attachment'}</span></div>
            </div>
            <p style="font-size: 12px; color: #64748b; margin-top: 24px;">MergeMemo AI &bull; GitHub PR Intelligence & Documentation Platform</p>
          </div>
        `,
      };

      if (attachments.length > 0) {
        payload.attachments = attachments;
      }

      const { data, error } = await client.emails.send(payload);

      if (error) {
        return {
          sent: false,
          error: error.message,
        };
      }

      return {
        sent: true,
        messageId: data?.id,
        responseData: data,
      };
    } catch (err: any) {
      console.error('Resend test delivery exception:', err);
      return {
        sent: false,
        error: err.message || 'Unknown Resend test delivery error',
      };
    }
  }
}

export const emailService = new EmailService();
