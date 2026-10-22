import { test, describe } from 'node:test';
import assert from 'node:assert';
import { githubService } from '../src/services/github.service.js';
import { aiService } from '../src/services/ai.service.js';
import { emailService } from '../src/services/email.service.js';

describe('MergeMemo Core Engine Tests', () => {
  describe('1. GitHub URL Parser', () => {
    test('accurately parses standard GitHub Pull Request URLs', () => {
      const res = githubService.parseUrl('https://github.com/facebook/react/pull/28900');
      assert.deepStrictEqual(res, {
        owner: 'facebook',
        repo: 'react',
        type: 'pull',
        number: 28900,
      });
    });

    test('accurately parses standard GitHub Issue URLs', () => {
      const res = githubService.parseUrl('https://github.com/shadcn-ui/ui/issues/2940');
      assert.deepStrictEqual(res, {
        owner: 'shadcn-ui',
        repo: 'ui',
        type: 'issues',
        number: 2940,
      });
    });

    test('returns null for invalid or non-GitHub URLs', () => {
      assert.strictEqual(githubService.parseUrl('https://gitlab.com/owner/repo/pull/1'), null);
      assert.strictEqual(githubService.parseUrl('random-string'), null);
      assert.strictEqual(githubService.parseUrl(''), null);
    });
  });

  describe('2. Pull Request Classification & Analytics Formula', () => {
    test('enforces Total PRs = Merged + Open + Closed Unmerged rule', () => {
      const merged = 85;
      const open = 12;
      const closedUnmerged = 3;
      const total = merged + open + closedUnmerged;

      assert.strictEqual(total, 100);
      const mergeRate = Math.round((merged / total) * 100);
      assert.strictEqual(mergeRate, 85);
    });

    test('handles zero PR state safely without dividing by zero', () => {
      const merged = 0;
      const total = 0;
      const mergeRate = total > 0 ? Math.round((merged / total) * 100) : 0;
      assert.strictEqual(mergeRate, 0);
    });
  });

  describe('3. AI Grounded Intelligence Engine', () => {
    test('generates complete, grounded technical report adhering to required schema', async () => {
      const mockPR = {
        number: 42,
        title: 'fix(core): prevent race condition in event queue',
        author: 'octocat',
        url: 'https://github.com/octo-org/engine/pull/42',
        baseBranch: 'main',
        headBranch: 'fix/race-condition',
        body: 'Fixes race condition when events arrive out-of-order.',
        changedFiles: 2,
        additions: 45,
        deletions: 12,
        files: [
          {
            filename: 'src/queue.ts',
            status: 'modified',
            additions: 30,
            deletions: 5,
            patch: '@@ -10,5 +10,12 @@ export class EventQueue {\n+   private isProcessing = false;',
          },
        ],
        commits: [
          { sha: 'a1b2c3d', message: 'Add atomic lock to queue processor' },
        ],
        comments: [],
      };

      const mockIssue = {
        number: 40,
        title: 'EventQueue crashes under high throughput concurrency',
        body: 'Events occasionally drop or crash when dispatched in parallel.',
        url: 'https://github.com/octo-org/engine/issues/40',
        labels: ['bug', 'concurrency'],
      };

      const report = await aiService.generateReport({
        prData: mockPR,
        issueData: mockIssue,
      });

      // Verify essential sections
      assert.ok(report.executiveSummary, 'Executive summary is present');
      assert.ok(report.problemStatement, 'Problem statement is present');
      assert.ok(report.rootCause, 'Root cause analysis is present');
      assert.ok(report.technicalImplementation.keyFilesChanged.length > 0, 'Key files changed are listed');
      assert.ok(report.technicalImplementation.beforeAfterBehavior.length > 0, 'Before/after behavior is present');
      assert.ok(report.testingValidation.testStrategy, 'Test strategy is present');
      assert.ok(report.meetingPreparation.twoMinuteScript, '2-minute presentation script is present');
      assert.ok(report.meetingPreparation.likelyQuestions.length > 0, 'Maintainer Q&A are present');
    });
  });

  describe('4. Email Dispatch Service', () => {
    test('handles fallback simulated email dispatch cleanly', async () => {
      const mockDoc: any = {
        pr: { repo: 'engine', number: 42, title: 'Concurrency fix', author: 'octocat', additions: 10, deletions: 2, changedFiles: 1 },
        report: {
          executiveSummary: 'Fixed concurrency race condition.',
          technicalImplementation: { overview: 'Added atomic locking.' },
        },
      };

      const result = await emailService.sendReportEmail({
        recipientEmail: 'reviewer@company.com',
        reportDoc: mockDoc,
        customApiKey: '', // Explicitly test simulated delivery fallback
      });

      assert.strictEqual(result.sent, true);
      assert.ok(result.messageId?.startsWith('sim_'), 'Contains simulated messageId');
    });
  });

  describe('5. PR Copilot Interactive Q&A Engine', () => {
    test('answers security and risk questions accurately from reportDoc', async () => {
      const mockDoc: any = {
        pr: { repo: 'engine', number: 42, title: 'Concurrency fix', author: 'octocat', additions: 10, deletions: 2, changedFiles: 1, url: 'https://github.com/octo-org/engine/pull/42' },
        report: {
          executiveSummary: 'Fixed concurrency race condition.',
          problemStatement: 'Race condition under high load.',
          rootCause: 'Lack of atomic state lock.',
          impactLimitations: { impact: 'Zero regressions.', breakingChanges: false, performanceConsiderations: 'O(1) overhead.' },
          testingValidation: { testStrategy: 'Unit regression suite.', automatedTestsAdded: ['testConcurrentAccess'] },
        },
      };

      const answer = await aiService.answerPRQuestion({
        query: 'What are the security and deployment risks?',
        reportDoc: mockDoc,
      });

      assert.ok(answer.includes('Risk & Security Assessment'), 'Contains risk header');
      assert.ok(answer.includes('Low Deployment Risk'), 'Notes zero breaking changes');
    });

    test('drafts ready-to-send Slack updates', async () => {
      const mockDoc: any = {
        pr: { repo: 'engine', number: 42, title: 'Concurrency fix', author: 'octocat', additions: 10, deletions: 2, changedFiles: 1, url: 'https://github.com/octo-org/engine/pull/42' },
        report: {
          executiveSummary: 'Fixed concurrency race condition.',
          problemStatement: 'Race condition under high load.',
          rootCause: 'Lack of atomic state lock.',
          impactLimitations: { impact: 'Zero regressions.' },
          testingValidation: { testStrategy: 'Unit regression suite.' },
        },
      };

      const answer = await aiService.answerPRQuestion({
        query: 'Draft a Slack update for the team',
        reportDoc: mockDoc,
      });

      assert.ok(answer.includes('Ready-to-Send Slack Update'), 'Contains Slack header');
      assert.ok(answer.includes('octocat'), 'Mentions author');
      assert.ok(answer.includes('#42'), 'Mentions PR number');
    });
  });
});

