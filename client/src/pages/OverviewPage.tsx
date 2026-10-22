import React from 'react';
import { useApp } from '../context/AppContext';
import {
  GitPullRequest,
  GitMerge,
  CircleDot,
  XCircle,
  ExternalLink,
  Sparkles,
  Building2,
  Calendar,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Briefcase,
  Users,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const OverviewPage: React.FC = () => {
  const {
    analytics,
    loadingAnalytics,
    analyticsError,
    refreshAnalytics,
    setActivePage,
    setSelectedOrgForFilter,
    setPrefillAnalyzePR,
  } = useApp();

  if (loadingAnalytics && !analytics) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 rounded-xl bg-card border border-border" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-card border border-border" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 rounded-xl bg-card border border-border lg:col-span-2" />
          <div className="h-80 rounded-xl bg-card border border-border" />
        </div>
      </div>
    );
  }

  if (analyticsError && !analytics) {
    return (
      <div className="p-12 text-center rounded-xl bg-card border border-border space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center">
          <XCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Could not load contributor metrics</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">{analyticsError}</p>
        <button
          onClick={() => refreshAnalytics()}
          className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:opacity-90"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!analytics) return null;

  const { user, totalPRs, mergedPRs, openPRs, closedUnmergedPRs, mergeRate } = analytics;

  // Donut chart status data
  const pieData = [
    { name: 'Merged', value: mergedPRs, color: '#8957e5' },
    { name: 'Open', value: openPRs, color: '#238636' },
    { name: 'Closed Unmerged', value: closedUnmergedPRs, color: '#6e7681' },
  ].filter((d) => d.value > 0);

  const handleAnalyzePR = (prUrl: string) => {
    setPrefillAnalyzePR({ prUrl });
    setActivePage('analyze');
  };

  const handleSelectOrg = (orgName: string) => {
    setSelectedOrgForFilter(orgName);
    setActivePage('contributions');
  };

  return (
    <div className="space-y-6">
      {/* 1. Compact GitHub Profile Header */}
      <div className="p-5 rounded-xl bg-card border border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={user.avatar_url}
            alt={user.login}
            className="w-16 h-16 rounded-full border-2 border-border shadow-xs object-cover"
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-foreground">
                {user.name || user.login}
              </h2>
              <span className="text-xs text-muted-foreground font-mono">@{user.login}</span>
              <a
                href={user.html_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary hover:underline inline-flex items-center gap-1 font-medium"
              >
                GitHub Profile <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            {user.bio && (
              <p className="text-xs text-muted-foreground mt-1 max-w-2xl line-clamp-2">
                {user.bio}
              </p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
              {user.company && (
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5" /> {user.company}
                </span>
              )}
              {user.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {user.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> {user.followers} followers
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Active since{' '}
                {new Date(user.created_at).getFullYear()}
              </span>
            </div>
          </div>
        </div>

        {/* Quick CTA to analyze PR */}
        <button
          onClick={() => setActivePage('analyze')}
          className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow-xs transition-all"
        >
          <Sparkles className="w-4 h-4" />
          <span>Generate AI Report</span>
        </button>
      </div>

      {/* 2. Four Clear Statistic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total PRs */}
        <div className="p-4 rounded-xl bg-card border border-border space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Total PRs</span>
            <GitPullRequest className="w-4 h-4 text-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-foreground tracking-tight">
              {totalPRs.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground">authored</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Across {analytics.distinctReposCount} repositories and {analytics.distinctOrgsCount} organizations
          </p>
        </div>

        {/* Merged PRs */}
        <div className="p-4 rounded-xl bg-card border border-border space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Merged PRs</span>
            <GitMerge className="w-4 h-4 text-pr-merged" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-pr-merged tracking-tight">
              {mergedPRs.toLocaleString()}
            </span>
            <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-pr-merged-subtle text-pr-merged border border-pr-merged-border">
              {mergeRate}% merge rate
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Successfully shipped to main branches
          </p>
        </div>

        {/* Open PRs */}
        <div className="p-4 rounded-xl bg-card border border-border space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Open PRs</span>
            <CircleDot className="w-4 h-4 text-pr-open" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-pr-open tracking-tight">
              {openPRs.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground">
              {totalPRs > 0 ? Math.round((openPRs / totalPRs) * 100) : 0}% of authored
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Currently in active review or awaiting merge
          </p>
        </div>

        {/* Closed Unmerged PRs */}
        <div className="p-4 rounded-xl bg-card border border-border space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Closed Unmerged</span>
            <XCircle className="w-4 h-4 text-pr-closed" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-pr-closed tracking-tight">
              {closedUnmergedPRs.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground">
              {totalPRs > 0 ? Math.round((closedUnmergedPRs / totalPRs) * 100) : 0}% of authored
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Closed without merge (superseded, rejected, or withdrawn)
          </p>
        </div>
      </div>

      {/* 3. Charts Section: Monthly Contribution Activity & PR Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Activity Chart */}
        <div className="p-5 rounded-xl bg-card border border-border lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Monthly Contribution Activity
              </h3>
              <p className="text-xs text-muted-foreground">
                Pull request submission and merge cadence over time
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-sm bg-pr-merged" /> Merged
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-sm bg-pr-open" /> Open
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-sm bg-pr-closed" /> Closed
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            {analytics.monthlyActivity.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.monthlyActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="label"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      borderRadius: '8px',
                      border: '1px solid #334155',
                      fontSize: '12px',
                      color: '#fff',
                    }}
                  />
                  <Bar dataKey="merged" stackId="a" fill="#8957e5" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="open" stackId="a" fill="#238636" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="closed" stackId="a" fill="#6e7681" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                No recent PR timeline activity available for this account.
              </div>
            )}
          </div>
        </div>

        {/* PR Status Distribution Donut */}
        <div className="p-5 rounded-xl bg-card border border-border space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Status Distribution</h3>
            <p className="text-xs text-muted-foreground">Breakdown of pull request outcomes</p>
          </div>

          <div className="relative h-48 w-full flex items-center justify-center">
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        borderRadius: '8px',
                        border: '1px solid #334155',
                        fontSize: '12px',
                        color: '#fff',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-bold text-foreground">{mergeRate}%</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Merge Rate
                  </span>
                </div>
              </>
            ) : (
              <div className="text-xs text-muted-foreground">No distribution data</div>
            )}
          </div>

          {/* Legend */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border text-center">
            <div>
              <div className="text-[10px] text-muted-foreground uppercase font-semibold">Merged</div>
              <div className="text-sm font-bold text-pr-merged">{mergedPRs}</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground uppercase font-semibold">Open</div>
              <div className="text-sm font-bold text-pr-open">{openPRs}</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground uppercase font-semibold">Closed</div>
              <div className="text-sm font-bold text-pr-closed">{closedUnmergedPRs}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Top Contributing Organizations & Recent PRs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Organizations Card */}
        <div className="p-5 rounded-xl bg-card border border-border space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" /> Top Organizations
              </h3>
              <p className="text-xs text-muted-foreground">Ecosystems receiving contributions</p>
            </div>
            <button
              onClick={() => setActivePage('organizations')}
              className="text-xs text-primary hover:underline font-semibold"
            >
              View all &rarr;
            </button>
          </div>

          <div className="space-y-3">
            {analytics.topOrganizations.slice(0, 5).map((org) => (
              <div
                key={org.name}
                onClick={() => handleSelectOrg(org.name)}
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 border border-transparent hover:border-border cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={org.avatarUrl}
                    alt={org.name}
                    className="w-8 h-8 rounded-lg border border-border object-cover"
                  />
                  <div>
                    <div className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                      <span>{org.name}</span>
                      {org.isOfficialOrg && (
                        <span className="text-[9px] px-1 rounded bg-muted text-muted-foreground font-medium">
                          Org
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {org.repositories.length} {org.repositories.length === 1 ? 'repo' : 'repos'} contributed
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-foreground">{org.totalPRs} PRs</div>
                  <div className="text-[10px] text-pr-merged font-semibold">{org.mergedPRs} merged</div>
                </div>
              </div>
            ))}

            {analytics.topOrganizations.length === 0 && (
              <div className="text-xs text-muted-foreground py-4 text-center">
                No organizations recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Recent Pull Requests List */}
        <div className="p-5 rounded-xl bg-card border border-border lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <GitPullRequest className="w-4 h-4 text-primary" /> Recent Pull Requests
              </h3>
              <p className="text-xs text-muted-foreground">Latest pull request submissions</p>
            </div>
            <button
              onClick={() => setActivePage('contributions')}
              className="text-xs text-primary hover:underline font-semibold"
            >
              See all ({analytics.allPRs.length}) &rarr;
            </button>
          </div>

          <div className="space-y-2">
            {analytics.recentPRs.slice(0, 6).map((pr) => {
              const statusColors = {
                merged: 'bg-pr-merged-subtle text-pr-merged border-pr-merged-border',
                open: 'bg-pr-open-subtle text-pr-open border-pr-open-border',
                closed: 'bg-pr-closed-subtle text-pr-closed border-pr-closed-border',
              }[pr.state];

              return (
                <div
                  key={pr.id}
                  className="p-3 rounded-lg border border-border/70 hover:border-border hover:bg-muted/30 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusColors}`}
                      >
                        {pr.state}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground">
                        {pr.repository.full_name}#{pr.number}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        &bull; {new Date(pr.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-foreground truncate">
                      {pr.title}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleAnalyzePR(pr.html_url)}
                      title="Generate technical report for this PR"
                      className="px-2.5 py-1.5 rounded-md bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span className="hidden sm:inline">Analyze</span>
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
                </div>
              );
            })}

            {analytics.recentPRs.length === 0 && (
              <div className="text-xs text-muted-foreground py-6 text-center">
                No recent pull requests found for @{user.login}.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
