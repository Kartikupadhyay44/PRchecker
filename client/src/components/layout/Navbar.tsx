import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { NavigationPage } from '../../types';
import {
  Sparkles,
  GitPullRequest,
  BarChart3,
  FileText,
  Settings,
  Search,
  Sun,
  Moon,
  Github,
  RefreshCw,
  ChevronDown,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  onOpenSearch: () => void;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<Props> = ({ onOpenSearch, onOpenSettings }) => {
  const {
    activePage,
    setActivePage,
    username,
    refreshAnalytics,
    loadingAnalytics,
    theme,
    toggleTheme,
  } = useApp();

  const [isEditingUser, setIsEditingUser] = useState(false);
  const [userInput, setUserInput] = useState(username);

  const navItems: Array<{
    id: NavigationPage;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'analyze', label: 'Analyze PR', icon: Sparkles },
    { id: 'contributions', label: 'Pull Requests', icon: GitPullRequest },
    { id: 'overview', label: 'Insights & Stats', icon: BarChart3 },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userInput.trim() && userInput.trim() !== username) {
      refreshAnalytics(userInput.trim());
    }
    setIsEditingUser(false);
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border/80 bg-background/80 backdrop-blur-xl select-none transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActivePage('analyze')}
            className="flex items-center gap-2.5 group text-left focus:outline-none"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20 group-hover:scale-105 transition-transform border border-white/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-bold text-sm tracking-tight text-foreground">
                  MergeMemo
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20">
                  AI
                </span>
              </div>
              <span className="text-[10.5px] text-muted-foreground block font-mono mt-0.5">
                PR Intelligence
              </span>
            </div>
          </button>
        </div>

        {/* Center: Sliding Animated Segmented Nav Tabs */}
        <nav className="flex items-center p-1 rounded-2xl bg-muted/40 border border-border/80 shadow-2xs relative">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors z-10 ${
                  isActive
                    ? 'text-foreground font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="navbar-active-pill"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    className="absolute inset-0 bg-card rounded-xl border border-border shadow-2xs -z-10"
                  />
                )}
                <Icon
                  className={`w-3.5 h-3.5 transition-transform ${
                    isActive ? 'text-primary scale-105' : 'text-muted-foreground'
                  }`}
                />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: User Switcher, Quick Search, Theme & Settings */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Tracked GitHub User Pill */}
          <div className="relative">
            {isEditingUser ? (
              <form onSubmit={handleUserSubmit} className="flex items-center">
                <input
                  type="text"
                  autoFocus
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onBlur={() => setIsEditingUser(false)}
                  placeholder="github user..."
                  className="w-28 sm:w-36 px-2.5 py-1 text-xs rounded-xl border border-primary bg-background text-foreground outline-none font-mono shadow-xs"
                />
              </form>
            ) : (
              <button
                onClick={() => {
                  setUserInput(username);
                  setIsEditingUser(true);
                }}
                title="Click to switch tracked GitHub user"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-border/80 bg-muted/30 hover:bg-muted/70 text-xs font-medium transition-all group"
              >
                <Github className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                <span className="font-mono text-foreground font-semibold max-w-[90px] truncate text-[11px]">
                  @{username}
                </span>
                <ChevronDown className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>
            )}
          </div>

          {/* Quick Refresh User Data */}
          <button
            onClick={() => refreshAnalytics()}
            disabled={loadingAnalytics}
            title="Refresh GitHub metrics"
            className="p-1.5 rounded-xl border border-border hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                loadingAnalytics ? 'animate-spin text-primary' : ''
              }`}
            />
          </button>

          {/* Global Search / Quick Jump */}
          <button
            onClick={onOpenSearch}
            title="Search PRs and Reports (⌘K)"
            className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-border hover:bg-muted/70 text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono text-muted-foreground border border-border/60">
              ⌘K
            </kbd>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            className="p-1.5 rounded-xl border border-border hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-slate-700" />
            )}
          </button>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            title="Platform Settings & API Keys"
            className="p-1.5 rounded-xl border border-border hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
