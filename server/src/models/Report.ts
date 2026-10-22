import mongoose, { Schema, Document } from 'mongoose';
import { ReportDocument } from '../types/index.js';

export interface IReportDoc extends Document, Omit<ReportDocument, 'id'> {
  reportId: string;
}

const ReportSchema: Schema = new Schema(
  {
    reportId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, default: 'default' },
    pr: {
      number: { type: Number, required: true },
      title: { type: String, required: true },
      url: { type: String, required: true },
      repo: { type: String, required: true },
      org: { type: String, required: true },
      author: { type: String, required: true },
      authorAvatar: { type: String, default: '' },
      state: { type: String, required: true },
      additions: { type: Number, default: 0 },
      deletions: { type: Number, default: 0 },
      changedFiles: { type: Number, default: 0 },
      baseBranch: { type: String, default: 'main' },
      headBranch: { type: String, default: 'feature' },
      mergedAt: { type: String, default: null },
    },
    issue: {
      number: { type: Number },
      title: { type: String },
      url: { type: String },
      state: { type: String },
      author: { type: String },
      body: { type: String },
    },
    report: {
      executiveSummary: { type: String, required: true },
      problemStatement: { type: String, required: true },
      rootCause: { type: String, required: true },
      technicalImplementation: {
        overview: { type: String, required: true },
        keyFilesChanged: [
          {
            path: { type: String },
            additions: { type: Number },
            deletions: { type: Number },
            description: { type: String },
            functionsAffected: [{ type: String }],
            diffSnippet: { type: String },
          },
        ],
        beforeAfterBehavior: [
          {
            area: { type: String },
            before: { type: String },
            after: { type: String },
          },
        ],
        designDecisions: [
          {
            title: { type: String },
            rationale: { type: String },
            alternativesConsidered: { type: String },
          },
        ],
      },
      testingValidation: {
        testStrategy: { type: String },
        automatedTestsAdded: [{ type: String }],
        ciResults: { type: String },
        manualVerification: { type: String },
      },
      reviewerFeedback: {
        summary: { type: String },
        keyDiscussions: [{ type: String }],
        revisionsMade: { type: String },
      },
      impactLimitations: {
        impact: { type: String },
        limitations: [{ type: String }],
        breakingChanges: { type: Boolean, default: false },
        performanceConsiderations: { type: String },
      },
      meetingPreparation: {
        simpleExplanation: { type: String },
        deepTechnicalExplanation: { type: String },
        twoMinuteScript: { type: String },
        likelyQuestions: [
          {
            question: { type: String },
            suggestedAnswer: { type: String },
            context: { type: String },
          },
        ],
        importantCodeSnippets: [
          {
            filename: { type: String },
            lines: { type: String },
            explanation: { type: String },
            code: { type: String },
          },
        ],
      },
      references: [
        {
          title: { type: String },
          url: { type: String },
          type: { type: String },
        },
      ],
    },
    pdfUrl: { type: String },
    pdfPath: { type: String },
    emailDelivery: {
      recipient: { type: String },
      sent: { type: Boolean, default: false },
      sentAt: { type: String },
      error: { type: String },
      messageId: { type: String },
    },
  },
  { timestamps: true }
);

export const ReportModel = mongoose.model<IReportDoc>('Report', ReportSchema);
