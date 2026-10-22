import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Settings,
  Github,
  Mail,
  Sun,
  Moon,
  Key,
  Save,
  CheckCircle2,
  Shield,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, showToast, refreshAnalytics, username, setUsername } = useApp();

  const [form, setForm] = useState({
    githubUsername: settings.githubUsername || username,
    preferredEmail: settings.preferredEmail || '',
    theme: settings.theme || 'dark',
    customOpenAiKey: settings.customOpenAiKey || '',
    customGithubToken: settings.customGithubToken || '',
    customResendKey: settings.customResendKey || '',
    autoSendEmail: settings.autoSendEmail || false,
    includeDiffsInReport: settings.includeDiffsInReport !== false,
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateSettings(form);
      if (form.githubUsername && form.githubUsername !== username) {
        setUsername(form.githubUsername);
        refreshAnalytics(form.githubUsername);
      }
    } catch {
      // Error handled in context
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="p-6 rounded-2xl bg-card border border-border shadow-subtle space-y-6">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" /> Application Settings
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Configure your default profile, delivery email, and optional external API credentials.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Profile & Defaults */}
          <div className="space-y-4 pt-2 border-t border-border">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Profile & Preferences
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Github className="w-3.5 h-3.5 text-muted-foreground" /> Connected GitHub Profile
                </label>
                <input
                  type="text"
                  placeholder="e.g. torvalds, shadcn"
                  value={form.githubUsername}
                  onChange={(e) => setForm({ ...form, githubUsername: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs outline-none focus:border-primary transition-colors"
                />
                <p className="text-[11px] text-muted-foreground">
                  Default handle loaded on overview and contribution explorer.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" /> Preferred Email Address
                </label>
                <input
                  type="email"
                  placeholder="developer@company.com"
                  value={form.preferredEmail}
                  onChange={(e) => setForm({ ...form, preferredEmail: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs outline-none focus:border-primary transition-colors"
                />
                <p className="text-[11px] text-muted-foreground">
                  Pre-fills the delivery address when generating or emailing reports.
                </p>
              </div>
            </div>

            {/* Theme Preference */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Theme Preference</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, theme: 'dark' })}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                    form.theme === 'dark'
                      ? 'bg-muted border-primary text-foreground font-semibold'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Dark Mode (Recommended)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, theme: 'light' })}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                    form.theme === 'light'
                      ? 'bg-muted border-primary text-foreground font-semibold'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Light Mode</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Custom API Credentials */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-primary" /> API Credentials (Optional)
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  MergeMemo works out-of-the-box with built-in engines. Adding your own keys unlocks higher rate limits and customized models.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {/* OpenAI Key */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-foreground flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-muted-foreground" /> OpenAI API Key
                  </label>
                  <span className="text-[10px] text-muted-foreground">Stored securely</span>
                </div>
                <input
                  type="password"
                  placeholder="sk-proj-..."
                  value={form.customOpenAiKey}
                  onChange={(e) => setForm({ ...form, customOpenAiKey: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs font-mono outline-none focus:border-primary transition-colors"
                />
              </div>

              {/* GitHub Token */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-foreground flex items-center gap-1.5">
                    <Github className="w-3.5 h-3.5 text-muted-foreground" /> GitHub Personal Access Token
                  </label>
                  <a
                    href="https://github.com/settings/tokens"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-primary hover:underline inline-flex items-center gap-0.5"
                  >
                    Generate token <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <input
                  type="password"
                  placeholder="ghp_..."
                  value={form.customGithubToken}
                  onChange={(e) => setForm({ ...form, customGithubToken: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs font-mono outline-none focus:border-primary transition-colors"
                />
                <p className="text-[11px] text-muted-foreground">
                  Raises GitHub API rate limit from 60 to 5,000 requests/hour.
                </p>
              </div>

              {/* Resend API Key */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-foreground flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" /> Resend API Key
                  </label>
                  <a
                    href="https://resend.com/api-keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-primary hover:underline inline-flex items-center gap-0.5"
                  >
                    Get API key <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <input
                  type="password"
                  placeholder="re_..."
                  value={form.customResendKey}
                  onChange={(e) => setForm({ ...form, customResendKey: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs font-mono outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Report Preferences */}
          <div className="space-y-3 pt-4 border-t border-border">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Report Generation Preferences
            </h3>

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
                <input
                  type="checkbox"
                  checked={form.includeDiffsInReport}
                  onChange={(e) => setForm({ ...form, includeDiffsInReport: e.target.checked })}
                  className="rounded border-border text-primary focus:ring-0"
                />
                <span>Include code diff snippets in file breakdowns</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
                <input
                  type="checkbox"
                  checked={form.autoSendEmail}
                  onChange={(e) => setForm({ ...form, autoSendEmail: e.target.checked })}
                  className="rounded border-border text-primary focus:ring-0"
                />
                <span>Automatically email report upon successful generation</span>
              </label>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-border flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving Changes...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
