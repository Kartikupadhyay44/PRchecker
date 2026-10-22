import {
  UserAnalytics,
  ReportDocument,
  AppSettings,
} from '../types';

const API_BASE = '/api';

export const api = {
  // Fetch user analytics
  async getAnalytics(username: string, token?: string): Promise<UserAnalytics> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['x-github-token'] = token;
    }

    const res = await fetch(`${API_BASE}/github/user/${encodeURIComponent(username)}`, {
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to fetch analytics' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    return res.json();
  },

  // Validate GitHub URL
  async validateUrl(url: string) {
    const res = await fetch(`${API_BASE}/github/validate-url?url=${encodeURIComponent(url)}`);
    return res.json();
  },

  // Start PR report generation pipeline
  async startAnalysis(payload: {
    prUrl: string;
    issueUrl?: string;
    email?: string;
    customGithubToken?: string;
    customOpenAiKey?: string;
    customResendKey?: string;
  }): Promise<{ jobId: string }> {
    const res = await fetch(`${API_BASE}/analyze/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to start analysis' }));
      throw new Error(err.error || 'Failed to start analysis');
    }

    return res.json();
  },

  // Check job status
  async checkAnalysisStatus(jobId: string): Promise<{
    status: 'running' | 'done' | 'error';
    result?: ReportDocument;
    error?: string;
  }> {
    const res = await fetch(`${API_BASE}/analyze/status/${jobId}`);
    if (!res.ok) {
      throw new Error('Failed to retrieve job status');
    }
    return res.json();
  },

  // Fetch all saved reports
  async getAllReports(params?: { search?: string; repo?: string; state?: string }): Promise<ReportDocument[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.repo) query.append('repo', params.repo);
    if (params?.state) query.append('state', params.state);

    const res = await fetch(`${API_BASE}/reports?${query.toString()}`);
    if (!res.ok) {
      throw new Error('Failed to fetch reports');
    }
    return res.json();
  },

  // Fetch single report by ID
  async getReportById(id: string): Promise<ReportDocument> {
    const res = await fetch(`${API_BASE}/reports/${id}`);
    if (!res.ok) {
      throw new Error('Report not found');
    }
    return res.json();
  },

  // Email report
  async emailReport(id: string, email: string): Promise<{ sent: boolean; messageId?: string; error?: string }> {
    const res = await fetch(`${API_BASE}/reports/${id}/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return res.json();
  },

  // Get settings
  async getSettings(): Promise<AppSettings> {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) {
      throw new Error('Failed to load settings');
    }
    return res.json();
  },

  // Save settings
  async saveSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!res.ok) {
      throw new Error('Failed to save settings');
    }
    return res.json();
  },
};
