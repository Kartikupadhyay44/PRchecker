import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AnalyzePRPage: React.FC = () => {
  const { prefillAnalyzePR, setPrefillAnalyzePR, settings, showToast } = useApp();

  const [prUrl, setPrUrl] = useState('');
  const [issueUrl, setIssueUrl] = useState('');
  const [email, setEmail] = useState('');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [currentStage, setCurrentStage] = useState<GenerationStage | 'idle'>('idle');
  const [stageProgress, setStageProgress] = useState<number>(0);
  const [stageLabel, setStageLabel] = useState<string>('');
  const [stageDetail, setStageDetail] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Result state
  const [generatedReport, setGeneratedReport] = useState<ReportDocument | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'technical' | 'validation' | 'meeting'>('overview');
  const [copiedScript, setCopiedScript] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Handle pre-fill from Contributions or Overview pages
  useEffect(() => {
    if (prefillAnalyzePR) {
      setPrUrl(prefillAnalyzePR.prUrl);
      if (prefillAnalyzePR.issueUrl) {
        setIssueUrl(prefillAnalyzePR.issueUrl);
      }
      setPrefillAnalyzePR(null);
    }
  }, [prefillAnalyzePR, setPrefillAnalyzePR]);

  // Sync preferred email from settings
  useEffect(() => {
    if (settings.preferredEmail && !email) {
      setEmail(settings.preferredEmail);
    }
  }, [settings.preferredEmail, email]);

  // 6 Stages definitions for progress timeline
  const stages: Array<{ id: GenerationStage; label: string; number: number }> = [
    { id: 'fetching_github', label: 'Fetching GitHub data', number: 1 },
    { id: 'reading_code', label: 'Reading code changes', number: 2 },
    { id: 'analyzing_implementation', label: 'Analyzing implementation', number: 3 },
    { id: 'preparing_documentation', label: 'Preparing documentation', number: 4 },
    { id: 'generating_pdf', label: 'Generating PDF', number: 5 },
    { id: 'sending_email', label: 'Sending email', number: 6 },
  ];

  // Helper to load sample PR
  const handleLoadSample = () => {
    setPrUrl('https://github.com/shadcn-ui/ui/pull/12360');
    setIssueUrl('https://github.com/shadcn-ui/ui/issues/12300');
  };

  // Start Generation
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prUrl.trim()) {
      setErrorMsg('Please enter a valid GitHub Pull Request URL');
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);
    setGeneratedReport(null);
    setCurrentStage('fetching_github');
    setStageProgress(10);
    setStageLabel('Connecting to GitHub API...');

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
        // Fallback to polling
        pollFinalResult(newJobId);
      };
    } catch (err: any) {
      setIsGenerating(false);
      setErrorMsg(err.message || 'Failed to initiate report generation');
    }
  };

  // Poll for final result once generation is marked completed
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

          // Trigger delight confetti
          confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.6 },
          });

          showToast('Technical report successfully generated!', 'success');
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
    }, 1500);
  };

  const handleCopyScript = (scriptText: string) => {
    navigator.clipboard.writeText(scriptText);
    setCopiedScript(true);
    showToast('Meeting script copied to clipboard', 'info');
    setTimeout(() => setCopiedScript(false), 2000);
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

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* 1. Header Section */}
      <div className="text-center space-y-2 pt-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" /> AI Technical Documentation Engine
        </div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight sm:text-4xl">
          Turn your code into clarity.
        </h1>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          Generate comprehensive, source-grounded technical intelligence reports, standup presentation scripts, and executive PDFs directly from your GitHub PRs.
        </p>
      </div>

      {/* 2. Focused Input Card */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-subtle">
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* PR URL Input (Required) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>GitHub Pull Request URL <span className="text-rose-500">*</span></span>
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="text-[11px] text-primary hover:underline font-normal"
                >
                  Load sample PR
                </button>
              </label>
              <div className="relative">
                <GitPullRequest className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  required
                  placeholder="https://github.com/owner/repo/pull/123"
                  value={prUrl}
                  onChange={(e) => setPrUrl(e.target.value)}
                  disabled={isGenerating}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-xs outline-none focus:border-primary disabled:opacity-50 transition-colors font-mono"
                />
              </div>
            </div>

            {/* Issue URL Input (Optional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>GitHub Issue URL <span className="text-muted-foreground font-normal">(Optional)</span></span>
                <span className="text-[11px] text-muted-foreground">For root-cause grounding</span>
              </label>
              <div className="relative">
                <AlertCircle className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  placeholder="https://github.com/owner/repo/issues/120"
                  value={issueUrl}
                  onChange={(e) => setIssueUrl(e.target.value)}
                  disabled={isGenerating}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-xs outline-none focus:border-primary disabled:opacity-50 transition-colors font-mono"
                />
              </div>
            </div>
          </div>

          {/* Email Address Input (Optional) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Delivery Email Address <span className="text-muted-foreground font-normal">(Optional)</span></span>
              <span className="text-[11px] text-muted-foreground">Receive generated PDF report via email</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                placeholder="developer@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isGenerating}
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-xs outline-none focus:border-primary disabled:opacity-50 transition-colors"
              />
            </div>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Primary CTA */}
          <button
            type="submit"
            disabled={isGenerating}
            className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-sm shadow-md hover:shadow-lg disabled:opacity-60 transition-all flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Generating Intelligence Report...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Report</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* 3. Progress Interface (Active during processing) */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-6 rounded-2xl bg-card border border-border space-y-6 shadow-subtle"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary animate-pulse" /> Processing Pull Request
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">{stageLabel || 'Initializing pipeline...'}</p>
              </div>
              <span className="text-xs font-mono font-bold text-primary">{stageProgress}%</span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${stageProgress}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>

            {/* 6 Stage Nodes */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {stages.map((st, idx) => {
                const stageIndex = stages.findIndex((s) => s.id === currentStage);
                const isPast = stageIndex > idx || currentStage === 'completed';
                const isCurrent = st.id === currentStage;

                return (
                  <div
                    key={st.id}
                    className={`p-2.5 rounded-lg border text-center transition-all ${
                      isPast
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                        : isCurrent
                        ? 'bg-indigo-500/15 border-indigo-500 text-indigo-600 dark:text-indigo-300 font-semibold shadow-xs'
                        : 'bg-muted/30 border-border/60 text-muted-foreground opacity-60'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-bold tracking-wider mb-1">
                      Stage {st.number}
                    </div>
                    <div className="text-xs leading-snug line-clamp-2">
                      {st.label}
                    </div>
                  </div>
                );
              })}
            </div>

            {stageDetail && (
              <div className="text-xs font-mono text-muted-foreground text-center bg-muted/30 py-2 rounded-lg border border-border/50">
                &gt; {stageDetail}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Generated Report Preview */}
      {generatedReport && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Action Bar & Summary Card */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-elevated space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      generatedReport.pr.state === 'merged'
                        ? 'bg-pr-merged-subtle text-pr-merged border border-pr-merged-border'
                        : 'bg-pr-open-subtle text-pr-open border border-pr-open-border'
                    }`}
                  >
                    {generatedReport.pr.state} PR
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {generatedReport.pr.org}/{generatedReport.pr.repo}#{generatedReport.pr.number}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    &bull; Authored by @{generatedReport.pr.author}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-foreground tracking-tight">
                  {generatedReport.pr.title}
                </h2>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                  <span>
                    <strong className="text-emerald-500">+{generatedReport.pr.additions}</strong> /{' '}
                    <strong className="text-rose-500">-{generatedReport.pr.deletions}</strong> lines
                  </span>
                  <span>&bull;</span>
                  <span>{generatedReport.pr.changedFiles} files affected</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {generatedReport.pdfUrl && (
                  <a
                    href={generatedReport.pdfUrl}
                    download
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </a>
                )}
                <button
                  onClick={() => setEmailModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border hover:bg-muted text-foreground text-xs font-semibold transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email Report</span>
                </button>
                <a
                  href={generatedReport.pr.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="View on GitHub"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Email dispatch notice if delivered */}
            {generatedReport.emailDelivery?.sent && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Delivered PDF report to <strong>{generatedReport.emailDelivery.recipient}</strong>
                </span>
              </div>
            )}

            {/* Report Navigation Tabs */}
            <div className="flex items-center gap-1 border-b border-border pt-2 overflow-x-auto text-xs">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 font-semibold border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Executive Summary & Problem
              </button>
              <button
                onClick={() => setActiveTab('technical')}
                className={`px-4 py-2 font-semibold border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'technical'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Technical Implementation ({generatedReport.report.technicalImplementation.keyFilesChanged.length} files)
              </button>
              <button
                onClick={() => setActiveTab('validation')}
                className={`px-4 py-2 font-semibold border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'validation'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Testing & Reviews
              </button>
              <button
                onClick={() => setActiveTab('meeting')}
                className={`px-4 py-2 font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'meeting'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Sparkles className="w-3 h-3 text-indigo-500" />
                Meeting Preparation
              </button>
            </div>

            {/* Tab 1: Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-6 pt-2">
                {/* Executive Summary */}
                <div className="p-4 rounded-xl bg-muted/40 border border-border/70 space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-primary">
                    Executive Summary
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">
                    {generatedReport.report.executiveSummary}
                  </p>
                </div>

                {/* Problem & Root Cause Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-rose-500 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" /> Problem Statement
                    </h4>
                    <p className="text-xs text-foreground/90 leading-relaxed">
                      {generatedReport.report.problemStatement}
                    </p>
                    {generatedReport.issue && (
                      <div className="text-[11px] text-muted-foreground pt-1 border-t border-border">
                        Linked Issue #{generatedReport.issue.number}: {generatedReport.issue.title}
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" /> Root Cause Analysis
                    </h4>
                    <p className="text-xs text-foreground/90 leading-relaxed">
                      {generatedReport.report.rootCause}
                    </p>
                  </div>
                </div>

                {/* Impact & Limitations */}
                <div className="p-4 rounded-xl bg-card border border-border space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Production Impact & System Constraints
                  </h4>
                  <p className="text-xs text-foreground leading-relaxed">
                    {generatedReport.report.impactLimitations.impact}
                  </p>
                  <div className="space-y-1">
                    <div className="text-[11px] font-semibold text-muted-foreground">Operating Limitations:</div>
                    <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5">
                      {generatedReport.report.impactLimitations.limitations.map((lim, i) => (
                        <li key={i}>{lim}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                    <strong>Performance Considerations:</strong>{' '}
                    {generatedReport.report.impactLimitations.performanceConsiderations}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Technical Implementation */}
            {activeTab === 'technical' && (
              <div className="space-y-6 pt-2">
                <div className="p-4 rounded-xl bg-muted/40 border border-border/70 space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-primary">
                    Architectural Overview
                  </div>
                  <p className="text-xs text-foreground leading-relaxed">
                    {generatedReport.report.technicalImplementation.overview}
                  </p>
                </div>

                {/* Key Files Changed */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    File-by-File Breakdown
                  </h4>
                  <div className="space-y-2">
                    {generatedReport.report.technicalImplementation.keyFilesChanged.map((f, i) => (
                      <div key={i} className="p-3.5 rounded-xl border border-border bg-card space-y-2">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="font-semibold text-foreground">{f.path}</span>
                          <span className="text-[11px]">
                            <span className="text-emerald-500 font-bold">+{f.additions}</span> /{' '}
                            <span className="text-rose-500 font-bold">-{f.deletions}</span>
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{f.description}</p>
                        {f.functionsAffected.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                            <span className="text-muted-foreground">Functions:</span>
                            {f.functionsAffected.map((fn, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.2 rounded bg-muted text-foreground font-mono"
                              >
                                {fn}()
                              </span>
                            ))}
                          </div>
                        )}
                        {f.diffSnippet && (
                          <pre className="p-2.5 rounded-lg bg-neutral-900 text-neutral-100 text-[11px] font-mono overflow-x-auto leading-relaxed border border-neutral-800">
                            {f.diffSnippet}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Before vs After Behavior */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Before & After Behavior
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {generatedReport.report.technicalImplementation.beforeAfterBehavior.map((b, i) => (
                      <div key={i} className="p-3.5 rounded-xl border border-border bg-card space-y-2">
                        <div className="text-xs font-bold text-foreground">{b.area}</div>
                        <div className="text-xs text-rose-500/90 bg-rose-500/5 p-2 rounded-md border border-rose-500/10">
                          <strong>Before:</strong> {b.before}
                        </div>
                        <div className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 p-2 rounded-md border border-emerald-500/10">
                          <strong>After:</strong> {b.after}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Design Decisions */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Design Decisions & Alternatives Considered
                  </h4>
                  <div className="space-y-2">
                    {generatedReport.report.technicalImplementation.designDecisions.map((d, i) => (
                      <div key={i} className="p-3.5 rounded-xl border border-border bg-card space-y-1.5">
                        <div className="text-xs font-bold text-foreground">{d.title}</div>
                        <p className="text-xs text-foreground/90">
                          <strong>Rationale:</strong> {d.rationale}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          <strong>Alternatives evaluated:</strong> {d.alternativesConsidered}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Testing & Reviews */}
            {activeTab === 'validation' && (
              <div className="space-y-6 pt-2">
                <div className="p-4 rounded-xl bg-card border border-border space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Testing & Validation Strategy
                  </h4>
                  <p className="text-xs text-foreground leading-relaxed">
                    {generatedReport.report.testingValidation.testStrategy}
                  </p>
                  <div>
                    <div className="text-[11px] font-semibold text-muted-foreground mb-1">
                      Automated Tests:
                    </div>
                    <ul className="list-disc list-inside text-xs text-foreground/90 space-y-0.5">
                      {generatedReport.report.testingValidation.automatedTestsAdded.map((t, idx) => (
                        <li key={idx}>{t}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground">
                    <strong>CI Matrix Status:</strong> {generatedReport.report.testingValidation.ciResults}
                  </div>
                </div>

                {/* Reviewer Feedback */}
                <div className="p-4 rounded-xl bg-card border border-border space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Reviewer Feedback & Discussion
                  </h4>
                  <p className="text-xs text-foreground">
                    {generatedReport.report.reviewerFeedback.summary}
                  </p>
                  <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5">
                    {generatedReport.report.reviewerFeedback.keyDiscussions.map((d, idx) => (
                      <li key={idx}>{d}</li>
                    ))}
                  </ul>
                  <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                    <strong>Revisions:</strong> {generatedReport.report.reviewerFeedback.revisionsMade}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Meeting Preparation */}
            {activeTab === 'meeting' && (
              <div className="space-y-6 pt-2">
                {/* 2-minute spoken script */}
                <div className="p-5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      <Clock className="w-4 h-4" /> 2-Minute Presentation Script
                    </div>
                    <button
                      onClick={() => handleCopyScript(generatedReport.report.meetingPreparation.twoMinuteScript)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-card border border-border hover:bg-muted text-foreground text-xs font-semibold transition-colors"
                    >
                      {copiedScript ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedScript ? 'Copied!' : 'Copy Script'}</span>
                    </button>
                  </div>
                  <div className="p-4 rounded-lg bg-card border border-border/80 text-xs text-foreground italic leading-relaxed">
                    &ldquo;{generatedReport.report.meetingPreparation.twoMinuteScript}&rdquo;
                  </div>
                </div>

                {/* Simple vs Deep Technical Explanation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Simple Explanation (For Product / Stakeholders)
                    </h4>
                    <p className="text-xs text-foreground leading-relaxed">
                      {generatedReport.report.meetingPreparation.simpleExplanation}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Deep Technical Explanation (For Staff / Architects)
                    </h4>
                    <p className="text-xs text-foreground leading-relaxed">
                      {generatedReport.report.meetingPreparation.deepTechnicalExplanation}
                    </p>
                  </div>
                </div>

                {/* Likely Maintainer Questions & Recommended Answers */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-primary" /> Likely Maintainer Questions & Answers
                  </h4>
                  <div className="space-y-2">
                    {generatedReport.report.meetingPreparation.likelyQuestions.map((qa, i) => (
                      <div key={i} className="p-3.5 rounded-xl border border-border bg-card space-y-1.5">
                        <div className="text-xs font-bold text-foreground flex items-start gap-2">
                          <span className="text-primary font-mono">Q:</span>
                          <span>{qa.question}</span>
                        </div>
                        <div className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-500/5 p-2.5 rounded-lg border border-emerald-500/10 flex items-start gap-2">
                          <span className="font-bold font-mono">A:</span>
                          <span>{qa.suggestedAnswer}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground italic">
                          Context: {qa.context}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Important Code to Demonstrate */}
                {generatedReport.report.meetingPreparation.importantCodeSnippets?.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-primary" /> Key Code Snippets to Showcase
                    </h4>
                    <div className="space-y-3">
                      {generatedReport.report.meetingPreparation.importantCodeSnippets.map((cs, i) => (
                        <div key={i} className="p-3.5 rounded-xl border border-border bg-card space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono font-semibold text-foreground">{cs.filename}</span>
                            <span className="text-[11px] text-muted-foreground">{cs.lines}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{cs.explanation}</p>
                          <pre className="p-2.5 rounded-lg bg-neutral-900 text-neutral-100 text-[11px] font-mono overflow-x-auto leading-relaxed border border-neutral-800">
                            {cs.code}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Email Delivery Modal */}
      {emailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setEmailModalOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-md p-6 rounded-2xl bg-card border border-border shadow-2xl z-10 space-y-4">
            <h3 className="text-base font-bold text-foreground">Email Intelligence Report</h3>
            <p className="text-xs text-muted-foreground">
              Send the full technical report and executive PDF to an email address.
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Recipient Email</label>
              <input
                type="email"
                placeholder="colleague@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs outline-none focus:border-primary"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setEmailModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-xs font-medium text-foreground"
              >
                Cancel
              </button>
              <button
                disabled={sendingEmail}
                onClick={handleSendEmailNow}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sendingEmail ? 'Sending...' : 'Send Report'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
