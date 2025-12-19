import React, { useState, useRef } from 'react';
import { Upload, ArrowRight, Loader2, AlertCircle, ChevronDown, ChevronUp, FileText, Keyboard, Check } from 'lucide-react';
import { ContextData, FeedbackEntry } from '../types';
import { importFile, tableRowsToItems, ImportOptions, ImportResult } from '../services/universalImport';

interface IngestionWizardProps {
  onAnalyze: (name: string, data: string[], context?: string) => void;
  isLoading: boolean;
  contextData: ContextData;
  feedbackEntries: FeedbackEntry[];
  importOptions?: ImportOptions;
}

export const IngestionWizard: React.FC<IngestionWizardProps> = ({ onAnalyze, isLoading, contextData, feedbackEntries, importOptions }) => {
  const [mode, setMode] = useState<'upload' | 'paste'>('paste');
  const [textInput, setTextInput] = useState('');
  const [projectName, setProjectName] = useState('');
  const [context, setContext] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [selectedTextColumn, setSelectedTextColumn] = useState<string>('');
  
  // Context selection states
  const [selectedIcps, setSelectedIcps] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<string[]>([]);
  const [selectedLibraryEntries, setSelectedLibraryEntries] = useState<string[]>([]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    if (!projectName) {
      setProjectName(file.name.split('.')[0]);
    }

    setError(null);
    setIsParsingFile(true);
    try {
      const result = await importFile(file, importOptions);
      setImportResult(result);

      if (result.kind === 'text') {
        setSelectedTextColumn('');
        setTextInput(result.rawText);
      } else {
        const defaultCol = result.detectedTextColumn ?? result.columns[0] ?? '';
        setSelectedTextColumn(defaultCol);
        setTextInput('');
      }
    } catch (err) {
      setImportResult(null);
      setSelectedTextColumn('');
      setTextInput('');
      setError(err instanceof Error ? err.message : 'Failed to import file.');
    } finally {
      setIsParsingFile(false);
    }
  };

  const parseInput = (input: string): string[] => {
    return input
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0);
  };

  const handleSubmit = () => {
    setError(null);
    if (!projectName.trim()) {
      setError('Please give your project a name.');
      return;
    }
    const uploadedItems = (() => {
      if (mode !== 'upload') return null;
      if (!importResult) return null;
      if (importResult.kind === 'text') return parseInput(importResult.rawText);
      if (!selectedTextColumn) return null;
      return tableRowsToItems(importResult.rows, selectedTextColumn);
    })();

    const textItems = mode === 'upload' && uploadedItems ? uploadedItems : parseInput(textInput);

    const selectedEntries = selectedLibraryEntries
      .map(id => feedbackEntries.find(e => e.id === id))
      .filter((e): e is FeedbackEntry => Boolean(e));

    const libraryContextBlocks: string[] = [];
    const libraryItems: string[] = [];

    for (const entry of selectedEntries) {
      const meta = [entry.sourceType, entry.app, entry.source, entry.date].filter(Boolean).join(' | ');

      // If a bulk import exists, expand it into individual feedback items.
      if (entry.bulkImport?.items?.length) {
        libraryItems.push(...entry.bulkImport.items);

        if (entry.entryContext) {
          libraryContextBlocks.push(
            `Feedback Library Context (${entry.title}${meta ? ` | ${meta}` : ''})${entry.topic ? `\nTopic: ${entry.topic}` : ''}${entry.tags?.length ? `\nTags: ${entry.tags.join(', ')}` : ''}:\n${entry.entryContext}`
          );
        }

        continue;
      }

      // Fallback: treat the entry content as a single feedback item.
      const ctx = entry.entryContext ? `\n\nEntry Context:\n${entry.entryContext}` : '';
      libraryItems.push(`[${meta}]\n${entry.content}${ctx}`);
    }

    const items = [...textItems, ...libraryItems].filter(i => i.trim().length > 0);
    if (items.length === 0) {
      setError('No valid feedback items found. Paste data, upload a file, or select items from the Feedback Library.');
      return;
    }
    
    // Build combined context from selections and manual input
    let combinedContext = context;

    if (libraryContextBlocks.length > 0) {
      combinedContext = combinedContext
        ? `${libraryContextBlocks.join('\n\n')}\n\n${combinedContext}`
        : libraryContextBlocks.join('\n\n');
    }
    
    if (selectedIcps.length > 0) {
      const icpTexts = selectedIcps.map(id => {
        const icp = contextData.icps.find(i => i.id === id);
        if (!icp) return '';
        return `ICP: ${icp.name}\n${icp.description}\n${icp.demographics ? 'Demographics: ' + icp.demographics + '\n' : ''}${icp.painPoints ? 'Pain Points: ' + icp.painPoints + '\n' : ''}${icp.goals ? 'Goals: ' + icp.goals : ''}`;
      }).filter(Boolean);
      combinedContext = icpTexts.join('\n\n') + (combinedContext ? '\n\n' + combinedContext : '');
    }
    
    if (selectedProducts.length > 0) {
      const productTexts = selectedProducts.map(id => {
        const product = contextData.productInfos.find(p => p.id === id);
        if (!product) return '';
        return `Product: ${product.name}\n${product.description}\n${product.features ? 'Features: ' + product.features + '\n' : ''}${product.targetMarket ? 'Target Market: ' + product.targetMarket + '\n' : ''}${product.valueProposition ? 'Value Proposition: ' + product.valueProposition : ''}`;
      }).filter(Boolean);
      combinedContext = combinedContext + (combinedContext ? '\n\n' : '') + productTexts.join('\n\n');
    }
    
    if (selectedFeedback.length > 0) {
      const feedbackTexts = selectedFeedback.map(id => {
        const feedback = contextData.marketFeedbacks.find(f => f.id === id);
        if (!feedback) return '';
        return `Market Research: ${feedback.name} (${feedback.source})\n${feedback.content}`;
      }).filter(Boolean);
      combinedContext = combinedContext + (combinedContext ? '\n\n' : '') + feedbackTexts.join('\n\n');
    }
    
    onAnalyze(projectName, items, combinedContext || undefined);
  };

  const toggleSelection = (id: string, list: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (list.includes(id)) {
      setter(list.filter(item => item !== id));
    } else {
      setter([...list, id]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="space-y-4">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter text-zinc-950">New Analysis</h1>
        <p className="text-xl md:text-2xl text-zinc-500 font-light max-w-2xl">Import your customer feedback to uncover hidden insights, emerging trends, and actionable priorities.</p>
      </div>

      <div className="space-y-8">
        {/* Name Input */}
        <div className="space-y-3">
            <label className="text-sm font-bold text-zinc-950 uppercase tracking-widest">Project Name</label>
            <input 
              type="text" 
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. Q3 Customer Feedback"
              className="w-full px-6 py-5 text-xl rounded-2xl border-2 border-zinc-100 bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-0 transition-all font-medium"
            />
        </div>

        {/* Mode Toggle */}
        <div className="p-1.5 bg-zinc-100 rounded-2xl inline-flex gap-1 w-full md:w-auto">
            <button 
                onClick={() => setMode('paste')}
                className={`flex-1 md:flex-none px-8 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${mode === 'paste' ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
            >
                <Keyboard size={18} />
                Paste Text
            </button>
             <button 
                onClick={() => setMode('upload')}
                className={`flex-1 md:flex-none px-8 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${mode === 'upload' ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
            >
                <Upload size={18} />
                Upload File
            </button>
        </div>

        {/* Input Area */}
        <div className="bg-white rounded-3xl border-2 border-zinc-100 shadow-sm overflow-hidden">
             {mode === 'paste' ? (
                <textarea 
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Paste list of feedback items, one per line..."
                    className="w-full h-96 px-8 py-8 text-lg rounded-none border-0 bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-0 transition-all resize-none font-mono leading-relaxed"
                />
             ) : (
                 <div className="h-96 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-50 transition-all group" onClick={() => fileInputRef.current?.click()}>
                     <div className="p-6 bg-zinc-50 rounded-full mb-6 group-hover:scale-110 transition-transform group-hover:bg-zinc-100">
                        <FileText className="text-zinc-400 w-10 h-10 group-hover:text-zinc-900" />
                     </div>
                     <p className="text-2xl font-bold text-zinc-900 mb-2">{fileName || "Drop your file here"}</p>
                     <p className="text-zinc-400">
                       {isParsingFile ? 'Importing…' : 'Supports .csv, .xlsx, .pdf, .txt'}
                     </p>
                     <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept=".csv,.tsv,.txt,.pdf,.xlsx,.xls"
                        onChange={handleFileUpload}
                     />
                 </div>
             )}
        </div>

        {mode === 'upload' && importResult?.kind === 'table' && importResult.columns.length > 0 && (
          <div className="space-y-3">
            <label className="text-sm font-bold text-zinc-950 uppercase tracking-widest">Feedback Column</label>
            <select
              value={selectedTextColumn}
              onChange={(e) => setSelectedTextColumn(e.target.value)}
              className="w-full px-6 py-4 text-base rounded-2xl border-2 border-zinc-100 bg-white text-zinc-900 focus:outline-none focus:border-zinc-950 focus:ring-0 transition-all"
            >
              {importResult.columns.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {importResult.detectedTextColumn && (
              <p className="text-xs text-zinc-400">
                Auto-detected: {importResult.detectedTextColumn}
              </p>
            )}
          </div>
        )}

        {/* Context */}
        <div className="pt-2">
            <button 
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-base font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
            >
                {showAdvanced ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                Add Context (Recommended)
            </button>
            
            {showAdvanced && (
                <div className="mt-6 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                    
                    {/* ICP Selection */}
                    {contextData.icps.length > 0 && (
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-zinc-700 uppercase tracking-widest">Select ICPs</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {contextData.icps.map((icp) => (
                                    <button
                                        key={icp.id}
                                        onClick={() => toggleSelection(icp.id, selectedIcps, setSelectedIcps)}
                                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                                            selectedIcps.includes(icp.id)
                                                ? 'border-indigo-500 bg-indigo-50'
                                                : 'border-zinc-200 hover:border-zinc-300 bg-white'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h4 className="font-bold text-zinc-950">{icp.name}</h4>
                                                <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{icp.description}</p>
                                            </div>
                                            {selectedIcps.includes(icp.id) && (
                                                <Check size={20} className="text-indigo-600 ml-2 shrink-0" />
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Product Selection */}
                    {contextData.productInfos.length > 0 && (
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-zinc-700 uppercase tracking-widest">Select Product Info</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {contextData.productInfos.map((product) => (
                                    <button
                                        key={product.id}
                                        onClick={() => toggleSelection(product.id, selectedProducts, setSelectedProducts)}
                                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                                            selectedProducts.includes(product.id)
                                                ? 'border-purple-500 bg-purple-50'
                                                : 'border-zinc-200 hover:border-zinc-300 bg-white'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h4 className="font-bold text-zinc-950">{product.name}</h4>
                                                <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{product.description}</p>
                                            </div>
                                            {selectedProducts.includes(product.id) && (
                                                <Check size={20} className="text-purple-600 ml-2 shrink-0" />
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Market Feedback Selection */}
                    {contextData.marketFeedbacks.length > 0 && (
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-zinc-700 uppercase tracking-widest">Select Market Research</label>
                            <div className="grid grid-cols-1 gap-3">
                                {contextData.marketFeedbacks.map((feedback) => (
                                    <button
                                        key={feedback.id}
                                        onClick={() => toggleSelection(feedback.id, selectedFeedback, setSelectedFeedback)}
                                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                                            selectedFeedback.includes(feedback.id)
                                                ? 'border-emerald-500 bg-emerald-50'
                                                : 'border-zinc-200 hover:border-zinc-300 bg-white'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h4 className="font-bold text-zinc-950">{feedback.name}</h4>
                                                <p className="text-xs text-zinc-400 mb-1">{feedback.source}</p>
                                                <p className="text-xs text-zinc-500 line-clamp-2">{feedback.content}</p>
                                            </div>
                                            {selectedFeedback.includes(feedback.id) && (
                                                <Check size={20} className="text-emerald-600 ml-2 shrink-0" />
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                          {/* Feedback Library Selection */}
                          {feedbackEntries.length > 0 && (
                            <div className="space-y-3">
                              <label className="text-sm font-bold text-zinc-700 uppercase tracking-widest">Select Feedback Library Items (Optional)</label>
                              <div className="grid grid-cols-1 gap-3">
                                {feedbackEntries.slice(0, 40).map((entry) => (
                                  <button
                                    key={entry.id}
                                    onClick={() => toggleSelection(entry.id, selectedLibraryEntries, setSelectedLibraryEntries)}
                                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                                      selectedLibraryEntries.includes(entry.id)
                                        ? 'border-zinc-950 bg-zinc-50'
                                        : 'border-zinc-200 hover:border-zinc-300 bg-white'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <h4 className="font-bold text-zinc-950">{entry.title}</h4>
                                        <p className="text-xs text-zinc-400 mb-1">
                                          {[entry.sourceType, entry.app, entry.source, entry.date].filter(Boolean).join(' • ')}
                                        </p>
                                        {(entry.topic || (entry.tags && entry.tags.length > 0)) && (
                                          <p className="text-xs text-zinc-400 mb-1">
                                            {[entry.topic ? `Topic: ${entry.topic}` : null, entry.tags?.length ? `Tags: ${entry.tags.join(', ')}` : null]
                                              .filter(Boolean)
                                              .join(' • ')}
                                          </p>
                                        )}
                                        {entry.bulkImport?.items?.length ? (
                                          <p className="text-xs text-zinc-500 mb-1">
                                            Imported dataset: {entry.bulkImport.items.length.toLocaleString()} lines
                                          </p>
                                        ) : null}
                                        <p className="text-xs text-zinc-500 line-clamp-2 whitespace-pre-wrap">{entry.content}</p>
                                      </div>
                                      {selectedLibraryEntries.includes(entry.id) && (
                                        <Check size={20} className="text-zinc-950 ml-2 shrink-0" />
                                      )}
                                    </div>
                                  </button>
                                ))}
                              </div>
                              {feedbackEntries.length > 40 && (
                                <p className="text-xs text-zinc-400">
                                  Showing latest 40 items. Use Feedback Library to manage the full set.
                                </p>
                              )}
                            </div>
                          )}

                    {/* Manual Context Input */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-zinc-700 uppercase tracking-widest">Additional Context (Optional)</label>
                        <textarea 
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
                            placeholder="Add any additional context or specific instructions..."
                            className="w-full h-32 px-6 py-4 rounded-2xl border-2 border-zinc-100 bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-0 transition-all text-base resize-none"
                        />
                    </div>
                </div>
            )}
        </div>

        {error && (
            <div className="flex items-center gap-3 p-4 bg-rose-50 text-rose-600 text-sm font-medium rounded-xl border border-rose-100">
              <AlertCircle size={18} />
              {error}
            </div>
        )}

        <div className="pt-6 pb-20">
            <button 
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full bg-zinc-950 hover:bg-zinc-800 text-white text-xl font-bold py-6 rounded-2xl flex items-center justify-center gap-3 transition-all disabled:opacity-70 disabled:cursor-not-allowed hover:scale-[1.01] hover:shadow-2xl shadow-zinc-200"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin w-6 h-6" />
                  Analyzing...
                </>
              ) : (
                <>
                  Start Analysis
                  <ArrowRight className="w-6 h-6" />
                </>
              )}
            </button>
        </div>
      </div>
    </div>
  );
};