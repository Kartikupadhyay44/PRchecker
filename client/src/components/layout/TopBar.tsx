import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Sun,
  Moon,
  Sparkles,
  RefreshCw,
  UserCheck,
  Github,
  AlertCircle,
} from 'lucide-react';

interface Props {
  onOpenSearch: () => void;
}

export const TopBar: React.FC<Props> = ({ onOpenSearch }) => {
  const {
    activePage,
    setActivePage,
    username,
    refreshAnalytics,
    loadingAnalytics,
    analytics,
    theme,
    toggleTheme,
  } = useApp();

  const [inputUser, setInputUser] = useState(username);
  const [isEditingUser, setIsEditingUser] = useState(false);

  const pageTitles: Record<string, { title: string; subtitle: string }> = {
    overview: {
      title: 'Overview Dashboard',
      subtitle: 'High-level PR metrics, distribution and contribution cadence',
    },
    contributions: {
      title: 'PR Contributions',
      subtitle: 'Searchable directory of authored pull requests and review status',
    },
    organizations: {
      title: 'Organizations & Repositories',
      subtitle: 'Exploration of contributed open-source ecosystems and repositories',
    },
    analyze: {
      title: 'Analyze Pull Request',
      subtitle: 'Turn your code into clarity with AI-powered technical briefings',
    },
    reports: {
      title: 'Reports Library',
      subtitle: 'Saved technical intelligence documentation and meeting prep guides',
    },
    settings: {
      title: 'Platform Settings',
      subtitle: 'API credentials, profile connection and generation preferences',
    },
  };

  const currentMeta = pageTitles[activePage] || {
    title: 'MergeMemo AI',
    subtitle: 'GitHub PR Intelligence Platform',
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUser.trim() && inputUser.trim() !== username) {
      refreshAnalytics(inputUser.trim());
    }
    setIsEditingUser(false);
  };

  return (
    <header className="h-16 px-6 border-b border-border bg-card/60 backdrop-blur-md flex items-center justify-between sticky top-0 z-10 select-none">
      {/* Page Title & Subtitle */}
      <div>
        <h1 className="text-base font-semibold text-foreground tracking-tight flex items-center gap-2">
          {currentMeta.title}
        </h1>
        <p className="text-xs text-muted-foreground hidden sm:block">
          {currentMeta.subtitle}
        </p>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Rate limit warning if applicable */}
        {analytics?.isRateLimited && (
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Rate limited (add GitHub token in Settings)</span>
          </div>
        )}

        {/* Global Search Button */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Quick Jump...</span>
          <kbd className="hidden md:inline-block px-1.5 py-0.2 text-[10px] bg-background border border-border rounded font-mono">
            ⌘K
          </kbd>
        </button>

        {/* GitHub User Quick Switcher */}
        <div className="relative">
          {isEditingUser ? (
            <form onSubmit={handleUserSubmit} className="flex items-center">
              <input
                type="text"
                autoFocus
                value={inputUser}
                onChange={(e) => setInputUser(e.target.value)}
                onBlur={() => setIsEditingUser(false)}
                placeholder="github user..."
                className="w-32 px-2.5 py-1 rounded-lg border border-primary bg-background text-foreground text-xs outline-none"
              />
            </form>
          ) : (
            <button
              onClick={() => {
                setInputUser(username);
                setIsEditingUser(true);
              }}
              title="Click to switch tracked GitHub user"
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border bg-muted/30 hover:bg-muted/70 text-xs font-medium transition-colors"
            >
              <Github className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-semibold text-foreground">@{username}</span>
              <UserCheck className="w-3 h-3 text-emerald-500" />
            </button>
          )}
        </div>

        {/* Refresh Analytics Button */}
        <button
          onClick={() => refreshAnalytics()}
          disabled={loadingAnalytics}
          title="Refresh GitHub metrics"
          className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loadingAnalytics ? 'animate-spin text-primary' : ''}`} />
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Primary CTA: New Report */}
        {activePage !== 'analyze' && (
          <button
            onClick={() => setActivePage('analyze')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Analyze PR</span>
          </button>
        )}
      </div>
    </header>
  );
};
