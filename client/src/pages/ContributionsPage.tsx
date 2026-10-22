import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { PullRequestItem } from '../types';
import {
  Search,
  Filter,
  ExternalLink,
  Sparkles,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  GitPullRequest,
  CheckCircle2,
  Calendar,
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
  const pageSize = 12;

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
        (pr) =>
          pr.repository.owner.toLowerCase() === selectedOrgForFilter.toLowerCase()
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

    // Sorting
    list.sort((a, b) => {
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });

    return list;
  }, [analytics, statusFilter, selectedOrgForFilter, searchTerm, sortOrder]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredPRs.length / pageSize));
  const paginatedPRs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPRs.slice(start, start + pageSize);
  }, [filteredPRs, currentPage, pageSize]);

  const handleGenerateReport = (pr: PullRequestItem) => {
    setPrefillAnalyzePR({
      prUrl: pr.html_url,
    });
    setActivePage('analyze');
  };

  if (loadingAnalytics && !analytics) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-14 rounded-xl bg-card border border-border" />
        <div className="h-96 rounded-xl bg-card border border-border" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Org Banner filter if active */}
      {selectedOrgForFilter && (
        <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between text-xs text-indigo-900 dark:text-indigo-200">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Filtered by Organization:</span>
            <span className="px-2 py-0.5 rounded bg-indigo-500/20 font-mono font-bold">
              {selectedOrgForFilter}
            </span>
          </div>
          <button
            onClick={() => setSelectedOrgForFilter(null)}
            className="text-xs hover:underline font-semibold"
          >
            Clear Filter &times;
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-card border border-border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, repository, or PR number..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center rounded-lg border border-border bg-muted/30 p-1 text-xs">
            <button
              onClick={() => {
                setStatusFilter('all');
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                statusFilter === 'all'
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All ({analytics?.allPRs.length || 0})
            </button>
            <button
              onClick={() => {
                setStatusFilter('merged');
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                statusFilter === 'merged'
                  ? 'bg-pr-merged-subtle text-pr-merged font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Merged ({analytics?.mergedPRs || 0})
            </button>
            <button
              onClick={() => {
                setStatusFilter('open');
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                statusFilter === 'open'
                  ? 'bg-pr-open-subtle text-pr-open font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Open ({analytics?.openPRs || 0})
            </button>
            <button
              onClick={() => {
                setStatusFilter('closed');
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                statusFilter === 'closed'
                  ? 'bg-pr-closed-subtle text-pr-closed font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Closed ({analytics?.closedUnmergedPRs || 0})
            </button>
          </div>

          {/* Sort order toggle */}
          <button
            onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>{sortOrder === 'newest' ? 'Newest first' : 'Oldest first'}</span>
          </button>
        </div>
      </div>

      {/* Contributions Table */}
      <div className="rounded-xl bg-card border border-border overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                <th className="py-3.5 px-4 w-28">Status</th>
                <th className="py-3.5 px-4">Pull Request</th>
                <th className="py-3.5 px-4 w-52">Repository & Org</th>
                <th className="py-3.5 px-4 w-36">Created Date</th>
                <th className="py-3.5 px-4 w-36">Updated Date</th>
                <th className="py-3.5 px-4 w-36 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedPRs.map((pr) => {
                const statusStyles = {
                  merged: 'bg-pr-merged-subtle text-pr-merged border-pr-merged-border',
                  open: 'bg-pr-open-subtle text-pr-open border-pr-open-border',
                  closed: 'bg-pr-closed-subtle text-pr-closed border-pr-closed-border',
                }[pr.state];

                return (
                  <tr key={pr.id} className="hover:bg-muted/30 transition-colors group">
                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusStyles}`}
                      >
                        {pr.state}
                      </span>
                    </td>

                    {/* PR Title & Number */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {pr.title}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                        #{pr.number}
                      </div>
                    </td>

                    {/* Repository & Organization */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <img
                          src={pr.repository.owner_avatar}
                          alt={pr.repository.owner}
                          className="w-5 h-5 rounded-md border border-border object-cover"
                        />
                        <span className="font-medium text-foreground truncate max-w-[150px]">
                          {pr.repository.full_name}
                        </span>
                      </div>
                    </td>

                    {/* Created Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-muted-foreground">
                      {new Date(pr.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    {/* Updated Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-muted-foreground">
                      {new Date(pr.updated_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleGenerateReport(pr)}
                          title="Generate AI Technical Report"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 font-semibold transition-colors"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>AI Report</span>
                        </button>
                        <a
                          href={pr.html_url}
                          target="_blank"
                          rel="noreferrer"
                          title="View on GitHub"
                          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {paginatedPRs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <GitPullRequest className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="font-medium text-foreground text-sm">No pull requests match this filter</p>
                    <p className="text-xs mt-1">Try refining your search terms or clearing selected filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-border bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
            <div>
              Showing{' '}
              <span className="font-semibold text-foreground">
                {(currentPage - 1) * pageSize + 1}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-foreground">
                {Math.min(currentPage * pageSize, filteredPRs.length)}
              </span>{' '}
              of <span className="font-semibold text-foreground">{filteredPRs.length}</span> contributions
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="p-1 rounded border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed text-foreground"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="p-1 rounded border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed text-foreground"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
