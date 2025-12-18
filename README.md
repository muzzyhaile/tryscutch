<div align="center">
  <div style="background-color: black; color: white; width: 60px; height: 60px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 24px; margin: 0 auto 20px auto;">C</div>
   <h1>Scutch</h1>
   <p><strong>Scutch — turn raw feedback into clarity, in minutes.</strong></p>
</div>

<br />

Scutch is a powerful Voice of Customer (VoC) tool designed to instantly analyze raw feedback. Upload your data and get automatic themes, sentiment analysis, and strategic insights powered by Google's Gemini AI—no complex integrations or setup required.

## ✨ Features

- **Instant Analysis**: Upload your feedback files and get results in seconds.
- **AI-Powered Insights**: Leverages Google Gemini to identify themes, sentiment, and actionable strategic advice.
- **Visual Reports**: Interactive charts and visualizations to understand your data at a glance.
- **Smart Clustering**: Automatically groups similar feedback into meaningful clusters with priority scores.
- **Export Options**: Download your analysis as a PDF report or raw JSON data.


## 🚀 Run Locally

Follow these steps to get Scutch running on your local machine.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- A Google Gemini API Key ([Get one here](https://aistudio.google.com/app/apikey))
- A Supabase project (Auth + Postgres) for persistence

### Google OAuth (Supabase Auth)

This app is configured to use **Google sign-in only** via Supabase Auth.

#### 1) Create the Google OAuth Client

In Google Cloud Console:

- Go to **APIs & Services → Credentials → Create credentials → OAuth client ID**
- **Application type**: Web application
- **Name**: anything (e.g. “Scutch oauth”)

**Authorized JavaScript origins** (browser origins):

- `http://localhost:3000`
- `https://YOUR_PRODUCTION_DOMAIN` (when you deploy)

**Authorized redirect URIs**:

- `https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback`

Notes:

- You must also configure the **OAuth consent screen** (brand name, support email, etc.).
- If your Supabase project uses a **custom domain**, the redirect URI must use that custom domain instead.

#### 2) Enable Google Provider in Supabase

In Supabase Dashboard:

- Go to **Authentication → Providers → Google**
- Enable Google
- Paste your **Google Client ID** and **Client Secret**

Then go to **Authentication → URL Configuration**:

- **Site URL**: `http://localhost:3000`
- **Additional Redirect URLs**:
   - `http://localhost:3000/*`
   - `https://YOUR_PRODUCTION_DOMAIN/*`

#### 3) Run locally

This repo runs Vite on port `3000` (see `vite.config.ts`).

```bash
npm install
npm run dev
```

Then click **Continue with Google** on the login screen.

### Installation

1. **Clone the repository** (if applicable) or download the source.

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment**:
   Create a `.env.local` file in the root directory and add your keys:
   ```env
   VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
   ```

   Notes:
   - New Supabase projects may show a **Publishable key** (starts with `sb_publishable_...`). Use that.
   - This app also supports the legacy env var name `VITE_SUPABASE_ANON_KEY` for compatibility.
   - Gemini runs server-side in a Supabase Edge Function. Set `GEMINI_API_KEY` in Supabase Dashboard → Edge Functions → Secrets (not in `.env.local`).

   Deploy the Edge Function from this repo:
   ```bash
   supabase functions deploy gemini --project-ref <your-project-ref>
   ```

   See `.env.example` for the expected variables.

4. **Run the app**:
   ```bash
   npm run dev
   ```

5. **Open in Browser**:
   Navigate to http://localhost:3000 (configured in vite.config.ts).

## 🛠️ Tech Stack

- **Framework**: React 19 + Vite
- **Language**: TypeScript
- **AI Model**: Google Gemini (via Supabase Edge Function)
- **Styling**: Tailwind CSS + Lucide React
- **Visualization**: Recharts
- **Export**: html2canvas, jspdf
- **Testing**: Vitest + React Testing Library
- **CI/CD**: GitHub Actions

## 🏗️ Architecture

Scutch follows SOLID principles and clean architecture patterns:

### Design Patterns

- **Repository Pattern**: Storage abstraction layer (`lib/storage.ts`) separates data persistence from business logic
- **Strategy Pattern**: AI service abstraction (`lib/aiService.ts`) allows swapping AI providers without code changes
- **Custom Hooks**: Separation of concerns with `useProjects`, `useContextData`, `useForms`, `useLanguage`
- **Error Boundaries**: React error boundaries catch and display errors gracefully

### Project Structure

```
claritytool/
├── components/      # React UI components
├── services/        # Legacy service layer (being phased out)
├── lib/            # Core abstractions and utilities
│   ├── storage.ts         # Storage abstraction (Repository pattern)
│   ├── aiService.ts       # AI service abstraction (Strategy pattern)
│   └── geminiProvider.ts  # Gemini AI implementation
├── hooks/          # Custom React hooks
│   ├── useProjects.ts
│   ├── useContextData.ts
│   ├── useForms.ts
│   └── useLanguage.ts
├── test/           # Test files and setup
├── types.ts        # TypeScript type definitions
└── .github/        # CI/CD workflows
```

### Testing

Run tests with:

```bash
npm test              # Run tests
npm run test:ui       # Run tests with UI
npm run test:coverage # Run tests with coverage
```

## 🧪 Development

### Running Tests

```bash
npm test
```

### Building for Production

```bash
npm run build
```

### Code Quality

- **TypeScript**: Full type safety throughout the codebase
- **Error Handling**: Comprehensive error boundaries and try-catch blocks
- **Testing**: Unit tests for critical functionality
- **CI/CD**: Automated testing and type checking on every push

## 📄 License

Private / Proprietary
