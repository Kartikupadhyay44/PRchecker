export type NavigationPage = 
  | 'overview' 
  | 'contributions' 
  | 'organizations' 
  | 'analyze' 
  | 'reports' 
  | 'settings';

export type PRState = 'open' | 'merged' | 'closed';

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  bio: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
}

export interface PullRequestItem {
  id: number;
  number: number;
  title: string;
  html_url: string;
  state: PRState;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  repository: {
    name: string;
    full_name: string;
    owner: string;
    owner_avatar: string;
    is_org: boolean;
    html_url: string;
  };
  additions?: number;
  deletions?: number;
  changed_files?: number;
  author: string;
  author_avatar: string;
}

export interface OrganizationStat {
  name: string;
  avatarUrl: string;
  htmlUrl: string;
  totalPRs: number;
  mergedPRs: number;
  openPRs: number;
  closedPRs: number;
  repositories: string[];
  latestContributionDate: string;
  isOfficialOrg: boolean;
}

export interface MonthlyActivity {
  month: string;
  year: number;
  label: string;
  total: number;
  merged: number;
  open: number;
  closed: number;
}

export interface UserAnalytics {
  user: GitHubUser;
  totalPRs: number;
  mergedPRs: number;
  openPRs: number;
  closedUnmergedPRs: number;
  mergeRate: number;
  distinctReposCount: number;
  distinctOrgsCount: number;
  monthlyActivity: MonthlyActivity[];
  topOrganizations: OrganizationStat[];
  recentPRs: PullRequestItem[];
  allPRs: PullRequestItem[];
  isRateLimited: boolean;
  rateLimitRemaining?: number;
  rateLimitReset?: string;
  cachedAt?: string;
}

export interface ReportFileChange {
  path: string;
  additions: number;
  deletions: number;
  description: string;
  functionsAffected: string[];
  diffSnippet?: string;
}

export interface ReportBeforeAfter {
  area: string;
  before: string;
  after: string;
}

export interface ReportDesignDecision {
  title: string;
  rationale: string;
  alternativesConsidered: string;
}

export interface MeetingQuestionAnswer {
  question: string;
  suggestedAnswer: string;
  context: string;
}

export interface ImportantCodeSnippet {
  filename: string;
  lines: string;
  explanation: string;
  code: string;
}

export interface ReportContent {
  executiveSummary: string;
  problemStatement: string;
  rootCause: string;
  technicalImplementation: {
    overview: string;
    keyFilesChanged: ReportFileChange[];
    beforeAfterBehavior: ReportBeforeAfter[];
    designDecisions: ReportDesignDecision[];
  };
  testingValidation: {
    testStrategy: string;
    automatedTestsAdded: string[];
    ciResults: string;
    manualVerification: string;
  };
  reviewerFeedback: {
    summary: string;
    keyDiscussions: string[];
    revisionsMade: string;
  };
  impactLimitations: {
    impact: string;
    limitations: string[];
    breakingChanges: boolean;
    performanceConsiderations: string;
  };
  meetingPreparation: {
    simpleExplanation: string;
    deepTechnicalExplanation: string;
    twoMinuteScript: string;
    likelyQuestions: MeetingQuestionAnswer[];
    importantCodeSnippets: ImportantCodeSnippet[];
  };
  references: Array<{
    title: string;
    url: string;
    type: 'issue' | 'pr' | 'commit' | 'file' | 'doc';
  }>;
}

export interface ReportDocument {
  id: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
  pr: {
    number: number;
    title: string;
    url: string;
    repo: string;
    org: string;
    author: string;
    authorAvatar: string;
    state: PRState;
    additions: number;
    deletions: number;
    changedFiles: number;
    baseBranch: string;
    headBranch: string;
    mergedAt?: string | null;
  };
  issue?: {
    number: number;
    title: string;
    url: string;
    state: string;
    author: string;
    body: string;
  } | null;
  report: ReportContent;
  pdfUrl?: string;
  pdfPath?: string;
  emailDelivery?: {
    recipient: string;
    sent: boolean;
    sentAt?: string;
    error?: string;
    messageId?: string;
  };
}

export type GenerationStage = 
  | 'fetching_github'
  | 'reading_code'
  | 'analyzing_implementation'
  | 'preparing_documentation'
  | 'generating_pdf'
  | 'sending_email'
  | 'completed'
  | 'failed';

export interface StageUpdate {
  stage: GenerationStage;
  label: string;
  progress: number;
  detail?: string;
  timestamp: string;
}

export interface AppSettings {
  githubUsername: string;
  preferredEmail: string;
  theme: 'light' | 'dark' | 'system';
  customOpenAiKey?: string;
  customGithubToken?: string;
  customResendKey?: string;
  autoSendEmail: boolean;
  includeDiffsInReport: boolean;
}
