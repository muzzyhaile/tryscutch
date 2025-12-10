import React from 'react';
import { Project, Cluster } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Download, TrendingUp, AlertTriangle, MessageSquare, CheckCircle2 } from 'lucide-react';

interface AnalysisViewProps {
  project: Project;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ project }) => {
  const result = project.analysis;

  if (!result) return <div>No analysis available.</div>;

  const sortedClusters = [...result.clusters].sort((a, b) => b.itemCount - a.itemCount);
  const totalItems = result.totalItemsProcessed;

  // Custom colors for calmness
  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];

  const getSentimentColor = (score: number) => {
    if (score > 0.3) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (score < -0.3) return 'text-rose-600 bg-rose-50 border-rose-100';
    return 'text-zinc-600 bg-zinc-100 border-zinc-200';
  };

  const getPriorityColor = (score: number) => {
    if (score >= 8) return 'text-rose-700 bg-rose-50 border-rose-200';
    if (score >= 5) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-zinc-700 bg-zinc-50 border-zinc-200';
  };

  const exportReport = () => {
    const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
      JSON.stringify(project, null, 2)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = `${project.name.replace(/\s+/g, "_")}_report.json`;
    link.click();
  };

  const scrollToCluster = (clusterId: string) => {
    const element = document.getElementById(`cluster-${clusterId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add a temporary highlight ring
      element.classList.add('ring-2', 'ring-indigo-500');
      setTimeout(() => element.classList.remove('ring-2', 'ring-indigo-500'), 2000);
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <span className="px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-600 uppercase tracking-wider">Analysis Complete</span>
             <span className="text-zinc-300">•</span>
             <span className="text-xs text-zinc-500">{new Date(project.createdAt).toLocaleDateString()}</span>
          </div>
          <h1 className="text-3xl font-bold text-zinc-900">{project.name}</h1>
        </div>
        <button 
            onClick={exportReport}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-700 font-medium rounded-lg hover:bg-zinc-50 transition-all shadow-sm"
        >
            <Download size={16} />
            Export Report
        </button>
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <h3 className="text-lg font-semibold text-zinc-900 mb-2">Executive Summary</h3>
          <p className="text-zinc-600 leading-relaxed">
            {result.summary}
          </p>
          
          <div className="mt-6 pt-6 border-t border-zinc-100 grid grid-cols-3 gap-4">
              <div>
                  <div className="text-sm text-zinc-500 mb-1">Sentiment</div>
                  <div className="flex items-center gap-2">
                     <span className={`text-2xl font-bold ${result.overallSentiment > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {(result.overallSentiment * 100).toFixed(0)}%
                     </span>
                     <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
                        {result.overallSentiment > 0.2 ? 'Positive' : result.overallSentiment < -0.2 ? 'Negative' : 'Neutral'}
                     </span>
                  </div>
              </div>
              <div>
                  <div className="text-sm text-zinc-500 mb-1">Volume</div>
                  <div className="flex items-center gap-2">
                     <span className="text-2xl font-bold text-zinc-900">
                        {totalItems}
                     </span>
                     <span className="text-xs text-zinc-400">items</span>
                  </div>
              </div>
              <div>
                  <div className="text-sm text-zinc-500 mb-1">Clusters</div>
                  <div className="flex items-center gap-2">
                     <span className="text-2xl font-bold text-zinc-900">
                        {result.clusters.length}
                     </span>
                     <span className="text-xs text-zinc-400">themes</span>
                  </div>
              </div>
          </div>
        </div>

        <div className="bg-indigo-900 p-6 rounded-2xl shadow-sm text-white flex flex-col">
            <h3 className="text-indigo-200 font-medium text-sm uppercase tracking-wider mb-4">Top Action Items</h3>
            <ul className="space-y-3 flex-1">
                {result.topPriorities.slice(0, 3).map((item, i) => (
                    <li key={i} className="flex gap-3">
                        <div className="mt-1 min-w-[18px]">
                            <CheckCircle2 size={18} className="text-indigo-400" />
                        </div>
                        <span className="text-sm text-indigo-100 font-light leading-snug">{item}</span>
                    </li>
                ))}
            </ul>
        </div>
      </div>

      {/* Cluster Chart */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
        <h3 className="text-lg font-semibold text-zinc-900 mb-6">Theme Distribution</h3>
        <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                    data={sortedClusters} 
                    layout="vertical" 
                    margin={{ top: 0, right: 20, left: 20, bottom: 0 }}
                >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E4E4E7" />
                    <XAxis type="number" hide />
                    <YAxis 
                        dataKey="name" 
                        type="category" 
                        axisLine={false} 
                        tickLine={false} 
                        width={180}
                        tick={{ fill: '#52525B', fontSize: 13, fontWeight: 500 }}
                    />
                    <Tooltip 
                        cursor={{ fill: '#F4F4F5' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Bar 
                        dataKey="itemCount" 
                        radius={[0, 4, 4, 0]} 
                        barSize={32}
                        onClick={(data) => scrollToCluster(data.id)}
                        className="cursor-pointer"
                    >
                        {sortedClusters.map((entry, index) => (
                            <Cell 
                                key={`cell-${index}`} 
                                fill={COLORS[index % COLORS.length]} 
                                className="hover:opacity-80 transition-opacity"
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
        <p className="text-center text-xs text-zinc-400 mt-4">Click on a bar to view theme details</p>
      </div>

      {/* Deep Dive Clusters */}
      <div className="grid grid-cols-1 gap-6">
        <h3 className="text-xl font-semibold text-zinc-900 mt-4">Deep Dive</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sortedClusters.map((cluster) => (
                <div 
                    key={cluster.id} 
                    id={`cluster-${cluster.id}`}
                    className="bg-white rounded-xl border border-zinc-200 p-5 hover:shadow-md transition-all duration-300 scroll-mt-24"
                >
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                            <h4 className="font-semibold text-zinc-900 text-lg">{cluster.name}</h4>
                            {cluster.isEmerging && (
                                <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100">
                                    <TrendingUp size={12} /> Emerging
                                </span>
                            )}
                        </div>
                        <div className={`px-2 py-1 text-xs font-bold rounded border ${getPriorityColor(cluster.priorityScore)}`}>
                            P{cluster.priorityScore}
                        </div>
                    </div>
                    
                    <p className="text-zinc-600 text-sm mb-4 leading-relaxed">
                        {cluster.description}
                    </p>

                    <div className="mb-4">
                        <h5 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Key Insights</h5>
                        <ul className="space-y-1">
                            {cluster.keyInsights.map((insight, idx) => (
                                <li key={idx} className="text-sm text-zinc-700 flex items-start gap-2">
                                    <span className="text-zinc-300 mt-1.5">•</span>
                                    <span>{insight}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-zinc-100 mt-auto">
                        <div className="flex items-center gap-3">
                             <div className={`px-2 py-1 text-xs font-medium rounded border ${getSentimentColor(cluster.sentimentScore)}`}>
                                Sentiment: {cluster.sentimentScore > 0 ? '+' : ''}{cluster.sentimentScore}
                             </div>
                        </div>
                        <div className="flex items-center gap-1 text-zinc-400 text-xs">
                            <MessageSquare size={14} />
                            {cluster.itemCount} items
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};
