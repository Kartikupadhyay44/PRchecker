import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { Resend } from 'resend';
import fs from 'fs';
import { config } from '../config/index.js';
import { ReportDocument } from '../types/index.js';

export class EmailService {
  private smtpTransporter: Transporter | null = null;

  constructor() {
    this.initSmtp();
  }

  private initSmtp(): Transporter | null {
    if (config.smtpServer && config.smtpUser && config.smtpPass) {
      try {
        this.smtpTransporter = nodemailer.createTransport({
          host: config.smtpServer,
          port: config.smtpPort,
          secure: config.smtpPort === 465,
          auth: {
            user: config.smtpUser,
            pass: config.smtpPass,
          },
          tls: {
            rejectUnauthorized: false,
          },
        });
        return this.smtpTransporter;
      } catch (err: any) {
        console.warn('[EmailService] Failed to initialize SMTP transporter:', err.message);
        this.smtpTransporter = null;
      }
    }
    return null;
  }

  private getResendClient(customKey?: string): Resend | null {
    const key = customKey !== undefined ? customKey : config.resendApiKey;
    if (!key) return null;
    return new Resend(key);
  }

  public isSmtpConfigured(): boolean {
    return Boolean(config.smtpServer && config.smtpUser && config.smtpPass);
  }

  // Verify SMTP Connection
  public async verifyConnection(): Promise<{ ok: boolean; message: string }> {
    if (!this.smtpTransporter) {
      const created = this.initSmtp();
      if (!created) {
        return { ok: false, message: 'SMTP credentials not configured.' };
      }
    }

    try {
      await this.smtpTransporter!.verify();
      return { ok: true, message: 'SMTP connection verified successfully.' };
    } catch (err: any) {
      return { ok: false, message: err.message || 'SMTP verification failed.' };
    }
  }

  public async sendReportEmail(params: {
    recipientEmail: string;
    reportDoc: ReportDocument;
    pdfPath?: string;
    customApiKey?: string;
  }): Promise<{ sent: boolean; messageId?: string; error?: string }> {
    const { recipientEmail, reportDoc, pdfPath, customApiKey } = params;

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

    // 1. Prepare attachments if PDF is present
    let attachments: Array<{ filename: string; content?: Buffer; path?: string }> = [];
    if (pdfPath && fs.existsSync(pdfPath)) {
      try {
        const fileBuffer = fs.readFileSync(pdfPath);
        attachments = [
          {
            filename: `MergeMemo-${reportDoc.pr.repo}-PR-${reportDoc.pr.number}.pdf`,
            content: fileBuffer,
          },
        ];
      } catch (err: any) {
        console.warn('[EmailService] Could not read PDF attachment:', err.message);
      }
    }

    // If caller explicitly passed empty string as customApiKey (test / offline mode), simulate delivery
    if (customApiKey === '') {
      console.log(`[Email Mock Delivery] Simulated email dispatch to ${recipientEmail} for PR #${reportDoc.pr.number}.`);
      return {
        sent: true,
        messageId: `sim_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      };
    }

    // 2. Dispatch via SMTP (Brevo / Nodemailer) if configured
    if (this.isSmtpConfigured()) {
      try {
        if (!this.smtpTransporter) {
          this.initSmtp();
        }

        const sender = config.senderEmail
          ? `"MergeMemo AI" <${config.senderEmail}>`
          : `"MergeMemo AI" <${config.smtpUser}>`;

        const info = await this.smtpTransporter!.sendMail({
          from: sender,
          to: recipientEmail,
          subject,
          text: textBody,
          html: htmlBody,
          attachments,
        });

        console.log(`[EmailService] Successfully dispatched report via SMTP to ${recipientEmail} (messageId: ${info.messageId})`);
        return {
          sent: true,
          messageId: info.messageId,
        };
      } catch (smtpErr: any) {
        console.error('[EmailService] SMTP delivery failed:', smtpErr);
        return {
          sent: false,
          error: smtpErr.message || 'SMTP delivery failed',
        };
      }
    }

    // 3. Fallback: Dispatch via Resend API if custom key or RESEND_API_KEY is supplied
    const resendClient = this.getResendClient(customApiKey);
    if (resendClient) {
      try {
        const emailPayload: any = {
          from: config.resendFromEmail,
          to: recipientEmail,
          subject,
          text: textBody,
          html: htmlBody,
        };

        if (attachments.length > 0) {
          emailPayload.attachments = attachments.map((a) => ({
            filename: a.filename,
            content: a.content,
          }));
        }

        const { data, error } = await resendClient.emails.send(emailPayload);
        if (error) {
          return { sent: false, error: error.message };
        }

        return { sent: true, messageId: data?.id };
      } catch (err: any) {
        return { sent: false, error: err.message || 'Resend delivery failed' };
      }
    }

    // 4. Default: Simulated delivery for offline test runs
    console.log(`[Email Mock Delivery] Simulated email dispatch to ${recipientEmail} for PR #${reportDoc.pr.number}.`);
    return {
      sent: true,
      messageId: `sim_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    };
  }

  public async sendTestEmail(params: {
    recipientEmail: string;
    pdfPath?: string;
  }): Promise<{ sent: boolean; messageId?: string; error?: string }> {
    const { recipientEmail, pdfPath } = params;

    if (!this.isSmtpConfigured()) {
      return {
        sent: false,
        error: 'SMTP configuration is missing (SMTP_SERVER, SMTP_USER, SMTP_PASS).',
      };
    }

    try {
      if (!this.smtpTransporter) {
        this.initSmtp();
      }

      const sender = config.senderEmail
        ? `"MergeMemo AI" <${config.senderEmail}>`
        : `"MergeMemo AI" <${config.smtpUser}>`;

      let attachments: any[] = [];
      if (pdfPath && fs.existsSync(pdfPath)) {
        attachments = [
          {
            filename: 'MergeMemo-Verified-Report.pdf',
            content: fs.readFileSync(pdfPath),
          },
        ];
      }

      const info = await this.smtpTransporter!.sendMail({
        from: sender,
        to: recipientEmail,
        subject: 'MergeMemo AI — SMTP Mail Service Verification',
        text: 'This is a verification email from MergeMemo AI confirming that the Brevo SMTP integration is active and operating properly.',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
            <h2 style="color: #4f46e5; margin-top: 0;">✓ Mail Service Operational</h2>
            <p style="color: #334155; font-size: 14px; line-height: 1.6;">Your MergeMemo AI platform has successfully connected to the Brevo SMTP relay service.</p>
            <div style="background: #f1f5f9; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 12px; color: #475569;">
              Sender: ${config.senderEmail}<br/>
              Relay: ${config.smtpServer}:${config.smtpPort}
            </div>
          </div>
        `,
        attachments,
      });

      return {
        sent: true,
        messageId: info.messageId,
      };
    } catch (err: any) {
      return {
        sent: false,
        error: err.message || 'Failed to send test email',
      };
    }
  }
}

export const emailService = new EmailService();
