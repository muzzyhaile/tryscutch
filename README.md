<div align="center">
  <div style="background-color: black; color: white; width: 60px; height: 60px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 24px; margin: 0 auto 20px auto;">C</div>
  <h1>Clarity</h1>
  <p><strong>Turn raw feedback into clarity, in minutes.</strong></p>
</div>

<br />

Clarity is a powerful Voice of Customer (VoC) tool designed to instantly analyze raw feedback. Upload your data and get automatic themes, sentiment analysis, and strategic insights powered by Google's Gemini AI—no complex integrations or setup required.

## ✨ Features

- **Instant Analysis**: Upload your feedback files and get results in seconds.
- **AI-Powered Insights**: Leverages Google Gemini to identify themes, sentiment, and actionable strategic advice.
- **Visual Reports**: Interactive charts and visualizations to understand your data at a glance.
- **Smart Clustering**: Automatically groups similar feedback into meaningful clusters with priority scores.
- **Export Options**: Download your analysis as a PDF report or raw JSON data.
- **Privacy Focused**: Runs locally with your own API key.

## 🚀 Run Locally

Follow these steps to get Clarity running on your local machine.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- A Google Gemini API Key ([Get one here](https://aistudio.google.com/app/apikey))

### Installation

1. **Clone the repository** (if applicable) or download the source.

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment**:
   Create a `.env.local` file in the root directory and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

4. **Run the app**:
   ```bash
   npm run dev
   ```

5. **Open in Browser**:
   Navigate to http://localhost:3000 (configured in vite.config.ts).

## 🛠️ Tech Stack

- **Framework**: React 19 + Vite
- **Language**: TypeScript
- **AI Model**: Google Gemini (via @google/genai)
- **Styling**: Tailwind CSS + Lucide React
- **Visualization**: Recharts
- **Export**: html2canvas, jspdf
- **Testing**: Vitest + React Testing Library
- **CI/CD**: GitHub Actions

## 🏗️ Architecture

Clarity follows SOLID principles and clean architecture patterns:

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
