import React, { useState, useEffect } from 'react';
import { Project, Cluster } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Download, TrendingUp, MessageSquare, X, Quote, Zap, FileDown, ArrowUp, ArrowDown, Bot, Sparkles, Loader2, Printer, Copy, Check, Lightbulb, Package, Wrench, Rocket, Globe } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { generateStrategicAdvice, generateProductRecommendations, translateText } from '../services/geminiService';
import { SupportedLanguage, SUPPORTED_LANGUAGES } from '../types-languages';
import { LanguageSwitcher } from './LanguageSwitcher';

interface AnalysisViewProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
  isPrintView?: boolean;
  selectedLanguage?: SupportedLanguage;
  onLanguageChange?: (language: SupportedLanguage) => void;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ project, onUpdateProject, isPrintView = false, selectedLanguage = 'en', onLanguageChange }) => {
  const result = project.analysis;
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isGeneratingAdvice, setIsGeneratingAdvice] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [isGeneratingRecommendations, setIsGeneratingRecommendations] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<{[key: string]: string}>({});
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en');

  // Auto-print effect
  useEffect(() => {
    if (isPrintView) {
        // Small delay to ensure everything renders (especially charts)
        const timer = setTimeout(() => {
            window.print();
        }, 800);
        return () => clearTimeout(timer);
    }
  }, [isPrintView]);

  if (!result) return <div>No analysis available.</div>;

  const sortedClusters = [...result.clusters].sort((a, b) => b.itemCount - a.itemCount);
  const totalItems = result.totalItemsProcessed;

  // Vivid, bold colors
  const COLORS = ['#4f46e5', '#7c3aed', '#db2777', '#e11d48', '#d97706', '#059669', '#0891b2', '#2563eb'];

  const getPriorityColor = (score: number) => {
    if (score >= 8) return 'text-rose-600 bg-rose-50 border-rose-200';
    if (score >= 5) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-zinc-600 bg-zinc-50 border-zinc-200';
  };

  // Calculate dynamic impact
  const avgPriority = sortedClusters.reduce((acc, c) => acc + c.priorityScore, 0) / (sortedClusters.length || 1);
  const impactLabel = avgPriority > 7 ? 'Critical' : avgPriority > 5 ? 'High' : avgPriority > 3 ? 'Medium' : 'Low';
  const impactColorClass = avgPriority > 7 ? 'text-rose-600' : avgPriority > 5 ? 'text-orange-600' : 'text-indigo-600';

  const exportJSON = () => {
    const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
      JSON.stringify(project, null, 2)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = `${project.name.replace(/\s+/g, "_")}_report.json`;
    link.click();
  };

  const copyMarkdown = () => {
      let md = `# ${project.name} - Analysis Report\n\n`;
      md += `**Date:** ${new Date(project.createdAt).toLocaleDateString()}\n`;
      md += `**Items:** ${totalItems}\n\n`;
      
      md += `## Executive Summary\n\n${result.summary}\n\n`;
      
      md += `## Strategic Priorities\n\n`;
      result.topPriorities.forEach((p, i) => {
          md += `${i+1}. ${p}\n`;
      });
      md += `\n`;

      md += `## Theme Overview\n\n`;
      sortedClusters.forEach(c => {
          md += `### ${c.name} (P${c.priorityScore})\n`;
          md += `${c.description}\n`;
          md += `*Sentiment: ${c.sentimentScore} | Volume: ${c.itemCount}*\n\n`;
      });

      navigator.clipboard.writeText(md);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
  };

  const openPrintPage = () => {
      // Constructs URL to open this specific project in print mode
      const url = `${window.location.origin}${window.location.pathname}?print=true&projectId=${project.id}`;
      window.open(url, '_blank');
  };

  const exportPDF = async () => {
    setIsExporting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 100)); // Render wait

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 12; 
      const contentWidth = pageWidth - (margin * 2);
      let yPos = margin;

      // Helper to capture and add section
      const addSection = async (elementId: string) => {
        const el = document.getElementById(elementId);
        if (!el) return;

        const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
        const imgHeight = (canvas.height * contentWidth) / canvas.width;

        // Check for page break
        if (yPos + imgHeight > pageHeight - margin) {
          pdf.addPage();
          yPos = margin;
        }

        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', margin, yPos, contentWidth, imgHeight);
        yPos += imgHeight + 6; // Gap between sections
      };

      // 1. Header & Summary
      await addSection('report-header');
      await addSection('report-summary');
      await addSection('report-actions');
      await addSection('report-stats');
      
      // Force chart to new page if it's low on space, otherwise just flow
      if (yPos > 180) { // If past middle of page, push chart to new page
          pdf.addPage();
          yPos = margin;
      }
      await addSection('report-chart');
      
      // Deep Dive Header
      await addSection('report-deep-dive-title');

      // Deep Dive Grid - Smart Layout (2 Column)
      const grid = document.getElementById('report-cluster-grid');
      if (grid) {
        const cards = Array.from(grid.children) as HTMLElement[];
        const colGap = 6;
        const cardWidth = (contentWidth - colGap) / 2;

        for (let i = 0; i < cards.length; i += 2) {
             const card1 = cards[i];
             const card2 = cards[i+1];

             // Capture Card 1
             const c1 = await html2canvas(card1, { scale: 2, backgroundColor: '#ffffff' });
             const h1 = (c1.height * cardWidth) / c1.width;

             // Capture Card 2 (if exists)
             let h2 = 0;
             let c2Data = null;
             if (card2) {
                 const c2 = await html2canvas(card2, { scale: 2, backgroundColor: '#ffffff' });
                 h2 = (c2.height * cardWidth) / c2.width;
                 c2Data = c2.toDataURL('image/png');
             }

             const maxHeight = Math.max(h1, h2);

             // Check page break
             if (yPos + maxHeight > pageHeight - margin) {
                 pdf.addPage();
                 yPos = margin;
             }

             // Place images
             pdf.addImage(c1.toDataURL('image/png'), 'PNG', margin, yPos, cardWidth, h1);
             if (c2Data) {
                 pdf.addImage(c2Data, 'PNG', margin + cardWidth + colGap, yPos, cardWidth, h2);
             }

             yPos += maxHeight + 6;
        }
      }

      pdf.save(`${project.name.replace(/\s+/g, "_")}_report.pdf`);
    } catch (error) {
      console.error("PDF Export failed", error);
      alert("Could not generate PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const getClusterItems = (cluster: Cluster) => {
    if (!cluster.itemIndices || cluster.itemIndices.length === 0) return [];
    return cluster.itemIndices
        .map(index => project.items[index])
        .filter(item => item !== undefined);
  };

  // --- Handlers for updates ---

  const movePriority = (index: number, direction: 'up' | 'down') => {
    const newPriorities = [...result.topPriorities];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;

    if (swapIndex < 0 || swapIndex >= newPriorities.length) return;

    [newPriorities[index], newPriorities[swapIndex]] = [newPriorities[swapIndex], newPriorities[index]];

    const updatedProject = {
        ...project,
        analysis: {
            ...result,
            topPriorities: newPriorities
        }
    };
    onUpdateProject(updatedProject);
  };

  const updateClusterScore = (clusterId: string, newScore: number) => {
    const updatedClusters = result.clusters.map(c => 
        c.id === clusterId ? { ...c, priorityScore: newScore } : c
    );

    const updatedProject = {
        ...project,
        analysis: {
            ...result,
            clusters: updatedClusters
        }
    };
    onUpdateProject(updatedProject);
    
    // Update local selection so slider doesn't jump back
    if (selectedCluster && selectedCluster.id === clusterId) {
        setSelectedCluster({ ...selectedCluster, priorityScore: newScore });
    }
  };

  const handleGenerateAdvice = async () => {
    if (!selectedCluster) return;
    setIsGeneratingAdvice(true);
    
    const items = getClusterItems(selectedCluster).map(i => i.content);
    
    try {
        const advice = await generateStrategicAdvice(selectedCluster.name, items, project.context);
        const updatedClusters = result.clusters.map(c => 
            c.id === selectedCluster.id ? { ...c, strategicAdvice: advice } : c
        );

        const updatedProject = {
            ...project,
            analysis: {
                ...result,
                clusters: updatedClusters
            }
        };
        onUpdateProject(updatedProject);
        setSelectedCluster({ ...selectedCluster, strategicAdvice: advice });
    } catch (e) {
        console.error(e);
    } finally {
        setIsGeneratingAdvice(false);
    }
  };

  const handleTranslateReport = async () => {
    if (currentLanguage === selectedLanguage) return;
    
    setIsTranslating(true);
    const targetLang = SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage);
    
    try {
      const translations: {[key: string]: string} = {};
      
      // Translate summary
      if (result.summary) {
        translations['summary'] = await translateText(result.summary, targetLang?.name || 'English');
      }
      
      // Translate top priorities
      if (result.topPriorities) {
        for (let i = 0; i < result.topPriorities.length; i++) {
          const key = `priority-${i}`;
          translations[key] = await translateText(result.topPriorities[i], targetLang?.name || 'English');
        }
      }
      
      // Translate cluster names and descriptions
      for (const cluster of result.clusters) {
        translations[`cluster-name-${cluster.id}`] = await translateText(cluster.name, targetLang?.name || 'English');
        translations[`cluster-desc-${cluster.id}`] = await translateText(cluster.description, targetLang?.name || 'English');
        
        if (cluster.strategicAdvice) {
          translations[`cluster-advice-${cluster.id}`] = await translateText(cluster.strategicAdvice, targetLang?.name || 'English');
        }
      }
      
      setTranslatedContent(translations);
      setCurrentLanguage(selectedLanguage);
    } catch (e) {
      console.error('Translation failed:', e);
      alert('Translation failed. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  // Auto-translate when language changes
  useEffect(() => {
    if (selectedLanguage !== 'en' && selectedLanguage !== currentLanguage) {
      handleTranslateReport();
    } else if (selectedLanguage === 'en') {
      setTranslatedContent({});
      setCurrentLanguage('en');
    }
  }, [selectedLanguage]);

  const handleGenerateRecommendations = async () => {
    if (!result) return;
    setIsGeneratingRecommendations(true);
    
    try {
        const recommendations = await generateProductRecommendations(
            result.clusters,
            project.items.map(i => i.content),
            project.context
        );
        
        const updatedProject = {
            ...project,
            analysis: {
                ...result,
                productRecommendations: recommendations
            }
        };
        onUpdateProject(updatedProject);
    } catch (e) {
        console.error(e);
    } finally {
        setIsGeneratingRecommendations(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch(category) {
      case 'feature': return <Rocket size={20} />;
      case 'improvement': return <TrendingUp size={20} />;
      case 'fix': return <Wrench size={20} />;
      case 'enhancement': return <Sparkles size={20} />;
      default: return <Package size={20} />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      high: 'bg-rose-100 text-rose-700 border-rose-200',
      medium: 'bg-amber-100 text-amber-700 border-amber-200',
      low: 'bg-zinc-100 text-zinc-600 border-zinc-200'
    };
    return colors[priority as keyof typeof colors] || colors.low;
  };

  const getEffortBadge = (effort: string) => {
    const colors = {
      low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      medium: 'bg-blue-100 text-blue-700 border-blue-200',
      high: 'bg-purple-100 text-purple-700 border-purple-200'
    };
    return colors[effort as keyof typeof colors] || colors.medium;
  };


  return (
    <div className={`space-y-12 pb-24 animate-in fade-in duration-700 relative ${isPrintView ? 'p-12 max-w-[210mm] mx-auto' : ''}`}>
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-zinc-100">
        <div className="space-y-2" id="report-header">
          <div className="flex items-center gap-3">
             <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-zinc-950 text-white uppercase tracking-widest">Completed</span>
             <span className="text-zinc-400 font-medium text-xs">{new Date(project.createdAt).toLocaleDateString()}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-zinc-950 tracking-tight leading-tight">{project.name}</h1>
        </div>
        
        {!isPrintView && onLanguageChange && (
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <Globe size={18} className="text-zinc-400" />
                    <LanguageSwitcher 
                        currentLanguage={selectedLanguage}
                        onLanguageChange={onLanguageChange}
                    />
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={copyMarkdown}
                        className="flex items-center gap-2 px-4 py-3 bg-white border-2 border-zinc-100 text-zinc-500 font-bold rounded-xl hover:border-zinc-300 hover:text-zinc-950 transition-all"
                        title="Copy Report to Clipboard"
                    >
                        {hasCopied ? <Check size={20} className="text-emerald-500"/> : <Copy size={20} />}
                    </button>
                    <button 
                        onClick={openPrintPage}
                        className="flex items-center gap-2 px-4 py-3 bg-white border-2 border-zinc-100 text-zinc-500 font-bold rounded-xl hover:border-zinc-300 hover:text-zinc-950 transition-all"
                        title="Open Print View"
                    >
                        <Printer size={20} />
                    </button>
                    <button 
                        onClick={exportJSON}
                        className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-zinc-100 text-zinc-500 font-bold rounded-xl hover:border-zinc-300 hover:text-zinc-950 transition-all"
                    >
                        <Download size={20} />
                        JSON
                    </button>
                    <button 
                        onClick={exportPDF}
                        disabled={isExporting}
                        className="flex items-center gap-2 px-6 py-3 bg-zinc-950 border-2 border-zinc-950 text-white font-bold rounded-xl hover:bg-zinc-800 hover:border-zinc-800 hover:shadow-lg transition-all"
                    >
                        {isExporting ? <span className="animate-pulse">Generating...</span> : <><FileDown size={20} /> Export Report</>}
                    </button>
                </div>
            </div>
        )}
      </div>

      {/* Printable Report Area - IDs added for PDF Generator */}
      <div className="space-y-10 bg-white">
        
        {/* 1. Executive Summary (Full Width) */}
        <div id="report-summary" className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-zinc-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <h3 className="text-3xl font-bold text-zinc-950 mb-8 tracking-tight">Executive Summary</h3>
            
            <div className="flex flex-wrap gap-3 mb-10">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest py-2">Dominant Signals:</span>
                {sortedClusters.slice(0, 3).map((c, i) => (
                    <span key={c.id} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-50 border border-zinc-200 text-zinc-700 text-sm font-bold">
                        <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-indigo-500' : i === 1 ? 'bg-purple-500' : 'bg-pink-500'}`}></div>
                        {c.name}
                    </span>
                ))}
            </div>

            <div className="prose prose-xl prose-zinc max-w-none">
                {isTranslating ? (
                    <div className="flex items-center gap-3 text-zinc-400">
                        <Loader2 className="animate-spin" size={24} />
                        <span>Translating...</span>
                    </div>
                ) : (
                    <p className="text-zinc-600 text-2xl leading-relaxed font-light">
                        {translatedContent['summary'] || result.summary}
                    </p>
                )}
            </div>
        </div>

        {/* 2. Action Items (Full Width, Black) */}
        <div id="report-actions" className="bg-zinc-950 p-8 md:p-12 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-5">
                <Zap size={200} />
            </div>
            <div className="relative z-10">
                <h3 className="text-zinc-300 font-bold text-sm uppercase tracking-widest mb-10">Strategic Priorities</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                    {result.topPriorities.slice(0, 4).map((item, i) => (
                        <div key={i} className="flex gap-6 group/item">
                            <div className="mt-1 min-w-[3rem] h-12 rounded-2xl bg-white flex items-center justify-center text-xl font-bold shrink-0 text-zinc-950 shadow-lg">
                                {i + 1}
                            </div>
                            <div className="flex-1 space-y-2">
                                <span className="text-xl font-medium leading-relaxed block text-zinc-100">
                                    {translatedContent[`priority-${i}`] || item}
                                </span>
                                {!isPrintView && (
                                    <div className="flex gap-2 opacity-0 group-hover/item:opacity-100 transition-opacity no-print">
                                        <button onClick={() => movePriority(i, 'up')} disabled={i === 0} className="text-zinc-500 hover:text-white"><ArrowUp size={16}/></button>
                                        <button onClick={() => movePriority(i, 'down')} disabled={i === result.topPriorities.length - 1} className="text-zinc-500 hover:text-white"><ArrowDown size={16}/></button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* 3. High Impact Stats (Huge) */}
        <div id="report-stats" className="grid grid-cols-2 md:grid-cols-4 gap-6">
             <div className="bg-zinc-50 p-8 rounded-[2rem] border border-zinc-100">
                <div className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2">Sentiment Score</div>
                <div className={`text-6xl font-bold tracking-tighter ${result.overallSentiment > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {(result.overallSentiment * 100).toFixed(0)}%
                </div>
            </div>
            <div className="bg-zinc-50 p-8 rounded-[2rem] border border-zinc-100">
                <div className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2">Total Feedback</div>
                <div className="text-6xl font-bold tracking-tighter text-zinc-950">{totalItems}</div>
            </div>
            <div className="bg-zinc-50 p-8 rounded-[2rem] border border-zinc-100">
                <div className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2">Themes Detected</div>
                <div className="text-6xl font-bold tracking-tighter text-zinc-950">{result.clusters.length}</div>
            </div>
            <div className="bg-zinc-50 p-8 rounded-[2rem] border border-zinc-100">
                <div className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2">Urgency</div>
                <div className={`text-6xl font-bold tracking-tighter ${impactColorClass}`}>{impactLabel}</div>
            </div>
        </div>

        {/* 4. Chart */}
        <div id="report-chart" className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-zinc-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] break-inside-avoid">
            <h3 className="text-2xl font-bold text-zinc-950 tracking-tight mb-10">Theme Distribution</h3>
            <div className="h-[600px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                        data={sortedClusters} 
                        layout="vertical" 
                        margin={{ top: 0, right: 30, left: 30, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f4f4f5" />
                        <XAxis type="number" hide />
                        <YAxis 
                            dataKey="name" 
                            type="category" 
                            axisLine={false} 
                            tickLine={false} 
                            width={240}
                            tick={{ fill: '#18181b', fontSize: 16, fontWeight: 700 }}
                        />
                        <Tooltip 
                            cursor={{ fill: '#f4f4f5' }}
                            contentStyle={{ 
                                borderRadius: '16px', 
                                border: 'none', 
                                boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)',
                                padding: '12px 20px',
                                fontWeight: 600,
                                color: '#09090b',
                                backgroundColor: '#fff'
                            }}
                        />
                        <Bar 
                            dataKey="itemCount" 
                            radius={[0, 12, 12, 0]} 
                            barSize={48}
                            onClick={(data) => !isPrintView && setSelectedCluster(data)}
                            className={!isPrintView ? "cursor-pointer" : ""}
                        >
                            {sortedClusters.map((entry, index) => (
                                <Cell 
                                    key={`cell-${index}`} 
                                    fill={COLORS[index % COLORS.length]} 
                                    className={!isPrintView ? "hover:opacity-80 transition-opacity" : ""}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* 5. Product Recommendations Section */}
        {!isPrintView && (
          <div id="product-recommendations" className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-zinc-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex items-start justify-between mb-8">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-zinc-950 rounded-xl">
                    <Lightbulb size={24} className="text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-zinc-950 tracking-tight">Product Recommendations</h3>
                </div>
                <p className="text-zinc-500 text-lg">AI-powered actionable improvements based on customer feedback</p>
              </div>
              
              <button 
                onClick={handleGenerateRecommendations}
                disabled={isGeneratingRecommendations}
                className="px-6 py-3 bg-zinc-950 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                {isGeneratingRecommendations ? (
                  <>
                    <Loader2 className="animate-spin" size={20}/>
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    {result?.productRecommendations?.length ? 'Regenerate' : 'Generate Ideas'}
                  </>
                )}
              </button>
            </div>

            {result?.productRecommendations && result.productRecommendations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {result.productRecommendations.map((rec) => (
                  <div key={rec.id} className="bg-zinc-50 p-6 rounded-2xl border border-zinc-200 hover:bg-white hover:border-zinc-300 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg text-zinc-950 border border-zinc-200">
                          {getCategoryIcon(rec.category)}
                        </div>
                        <div>
                          <h4 className="font-bold text-lg text-zinc-950">{rec.title}</h4>
                          <span className="text-xs uppercase tracking-wider text-zinc-400 font-bold">{rec.category}</span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-zinc-600 mb-4 leading-relaxed">{rec.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getPriorityBadge(rec.priority)}`}>
                        Priority: {rec.priority}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getEffortBadge(rec.effort)}`}>
                        Effort: {rec.effort}
                      </span>
                    </div>
                    
                    <div className="pt-4 border-t border-zinc-200">
                      <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Expected Impact</div>
                      <p className="text-sm text-zinc-700 font-medium">{rec.impact}</p>
                    </div>
                    
                    {rec.relatedClusters.length > 0 && (
                      <div className="pt-4 border-t border-zinc-200 mt-4">
                        <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Related Themes</div>
                        <div className="flex flex-wrap gap-2">
                          {rec.relatedClusters.map(clusterId => {
                            const cluster = result.clusters.find(c => c.id === clusterId);
                            return cluster ? (
                              <span key={clusterId} className="px-2 py-1 bg-zinc-100 text-zinc-700 rounded text-xs font-medium border border-zinc-200">
                                {translatedContent[`cluster-name-${cluster.id}`] || cluster.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 border-2 border-dashed border-zinc-200 rounded-2xl bg-zinc-50">
                <Lightbulb size={48} className="mx-auto mb-4 text-zinc-300" />
                <p className="text-zinc-500 font-medium">Click "Generate Ideas" to get AI-powered product recommendations</p>
                <p className="text-sm text-zinc-400 mt-2">Based on your feedback themes and customer priorities</p>
              </div>
            )}
          </div>
        )}

        {/* 6. Deep Dive Grid */}
        <div className="space-y-8">
            <h3 id="report-deep-dive-title" className="text-4xl font-bold text-zinc-950 tracking-tighter">Deep Dive Analysis</h3>
            
            {/* The ID 'report-cluster-grid' allows us to iterate through children for PDF export */}
            <div id="report-cluster-grid" className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sortedClusters.map((cluster) => (
                    <div 
                        key={cluster.id} 
                        onClick={() => !isPrintView && setSelectedCluster(cluster)}
                        className={`group bg-white rounded-[2rem] border border-zinc-100 p-8 hover:shadow-xl transition-all duration-300 relative overflow-hidden break-inside-avoid ${!isPrintView ? 'cursor-pointer' : ''}`}
                    >
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-transparent group-hover:bg-indigo-500 transition-colors"></div>
                        
                        <div className="flex justify-between items-start mb-4 pl-4">
                            <div className="space-y-1">
                                <h4 className="font-bold text-zinc-950 text-2xl tracking-tight">{translatedContent[`cluster-name-${cluster.id}`] || cluster.name}</h4>
                                {cluster.isEmerging && (
                                    <div className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100 uppercase tracking-wider">
                                        <TrendingUp size={12} /> Emerging Theme
                                    </div>
                                )}
                            </div>
                            <div className={`px-3 py-1.5 text-sm font-bold rounded-lg border ${getPriorityColor(cluster.priorityScore)}`}>
                                P{cluster.priorityScore}
                            </div>
                        </div>
                        
                        <p className="text-zinc-500 text-lg mb-6 pl-4 leading-relaxed font-medium">
                            {translatedContent[`cluster-desc-${cluster.id}`] || cluster.description}
                        </p>

                        <div className="pl-4 space-y-3">
                            {cluster.keyInsights.slice(0, 2).map((insight, idx) => (
                                <div key={idx} className="flex gap-3 text-base text-zinc-700">
                                    <div className="min-w-[6px] h-[6px] bg-zinc-300 rounded-full mt-2.5"></div>
                                    <span>{insight}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 pt-6 border-t border-zinc-50 pl-4 flex items-center justify-between">
                            <div className={`text-base font-bold ${cluster.sentimentScore > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {cluster.sentimentScore > 0 ? '+' : ''}{cluster.sentimentScore.toFixed(2)} Sentiment
                            </div>
                            <div className="text-zinc-400 text-sm font-medium flex items-center gap-2">
                                <MessageSquare size={16} />
                                {cluster.itemCount} items
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

      </div>

      {/* Detail Drawer (Only show if not printing) */}
      {!isPrintView && selectedCluster && (
          <>
            <div 
                className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm z-40 transition-opacity no-print" 
                onClick={() => setSelectedCluster(null)}
            />
            <div className="fixed inset-y-0 right-0 w-full md:w-[800px] bg-white z-50 shadow-2xl transform transition-transform animate-in slide-in-from-right duration-300 flex flex-col no-print">
                <div className="p-8 border-b border-zinc-100 flex items-start justify-between bg-white shrink-0">
                    <div className="space-y-2">
                        <div className="flex items-center gap-4">
                            <h2 className="text-3xl md:text-4xl font-bold text-zinc-950 tracking-tight">{translatedContent[`cluster-name-${selectedCluster.id}`] || selectedCluster.name}</h2>
                             {selectedCluster.isEmerging && (
                                <span className="flex items-center gap-1 text-xs font-bold px-3 py-1 bg-indigo-600 text-white rounded-full">
                                    <TrendingUp size={12} /> Emerging
                                </span>
                            )}
                        </div>
                        <p className="text-zinc-500 text-lg">{translatedContent[`cluster-desc-${selectedCluster.id}`] || selectedCluster.description}</p>
                    </div>
                    <button 
                        onClick={() => setSelectedCluster(null)}
                        className="p-3 hover:bg-zinc-100 rounded-full transition-colors text-zinc-400 hover:text-zinc-950"
                    >
                        <X size={28} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-12">
                    {/* Stats & Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Priority with Slider */}
                        <div className="bg-zinc-50 p-6 rounded-2xl flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-4">
                                <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Priority</div>
                                <div className={`text-3xl font-bold ${getPriorityColor(selectedCluster.priorityScore).split(' ')[0]}`}>
                                    {selectedCluster.priorityScore}/10
                                </div>
                            </div>
                            <div>
                                <input 
                                    type="range" 
                                    min="1" 
                                    max="10" 
                                    value={selectedCluster.priorityScore}
                                    onChange={(e) => updateClusterScore(selectedCluster.id, parseInt(e.target.value))}
                                    className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-950"
                                />
                                <div className="flex justify-between text-xs text-zinc-400 font-bold mt-2">
                                    <span>Low</span>
                                    <span>Crit</span>
                                </div>
                            </div>
                        </div>

                         <div className="bg-zinc-50 p-6 rounded-2xl text-center flex flex-col justify-center">
                            <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Sentiment</div>
                            <div className={`text-3xl font-bold ${selectedCluster.sentimentScore > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {selectedCluster.sentimentScore}
                            </div>
                        </div>
                         <div className="bg-zinc-50 p-6 rounded-2xl text-center flex flex-col justify-center">
                            <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Volume</div>
                            <div className="text-3xl font-bold text-zinc-950">
                                {selectedCluster.itemCount}
                            </div>
                        </div>
                    </div>
                    
                    {/* Strategy Agent */}
                    <div className="p-1 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
                        <div className="bg-white rounded-[1.4rem] p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-zinc-950 text-white rounded-lg">
                                        <Sparkles size={20} />
                                    </div>
                                    <h3 className="text-xl font-bold text-zinc-950">Consult Strategy Agent</h3>
                                </div>
                                <button 
                                    onClick={handleGenerateAdvice}
                                    disabled={isGeneratingAdvice}
                                    className="px-4 py-2 bg-zinc-950 text-white rounded-xl font-bold text-sm hover:bg-zinc-800 transition-all flex items-center gap-2"
                                >
                                    {isGeneratingAdvice ? <Loader2 className="animate-spin" size={16}/> : <Bot size={16} />}
                                    {selectedCluster.strategicAdvice ? 'Regenerate Advice' : 'Run Specialized Analysis'}
                                </button>
                            </div>
                            
                            {selectedCluster.strategicAdvice ? (
                                <div className="prose prose-zinc max-w-none bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
                                    <div className="whitespace-pre-wrap font-medium text-zinc-700 leading-relaxed">
                                        {translatedContent[`cluster-advice-${selectedCluster.id}`] || selectedCluster.strategicAdvice}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-zinc-400 text-sm font-medium border-2 border-dashed border-zinc-100 rounded-2xl">
                                    Click to generate a root cause analysis and implementation plan for this cluster.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Insights */}
                    <div>
                        <h4 className="text-sm font-bold text-zinc-950 uppercase tracking-widest mb-4">Key Takeaways</h4>
                        <div className="space-y-4">
                            {selectedCluster.keyInsights.map((insight, idx) => (
                                <div key={idx} className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 text-indigo-950 font-medium text-base leading-relaxed">
                                    {insight}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Raw Feedback */}
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="text-sm font-bold text-zinc-950 uppercase tracking-widest">Customer Voice</h4>
                            <span className="text-xs font-bold bg-zinc-100 px-2 py-1 rounded text-zinc-500">{getClusterItems(selectedCluster).length} ITEMS</span>
                        </div>
                        
                        <div className="space-y-4">
                            {getClusterItems(selectedCluster).length > 0 ? (
                                getClusterItems(selectedCluster).map((item, idx) => (
                                    <div key={idx} className="flex gap-4 p-4 rounded-xl hover:bg-zinc-50 transition-colors border border-transparent hover:border-zinc-100">
                                        <Quote className="w-5 h-5 text-zinc-300 shrink-0 mt-1" />
                                        <p className="text-zinc-700 text-base leading-relaxed">{item.content}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 text-zinc-400 bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-200">
                                    No direct verbatim items mapped to this cluster.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
          </>
      )}
    </div>
  );
};