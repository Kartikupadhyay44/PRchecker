import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Building2,
  FolderGit2,
  ExternalLink,
  Calendar,
  CheckCircle2,
  CircleDot,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  User,
} from 'lucide-react';

export const OrganizationsPage: React.FC = () => {
  const { analytics, loadingAnalytics, setActivePage, setSelectedOrgForFilter } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'official' | 'personal'>('all');

  if (loadingAnalytics && !analytics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-48 rounded-xl bg-card border border-border" />
        ))}
      </div>
    );
  }

  if (!analytics) return null;

  const orgs = analytics.topOrganizations || [];

  const filteredOrgs = orgs.filter((org) => {
    const matchesSearch =
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.repositories.some((r) => r.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (filterType === 'official') return org.isOfficialOrg;
    if (filterType === 'personal') return !org.isOfficialOrg;
    return true;
  });

  const handleDrilldown = (orgName: string) => {
    setSelectedOrgForFilter(orgName);
    setActivePage('contributions');
  };

  return (
    <div className="space-y-6">
      {/* Overview Context Card */}
      <div className="p-5 rounded-xl bg-card border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" /> Open Source Organization Footprint
          </h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-xl">
            Showing all organizations and repository namespaces where @{analytics.user.login} has submitted code contributions.
            Distinguishes established public organizations from independent user repositories.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xl font-extrabold text-foreground tracking-tight">
              {orgs.length}
            </div>
            <div className="text-[11px] text-muted-foreground uppercase font-semibold">
              Namespaces
            </div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-right">
            <div className="text-xl font-extrabold text-pr-merged tracking-tight">
              {analytics.distinctReposCount}
            </div>
            <div className="text-[11px] text-muted-foreground uppercase font-semibold">
              Repositories
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-card border border-border flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search organizations or repositories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="flex items-center rounded-lg border border-border bg-muted/30 p-1 text-xs w-full sm:w-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`flex-1 sm:flex-none px-3 py-1 rounded-md font-medium transition-all ${
              filterType === 'all'
                ? 'bg-card text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All ({orgs.length})
          </button>
          <button
            onClick={() => setFilterType('official')}
            className={`flex-1 sm:flex-none px-3 py-1 rounded-md font-medium transition-all ${
              filterType === 'official'
                ? 'bg-card text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Official Orgs ({orgs.filter((o) => o.isOfficialOrg).length})
          </button>
          <button
            onClick={() => setFilterType('personal')}
            className={`flex-1 sm:flex-none px-3 py-1 rounded-md font-medium transition-all ${
              filterType === 'personal'
                ? 'bg-card text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Personal Repos ({orgs.filter((o) => !o.isOfficialOrg).length})
          </button>
        </div>
      </div>

      {/* Organization Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrgs.map((org) => {
          const mergeRate = org.totalPRs > 0 ? Math.round((org.mergedPRs / org.totalPRs) * 100) : 0;

          return (
            <div
              key={org.name}
              className="p-5 rounded-xl bg-card border border-border/80 hover:border-border hover:shadow-subtle transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Org Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={org.avatarUrl}
                      alt={org.name}
                      className="w-10 h-10 rounded-xl border border-border object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-foreground text-sm group-hover:text-primary transition-colors truncate">
                          {org.name}
                        </span>
                        {org.isOfficialOrg ? (
                          <span
                            title="Verified Organization Namespace"
                            className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-500 border border-indigo-500/20"
                          >
                            <ShieldCheck className="w-2.5 h-2.5" /> Org
                          </span>
                        ) : (
                          <span
                            title="Personal / Independent Repository"
                            className="inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.2 rounded bg-muted text-muted-foreground"
                          >
                            <User className="w-2.5 h-2.5" /> Personal
                          </span>
                        )}
                      </div>
                      <a
                        href={org.htmlUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-muted-foreground hover:underline inline-flex items-center gap-1 mt-0.5"
                      >
                        github.com/{org.name} <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* PR Numbers & Metrics */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-muted/30 border border-border/50 text-center mb-3">
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase font-semibold">Total PRs</div>
                    <div className="text-sm font-bold text-foreground">{org.totalPRs}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase font-semibold">Merged</div>
                    <div className="text-sm font-bold text-pr-merged">{org.mergedPRs}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase font-semibold">Open</div>
                    <div className="text-sm font-bold text-pr-open">{org.openPRs}</div>
                  </div>
                </div>

                {/* Repositories Contributed to */}
                <div className="space-y-1.5 mb-3">
                  <div className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                    <FolderGit2 className="w-3 h-3 text-primary" /> Contributed Repositories:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {org.repositories.slice(0, 4).map((repo) => (
                      <span
                        key={repo}
                        className="px-2 py-0.5 rounded-md bg-muted text-foreground font-mono text-[11px] border border-border/60"
                      >
                        {repo}
                      </span>
                    ))}
                    {org.repositories.length > 4 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] text-muted-foreground font-medium">
                        +{org.repositories.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                <span className="text-muted-foreground text-[11px] flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(org.latestContributionDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                  })}
                </span>

                <button
                  onClick={() => handleDrilldown(org.name)}
                  className="font-semibold text-primary hover:text-primary/80 inline-flex items-center gap-1 group/btn"
                >
                  <span>View PRs</span>
                  <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredOrgs.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            <Building2 className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="font-semibold text-foreground text-sm">No organizations match your query</p>
            <p className="text-xs mt-1">Try resetting the search bar or filter selection.</p>
          </div>
        )}
      </div>
    </div>
  );
};
