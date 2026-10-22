import React, { useState, useEffect } from 'react';
import { useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
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

  useEffect(() => {
    const handleOpenSearch = () => setIsSearchOpen(true);
    window.addEventListener('open-global-search', handleOpenSearch);
    return () => window.removeEventListener('open-global-search', handleOpenSearch);
  }, []);

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
      {/* Collapsible Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <TopBar onOpenSearch={() => setIsSearchOpen(true)} />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto px-6 py-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {activePage === 'overview' && <OverviewPage />}
            {activePage === 'contributions' && <ContributionsPage />}
            {activePage === 'organizations' && <OrganizationsPage />}
            {activePage === 'analyze' && <AnalyzePRPage />}
            {activePage === 'reports' && <ReportsPage />}
            {activePage === 'settings' && <SettingsPage />}
          </div>
        </main>
      </div>

      {/* Global Command Palette */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Toast Notification Container */}
      <ToastContainer />
    </div>
  );
};

export const App: React.FC = () => {
  return <AppContent />;
};

export default App;
