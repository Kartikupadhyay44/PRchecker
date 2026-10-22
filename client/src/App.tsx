import React, { useState, useEffect } from 'react';
import { useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { SettingsModal } from './components/layout/SettingsModal';
import { GlobalSearchModal } from './components/layout/GlobalSearchModal';
import { ToastContainer } from './components/ui/ToastContainer';
import { OverviewPage } from './pages/OverviewPage';
import { ContributionsPage } from './pages/ContributionsPage';
import { OrganizationsPage } from './pages/OrganizationsPage';
import { AnalyzePRPage } from './pages/AnalyzePRPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

export const AppContent: React.FC = () => {
  const { activePage } = useApp();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Auto-scroll window to top on navigation page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activePage]);

  // Global keybindings
  useEffect(() => {
    const handleOpenSearch = () => setIsSearchOpen(true);
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };

    window.addEventListener('open-global-search', handleOpenSearch);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('open-global-search', handleOpenSearch);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col antialiased selection:bg-indigo-500/20 selection:text-indigo-600 dark:selection:text-indigo-300 relative">
      {/* Ambient Top Glow Spotlight (Linear / Vercel style) */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none">
        <div className="absolute -top-[300px] left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-gradient-to-b from-indigo-500/12 via-purple-500/6 to-transparent blur-3xl opacity-60 dark:opacity-30" />
      </div>

      {/* Sleek, Modern Navbar */}
      <Navbar
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-7">
        <div className="max-w-6xl mx-auto">
          {activePage === 'analyze' && <AnalyzePRPage />}
          {activePage === 'contributions' && <ContributionsPage />}
          {activePage === 'overview' && <OverviewPage />}
          {activePage === 'organizations' && <OverviewPage />}
          {activePage === 'reports' && <ReportsPage />}
          {activePage === 'settings' && <SettingsPage />}
        </div>
      </main>

      {/* Global Quick Jump Palette */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Settings Modal Dialog */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Toast Notification Container */}
      <ToastContainer />
    </div>
  );
};

export const App: React.FC = () => {
  return <AppContent />;
};

export default App;
