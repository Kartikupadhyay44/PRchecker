import { Octokit } from '@octokit/rest';
import { config } from '../config/index.js';
import {
  GitHubUser,
  PullRequestItem,
  UserAnalytics,
  OrganizationStat,
  MonthlyActivity,
  PRState,
} from '../types/index.js';
import { CacheModel, memoryCache } from '../models/Cache.js';

export class GitHubService {
  private getClient(customToken?: string): Octokit {
    const token = customToken || config.githubToken;
    return new Octokit(token ? { auth: token } : {});
  }

  // Parse GitHub issue or PR url
  public parseUrl(url: string): { owner: string; repo: string; type: 'pull' | 'issues'; number: number } | null {
    if (!url || typeof url !== 'string') return null;
    const cleanUrl = url.trim();
    // Match https://github.com/:owner/:repo/(pull|issues)/:number
    const match = cleanUrl.match(/^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/(pull|issues)\/(\d+)/i);
    if (!match) return null;

    return {
      owner: match[1],
      repo: match[2],
      type: match[3].toLowerCase() === 'pull' ? 'pull' : 'issues',
      number: parseInt(match[4], 10),
    };
  }

  // Fetch GitHub User profile
  public async getUser(username: string, customToken?: string): Promise<GitHubUser> {
    const cacheKey = `gh_user_${username.toLowerCase()}`;
    const cached = memoryCache.get<GitHubUser>(cacheKey);
    if (cached) return cached;

    const octokit = this.getClient(customToken);
    const { data } = await octokit.users.getByUsername({ username });

    const user: GitHubUser = {
      login: data.login,
      id: data.id,
      avatar_url: data.avatar_url,
      html_url: data.html_url,
      name: data.name,
      bio: data.bio,
      company: data.company,
      blog: data.blog,
      location: data.location,
      public_repos: data.public_repos,
      followers: data.followers,
      following: data.following,
      created_at: data.created_at,
    };

    memoryCache.set(cacheKey, user, 1800);
    return user;
  }

  // Fetch all user authored PRs and compute analytics
  public async getUserAnalytics(username: string, customToken?: string): Promise<UserAnalytics> {
    const cleanUsername = username.trim().toLowerCase();
    const cacheKey = `gh_analytics_${cleanUsername}`;

    // Check memory cache
    const cached = memoryCache.get<UserAnalytics>(cacheKey);
    if (cached) return cached;

    // Check Mongo cache if available
    try {
      const dbCached = await CacheModel.findOne({ key: cacheKey });
      if (dbCached && dbCached.data) {
        memoryCache.set(cacheKey, dbCached.data, 1800);
        return dbCached.data as UserAnalytics;
      }
    } catch {
      // Ignore DB cache errors
    }

    const octokit = this.getClient(customToken);
    const user = await this.getUser(cleanUsername, customToken);

    let isRateLimited = false;
    let rateLimitRemaining: number | undefined;
    let rateLimitReset: string | undefined;

    try {
      const rateLimitRes = await octokit.rateLimit.get();
      rateLimitRemaining = rateLimitRes.data.rate.remaining;
      rateLimitReset = new Date(rateLimitRes.data.rate.reset * 1000).toISOString();
      if (rateLimitRemaining === 0) {
        isRateLimited = true;
      }
    } catch {
      // Continue even if rate limit check fails
    }

    // Search authored PRs: `type:pr author:${cleanUsername}`
    // Fetch up to 100 most recent PRs
    let rawItems: any[] = [];
    try {
      const searchRes = await octokit.search.issuesAndPullRequests({
        q: `type:pr author:${cleanUsername}`,
        sort: 'created',
        order: 'desc',
        per_page: 100,
      });
      rawItems = searchRes.data.items;
    } catch (err: any) {
      if (err.status === 403 || err.message?.includes('rate limit')) {
        isRateLimited = true;
      } else {
        throw err;
      }
    }

    // Process and classify PRs
    const allPRs: PullRequestItem[] = [];
    let mergedCount = 0;
    let openCount = 0;
    let closedUnmergedCount = 0;

    const orgsMap = new Map<
      string,
      {
        name: string;
        avatarUrl: string;
        htmlUrl: string;
        totalPRs: number;
        mergedPRs: number;
        openPRs: number;
        closedPRs: number;
        repos: Set<string>;
        latestDate: string;
        isOfficialOrg: boolean;
      }
    >();

    const distinctRepos = new Set<string>();
    const monthlyMap = new Map<string, { total: number; merged: number; open: number; closed: number; date: Date }>();

    for (const item of rawItems) {
      // Determine state accurately
      let state: PRState = 'closed';
      if (item.state === 'open') {
        state = 'open';
        openCount++;
      } else if (item.pull_request?.merged_at) {
        state = 'merged';
        mergedCount++;
      } else {
        state = 'closed';
        closedUnmergedCount++;
      }

      // Extract repo & owner info
      // item.repository_url looks like: https://api.github.com/repos/facebook/react
      const repoUrlParts = item.repository_url?.split('/') || [];
      const repoName = repoUrlParts[repoUrlParts.length - 1] || 'repository';
      const ownerName = repoUrlParts[repoUrlParts.length - 2] || 'unknown';
      const repoFullName = `${ownerName}/${repoName}`;

      distinctRepos.add(repoFullName);

      const prItem: PullRequestItem = {
        id: item.id,
        number: item.number,
        title: item.title,
        html_url: item.html_url,
        state,
        created_at: item.created_at,
        updated_at: item.updated_at,
        closed_at: item.closed_at,
        merged_at: item.pull_request?.merged_at || null,
        repository: {
          name: repoName,
          full_name: repoFullName,
          owner: ownerName,
          owner_avatar: `https://github.com/${ownerName}.png?size=80`,
          is_org: ownerName.toLowerCase() !== cleanUsername.toLowerCase(),
          html_url: `https://github.com/${repoFullName}`,
        },
        author: item.user?.login || cleanUsername,
        author_avatar: item.user?.avatar_url || user.avatar_url,
      };

      allPRs.push(prItem);

      // Track Organization / Owner stats
      const isOfficialOrg = ownerName.toLowerCase() !== cleanUsername.toLowerCase();
      const existingOrg = orgsMap.get(ownerName) || {
        name: ownerName,
        avatarUrl: `https://github.com/${ownerName}.png?size=80`,
        htmlUrl: `https://github.com/${ownerName}`,
        totalPRs: 0,
        mergedPRs: 0,
        openPRs: 0,
        closedPRs: 0,
        repos: new Set<string>(),
        latestDate: item.created_at,
        isOfficialOrg,
      };

      existingOrg.totalPRs++;
      if (state === 'merged') existingOrg.mergedPRs++;
      else if (state === 'open') existingOrg.openPRs++;
      else existingOrg.closedPRs++;

      existingOrg.repos.add(repoName);
      if (new Date(item.created_at) > new Date(existingOrg.latestDate)) {
        existingOrg.latestDate = item.created_at;
      }
      orgsMap.set(ownerName, existingOrg);

      // Monthly aggregation
      const d = new Date(item.created_at);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const existingMonth = monthlyMap.get(monthKey) || {
        total: 0,
        merged: 0,
        open: 0,
        closed: 0,
        date: new Date(d.getFullYear(), d.getMonth(), 1),
      };

      existingMonth.total++;
      if (state === 'merged') existingMonth.merged++;
      else if (state === 'open') existingMonth.open++;
      else existingMonth.closed++;

      monthlyMap.set(monthKey, existingMonth);
    }

    // Classification Rule: Total PRs = Merged + Open + Closed Unmerged
    const totalPRs = mergedCount + openCount + closedUnmergedCount;
    const mergeRate = totalPRs > 0 ? Math.round((mergedCount / totalPRs) * 100) : 0;

    // Convert orgs to array and sort by totalPRs
    const topOrganizations: OrganizationStat[] = Array.from(orgsMap.values())
      .map((org) => ({
        name: org.name,
        avatarUrl: org.avatarUrl,
        htmlUrl: org.htmlUrl,
        totalPRs: org.totalPRs,
        mergedPRs: org.mergedPRs,
        openPRs: org.openPRs,
        closedPRs: org.closedPRs,
        repositories: Array.from(org.repos),
        latestContributionDate: org.latestDate,
        isOfficialOrg: org.isOfficialOrg,
      }))
      .sort((a, b) => b.totalPRs - a.totalPRs);

    // Format monthly activity sorted chronologically
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const sortedMonthKeys = Array.from(monthlyMap.keys()).sort();

    // Ensure we have at least the last 6 months represented
    const monthlyActivity: MonthlyActivity[] = sortedMonthKeys.map((key) => {
      const data = monthlyMap.get(key)!;
      const [yearStr, monthStr] = key.split('-');
      const year = parseInt(yearStr, 10);
      const monthIndex = parseInt(monthStr, 10) - 1;
      return {
        month: monthNames[monthIndex],
        year,
        label: `${monthNames[monthIndex]} '${String(year).slice(2)}`,
        total: data.total,
        merged: data.merged,
        open: data.open,
        closed: data.closed,
      };
    });

    const analytics: UserAnalytics = {
      user,
      totalPRs,
      mergedPRs: mergedCount,
      openPRs: openCount,
      closedUnmergedPRs: closedUnmergedCount,
      mergeRate,
      distinctReposCount: distinctRepos.size,
      distinctOrgsCount: topOrganizations.length,
      monthlyActivity,
      topOrganizations,
      recentPRs: allPRs.slice(0, 10),
      allPRs,
      isRateLimited,
      rateLimitRemaining,
      rateLimitReset,
      cachedAt: new Date().toISOString(),
    };

    // Store in cache
    memoryCache.set(cacheKey, analytics, 1800);
    try {
      await CacheModel.findOneAndUpdate(
        { key: cacheKey },
        { data: analytics, createdAt: new Date() },
        { upsert: true }
      );
    } catch {
      // Ignore DB cache errors
    }

    return analytics;
  }

  // Retrieve comprehensive PR and code diff details
  public async getPRDetails(owner: string, repo: string, pullNumber: number, customToken?: string) {
    const octokit = this.getClient(customToken);

    // Fetch PR info
    const { data: pr } = await octokit.pulls.get({
      owner,
      repo,
      pull_number: pullNumber,
    });

    // Fetch changed files (up to 100 files)
    let files: any[] = [];
    try {
      const filesRes = await octokit.pulls.listFiles({
        owner,
        repo,
        pull_number: pullNumber,
        per_page: 100,
      });
      files = filesRes.data;
    } catch (e) {
      console.warn(`Could not list files for ${owner}/${repo}#${pullNumber}:`, e);
    }

    // Fetch commits
    let commits: any[] = [];
    try {
      const commitsRes = await octokit.pulls.listCommits({
        owner,
        repo,
        pull_number: pullNumber,
        per_page: 50,
      });
      commits = commitsRes.data.map((c) => ({
        sha: c.sha.substring(0, 7),
        message: c.commit.message,
        author: c.commit.author?.name || 'Contributor',
        date: c.commit.author?.date,
      }));
    } catch {
      // Commits list error fallback
    }

    // Fetch review comments
    let comments: any[] = [];
    try {
      const commentsRes = await octokit.issues.listComments({
        owner,
        repo,
        issue_number: pullNumber,
        per_page: 30,
      });
      comments = commentsRes.data.map((c) => ({
        user: c.user?.login || 'reviewer',
        body: c.body,
        created_at: c.created_at,
      }));
    } catch {
      // Comments error fallback
    }

    return {
      number: pr.number,
      title: pr.title,
      body: pr.body || '',
      state: (pr.merged_at ? 'merged' : pr.state) as PRState,
      url: pr.html_url,
      author: pr.user?.login || 'author',
      authorAvatar: pr.user?.avatar_url || '',
      baseBranch: pr.base.ref,
      headBranch: pr.head.ref,
      additions: pr.additions,
      deletions: pr.deletions,
      changedFiles: pr.changed_files,
      mergedAt: pr.merged_at,
      createdAt: pr.created_at,
      updatedAt: pr.updated_at,
      commits,
      comments,
      files: files.map((f) => ({
        filename: f.filename,
        status: f.status,
        additions: f.additions,
        deletions: f.deletions,
        changes: f.changes,
        patch: f.patch ? f.patch.slice(0, 1000) : '', // Keep relevant snippet
      })),
    };
  }

  // Retrieve Issue details
  public async getIssueDetails(owner: string, repo: string, issueNumber: number, customToken?: string) {
    const octokit = this.getClient(customToken);

    const { data: issue } = await octokit.issues.get({
      owner,
      repo,
      issue_number: issueNumber,
    });

    let comments: string[] = [];
    try {
      const commentsRes = await octokit.issues.listComments({
        owner,
        repo,
        issue_number: issueNumber,
        per_page: 20,
      });
      comments = commentsRes.data.map((c) => `${c.user?.login}: ${c.body}`);
    } catch {
      // Continue
    }

    return {
      number: issue.number,
      title: issue.title,
      body: issue.body || '',
      state: issue.state,
      url: issue.html_url,
      author: issue.user?.login || 'reporter',
      labels: issue.labels.map((l: any) => (typeof l === 'string' ? l : l.name)),
      comments,
    };
  }
}

export const githubService = new GitHubService();
