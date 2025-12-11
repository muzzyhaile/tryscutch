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

## 📄 License

Private / Proprietary
