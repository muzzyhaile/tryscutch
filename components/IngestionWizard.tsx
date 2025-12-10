import React, { useState, useRef } from 'react';
import { Upload, FileText, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

interface IngestionWizardProps {
  onAnalyze: (name: string, data: string[]) => void;
  isLoading: boolean;
}

export const IngestionWizard: React.FC<IngestionWizardProps> = ({ onAnalyze, isLoading }) => {
  const [mode, setMode] = useState<'upload' | 'paste'>('paste');
  const [textInput, setTextInput] = useState('');
  const [projectName, setProjectName] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    if (!projectName) {
      setProjectName(file.name.split('.')[0]);
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setTextInput(text); // For MVP, we treat file content as raw text blob to be parsed
    };
    reader.readAsText(file);
  };

  const parseInput = (input: string): string[] => {
    // Basic splitting by newline for MVP. 
    // In a real app, we'd use a robust CSV parser.
    return input
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 10); // Simple filter for empty/short lines
  };

  const handleSubmit = () => {
    setError(null);
    if (!projectName.trim()) {
      setError('Please give your project a name.');
      return;
    }
    const items = parseInput(textInput);
    if (items.length === 0) {
      setError('No valid feedback items found. Please paste data or upload a file.');
      return;
    }
    onAnalyze(projectName, items);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">New Analysis Project</h1>
        <p className="text-zinc-500 text-lg">Import your customer feedback to uncover hidden insights.</p>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-1">
        <div className="flex border-b border-zinc-100">
          <button 
            onClick={() => setMode('paste')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${mode === 'paste' ? 'bg-zinc-50 text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            Paste Text
          </button>
          <button 
             onClick={() => setMode('upload')}
             className={`flex-1 py-3 text-sm font-medium transition-colors ${mode === 'upload' ? 'bg-zinc-50 text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            Upload CSV
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">Project Name</label>
            <input 
              type="text" 
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. Q3 Customer Feedback"
              style={{ colorScheme: 'light' }}
              className="w-full px-4 py-2 rounded-lg border border-zinc-200 bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
            />
          </div>

          {mode === 'paste' ? (
             <div className="space-y-2">
               <label className="text-sm font-medium text-zinc-700">Paste Feedback</label>
               <textarea 
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Paste list of feedback items, one per line..."
                  style={{ colorScheme: 'light' }}
                  className="w-full h-48 px-4 py-3 rounded-lg border border-zinc-200 bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm resize-none font-mono"
               />
               <p className="text-xs text-zinc-400">Supported formats: Plain text, CSV content (raw)</p>
             </div>
          ) : (
             <div className="space-y-2">
               <label className="text-sm font-medium text-zinc-700">Upload File</label>
               <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-200 rounded-xl h-48 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-50 hover:border-zinc-300 transition-all group bg-white"
               >
                 <div className="p-3 bg-zinc-100 rounded-full mb-3 group-hover:scale-110 transition-transform">
                   <Upload className="text-zinc-500 w-6 h-6" />
                 </div>
                 <p className="text-sm font-medium text-zinc-700">{fileName || "Click to browse"}</p>
                 <p className="text-xs text-zinc-400 mt-1">CSV or TXT files supported</p>
                 <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                 />
               </div>
             </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="pt-2">
            <button 
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-zinc-200"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin w-4 h-4" />
                  Running AI Analysis...
                </>
              ) : (
                <>
                  Start Analysis
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};