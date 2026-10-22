import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Settings,
  X,
  Key,
  Mail,
  Github,
  Save,
  Shield,
  HelpCircle,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, username, setUsername, refreshAnalytics } = useApp();

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

  useEffect(() => {
    if (isOpen) {
      setForm({
        githubUsername: settings.githubUsername || username,
        preferredEmail: settings.preferredEmail || '',
        theme: settings.theme || 'dark',
        customOpenAiKey: settings.customOpenAiKey || '',
        customGithubToken: settings.customGithubToken || '',
        customResendKey: settings.customResendKey || '',
        autoSendEmail: settings.autoSendEmail || false,
        includeDiffsInReport: settings.includeDiffsInReport !== false,
      });
    }
  }, [isOpen, settings, username]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateSettings(form);
      if (form.githubUsername && form.githubUsername !== username) {
        setUsername(form.githubUsername);
        refreshAnalytics(form.githubUsername);
      }
      onClose();
    } catch {
      // Toast handles error
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-2xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Preferences & API Keys</h2>
              <p className="text-xs text-muted-foreground">Manage credentials and delivery defaults</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* GitHub Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Github className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Default GitHub Username</span>
            </label>
            <input
              type="text"
              value={form.githubUsername}
              onChange={(e) => setForm({ ...form, githubUsername: e.target.value })}
              placeholder="e.g. shadcn"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs font-mono outline-none focus:border-primary"
            />
          </div>

          {/* GitHub Token */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-muted-foreground" />
                <span>GitHub Personal Access Token</span>
              </label>
              <a
                href="https://github.com/settings/tokens"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-primary hover:underline flex items-center gap-1"
              >
                Generate Token <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <input
              type="password"
              value={form.customGithubToken}
              onChange={(e) => setForm({ ...form, customGithubToken: e.target.value })}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs font-mono outline-none focus:border-primary"
            />
            <p className="text-[11px] text-muted-foreground">
              Boosts rate limits from 60 req/hr to 5,000 req/hr. Kept local & secure.
            </p>
          </div>

          {/* Preferred Delivery Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Default Delivery Email</span>
            </label>
            <input
              type="email"
              value={form.preferredEmail}
              onChange={(e) => setForm({ ...form, preferredEmail: e.target.value })}
              placeholder="engineer@company.com"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs outline-none focus:border-primary"
            />
            <p className="text-[11px] text-muted-foreground">
              Auto-fills when sending generated PDF technical briefings.
            </p>
          </div>

          {/* OpenAI API Key */}
          <div className="space-y-1.5 pt-2 border-t border-border">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Custom OpenAI API Key (Optional)</span>
            </label>
            <input
              type="password"
              value={form.customOpenAiKey}
              onChange={(e) => setForm({ ...form, customOpenAiKey: e.target.value })}
              placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs font-mono outline-none focus:border-primary"
            />
            <p className="text-[11px] text-muted-foreground">
              If omitted, MergeMemo uses its built-in grounded code intelligence engine.
            </p>
          </div>

          {/* Checkboxes */}
          <div className="pt-2 border-t border-border space-y-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.includeDiffsInReport}
                onChange={(e) => setForm({ ...form, includeDiffsInReport: e.target.checked })}
                className="rounded border-border text-primary focus:ring-primary w-4 h-4"
              />
              <span className="text-xs text-foreground font-medium">
                Include syntax-highlighted code diffs in PDF reports
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.autoSendEmail}
                onChange={(e) => setForm({ ...form, autoSendEmail: e.target.checked })}
                className="rounded border-border text-primary focus:ring-primary w-4 h-4"
              />
              <span className="text-xs text-foreground font-medium">
                Automatically dispatch PDF email upon report completion
              </span>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg border border-border hover:bg-muted text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Preferences</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
