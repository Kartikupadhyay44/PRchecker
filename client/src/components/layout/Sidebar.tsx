import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { NavigationPage } from '../../types';
import {
  LayoutDashboard,
  GitPullRequest,
  Building2,
  Sparkles,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activePage, setActivePage, analytics, username } = useApp();
  const [collapsed, setCollapsed] = useState<boolean>(false);

  const navItems: Array<{
    id: NavigationPage;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    isPrimary?: boolean;
  }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'contributions', label: 'Contributions', icon: GitPullRequest },
    { id: 'organizations', label: 'Organizations', icon: Building2 },
    { id: 'analyze', label: 'Analyze PR', icon: Sparkles, badge: 'AI', isPrimary: true },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`relative z-20 flex flex-col border-r border-border bg-card transition-all duration-300 ease-in-out select-none ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-border">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-sm shrink-0">
            <span className="font-mono font-bold text-sm leading-none">&lambda;</span>
          </div>
          {!collapsed && (
            <div className="flex items-center gap-2 truncate">
              <span className="font-semibold text-foreground tracking-tight text-sm">
                MergeMemo
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20">
                AI
              </span>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                isActive
                  ? item.isPrimary
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              } ${collapsed ? 'justify-center px-0' : ''}`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive
                    ? item.isPrimary
                      ? 'text-white'
                      : 'text-primary'
                    : 'text-muted-foreground group-hover:text-foreground'
                }`}
              />

              {!collapsed && (
                <div className="flex items-center justify-between flex-1 truncate">
                  <span className="truncate">{item.label}</span>
                  {item.badge && !isActive && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-500 border border-indigo-500/30">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Active Contributor Profile Badge */}
      <div className="p-3 border-t border-border">
        {analytics?.user ? (
          <div
            className={`flex items-center gap-3 p-2 rounded-lg bg-muted/40 border border-border/50 ${
              collapsed ? 'justify-center p-1.5' : ''
            }`}
          >
            <img
              src={analytics.user.avatar_url}
              alt={analytics.user.login}
              className="w-7 h-7 rounded-full border border-border object-cover shrink-0"
            />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-foreground truncate">
                  @{analytics.user.login}
                </div>
                <div className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                  <span>{analytics.totalPRs} total PRs</span>
                  <span>&bull;</span>
                  <a
                    href={analytics.user.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-primary transition-colors inline-flex items-center"
                  >
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div
            className={`flex items-center gap-2 p-2 rounded-lg bg-muted/30 text-xs text-muted-foreground ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-muted border border-border animate-pulse shrink-0" />
            {!collapsed && <span className="truncate">@{username}</span>}
          </div>
        )}
      </div>
    </aside>
  );
};
