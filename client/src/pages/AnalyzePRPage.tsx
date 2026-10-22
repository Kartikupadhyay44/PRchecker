import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { ReportDocument, GenerationStage, StageUpdate } from '../types';
import { api } from '../services/api';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  GitPullRequest,
  AlertCircle,
  CheckCircle2,
  Download,
  Mail,
  ExternalLink,
  Code2,
  FileText,
  Clock,
  Layers,
  HelpCircle,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
  Send,
  Zap,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  ShieldCheck,
  CheckCheck,
  Share2,
  Bot,
  Terminal,
  Search,
  FileCode,
  X,
  Gauge,
  CornerDownLeft,
  CircleDot,
  GitMerge,
  XCircle,
  ArrowRight,
  Maximize2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

// Formatted Copilot message renderer with code-block copy
const CopilotMessageBubble: React.FC<{ message: CopilotMessage }> = ({ message }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const parts = message.text.split(/(```[\s\S]*?```)/g);

  return (
    <div
      className={`flex items-start gap-2.5 max-w-[88%] ${
        message.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
      }`}
    >
      <div
        className={`w-7 h-7 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold shadow-2xs ${
          message.role === 'user'
            ? 'bg-primary text-white shadow-xs'
            : 'bg-gradient-to-tr from-purple-600/20 to-indigo-600/20 text-purple-400 border border-purple-500/30'
        }`}
      >
        {message.role === 'user' ? 'You' : <Bot className="w-4 h-4" />}
      </div>

      <div
        className={`p-3.5 rounded-2xl text-xs space-y-2 leading-relaxed shadow-2xs ${
          message.role === 'user'
            ? 'bg-primary text-white rounded-tr-none'
            : 'bg-card/90 border border-border text-foreground rounded-tl-none backdrop-blur-sm'
        }`}
      >
        {parts.map((part, idx) => {
          if (part.startsWith('```') && part.endsWith('```')) {
            const rawLines = part.slice(3, -3).trim().split('\n');
            const firstLine = rawLines[0]?.trim();
            const hasLang = firstLine && !firstLine.includes(' ') && firstLine.length < 15;
            const lang = hasLang ? firstLine : 'text';
            const code = hasLang ? rawLines.slice(1).join('\n') : rawLines.join('\n');

            const handleCopyCode = () => {
              navigator.clipboard.writeText(code);
              setCopiedIndex(idx);
              setTimeout(() => setCopiedIndex(null), 2000);
            };

            return (
              <div
                key={idx}
                className="my-2 rounded-xl border border-border/80 bg-[#090d14] overflow-hidden font-mono text-[11px]"
              >
                <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-white/5 text-muted-foreground text-[10px]">
                  <span>{lang}</span>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    {copiedIndex === idx ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedIndex === idx ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-3 overflow-x-auto text-slate-200 whitespace-pre leading-snug">
                  {code}
                </pre>
              </div>
            );
          }

          const lines = part.split('\n');
          return (
            <div key={idx} className="space-y-1">
              {lines.map((line, lIdx) => {
                if (line.startsWith('### ')) {
                  return (
                    <h4
                      key={lIdx}
                      className="font-bold text-foreground text-xs mt-2.5 mb-1 flex items-center gap-1.5"
                    >
                      {line.replace('### ', '')}
                    </h4>
                  );
                }
                if (line.startsWith('- ')) {
                  return (
                    <div key={lIdx} className="flex items-start gap-1.5 pl-1 text-muted-foreground">
                      <span className="text-primary font-bold">&bull;</span>
                      <span
                        dangerouslySetInnerHTML={{
                          __html: formatMarkdownInline(line.slice(2)),
                        }}
                      />
                    </div>
                  );
                }
                if (!line.trim()) return <div key={lIdx} className="h-0.5" />;
                return (
                  <p
                    key={lIdx}
                    dangerouslySetInnerHTML={{
                      __html: formatMarkdownInline(line),
                    }}
                  />
                );
              })}
            </div>
          );
        })}

        <div
          className={`text-[10px] text-right font-mono mt-1 ${
            message.role === 'user' ? 'text-white/70' : 'text-muted-foreground'
          }`}
        >
          {message.timestamp}
        </div>
      </div>
    </div>
  );
};

function formatMarkdownInline(str: string): string {
  return str
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-foreground">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    .replace(
      /`(.*?)`/g,
      '<code class="px-1 py-0.5 rounded bg-muted/80 font-mono text-[10.5px] text-primary">$1</code>'
    );
}

export const AnalyzePRPage: React.FC = () => {
  const { prefillAnalyzePR, setPrefillAnalyzePR, settings, showToast, activeReport, setActiveReport } = useApp();

  const [prUrl, setPrUrl] = useState('');
  const [issueUrl, setIssueUrl] = useState('');
  const [email, setEmail] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isFormCollapsed, setIsFormCollapsed] = useState(Boolean(activeReport));

  // Pipeline generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [currentStage, setCurrentStage] = useState<GenerationStage | 'idle'>('idle');
  const [stageProgress, setStageProgress] = useState<number>(0);
  const [stageLabel, setStageLabel] = useState<string>('');
  const [stageDetail, setStageDetail] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Result state (persisted globally across navigation tabs)
  const generatedReport = activeReport;
  const setGeneratedReport = setActiveReport;
  const [activeTab, setActiveTab] = useState<
    'overview' | 'technical' | 'diffs' | 'meeting' | 'validation'
  >('overview');
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedSlack, setCopiedSlack] = useState(false);
  const [copiedJira, setCopiedJira] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Interactive Diff state
  const [selectedDiffIndex, setSelectedDiffIndex] = useState<number>(0);
  const [diffSearchQuery, setDiffSearchQuery] = useState('');

  // Interactive PR Copilot state
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [copilotQuery, setCopilotQuery] = useState('');
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotMessages, setCopilotMessages] = useState<CopilotMessage[]>([]);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [copilotMessages, copilotLoading]);

  // Handle pre-fill from Pull Requests view
  useEffect(() => {
    if (prefillAnalyzePR) {
      setPrUrl(prefillAnalyzePR.prUrl);
      if (prefillAnalyzePR.issueUrl) {
        setIssueUrl(prefillAnalyzePR.issueUrl);
        setShowAdvanced(true);
      }
      setIsFormCollapsed(false);
      setPrefillAnalyzePR(null);
    }
  }, [prefillAnalyzePR, setPrefillAnalyzePR]);

  // Sync preferred email from settings
  useEffect(() => {
    if (settings.preferredEmail && !email) {
      setEmail(settings.preferredEmail);
    }
  }, [settings.preferredEmail, email]);

  // Collapse form when report finishes
  useEffect(() => {
    if (generatedReport) {
      setIsFormCollapsed(true);
      setCopilotMessages([
        {
          id: 'welcome',
          role: 'assistant',
          text: `👋 **PR Copilot Initialized** for **${generatedReport.pr.title}** (#${generatedReport.pr.number})!\n\nI have fully ingested the diffs, testing coverage, architectural choices, and breaking changes. Ask me anything or select a quick action below!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [generatedReport]);

  const stages: Array<{ id: GenerationStage; label: string; number: number }> = [
    { id: 'fetching_github', label: 'Fetching GitHub', number: 1 },
    { id: 'reading_code', label: 'Reading Diffs', number: 2 },
    { id: 'analyzing_implementation', label: 'AI Deep Dive', number: 3 },
    { id: 'preparing_documentation', label: 'Structuring Briefing', number: 4 },
    { id: 'generating_pdf', label: 'Generating PDF', number: 5 },
    { id: 'sending_email', label: 'Delivery', number: 6 },
  ];

  const samplePresets = [
    {
      label: 'shadcn-ui/ui #12360',
      pr: 'https://github.com/shadcn-ui/ui/pull/12360',
      issue: 'https://github.com/shadcn-ui/ui/issues/12300',
    },
    {
      label: 'facebook/react #28900',
      pr: 'https://github.com/facebook/react/pull/28900',
      issue: '',
    },
    {
      label: 'vercel/next.js #8421',
      pr: 'https://github.com/vercel/next.js/pull/8421',
      issue: '',
    },
  ];

  // AI Risk & Complexity calculation
  const riskMetrics = useMemo(() => {
    if (!generatedReport) return null;
    const { pr, report } = generatedReport;
    const lineCount = (pr.additions || 0) + (pr.deletions || 0);
    const fileCount = pr.changedFiles || 1;
    const isBreaking = report.impactLimitations?.breakingChanges;

    let score = 2;
    if (isBreaking) score += 5;
    if (lineCount > 500) score += 2;
    else if (lineCount > 200) score += 1;
    if (fileCount > 10) score += 2;
    else if (fileCount > 5) score += 1;
    score = Math.min(10, Math.max(1, score));

    let level: 'Low Risk' | 'Moderate Risk' | 'High Risk' = 'Low Risk';
    let badgeClass = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/25';
    let barColor = 'bg-emerald-500';
    if (score >= 7) {
      level = 'High Risk';
      badgeClass = 'text-rose-500 bg-rose-500/10 border-rose-500/25';
      barColor = 'bg-rose-500';
    } else if (score >= 4) {
      level = 'Moderate Risk';
      badgeClass = 'text-amber-500 bg-amber-500/10 border-amber-500/25';
      barColor = 'bg-amber-500';
    }

    const estMinutes = Math.max(2, Math.round(lineCount / 70 + fileCount * 1.2));
    const blastRadius =
      fileCount > 10
        ? 'System-wide / Broad'
        : fileCount > 3
        ? 'Multi-component'
        : 'Isolated Scope';

    return {
      score,
      level,
      badgeClass,
      barColor,
      estMinutes,
      blastRadius,
      isBreaking,
    };
  }, [generatedReport]);

  const handleStartAnalysis = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prUrl.trim()) {
      setErrorMsg('Please enter a valid GitHub Pull Request URL');
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);
    setGeneratedReport(null);
    setCurrentStage('fetching_github');
    setStageProgress(12);
    setStageLabel('Connecting to GitHub API & parsing PR...');

    try {
      const { jobId: newJobId } = await api.startAnalysis({
        prUrl: prUrl.trim(),
        issueUrl: issueUrl.trim() || undefined,
        email: email.trim() || undefined,
        customGithubToken: settings.customGithubToken,
        customOpenAiKey: settings.customOpenAiKey,
        customResendKey: settings.customResendKey,
      });

      setJobId(newJobId);

      // Connect to SSE stream
      const eventSource = new EventSource(`/api/analyze/progress/${newJobId}`);

      eventSource.onmessage = (event) => {
        try {
          const update: StageUpdate = JSON.parse(event.data);
          if (update.stage) {
            setCurrentStage(update.stage);
            setStageProgress(update.progress);
            setStageLabel(update.label);
            if (update.detail) setStageDetail(update.detail);

            if (update.stage === 'completed') {
              eventSource.close();
              pollFinalResult(newJobId);
            } else if (update.stage === 'failed') {
              eventSource.close();
              setIsGenerating(false);
              setErrorMsg(update.detail || 'Analysis pipeline encountered an error');
            }
          }
        } catch {
          // Ignore parse errors
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        pollFinalResult(newJobId);
      };
    } catch (err: any) {
      setIsGenerating(false);
      setErrorMsg(err.message || 'Failed to initiate report generation');
    }
  };

  const pollFinalResult = async (id: string) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const status = await api.checkAnalysisStatus(id);
        if (status.status === 'done' && status.result) {
          clearInterval(interval);
          setGeneratedReport(status.result);
          setIsGenerating(false);
          setCurrentStage('completed');
          setStageProgress(100);

          confetti({
            particleCount: 50,
            spread: 50,
            origin: { y: 0.5 },
          });

          showToast('Technical briefing ready!', 'success');
        } else if (status.status === 'error') {
          clearInterval(interval);
          setIsGenerating(false);
          setErrorMsg(status.error || 'Failed to complete analysis');
        }
      } catch {
        // Continue polling
      }

      if (attempts > 20) {
        clearInterval(interval);
        setIsGenerating(false);
      }
    }, 1200);
  };

  const handleAskCopilot = async (queryText: string) => {
    if (!queryText.trim() || !generatedReport || copilotLoading) return;

    const userMsg: CopilotMessage = {
      id: String(Date.now()),
      role: 'user',
      text: queryText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setCopilotMessages((prev) => [...prev, userMsg]);
    setCopilotQuery('');
    setCopilotLoading(true);

    try {
      const res = await api.askPRCopilot({
        query: queryText.trim(),
        reportDoc: generatedReport,
        customApiKey: settings.customOpenAiKey,
      });

      const assistantMsg: CopilotMessage = {
        id: String(Date.now() + 1),
        role: 'assistant',
        text: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setCopilotMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setCopilotMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          role: 'assistant',
          text: `⚠️ Error retrieving response: ${err.message || 'Please retry.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setCopilotLoading(false);
    }
  };

  const handleCopyScript = (scriptText: string) => {
    navigator.clipboard.writeText(scriptText);
    setCopiedScript(true);
    showToast('2-Minute Presentation Script copied!', 'info');
    setTimeout(() => setCopiedScript(false), 2200);
  };

  const handleCopySlack = () => {
    if (!generatedReport) return;
    const slackText = `🚀 *PR Update:* ${generatedReport.pr.repo} #${generatedReport.pr.number} — ${generatedReport.pr.title}
👤 *Author:* @${generatedReport.pr.author}
📊 *Changes:* +${generatedReport.pr.additions}/-${generatedReport.pr.deletions} lines across ${generatedReport.pr.changedFiles} files
🎯 *TL;DR:* ${generatedReport.report.executiveSummary}
🛡️ *Risk:* ${riskMetrics?.level} (Score ${riskMetrics?.score}/10)
🔗 *GitHub Link:* ${generatedReport.pr.url}`;

    navigator.clipboard.writeText(slackText);
    setCopiedSlack(true);
    showToast('Slack announcement copied to clipboard!', 'success');
    confetti({ particleCount: 30, spread: 45, origin: { y: 0.8 } });
    setTimeout(() => setCopiedSlack(false), 2500);
  };

  const handleCopyJira = () => {
    if (!generatedReport) return;
    const jiraText = `h2. [PR #${generatedReport.pr.number}] ${generatedReport.pr.title}
*Repository:* ${generatedReport.pr.repo}
*Author:* @${generatedReport.pr.author}

h3. Executive Summary
${generatedReport.report.executiveSummary}

h3. Problem Statement & Root Cause
${generatedReport.report.problemStatement}
Root Cause: ${generatedReport.report.rootCause}

h3. Testing & Verification
${generatedReport.report.testingValidation.testStrategy}

*PR Link:* ${generatedReport.pr.url}`;

    navigator.clipboard.writeText(jiraText);
    setCopiedJira(true);
    showToast('Jira release notes copied to clipboard!', 'success');
    setTimeout(() => setCopiedJira(false), 2500);
  };

  const handleSendEmailNow = async () => {
    if (!generatedReport || !email || !email.includes('@')) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    setSendingEmail(true);
    try {
      const res = await api.emailReport(generatedReport.id, email);
      if (res.sent) {
        showToast(`Report emailed successfully to ${email}`, 'success');
        setEmailModalOpen(false);
      } else {
        showToast(res.error || 'Could not send email', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Email delivery failed', 'error');
    } finally {
      setSendingEmail(false);
    }
  };

  // Filter diff files
  const filteredFiles = useMemo(() => {
    if (!generatedReport?.report.technicalImplementation.keyFilesChanged) return [];
    const list = generatedReport.report.technicalImplementation.keyFilesChanged;
    if (!diffSearchQuery.trim()) return list;
    const q = diffSearchQuery.toLowerCase();
    return list.filter(
      (f) =>
        f.path.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.functionsAffected?.some((fn) => fn.toLowerCase().includes(q))
    );
  }, [generatedReport, diffSearchQuery]);

  const activeDiffFile =
    filteredFiles[selectedDiffIndex] ||
    generatedReport?.report.technicalImplementation.keyFilesChanged[0];

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* 1. Hero Input Bar (Collapsible when report is present) */}
      <div className="rounded-2xl bg-card border border-border shadow-subtle overflow-hidden transition-all">
        {generatedReport && isFormCollapsed ? (
          <div className="p-4 flex items-center justify-between gap-3 bg-muted/20">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
              <div className="text-xs truncate">
                <span className="text-muted-foreground">Active PR: </span>
                <span className="font-semibold text-foreground">
                  {generatedReport.pr.org}/{generatedReport.pr.repo}#{generatedReport.pr.number}
                </span>
                <span className="text-muted-foreground mx-1.5">&bull;</span>
                <span className="text-muted-foreground font-mono">{generatedReport.pr.title}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setActiveReport(null);
                setIsFormCollapsed(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5 text-primary" />
              <span>Analyze Another PR</span>
            </button>
          </div>
        ) : (
          <div className="p-6 sm:p-8">
            <div className="text-center max-w-xl mx-auto mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5" /> Instant Pull Request Intelligence
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                Turn Any Pull Request Into Clarity
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Get instant executive briefings, interactive diffs, AI risk assessments, standup
                scripts, and downloadable PDFs.
              </p>
            </div>

            <form onSubmit={handleStartAnalysis} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <GitPullRequest className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={prUrl}
                    onChange={(e) => setPrUrl(e.target.value)}
                    placeholder="https://github.com/owner/repo/pull/123"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-foreground text-xs sm:text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isGenerating || !prUrl}
                  className="px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs sm:text-sm font-semibold transition-all shadow-subtle flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Analyzing PR...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Analyze Pull Request</span>
                    </>
                  )}
                </button>
              </div>

              {/* Quick presets */}
              <div className="flex items-center gap-2 flex-wrap pt-1 text-[11px] text-muted-foreground">
                <span className="font-medium">Try Sample:</span>
                {samplePresets.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setPrUrl(preset.pr);
                      if (preset.issue) {
                        setIssueUrl(preset.issue);
                        setShowAdvanced(true);
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg bg-muted/60 hover:bg-muted text-foreground border border-border/60 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="ml-auto text-primary hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>{showAdvanced ? 'Hide Options' : 'Delivery & Issue Options'}</span>
                  {showAdvanced ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Advanced collapsible inputs */}
              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-3 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-3"
                  >
                    <div>
                      <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                        Related GitHub Issue URL (Optional)
                      </label>
                      <input
                        type="url"
                        value={issueUrl}
                        onChange={(e) => setIssueUrl(e.target.value)}
                        placeholder="https://github.com/owner/repo/issues/456"
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs outline-none focus:border-primary font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                        Recipient Email for PDF Briefing
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="engineer@company.com"
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs outline-none focus:border-primary"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </form>
          </div>
        )}
      </div>

      {/* 2. Generating Progress State */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-6 rounded-2xl bg-card border border-border space-y-4 shadow-subtle"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center animate-pulse">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Processing Pull Request</h3>
                  <p className="text-xs text-muted-foreground">{stageLabel}</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-primary">{stageProgress}%</span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${stageProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Stages milestone pills */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
              {stages.map((st, idx) => {
                const stageIndex = stages.findIndex((s) => s.id === currentStage);
                const isPast = stageIndex > idx || currentStage === 'completed';
                const isCurrent = st.id === currentStage;

                return (
                  <div
                    key={st.id}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      isPast
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-medium'
                        : isCurrent
                        ? 'bg-primary/15 border-primary text-primary font-bold shadow-xs'
                        : 'bg-muted/40 border-border/50 text-muted-foreground opacity-50'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-bold tracking-wider mb-0.5">
                      Stage {st.number}
                    </div>
                    <div className="text-[11px] truncate">{st.label}</div>
                  </div>
                );
              })}
            </div>

            {stageDetail && (
              <div className="text-[11px] font-mono text-muted-foreground text-center bg-muted/40 py-1.5 px-3 rounded-lg border border-border/50">
                &gt; {stageDetail}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Generated Report View */}
      {generatedReport && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          {/* Header Summary & Actions Card */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-elevated space-y-5">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      generatedReport.pr.state === 'merged'
                        ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                        : generatedReport.pr.state === 'open'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30'
                    }`}
                  >
                    {generatedReport.pr.state === 'merged' ? (
                      <GitMerge className="w-3 h-3" />
                    ) : generatedReport.pr.state === 'open' ? (
                      <CircleDot className="w-3 h-3" />
                    ) : (
                      <XCircle className="w-3 h-3" />
                    )}
                    <span>{generatedReport.pr.state} PR</span>
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">
                    {generatedReport.pr.org}/{generatedReport.pr.repo}#{generatedReport.pr.number}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    &bull; Authored by @{generatedReport.pr.author}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
                  {generatedReport.pr.title}
                </h2>
                <div className="text-xs text-muted-foreground mt-1.5 flex items-center gap-3">
                  <span className="flex items-center gap-1 font-mono">
                    <strong className="text-emerald-500 font-bold">
                      +{generatedReport.pr.additions}
                    </strong>{' '}
                    /{' '}
                    <strong className="text-rose-500 font-bold">
                      -{generatedReport.pr.deletions}
                    </strong>{' '}
                    lines
                  </span>
                  <span>&bull;</span>
                  <span>{generatedReport.pr.changedFiles} files changed</span>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Ask PR Copilot Button */}
                <button
                  onClick={() => setCopilotOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-subtle transition-all cursor-pointer border border-white/20"
                >
                  <Bot className="w-4 h-4 animate-bounce" />
                  <span>Ask PR Copilot</span>
                </button>

                {/* Slack Button */}
                <button
                  onClick={handleCopySlack}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition-colors"
                  title="Copy formatted Slack announcement"
                >
                  {copiedSlack ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                  )}
                  <span>{copiedSlack ? 'Copied!' : 'Slack'}</span>
                </button>

                {/* Jira Button */}
                <button
                  onClick={handleCopyJira}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition-colors"
                  title="Copy Jira release notes"
                >
                  {copiedJira ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                  <span>{copiedJira ? 'Copied!' : 'Jira'}</span>
                </button>

                {/* PDF Download Button */}
                {generatedReport.pdfUrl && (
                  <a
                    href={generatedReport.pdfUrl}
                    download
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </a>
                )}

                {/* Email Button */}
                <button
                  onClick={() => setEmailModalOpen(true)}
                  className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="Email PDF report"
                >
                  <Mail className="w-4 h-4" />
                </button>

                {/* GitHub Link */}
                <a
                  href={generatedReport.pr.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="View on GitHub"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* AI Risk & Complexity Telemetry Dashboard */}
            {riskMetrics && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                {/* Metric 1: Risk Level */}
                <div className="p-3.5 rounded-xl bg-muted/20 border border-border/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Risk Level
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${riskMetrics.badgeClass}`}>
                      {riskMetrics.level}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-base font-extrabold font-mono text-foreground">
                      {riskMetrics.score} <span className="text-xs text-muted-foreground font-normal">/ 10</span>
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      style={{ width: `${(riskMetrics.score / 10) * 100}%` }}
                      className={`h-full ${riskMetrics.barColor} rounded-full`}
                    />
                  </div>
                </div>

                {/* Metric 2: Review Effort */}
                <div className="p-3.5 rounded-xl bg-muted/20 border border-border/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Review Effort
                    </span>
                    <Clock className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-extrabold font-mono text-foreground">
                      ~{riskMetrics.estMinutes} mins
                    </span>
                    <span className="text-[11px] text-muted-foreground">read</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Estimated maintainer turnaround</p>
                </div>

                {/* Metric 3: Blast Radius */}
                <div className="p-3.5 rounded-xl bg-muted/20 border border-border/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Blast Radius
                    </span>
                    <Layers className="w-3.5 h-3.5 text-indigo-500" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-extrabold text-foreground truncate">
                      {riskMetrics.blastRadius}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    {generatedReport.pr.changedFiles} files affected
                  </p>
                </div>

                {/* Metric 4: Breaking Changes & Deep Dive */}
                <div className="p-3.5 rounded-xl bg-muted/20 border border-border/80 space-y-1.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Deployment Safety
                    </span>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <div className="text-xs font-semibold">
                    {riskMetrics.isBreaking ? (
                      <span className="text-rose-500">⚠️ Breaking Changes</span>
                    ) : (
                      <span className="text-emerald-500">✅ Zero Breaking Changes</span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setCopilotOpen(true);
                      handleAskCopilot('What are the security, performance and regression risks?');
                    }}
                    className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-1"
                  >
                    <span>Copilot Deep Dive</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Email dispatch notice if delivered */}
            {generatedReport.emailDelivery?.sent && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <CheckCheck className="w-4 h-4 shrink-0" />
                <span>
                  Delivered PDF report to <strong>{generatedReport.emailDelivery.recipient}</strong>
                </span>
              </div>
            )}

            {/* Content Tabs Navigation */}
            <div className="flex items-center gap-1 border-b border-border pt-2 overflow-x-auto text-xs">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'overview'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Executive Summary</span>
              </button>
              <button
                onClick={() => setActiveTab('diffs')}
                className={`px-4 py-2 font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'diffs'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Code2 className="w-3.5 h-3.5 text-indigo-500" />
                <span>
                  Visual Diffs (
                  {generatedReport.report.technicalImplementation.keyFilesChanged.length})
                </span>
              </button>
              <button
                onClick={() => setActiveTab('meeting')}
                className={`px-4 py-2 font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'meeting'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                <span>Standup Script & Q&A</span>
              </button>
              <button
                onClick={() => setActiveTab('technical')}
                className={`px-4 py-2 font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'technical'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Architecture & Decisions</span>
              </button>
              <button
                onClick={() => setActiveTab('validation')}
                className={`px-4 py-2 font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'validation'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Testing & QA</span>
              </button>
            </div>
          </div>

          {/* TAB 1: EXECUTIVE BRIEFING */}
          {activeTab === 'overview' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-6 rounded-2xl bg-card border border-border space-y-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" /> Executive Summary
                </h3>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {generatedReport.report.executiveSummary}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-card border border-border space-y-2">
                  <h4 className="text-xs font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> Problem & Root Cause
                  </h4>
                  <p className="text-xs text-foreground/90 leading-relaxed">
                    {generatedReport.report.problemStatement}
                  </p>
                  <p className="text-xs text-muted-foreground pt-1 border-t border-border/50">
                    <strong>Root Cause:</strong> {generatedReport.report.rootCause}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-card border border-border space-y-2">
                  <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Production Impact & Constraints
                  </h4>
                  <p className="text-xs text-foreground/90 leading-relaxed">
                    {generatedReport.report.impactLimitations.impact}
                  </p>
                  <div className="text-xs text-muted-foreground pt-1 border-t border-border/50">
                    <strong>Performance:</strong>{' '}
                    {generatedReport.report.impactLimitations.performanceConsiderations}
                  </div>
                </div>
              </div>

              {/* Before and After Behavior Matrix */}
              {generatedReport.report.technicalImplementation.beforeAfterBehavior?.length > 0 && (
                <div className="p-6 rounded-2xl bg-card border border-border space-y-3">
                  <h3 className="text-sm font-bold text-foreground">Before & After Behavior Matrix</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {generatedReport.report.technicalImplementation.beforeAfterBehavior.map(
                      (item, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-muted/20 border border-border space-y-1.5 text-xs"
                        >
                          <div className="text-rose-500 font-semibold flex items-center gap-1.5">
                            <span>Before:</span>
                            <span className="text-muted-foreground font-normal">{item.before}</span>
                          </div>
                          <div className="text-emerald-500 font-semibold flex items-center gap-1.5">
                            <span>After:</span>
                            <span className="text-foreground font-normal">{item.after}</span>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: VISUAL CODE DIFF VIEWER */}
          {activeTab === 'diffs' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-indigo-500" /> Interactive Visual Diff Viewer
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Color-coded additions, deletions, affected symbols, and rationale
                    </p>
                  </div>

                  {/* Search filter for files */}
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={diffSearchQuery}
                      onChange={(e) => {
                        setDiffSearchQuery(e.target.value);
                        setSelectedDiffIndex(0);
                      }}
                      placeholder="Filter changed files..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-border bg-background text-foreground text-xs outline-none focus:border-primary font-mono"
                    />
                  </div>
                </div>

                {/* File Navigator Bar */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-border/80">
                  {filteredFiles.map((file, idx) => {
                    const isSelected =
                      idx === selectedDiffIndex || activeDiffFile?.path === file.path;
                    return (
                      <button
                        key={file.path}
                        onClick={() => setSelectedDiffIndex(idx)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-2 shrink-0 border ${
                          isSelected
                            ? 'bg-primary/10 border-primary text-primary font-bold shadow-2xs'
                            : 'bg-muted/30 border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/70'
                        }`}
                      >
                        <FileCode className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[180px]">{file.path}</span>
                        <div className="flex items-center gap-1 text-[10px]">
                          <span className="text-emerald-500 font-bold">+{file.additions}</span>
                          <span className="text-rose-500 font-bold">-{file.deletions}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Active File Diff View */}
                {activeDiffFile ? (
                  <div className="space-y-3">
                    {/* File Header */}
                    <div className="p-4 rounded-xl bg-muted/20 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-foreground">
                            {activeDiffFile.path}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(activeDiffFile.path);
                              showToast('File path copied!', 'info');
                            }}
                            className="text-muted-foreground hover:text-foreground p-1 transition-colors"
                            title="Copy path"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {activeDiffFile.description}
                        </p>
                      </div>

                      {/* Affected Functions Pills */}
                      {activeDiffFile.functionsAffected?.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          {activeDiffFile.functionsAffected.map((fn, fIdx) => (
                            <span
                              key={fIdx}
                              className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 text-[10px] font-mono font-semibold"
                            >
                              {fn}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Diff lines view */}
                    <div className="rounded-xl border border-border/80 bg-[#080b11] text-slate-100 overflow-hidden font-mono text-xs shadow-2xs">
                      {activeDiffFile.diffSnippet ? (
                        <div className="divide-y divide-white/5 overflow-x-auto max-h-[500px]">
                          {activeDiffFile.diffSnippet.split('\n').map((line, lIdx) => {
                            const isAdded = line.startsWith('+') && !line.startsWith('+++');
                            const isRemoved = line.startsWith('-') && !line.startsWith('---');
                            const isHunk = line.startsWith('@@');

                            return (
                              <div
                                key={lIdx}
                                className={`flex items-start text-[11px] leading-5 transition-colors ${
                                  isAdded
                                    ? 'bg-emerald-950/30 text-emerald-300 border-l-2 border-emerald-500'
                                    : isRemoved
                                    ? 'bg-rose-950/30 text-rose-300 border-l-2 border-rose-500'
                                    : isHunk
                                    ? 'bg-indigo-950/30 text-indigo-300 font-bold border-l-2 border-indigo-500 py-1'
                                    : 'text-slate-300 hover:bg-white/[0.02]'
                                }`}
                              >
                                <span className="w-10 px-2 select-none text-slate-600 text-[10px] text-right shrink-0 border-r border-white/5 tabular-nums">
                                  {lIdx + 1}
                                </span>
                                <span className="px-3 whitespace-pre">{line}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-8 text-center space-y-2 text-slate-400">
                          <Code2 className="w-8 h-8 mx-auto text-slate-600" />
                          <p className="text-xs">
                            No raw diff snippet captured for this file ({activeDiffFile.path}).
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            +{activeDiffFile.additions} lines added, -{activeDiffFile.deletions} lines
                            deleted.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    No files match your search filter.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: STANDUP & MEETING PREPARATION */}
          {activeTab === 'meeting' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Highlighted 2-Minute Standup Elevator Pitch */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/30 space-y-3 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-indigo-500 text-white flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">
                        2-Minute Standup Presentation Script
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        Word-for-word elevator pitch for engineering syncs
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      handleCopyScript(generatedReport.report.meetingPreparation.twoMinuteScript)
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold shadow-xs hover:bg-primary/90 transition-colors"
                  >
                    {copiedScript ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedScript ? 'Copied!' : 'Copy Script'}</span>
                  </button>
                </div>
                <div className="p-4 rounded-xl bg-card border border-indigo-500/20 text-xs sm:text-sm text-foreground/95 leading-relaxed font-sans">
                  "{generatedReport.report.meetingPreparation.twoMinuteScript}"
                </div>
              </div>

              {/* Explanations for Stakeholders vs Architects */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-card border border-border space-y-2">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-primary" /> Plain English Explanation
                    (Product & Stakeholders)
                  </h4>
                  <p className="text-xs text-foreground/90 leading-relaxed">
                    {generatedReport.report.meetingPreparation.simpleExplanation}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-card border border-border space-y-2">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-purple-500" /> Deep Technical Architecture (Tech
                    Leads & Staff)
                  </h4>
                  <p className="text-xs text-foreground/90 leading-relaxed">
                    {generatedReport.report.meetingPreparation.deepTechnicalExplanation}
                  </p>
                </div>
              </div>

              {/* Maintainer Q&A */}
              {generatedReport.report.meetingPreparation.likelyQuestions?.length > 0 && (
                <div className="p-6 rounded-2xl bg-card border border-border space-y-3">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-primary" /> Anticipated Questions & Answers
                  </h3>
                  <div className="space-y-3">
                    {generatedReport.report.meetingPreparation.likelyQuestions.map((qa, i) => (
                      <div key={i} className="p-4 rounded-xl bg-muted/20 border border-border/80 space-y-1.5">
                        <div className="text-xs font-bold text-foreground flex items-start gap-2">
                          <span className="text-primary font-mono font-bold">Q:</span>
                          <span>{qa.question}</span>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-start gap-2 pl-3 border-l-2 border-primary/30">
                          <span className="font-semibold text-foreground">Suggested Answer:</span>
                          <span>{qa.suggestedAnswer || (qa as any).recommendedAnswer}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ARCHITECTURE & DECISIONS */}
          {activeTab === 'technical' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-6 rounded-2xl bg-card border border-border space-y-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" /> Technical Architecture & Implementation
                </h3>
                <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                  {generatedReport.report.technicalImplementation.overview}
                </p>
              </div>

              {/* Design Decisions */}
              {generatedReport.report.technicalImplementation.designDecisions?.length > 0 && (
                <div className="p-6 rounded-2xl bg-card border border-border space-y-3">
                  <h3 className="text-sm font-bold text-foreground">Architectural Design Decisions</h3>
                  <div className="space-y-3">
                    {generatedReport.report.technicalImplementation.designDecisions.map(
                      (decision, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl bg-muted/20 border border-border/80 space-y-1.5"
                        >
                          <h4 className="text-xs font-bold text-foreground">{decision.title}</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            <strong>Rationale:</strong> {decision.rationale}
                          </p>
                          {decision.alternativesConsidered && (
                            <p className="text-xs text-muted-foreground/80 leading-relaxed">
                              <strong>Alternatives Evaluated:</strong>{' '}
                              {decision.alternativesConsidered}
                            </p>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: TESTING & VALIDATION */}
          {activeTab === 'validation' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> Test Strategy & Coverage
                </h3>
                <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                  {generatedReport.report.testingValidation.testStrategy}
                </p>

                {generatedReport.report.testingValidation.automatedTestsAdded?.length > 0 && (
                  <div className="pt-3 border-t border-border space-y-2">
                    <h4 className="text-xs font-bold text-foreground">Automated Tests Added</h4>
                    <ul className="space-y-1.5">
                      {generatedReport.report.testingValidation.automatedTestsAdded.map((test, idx) => (
                        <li key={idx} className="text-xs text-muted-foreground flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{test}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* 4. Interactive PR Copilot Drawer */}
      <AnimatePresence>
        {copilotOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="w-full max-w-xl h-full bg-card/95 backdrop-blur-xl border-l border-border shadow-2xl flex flex-col"
            >
              {/* Drawer Header */}
              <div className="p-4 sm:p-5 border-b border-border/80 flex items-center justify-between bg-muted/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-xs border border-white/20">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-foreground">PR Copilot</h3>
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold border border-primary/20">
                        Interactive
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate max-w-[260px] sm:max-w-xs font-mono">
                      {generatedReport?.pr.title || 'Pull Request Assistant'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      if (generatedReport) {
                        setCopilotMessages([
                          {
                            id: 'reset',
                            role: 'assistant',
                            text: `Conversation cleared. What else would you like to know about **${generatedReport.pr.title}**?`,
                            timestamp: new Date().toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            }),
                          },
                        ]);
                      }
                    }}
                    className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground text-xs transition-colors"
                    title="Clear history"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setCopilotOpen(false)}
                    className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chat Message List */}
              <div
                ref={chatScrollRef}
                className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-background/40"
              >
                {copilotMessages.map((msg) => (
                  <CopilotMessageBubble key={msg.id} message={msg} />
                ))}

                {copilotLoading && (
                  <div className="flex items-start gap-2.5 max-w-[85%]">
                    <div className="w-7 h-7 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center justify-center text-xs shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="p-3.5 rounded-2xl bg-card border border-border text-foreground rounded-tl-none text-xs flex items-center gap-2 shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                      <span className="text-muted-foreground font-mono">
                        PR Copilot is thinking...
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Prompt Chips */}
              <div className="px-4 py-2.5 border-t border-border/80 bg-muted/20 flex items-center gap-1.5 overflow-x-auto text-[11px]">
                <span className="text-muted-foreground font-medium shrink-0">Quick:</span>
                <button
                  onClick={() =>
                    handleAskCopilot('What are the security, performance and regression risks?')
                  }
                  disabled={copilotLoading}
                  className="px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-all shrink-0 disabled:opacity-50 hover:border-primary/40"
                >
                  🛡️ Security & Risk
                </button>
                <button
                  onClick={() =>
                    handleAskCopilot(
                      'Draft a concise, high-impact Slack announcement for my engineering team.'
                    )
                  }
                  disabled={copilotLoading}
                  className="px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-all shrink-0 disabled:opacity-50 hover:border-primary/40"
                >
                  💬 Slack Update
                </button>
                <button
                  onClick={() =>
                    handleAskCopilot('Provide local test steps and QA verification checklist.')
                  }
                  disabled={copilotLoading}
                  className="px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-all shrink-0 disabled:opacity-50 hover:border-primary/40"
                >
                  🧪 Test Steps
                </button>
                <button
                  onClick={() =>
                    handleAskCopilot('Draft a Jira ticket / release notes description.')
                  }
                  disabled={copilotLoading}
                  className="px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-all shrink-0 disabled:opacity-50 hover:border-primary/40"
                >
                  📋 Jira Notes
                </button>
              </div>

              {/* Chat Input Bar */}
              <div className="p-4 border-t border-border bg-card">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAskCopilot(copilotQuery);
                  }}
                  className="flex items-center gap-2"
                >
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={copilotQuery}
                      onChange={(e) => setCopilotQuery(e.target.value)}
                      placeholder="Ask anything about this PR (e.g. 'Does this impact auth?')..."
                      disabled={copilotLoading}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-sans pr-12"
                    />
                    <kbd className="hidden sm:inline-block absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-muted text-[10px] text-muted-foreground border border-border/60 pointer-events-none font-mono">
                      ↵
                    </kbd>
                  </div>
                  <button
                    type="submit"
                    disabled={copilotLoading || !copilotQuery.trim()}
                    className="p-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white disabled:opacity-50 transition-colors shrink-0 shadow-xs"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. Email Delivery Modal */}
      {emailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" /> Send Technical Briefing via Brevo SMTP
            </h3>
            <p className="text-xs text-muted-foreground">
              We will generate and dispatch the full PDF technical briefing report directly to this
              inbox.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="recipient@company.com"
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs outline-none focus:border-primary"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setEmailModalOpen(false)}
                className="px-3 py-1.5 rounded-xl border border-border hover:bg-muted text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmailNow}
                disabled={sendingEmail || !email}
                className="px-4 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5"
              >
                {sendingEmail ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3" />
                    <span>Send PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
