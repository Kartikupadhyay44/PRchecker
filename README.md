# PRchecker / MergeMemo AI — GitHub PR Intelligence & Documentation Platform

> **Turn your code into clarity.** A production-grade AI-powered GitHub contribution analytics and technical documentation platform designed for engineers, engineering managers, and technical leads.

---

## 🌟 Overview

**PRchecker (MergeMemo AI)** transforms raw GitHub pull requests and commit diffs into executive-ready technical intelligence briefings, meeting standup presentation scripts, and downloadable PDF documentation. It combines real-time GitHub REST & GraphQL API data, accurate PR classification, organization discovery, and AI analysis.

---

## ✨ Key Capabilities

1. **GitHub Contributor Analytics**
   - Author lookups across public GitHub profiles (e.g. `@shadcn`, `@torvalds`, `@gaearon`).
   - Strict classification: **`Total PRs = Merged + Open + Closed Unmerged`**.
   - Merge rate tracking and monthly contribution activity cadence charts.
   - PR status distribution donut with animated hover telemetry.

2. **Organization & Ecosystem Explorer**
   - Discovers which organizations and namespaces receive the user's PRs.
   - Distinguishes **official organization accounts** from independently owned repositories.
   - One-click drill-down to filter all contributions for any given organization.

3. **Searchable PR Management Directory**
   - Filter by status (`Merged`, `Open`, `Closed`), repository, organization, or query.
   - Direct action buttons to view on GitHub or launch a one-click AI analysis.
   - Pagination, sorting, and restrained developer status color tokens (Purple for Merged, Green for Open, Slate for Closed).

4. **"Turn Your Code Into Clarity" — AI PR & Issue Analysis**
   - Input fields for **GitHub Pull Request URL** and optional **GitHub Issue URL**.
   - Real-time **6-stage backend processing pipeline**:
     1. Fetching GitHub data & metadata
     2. Reading code changes & commit diffs
     3. Analyzing implementation & architecture
     4. Preparing documentation & briefing
     5. Generating high-resolution technical PDF
     6. Dispatching report via email
   - Full structured preview with tabs:
     - **Executive Summary & Problem:** Problem statement, root cause, production impact, constraints.
     - **Technical Implementation:** File-by-file breakdown with diff snippets, before-and-after behavior matrix, architectural design decisions and alternatives considered.
     - **Validation & Reviews:** Test strategies, automated tests added, CI matrix results, reviewer feedback.
     - **Meeting Preparation:** **2-Minute Presentation Script** (word-for-word standup elevator pitch), simple explanation (product/stakeholders), deep technical explanation (architects/staff), likely maintainer questions with recommended answers, and key code snippets to showcase.

5. **Executive PDF Documentation**
   - High-fidelity PDF generated via headless Chrome (`puppeteer-core`).
   - Includes branded cover page, metadata summary, file diffs, testing breakdown, and meeting briefing.

6. **Email Delivery via Resend**
   - Automatically attaches the generated PDF report to an email.
   - Built-in resilient delivery simulator if API keys are not supplied.

7. **Reports Library & Settings**
   - Persistent report storage in MongoDB with memory fallback.
   - Searchable document reader modal for quick review before engineering reviews.
   - Configurable settings for GitHub personal tokens, OpenAI keys, Resend credentials, and Dark/Light themes.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Tailwind CSS, Lucide React, Framer Motion, Recharts, Canvas Confetti |
| **Backend** | Node.js, Express, ES Modules, TypeScript (`tsx`) |
| **GitHub Integration** | `@octokit/rest` (Search API, Pulls API, Issues API, Rate Limit handling) |
| **AI Engine** | OpenAI API (`gpt-4o`) with grounded deterministic fallback engine |
| **Database** | MongoDB (`mongoose`) with automatic resilient memory cache fallback |
| **PDF Generation** | Puppeteer Core (macOS Google Chrome headless engine) |
| **Email Delivery** | Resend API with automated delivery status tracking |

---

## 📁 Project Structure

```
PRchecker/
├── client/                     # React 18 + TypeScript + Vite Frontend
│   ├── src/
│   │   ├── components/layout/  # Sidebar, TopBar, GlobalSearchModal
│   │   ├── components/ui/      # ToastContainer, cards, badges
│   │   ├── context/            # AppContext (analytics, theme, settings, toasts)
│   │   ├── pages/              # Overview, Contributions, Organizations, AnalyzePR, Reports, Settings
│   │   ├── services/           # api.ts (REST client & SSE listeners)
│   │   ├── types.ts            # Frontend data models
│   │   ├── App.tsx             # Root layout and view controller
│   │   ├── main.tsx            # Application entrypoint
│   │   └── index.css           # Design tokens, themes, and base styles
│   ├── index.html              # HTML shell with Google Fonts
│   ├── tailwind.config.js      # Custom theme colors and status tokens
│   ├── vite.config.ts          # Bundler configuration and API proxy
│   └── package.json            # Client workspace dependencies
├── server/                     # Node.js + Express + TypeScript Backend
│   ├── src/
│   │   ├── config/             # Environment configuration & directory resolver
│   │   ├── models/             # Report.ts, UserSettings.ts, Cache.ts (Mongoose)
│   │   ├── routes/             # GitHub, Analyze, Reports, and Settings routers
│   │   ├── services/           # GitHub, AI, PDF, Email, and Report services
│   │   ├── types/              # Backend TypeScript interfaces and schemas
│   │   └── server.ts           # Express server bootstrap & MongoDB connection
│   ├── test/                   # Node test runner suite
│   │   └── analytics-and-reports.test.ts
│   ├── storage/pdfs/           # PDF storage directory
│   ├── tsconfig.json           # Server TypeScript configuration
│   └── package.json            # Server workspace dependencies
├── .env.example                # Safe environment template
├── .gitignore                  # Strict Git exclusion rules
├── package.json                # Root monorepo workspace configuration
└── README.md                   # Project documentation
```

---

## 🚀 Quickstart & Setup

### Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- MongoDB running locally on port 27017 (optional; automatic fallback included)
- Google Chrome installed (for PDF rendering)

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/Kartikupadhyay44/PRchecker.git
cd PRchecker

# Install dependencies across all workspaces
npm install
```

### 2. Environment Configuration

Copy the sample environment file:

```bash
cp .env.example .env
cp .env.example server/.env
```

Configuration variables in `.env`:

```env
PORT=5001
MONGODB_URI=mongodb://127.0.0.1:27017/mergememo
CLIENT_URL=http://localhost:3000

# Optional: Add external API keys for enhanced limits
OPENAI_API_KEY=
GITHUB_TOKEN=
RESEND_API_KEY=
RESEND_FROM_EMAIL=reports@mergememo.ai
```

*(Note: If you leave `OPENAI_API_KEY`, `GITHUB_TOKEN`, and `RESEND_API_KEY` blank, PRchecker runs seamlessly using its built-in grounded analysis engine, unauthenticated GitHub endpoints, and delivery simulator).*

### 3. Run Development Servers

#### Option A: Run Both Concurrently (Recommended)
```bash
npm run dev
```

#### Option B: Run Workspaces Independently
```bash
# In Terminal 1 (Backend API)
npm run dev:server

# In Terminal 2 (Frontend Client)
npm run dev:client
```

Open your browser to: **`http://localhost:3000`**

---

## 🧪 Testing & Verification

Run the automated test suite verifying URL parsing, PR classification calculations, grounded report generation, and email dispatch:

```bash
npm test
```

Build verification commands:
```bash
# Validate client TypeScript and build
npm run build --workspace=client

# Validate server TypeScript and build
npm run build --workspace=server
```

---

## 🎨 UI/UX Design System

The visual design is inspired by modern developer platforms like **Linear**, **Vercel**, **GitHub**, and **Raycast**:

- **Palette**: Deep navy/slate background (`#090D16`) in Dark Mode and crisp off-white (`#F8FAFC`) in Light Mode.
- **Status Badges**:
  - `Merged`: `#8957e5` (Purple)
  - `Open`: `#238636` (Green)
  - `Closed`: `#6e7681` (Slate Gray)
- **Typography**: Inter for UI and JetBrains Mono for commit hashes, file paths, and diffs.
- **Interactions**:
  - Keyboard shortcut **`⌘K` / `Ctrl+K`** opens the Global Command Palette.
  - One-click copy for the 2-minute meeting speech.
  - Real-time Server-Sent Events (SSE) for 6-stage progress tracking.

---

## 🔮 Future Improvements

- [ ] GitHub OAuth integration for private repository analysis and automated review comments
- [ ] Automated Slack and Microsoft Teams webhook notifications for newly published reports
- [ ] Self-hosted local LLM engine support via Ollama and vLLM
- [ ] Multi-contributor team comparison and shared engineering review dashboards

---

## 📜 License

MIT License. Built with passion for open-source contributors and engineering teams.
