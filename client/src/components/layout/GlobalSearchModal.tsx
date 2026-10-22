import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { NavigationPage } from '../../types';
import { Search, LayoutDashboard, GitPullRequest, Building2, Sparkles, FileText, Settings, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { setActivePage, refreshAnalytics } = useApp();
  const [query, setQuery] = useState('');

  // Keyboard shortcut listener: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open
          const evt = new CustomEvent('open-global-search');
          window.dispatchEvent(evt);
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  interface QuickNavItem {
    page: NavigationPage;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }

  const quickNav: QuickNavItem[] = [
    { page: 'overview', label: 'Overview Dashboard', icon: LayoutDashboard },
    { page: 'contributions', label: 'PR Contributions Table', icon: GitPullRequest },
    { page: 'organizations', label: 'Organization Explorer', icon: Building2 },
    { page: 'analyze', label: 'Analyze Pull Request & Issue', icon: Sparkles, badge: 'AI' },
    { page: 'reports', label: 'Saved Technical Reports', icon: FileText },
    { page: 'settings', label: 'Settings & API Keys', icon: Settings },
  ];

  const filteredNav = quickNav.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelectPage = (page: any) => {
    setActivePage(page);
    onClose();
  };

  const handleUserSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      refreshAnalytics(query.trim());
      setActivePage('overview');
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-10"
        >
          <form onSubmit={handleUserSearchSubmit} className="flex items-center px-4 border-b border-border">
            <Search className="w-5 h-5 text-muted-foreground mr-3 shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder="Search views, or type any GitHub username and hit Enter..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full py-4 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-base"
            />
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-xs text-muted-foreground bg-muted rounded border border-border">
              ESC
            </kbd>
          </form>

          <div className="p-3 max-h-96 overflow-y-auto space-y-1">
            {query.trim().length > 0 && (
              <button
                onClick={() => {
                  refreshAnalytics(query.trim());
                  setActivePage('overview');
                  onClose();
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left hover:bg-muted text-sm group transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-md bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Explore GitHub User: </span>
                    <span className="text-primary font-semibold">@{query.trim()}</span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground group-hover:text-foreground">Press Enter &rarr;</span>
              </button>
            )}

            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-3 pt-2 pb-1">
              Navigation
            </div>

            {filteredNav.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.page}
                  onClick={() => handleSelectPage(item.page)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left hover:bg-muted text-sm text-foreground transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-500 border border-indigo-500/30">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="px-4 py-2.5 bg-muted/40 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>Tip: Type any public GitHub handle like <code className="text-foreground">torvalds</code>, <code className="text-foreground">gaearon</code></span>
            <span>&uarr; &darr; to navigate</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
