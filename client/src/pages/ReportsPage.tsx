import React, { useState, useEffect, useMemo } from 'react';
import { ReportDocument } from '../types';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import {
  FileText,
  Search,
  Download,
  ExternalLink,
  RotateCcw,
  Clock,
  Sparkles,
  Calendar,
  Eye,
  X,
  Copy,
  Check,
  CheckCircle2,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { setActivePage, setPrefillAnalyzePR, showToast } = useApp();
  const [reports, setReports] = useState<ReportDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<ReportDocument | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await api.getAllReports();
      setReports(data);
    } catch (err: any) {
      console.warn('Could not fetch reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const s = search.toLowerCase();
      const matchesSearch =
        r.pr.title.toLowerCase().includes(s) ||
        r.pr.repo.toLowerCase().includes(s) ||
        r.pr.org.toLowerCase().includes(s) ||
        String(r.pr.number).includes(s);

      if (!matchesSearch) return false;
      if (statusFilter !== 'all' && r.pr.state !== statusFilter) return false;
      return true;
    });
  }, [reports, search, statusFilter]);

  const handleRegenerate = (r: ReportDocument) => {
    setPrefillAnalyzePR({
      prUrl: r.pr.url,
      issueUrl: r.issue?.url,
    });
    setActivePage('analyze');
  };

  const handleCopyScript = (script: string) => {
    navigator.clipboard.writeText(script);
    setCopiedScript(true);
    showToast('Meeting script copied', 'info');
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar Filters */}
      <div className="p-4 rounded-xl bg-card border border-border flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search reports by title, repo, or #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex items-center rounded-lg border border-border bg-muted/30 p-1 text-xs">
            {['all', 'merged', 'open'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-md font-medium capitalize transition-all ${
                  statusFilter === st
                    ? 'bg-card text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <button
            onClick={() => setActivePage('analyze')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>New Report</span>
          </button>
        </div>
      </div>

      {/* Reports Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-56 rounded-xl bg-card border border-border" />
          ))}
        </div>
      ) : filteredReports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map((r) => {
            const statusColors = {
              merged: 'bg-pr-merged-subtle text-pr-merged border-pr-merged-border',
              open: 'bg-pr-open-subtle text-pr-open border-pr-open-border',
              closed: 'bg-pr-closed-subtle text-pr-closed border-pr-closed-border',
            }[r.pr.state];

            return (
              <div
                key={r.id}
                className="p-5 rounded-xl bg-card border border-border hover:border-border/80 hover:shadow-subtle transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusColors}`}
                    >
                      {r.pr.state}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <div className="text-xs font-mono text-muted-foreground truncate">
                      {r.pr.org}/{r.pr.repo}#{r.pr.number}
                    </div>
                    <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 mt-1">
                      {r.pr.title}
                    </h3>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                    {r.report.executiveSummary}
                  </p>
                </div>

                {/* Footer Actions */}
                <div className="pt-4 mt-3 border-t border-border flex items-center justify-between">
                  <button
                    onClick={() => setSelectedReport(r)}
                    className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Briefing</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {r.pdfUrl && (
                      <a
                        href={r.pdfUrl}
                        download
                        title="Download PDF"
                        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => handleRegenerate(r)}
                      title="Regenerate Report"
                      className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={r.pr.url}
                      target="_blank"
                      rel="noreferrer"
                      title="View on GitHub"
                      className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center rounded-xl bg-card border border-border space-y-3">
          <FileText className="w-10 h-10 mx-auto text-muted-foreground/40" />
          <h3 className="text-sm font-semibold text-foreground">No reports generated yet</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Analyze any GitHub Pull Request to generate your first technical intelligence report and meeting preparation script.
          </p>
          <button
            onClick={() => setActivePage('analyze')}
            className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow-xs"
          >
            Analyze First PR
          </button>
        </div>
      )}

      {/* Full Document Reader Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div
            onClick={() => setSelectedReport(null)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-3xl max-h-[90vh] bg-card border border-border rounded-2xl shadow-2xl z-10 flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div>
                <div className="text-xs font-mono text-muted-foreground">
                  {selectedReport.pr.org}/{selectedReport.pr.repo}#{selectedReport.pr.number}
                </div>
                <h2 className="text-base font-bold text-foreground truncate max-w-md">
                  {selectedReport.pr.title}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                {selectedReport.pdfUrl && (
                  <a
                    href={selectedReport.pdfUrl}
                    download
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </a>
                )}
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Meeting Speech Box */}
              <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> 2-Minute Spoken Briefing
                  </span>
                  <button
                    onClick={() => handleCopyScript(selectedReport.report.meetingPreparation.twoMinuteScript)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-card border border-border text-foreground text-[11px]"
                  >
                    {copiedScript ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedScript ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="italic text-foreground leading-relaxed">
                  &ldquo;{selectedReport.report.meetingPreparation.twoMinuteScript}&rdquo;
                </p>
              </div>

              {/* Executive Summary */}
              <div className="space-y-1.5">
                <h4 className="font-bold uppercase tracking-wider text-muted-foreground">
                  Executive Summary
                </h4>
                <p className="text-foreground leading-relaxed">
                  {selectedReport.report.executiveSummary}
                </p>
              </div>

              {/* Problem & Root Cause */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-1">
                  <div className="font-bold text-rose-500">Problem</div>
                  <p className="text-muted-foreground">{selectedReport.report.problemStatement}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-1">
                  <div className="font-bold text-amber-500">Root Cause</div>
                  <p className="text-muted-foreground">{selectedReport.report.rootCause}</p>
                </div>
              </div>

              {/* Questions & Answers */}
              <div className="space-y-2">
                <h4 className="font-bold uppercase tracking-wider text-muted-foreground">
                  Likely Technical Questions
                </h4>
                {selectedReport.report.meetingPreparation.likelyQuestions.map((qa, i) => (
                  <div key={i} className="p-3 rounded-lg border border-border space-y-1">
                    <div className="font-bold text-foreground">Q: {qa.question}</div>
                    <div className="text-emerald-600 dark:text-emerald-400 font-medium">A: {qa.suggestedAnswer}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
