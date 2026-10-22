import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { PullRequestItem } from '../types';
import {
  Search,
  ExternalLink,
  Sparkles,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  GitPullRequest,
  Calendar,
  X,
  Building2,
  FolderGit2,
} from 'lucide-react';

export const ContributionsPage: React.FC = () => {
  const {
    analytics,
    loadingAnalytics,
    setActivePage,
    setPrefillAnalyzePR,
    selectedOrgForFilter,
    setSelectedOrgForFilter,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'merged' | 'open' | 'closed'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filter and sort pull requests
  const filteredPRs = useMemo(() => {
    if (!analytics?.allPRs) return [];

    let list = [...analytics.allPRs];

    // Status filter
    if (statusFilter !== 'all') {
      list = list.filter((pr) => pr.state === statusFilter);
    }

    // Organization filter
    if (selectedOrgForFilter) {
      list = list.filter(
        (pr) => pr.repository.owner.toLowerCase() === selectedOrgForFilter.toLowerCase()
      );
    }

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (pr) =>
          pr.title.toLowerCase().includes(q) ||
          pr.repository.full_name.toLowerCase().includes(q) ||
          String(pr.number).includes(q)
      );
    }

    // Sort order
    list.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return list;
  }, [analytics, statusFilter, selectedOrgForFilter, searchTerm, sortOrder]);

  const totalPages = Math.ceil(filteredPRs.length / pageSize) || 1;
  const paginatedPRs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPRs.slice(start, start + pageSize);
  }, [filteredPRs, currentPage, pageSize]);

  const handleAnalyze = (pr: PullRequestItem) => {
    setPrefillAnalyzePR({
      prUrl: pr.html_url,
    });
    setActivePage('analyze');
  };

  const statusPills: Array<{
    id: 'all' | 'merged' | 'open' | 'closed';
    label: string;
    count?: number;
  }> = [
    { id: 'all', label: 'All PRs', count: analytics?.totalPRs },
    { id: 'merged', label: 'Merged', count: analytics?.mergedPRs },
    { id: 'open', label: 'Open', count: analytics?.openPRs },
    { id: 'closed', label: 'Closed', count: analytics?.closedUnmergedPRs },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Top Header & Search Bar */}
      <div className="p-5 sm:p-6 rounded-2xl bg-card border border-border shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <GitPullRequest className="w-5 h-5 text-primary" />
              <span>Authored Pull Requests</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Browse, filter, and launch one-click AI analysis on any pull request.
            </p>
          </div>

          {/* Org Filter Chip if active */}
          {selectedOrgForFilter && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
              <Building2 className="w-3.5 h-3.5" />
              <span>Org: {selectedOrgForFilter}</span>
              <button
                onClick={() => setSelectedOrgForFilter(null)}
                className="hover:opacity-75 p-0.5 ml-1"
                title="Clear filter"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Search & Status Pill Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by title, repository, or #number..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-border bg-background text-foreground text-xs outline-none focus:border-primary transition-colors font-mono"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {statusPills.map((pill) => (
              <button
                key={pill.id}
                onClick={() => {
                  setStatusFilter(pill.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === pill.id
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/70'
                }`}
              >
                <span>{pill.label}</span>
                {pill.count !== undefined && (
                  <span className="ml-1.5 text-[10px] opacity-80 font-mono">
                    ({pill.count})
                  </span>
                )}
              </button>
            ))}

            <button
              onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
              title={`Sort: ${sortOrder === 'newest' ? 'Newest first' : 'Oldest first'}`}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-medium transition-colors shrink-0 ml-1"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span className="capitalize hidden sm:inline">{sortOrder}</span>
            </button>
          </div>
        </div>
      </div>

      {/* PR Cards List */}
      {loadingAnalytics && !analytics ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : paginatedPRs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-card border border-border space-y-3">
          <GitPullRequest className="w-8 h-8 mx-auto text-muted-foreground opacity-50" />
          <h3 className="text-sm font-bold text-foreground">No pull requests match your criteria</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Try clearing search queries or switching the status filter.
          </p>
          {(searchTerm || statusFilter !== 'all' || selectedOrgForFilter) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setSelectedOrgForFilter(null);
              }}
              className="px-4 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedPRs.map((pr) => {
            const isMerged = pr.state === 'merged';
            const isOpen = pr.state === 'open';

            return (
              <div
                key={pr.id}
                className={`p-4 sm:p-5 rounded-2xl bg-card border border-border hover:border-primary/40 shadow-2xs hover:shadow-subtle transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group border-l-4 ${
                  isMerged
                    ? 'border-l-purple-500'
                    : isOpen
                    ? 'border-l-emerald-500'
                    : 'border-l-slate-400'
                }`}
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isMerged
                          ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                          : isOpen
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30'
                      }`}
                    >
                      {pr.state}
                    </span>
                    <span className="font-mono text-muted-foreground">
                      {pr.repository.full_name}#{pr.number}
                    </span>
                    <span className="text-muted-foreground">&bull;</span>
                    <span className="text-muted-foreground flex items-center gap-1 font-mono text-[11px]">
                      <Calendar className="w-3 h-3" />
                      {new Date(pr.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-semibold text-foreground group-hover:text-primary transition-colors tracking-tight line-clamp-1">
                    {pr.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                  <a
                    href={pr.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title="View PR on GitHub"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <button
                    onClick={() => handleAnalyze(pr)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-white text-xs font-semibold transition-all border border-primary/20 shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Analyze PR</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      {filteredPRs.length > pageSize && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border text-xs text-muted-foreground shadow-2xs">
          <div>
            Showing <strong className="text-foreground">{(currentPage - 1) * pageSize + 1}</strong>-
            <strong className="text-foreground">
              {Math.min(currentPage * pageSize, filteredPRs.length)}
            </strong>{' '}
            of <strong className="text-foreground">{filteredPRs.length}</strong> pull requests
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono text-foreground font-semibold">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
