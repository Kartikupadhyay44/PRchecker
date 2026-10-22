import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { config } from '../config/index.js';
import { ReportDocument } from '../types/index.js';

export class PDFService {
  public async generateReportPDF(reportDoc: ReportDocument): Promise<{ pdfPath: string; pdfUrl: string }> {
    const filename = `mergememo-report-${reportDoc.pr.repo}-${reportDoc.pr.number}-${Date.now()}.pdf`;
    const outputPath = path.join(config.storageDir, filename);
    const pdfUrl = `/api/reports/${reportDoc.id}/pdf`;

    const html = this.buildHTMLTemplate(reportDoc);

    try {
      // Launch headless Chrome via puppeteer-core
      const browser = await puppeteer.launch({
        executablePath: config.chromePath,
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--font-render-hinting=none',
        ],
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'domcontentloaded' });

      await page.pdf({
        path: outputPath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm',
        },
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: `
          <div style="font-size: 8px; color: #94a3b8; width: 100%; display: flex; justify-content: space-between; padding: 0 20mm; font-family: -apple-system, sans-serif;">
            <span>MergeMemo AI &bull; Confidential Technical Briefing</span>
            <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
          </div>
        `,
      });

      await browser.close();
      return { pdfPath: outputPath, pdfUrl };
    } catch (err: any) {
      console.warn('Puppeteer launch error or environment limitation. Generating high-fidelity fallback document:', err.message);
      // Fallback: save HTML as readable document
      const fallbackPath = outputPath.replace('.pdf', '.html');
      fs.writeFileSync(fallbackPath, html, 'utf-8');
      return { pdfPath: fallbackPath, pdfUrl };
    }
  }

  private buildHTMLTemplate(doc: ReportDocument): string {
    const { pr, issue, report } = doc;
    const formattedDate = new Date(doc.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>MergeMemo AI Report — ${pr.repo} #${pr.number}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.55;
      font-size: 13px;
    }

    .page {
      padding: 0;
      margin-bottom: 30px;
    }

    .page-break {
      page-break-before: always;
    }

    /* Cover Page */
    .cover {
      min-height: 90vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 40px;
    }

    .brand-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 60px;
    }

    .brand-logo {
      width: 32px;
      height: 32px;
      background: #4f46e5;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 800;
      font-size: 16px;
    }

    .brand-name {
      font-size: 18px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #0f172a;
    }

    .brand-tagline {
      font-size: 11px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .cover-title-section {
      margin-top: 40px;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 600;
      margin-bottom: 16px;
    }

    .badge-purple {
      background: #f3e8ff;
      color: #7e22ce;
      border: 1px solid #d8b4fe;
    }

    .badge-green {
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #86efac;
    }

    .doc-title {
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1.25;
      color: #0f172a;
      margin-bottom: 12px;
    }

    .doc-subtitle {
      font-size: 15px;
      color: #475569;
      margin-bottom: 24px;
    }

    .metadata-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 20px;
      margin-top: 30px;
    }

    .meta-item {
      display: flex;
      flex-direction: column;
    }

    .meta-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      margin-bottom: 4px;
      font-weight: 600;
    }

    .meta-value {
      font-size: 13px;
      font-weight: 600;
      color: #0f172a;
    }

    .cover-footer {
      font-size: 11px;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
      padding-top: 20px;
      display: flex;
      justify-content: space-between;
    }

    /* Content Sections */
    h2 {
      font-size: 18px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #0f172a;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 8px;
      margin-top: 28px;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    h3 {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
      margin-top: 18px;
      margin-bottom: 6px;
    }

    p {
      color: #334155;
      margin-bottom: 10px;
      font-size: 12.5px;
    }

    .box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 16px;
      margin-bottom: 14px;
    }

    .box-primary {
      border-left: 4px solid #4f46e5;
      background: #fcfaff;
    }

    .box-green {
      border-left: 4px solid #10b981;
      background: #f0fdf4;
    }

    .table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      margin-bottom: 16px;
      font-size: 12px;
    }

    .table th, .table td {
      border: 1px solid #e2e8f0;
      padding: 8px 12px;
      text-align: left;
    }

    .table th {
      background: #f1f5f9;
      font-weight: 600;
      color: #334155;
    }

    .code-block {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      background: #0f172a;
      color: #f8fafc;
      padding: 12px;
      border-radius: 6px;
      overflow-x: auto;
      margin-top: 6px;
      margin-bottom: 12px;
      line-height: 1.45;
    }

    .qa-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 14px;
      margin-bottom: 10px;
    }

    .qa-question {
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 4px;
    }

    .qa-answer {
      color: #475569;
      font-size: 12px;
    }

    .speech-box {
      background: #eef2ff;
      border: 1px solid #c7d2fe;
      border-radius: 8px;
      padding: 14px 16px;
      font-style: italic;
      color: #312e81;
      line-height: 1.6;
      margin-bottom: 16px;
    }

    ul {
      margin-left: 20px;
      margin-bottom: 10px;
      color: #334155;
    }

    li {
      margin-bottom: 4px;
    }
  </style>
</head>
<body>

  <!-- Cover Page -->
  <div class="page cover">
    <div>
      <div class="brand-header">
        <div class="brand-logo">&lambda;</div>
        <div>
          <div class="brand-name">MergeMemo AI</div>
          <div class="brand-tagline">PR Intelligence & Architecture Brief</div>
        </div>
      </div>

      <div class="cover-title-section">
        <span class="badge ${pr.state === 'merged' ? 'badge-purple' : 'badge-green'}">
          ${pr.state.toUpperCase()} PULL REQUEST
        </span>
        <h1 class="doc-title">${pr.title}</h1>
        <p class="doc-subtitle">Pull Request #${pr.number} in <strong>${pr.org}/${pr.repo}</strong></p>

        <div class="metadata-grid">
          <div class="meta-item">
            <span class="meta-label">Author</span>
            <span class="meta-value">@${pr.author}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Target Branch</span>
            <span class="meta-value">${pr.baseBranch} &larr; ${pr.headBranch}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Code Impact</span>
            <span class="meta-value">+${pr.additions} / -${pr.deletions} lines (${pr.changedFiles} files)</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Generated On</span>
            <span class="meta-value">${formattedDate}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="cover-footer">
      <span>Repository: github.com/${pr.org}/${pr.repo}</span>
      <span>MergeMemo Technical Intelligence Platform</span>
    </div>
  </div>

  <!-- Page 2: Executive Summary & Problem Breakdown -->
  <div class="page page-break">
    <h2>1. Executive Summary</h2>
    <div class="box box-primary">
      <p style="font-size: 13px; font-weight: 500; color: #1e1b4b; margin: 0;">
        ${report.executiveSummary}
      </p>
    </div>

    <h2>2. Problem Statement</h2>
    <p>${report.problemStatement}</p>
    ${issue ? `<div class="box"><strong>Linked Issue #${issue.number}:</strong> ${issue.title}</div>` : ''}

    <h2>3. Root Cause Analysis</h2>
    <p>${report.rootCause}</p>

    <h2>4. Architectural & Technical Implementation</h2>
    <p>${report.technicalImplementation.overview}</p>

    <h3>Before vs. After Behavior</h3>
    <table class="table">
      <thead>
        <tr>
          <th style="width: 25%;">Area</th>
          <th style="width: 37.5%;">Previous Behavior</th>
          <th style="width: 37.5%;">Updated Behavior</th>
        </tr>
      </thead>
      <tbody>
        ${report.technicalImplementation.beforeAfterBehavior
          .map(
            (b) => `
          <tr>
            <td><strong>${b.area}</strong></td>
            <td>${b.before}</td>
            <td style="color: #166534;">${b.after}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  </div>

  <!-- Page 3: Key Files Changed & Design Decisions -->
  <div class="page page-break">
    <h2>5. File-by-File Breakdown</h2>
    <table class="table">
      <thead>
        <tr>
          <th>File Path</th>
          <th>Diff</th>
          <th>Description & Impact</th>
        </tr>
      </thead>
      <tbody>
        ${report.technicalImplementation.keyFilesChanged
          .map(
            (f) => `
          <tr>
            <td style="font-family: monospace; font-size: 11px;">${f.path}</td>
            <td style="white-space: nowrap; font-family: monospace;">
              <span style="color: #16a34a;">+${f.additions}</span> / <span style="color: #dc2626;">-${f.deletions}</span>
            </td>
            <td>${f.description}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>

    <h2>6. Key Design Decisions</h2>
    ${report.technicalImplementation.designDecisions
      .map(
        (d) => `
      <div class="box">
        <h3 style="margin-top: 0; color: #4338ca;">${d.title}</h3>
        <p><strong>Rationale:</strong> ${d.rationale}</p>
        <p style="margin-bottom: 0; color: #64748b;"><strong>Alternatives Evaluated:</strong> ${d.alternativesConsidered}</p>
      </div>
    `
      )
      .join('')}

    <h2>7. Testing & Validation</h2>
    <div class="box box-green">
      <p><strong>Test Strategy:</strong> ${report.testingValidation.testStrategy}</p>
      <p><strong>Automated Tests:</strong></p>
      <ul>
        ${report.testingValidation.automatedTestsAdded.map((t) => `<li>${t}</li>`).join('')}
      </ul>
      <p style="margin-bottom: 0;"><strong>CI Matrix:</strong> ${report.testingValidation.ciResults}</p>
    </div>
  </div>

  <!-- Page 4: Reviewer Feedback, Impact & Meeting Prep -->
  <div class="page page-break">
    <h2>8. Reviewer Feedback & Revisions</h2>
    <p>${report.reviewerFeedback.summary}</p>
    <ul>
      ${report.reviewerFeedback.keyDiscussions.map((d) => `<li>${d}</li>`).join('')}
    </ul>

    <h2>9. Impact, Limitations & Constraints</h2>
    <p>${report.impactLimitations.impact}</p>
    <ul>
      ${report.impactLimitations.limitations.map((l) => `<li>${l}</li>`).join('')}
    </ul>
    <p><strong>Performance Considerations:</strong> ${report.impactLimitations.performanceConsiderations}</p>

    <h2>10. Developer Meeting Preparation</h2>

    <h3>Executive Two-Minute Presentation Script</h3>
    <div class="speech-box">
      &ldquo;${report.meetingPreparation.twoMinuteScript}&rdquo;
    </div>

    <h3>Maintainer Questions & Recommended Answers</h3>
    ${report.meetingPreparation.likelyQuestions
      .map(
        (qa) => `
      <div class="qa-card">
        <div class="qa-question">Q: ${qa.question}</div>
        <div class="qa-answer"><strong>Recommended Answer:</strong> ${qa.suggestedAnswer}</div>
      </div>
    `
      )
      .join('')}

    <h2>11. GitHub References & Provenance</h2>
    <ul>
      ${report.references.map((r) => `<li><a href="${r.url}" style="color: #4f46e5; text-decoration: none;">${r.title}</a> &mdash; ${r.url}</li>`).join('')}
    </ul>
  </div>

</body>
</html>
    `;
  }
}

export const pdfService = new PDFService();
