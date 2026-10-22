import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { NavigationPage, UserAnalytics, AppSettings } from '../types';
import { api } from '../services/api';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  activePage: NavigationPage;
  setActivePage: (page: NavigationPage) => void;
  username: string;
  setUsername: (username: string) => void;
  analytics: UserAnalytics | null;
  loadingAnalytics: boolean;
  analyticsError: string | null;
  refreshAnalytics: (usernameOverride?: string) => Promise<void>;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  selectedOrgForFilter: string | null;
  setSelectedOrgForFilter: (org: string | null) => void;
  prefillAnalyzePR: { prUrl: string; issueUrl?: string } | null;
  setPrefillAnalyzePR: (val: { prUrl: string; issueUrl?: string } | null) => void;
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;
}

const defaultSettings: AppSettings = {
  githubUsername: 'shadcn',
  preferredEmail: '',
  theme: 'dark',
  customOpenAiKey: '',
  customGithubToken: '',
  customResendKey: '',
  autoSendEmail: false,
  includeDiffsInReport: true,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePage, setActivePage] = useState<NavigationPage>('overview');
  const [username, setUsername] = useState<string>('shadcn');
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState<boolean>(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [selectedOrgForFilter, setSelectedOrgForFilter] = useState<string | null>(null);
  const [prefillAnalyzePR, setPrefillAnalyzePR] = useState<{ prUrl: string; issueUrl?: string } | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Theme synchronization with document element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // Load initial settings
  useEffect(() => {
    (async () => {
      try {
        const loaded = await api.getSettings();
        setSettings(loaded);
        if (loaded.githubUsername) {
          setUsername(loaded.githubUsername);
        }
        if (loaded.theme && loaded.theme !== 'system') {
          setTheme(loaded.theme as 'light' | 'dark');
        }
      } catch (e) {
        console.warn('Using default settings:', e);
      }
    })();
  }, []);

  // Fetch GitHub analytics for user
  const refreshAnalytics = useCallback(
    async (usernameOverride?: string) => {
      const targetUser = (usernameOverride || username).trim();
      if (!targetUser) return;

      setLoadingAnalytics(true);
      setAnalyticsError(null);

      try {
        const data = await api.getAnalytics(targetUser, settings.customGithubToken);
        setAnalytics(data);
        if (usernameOverride) {
          setUsername(usernameOverride);
        }
      } catch (err: any) {
        setAnalyticsError(err.message || 'Failed to load user analytics');
        showToast(err.message || 'Failed to load user analytics', 'error');
      } finally {
        setLoadingAnalytics(false);
      }
    },
    [username, settings.customGithubToken, showToast]
  );

  // Trigger initial analytics fetch once username is available
  useEffect(() => {
    if (username && !analytics && !loadingAnalytics) {
      refreshAnalytics(username);
    }
  }, [username, analytics, loadingAnalytics, refreshAnalytics]);

  const updateSettings = useCallback(
    async (newSettings: Partial<AppSettings>) => {
      try {
        const updated = await api.saveSettings(newSettings);
        setSettings(updated);
        showToast('Settings successfully updated', 'success');
      } catch (err: any) {
        showToast(err.message || 'Failed to save settings', 'error');
        throw err;
      }
    },
    [showToast]
  );

  return (
    <AppContext.Provider
      value={{
        activePage,
        setActivePage,
        username,
        setUsername,
        analytics,
        loadingAnalytics,
        analyticsError,
        refreshAnalytics,
        theme,
        toggleTheme,
        settings,
        updateSettings,
        selectedOrgForFilter,
        setSelectedOrgForFilter,
        prefillAnalyzePR,
        setPrefillAnalyzePR,
        toasts,
        showToast,
        dismissToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
