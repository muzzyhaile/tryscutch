import React, { useMemo, useState } from 'react';
import { ICP, ProductInfo, MarketFeedback, ProductPrinciple, ContextData, DEFAULT_PRODUCT_PRINCIPLES } from '../types';
import { Plus, Edit2, Trash2, Users, Package, TrendingUp, X, Save, Compass, Check, Sparkles, Loader2 } from 'lucide-react';
import { generateMarketResearch } from '../services/geminiService';
import { useNotification } from '../lib/notification';

interface ContextManagerProps {
  contextData: ContextData;
  onUpdate: (data: ContextData) => void;
}

type ActiveTab = 'icp' | 'product' | 'market' | 'principles';

export const ContextManager: React.FC<ContextManagerProps> = ({ contextData, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('icp');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [showResearch, setShowResearch] = useState(false);
  const [researchCategory, setResearchCategory] = useState<'competitors' | 'pricing' | 'market' | 'other'>('competitors');
  const [researchName, setResearchName] = useState('');
  const [researchQuery, setResearchQuery] = useState('');
  const [isResearchLoading, setIsResearchLoading] = useState(false);
  const { notify } = useNotification();
  
  // ICP Form State
  const [icpForm, setIcpForm] = useState<Partial<ICP>>({});
  
  // Product Form State
  const [productForm, setProductForm] = useState<Partial<ProductInfo>>({});
  
  // Market Feedback Form State
  const [feedbackForm, setFeedbackForm] = useState<Partial<MarketFeedback>>({});
  
  // Product Principles Form State
  const [principleForm, setPrincipleForm] = useState<Partial<ProductPrinciple>>({});

  const resetForms = () => {
    setIcpForm({});
    setProductForm({});
    setFeedbackForm({});
    setPrincipleForm({});
    setIsEditing(false);
    setEditingId(null);
  };

  const contextSummary = useMemo(() => {
    const productBits = contextData.productInfos
      .slice(0, 3)
      .map(p => `Product: ${p.name}\n${p.description}${p.valueProposition ? `\nValue Proposition: ${p.valueProposition}` : ''}`)
      .join('\n\n');
    const icpBits = contextData.icps
      .slice(0, 3)
      .map(i => `ICP: ${i.name}\n${i.description}${i.painPoints ? `\nPain Points: ${i.painPoints}` : ''}`)
      .join('\n\n');

    return [productBits, icpBits].filter(Boolean).join('\n\n');
  }, [contextData.icps, contextData.productInfos]);

  const handleGenerateResearch = async () => {
    if (!researchQuery.trim()) {
      notify({
        type: 'warning',
        title: 'Missing request',
        message: 'Add a short research question before generating.',
      });
      return;
    }
    setIsResearchLoading(true);
    try {
      const content = await generateMarketResearch(researchCategory, researchQuery.trim(), contextSummary || undefined);

      const newResearch: MarketFeedback = {
        id: crypto.randomUUID(),
        name: (researchName || `${researchCategory.toUpperCase()} Research`).trim(),
        source: 'AI Research',
        content: `# ${researchName || `${researchCategory} research`}\n\n**Category:** ${researchCategory}\n\n**Request:** ${researchQuery.trim()}\n\n---\n\n${content}`,
        date: new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString(),
      };

      onUpdate({
        ...contextData,
        marketFeedbacks: [newResearch, ...contextData.marketFeedbacks],
      });

      setShowResearch(false);
      setResearchName('');
      setResearchQuery('');
    } catch (e) {
      console.error(e);
      notify({
        type: 'error',
        title: 'Research failed',
        message: e instanceof Error ? e.message : 'Failed to generate research. Please try again.',
      });
    } finally {
      setIsResearchLoading(false);
    }
  };

  // ICP Operations
  const handleSaveICP = () => {
    if (!icpForm.name || !icpForm.description) return;
    
    if (editingId) {
      onUpdate({
        ...contextData,
        icps: contextData.icps.map(icp => 
          icp.id === editingId ? { ...icp, ...icpForm } as ICP : icp
        )
      });
    } else {
      const newICP: ICP = {
        id: crypto.randomUUID(),
        name: icpForm.name,
        description: icpForm.description,
        demographics: icpForm.demographics || '',
        painPoints: icpForm.painPoints || '',
        goals: icpForm.goals || '',
        createdAt: new Date().toISOString()
      };
      onUpdate({ ...contextData, icps: [...contextData.icps, newICP] });
    }
    resetForms();
  };

  const handleEditICP = (icp: ICP) => {
    setIcpForm(icp);
    setEditingId(icp.id);
    setIsEditing(true);
  };

  const handleDeleteICP = (id: string) => {
    if (confirm('Delete this ICP?')) {
      onUpdate({ ...contextData, icps: contextData.icps.filter(i => i.id !== id) });
    }
  };

  // Product Operations
  const handleSaveProduct = () => {
    if (!productForm.name || !productForm.description) return;
    
    if (editingId) {
      onUpdate({
        ...contextData,
        productInfos: contextData.productInfos.map(p => 
          p.id === editingId ? { ...p, ...productForm } as ProductInfo : p
        )
      });
    } else {
      const newProduct: ProductInfo = {
        id: crypto.randomUUID(),
        name: productForm.name,
        description: productForm.description,
        features: productForm.features || '',
        targetMarket: productForm.targetMarket || '',
        valueProposition: productForm.valueProposition || '',
        createdAt: new Date().toISOString()
      };
      onUpdate({ ...contextData, productInfos: [...contextData.productInfos, newProduct] });
    }
    resetForms();
  };

  const handleEditProduct = (product: ProductInfo) => {
    setProductForm(product);
    setEditingId(product.id);
    setIsEditing(true);
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('Delete this product info?')) {
      onUpdate({ ...contextData, productInfos: contextData.productInfos.filter(p => p.id !== id) });
    }
  };

  // Market Feedback Operations
  const handleSaveFeedback = () => {
    if (!feedbackForm.name || !feedbackForm.content) return;
    
    if (editingId) {
      onUpdate({
        ...contextData,
        marketFeedbacks: contextData.marketFeedbacks.map(f => 
          f.id === editingId ? { ...f, ...feedbackForm } as MarketFeedback : f
        )
      });
    } else {
      const newFeedback: MarketFeedback = {
        id: crypto.randomUUID(),
        name: feedbackForm.name,
        source: feedbackForm.source || '',
        content: feedbackForm.content,
        date: feedbackForm.date || '',
        createdAt: new Date().toISOString()
      };
      onUpdate({ ...contextData, marketFeedbacks: [...contextData.marketFeedbacks, newFeedback] });
    }
    resetForms();
  };

  const handleEditFeedback = (feedback: MarketFeedback) => {
    setFeedbackForm(feedback);
    setEditingId(feedback.id);
    setIsEditing(true);
  };

  const handleDeleteFeedback = (id: string) => {
    if (confirm('Delete this market feedback?')) {
      onUpdate({ ...contextData, marketFeedbacks: contextData.marketFeedbacks.filter(f => f.id !== id) });
    }
  };

  // Product Principles Operations
  const handleSavePrinciple = () => {
    if (!principleForm.title || !principleForm.description) return;
    
    if (editingId) {
      onUpdate({
        ...contextData,
        productPrinciples: contextData.productPrinciples.map(p => 
          p.id === editingId ? { ...p, ...principleForm } as ProductPrinciple : p
        )
      });
    } else {
      const newPrinciple: ProductPrinciple = {
        id: crypto.randomUUID(),
        title: principleForm.title,
        description: principleForm.description,
        category: principleForm.category || 'other',
        priority: principleForm.priority || 'medium',
        createdAt: new Date().toISOString()
      };
      onUpdate({ ...contextData, productPrinciples: [...contextData.productPrinciples, newPrinciple] });
    }
    resetForms();
  };

  const handleEditPrinciple = (principle: ProductPrinciple) => {
    setPrincipleForm(principle);
    setEditingId(principle.id);
    setIsEditing(true);
  };

  const handleDeletePrinciple = (id: string) => {
    if (confirm('Delete this product principle?')) {
      onUpdate({ ...contextData, productPrinciples: contextData.productPrinciples.filter(p => p.id !== id) });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-zinc-950 mb-2">Context Library</h1>
        <p className="text-zinc-500 text-lg">Manage ICPs, product info, and market research to enhance your analysis</p>
      </div>

      {/* Tabs */}
      <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex gap-2 overflow-x-auto border-b border-zinc-200">
        <button
          onClick={() => { setActiveTab('icp'); resetForms(); }}
          className={`shrink-0 whitespace-nowrap flex items-center gap-2 px-4 sm:px-6 py-3 font-bold transition-all ${
            activeTab === 'icp'
              ? 'border-b-2 border-zinc-950 text-zinc-950'
              : 'text-zinc-400 hover:text-zinc-600'
          }`}
        >
          <Users size={20} />
          ICPs ({contextData.icps.length})
        </button>
        <button
          onClick={() => { setActiveTab('product'); resetForms(); }}
          className={`shrink-0 whitespace-nowrap flex items-center gap-2 px-4 sm:px-6 py-3 font-bold transition-all ${
            activeTab === 'product'
              ? 'border-b-2 border-zinc-950 text-zinc-950'
              : 'text-zinc-400 hover:text-zinc-600'
          }`}
        >
          <Package size={20} />
          Product Info ({contextData.productInfos.length})
        </button>
        <button
          onClick={() => { setActiveTab('market'); resetForms(); }}
          className={`shrink-0 whitespace-nowrap flex items-center gap-2 px-4 sm:px-6 py-3 font-bold transition-all ${
            activeTab === 'market'
              ? 'border-b-2 border-zinc-950 text-zinc-950'
              : 'text-zinc-400 hover:text-zinc-600'
          }`}
        >
          <TrendingUp size={20} />
          Market Feedback ({contextData.marketFeedbacks.length})
        </button>
        <button
          onClick={() => { setActiveTab('principles'); resetForms(); }}
          className={`shrink-0 whitespace-nowrap flex items-center gap-2 px-4 sm:px-6 py-3 font-bold transition-all ${
            activeTab === 'principles'
              ? 'border-b-2 border-zinc-950 text-zinc-950'
              : 'text-zinc-400 hover:text-zinc-600'
          }`}
        >
          <Compass size={20} />
          Product Principles ({contextData.productPrinciples.length})
        </button>
      </div>

      {/* ICP Tab */}
      {activeTab === 'icp' && (
        <div className="space-y-6">
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-6 py-3 bg-zinc-950 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all"
            >
              <Plus size={20} />
              New ICP
            </button>
          )}

          {isEditing && (
            <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">{editingId ? 'Edit ICP' : 'New ICP'}</h3>
                <button onClick={resetForms} className="p-2 hover:bg-zinc-200 rounded-lg">
                  <X size={20} />
                </button>
              </div>
              
              <input
                type="text"
                placeholder="ICP Name (e.g., Enterprise SaaS Buyer)"
                value={icpForm.name || ''}
                onChange={(e) => setIcpForm({ ...icpForm, name: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:border-zinc-950 focus:outline-none font-medium"
              />
              
              <textarea
                placeholder="Description"
                value={icpForm.description || ''}
                onChange={(e) => setIcpForm({ ...icpForm, description: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:border-zinc-950 focus:outline-none font-medium"
                rows={3}
              />
              
              <textarea
                placeholder="Demographics (optional)"
                value={icpForm.demographics || ''}
                onChange={(e) => setIcpForm({ ...icpForm, demographics: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:border-zinc-950 focus:outline-none font-medium"
                rows={2}
              />
              
              <textarea
                placeholder="Pain Points (optional)"
                value={icpForm.painPoints || ''}
                onChange={(e) => setIcpForm({ ...icpForm, painPoints: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:border-zinc-950 focus:outline-none font-medium"
                rows={2}
              />
              
              <textarea
                placeholder="Goals (optional)"
                value={icpForm.goals || ''}
                onChange={(e) => setIcpForm({ ...icpForm, goals: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:border-zinc-950 focus:outline-none font-medium"
                rows={2}
              />
              
              <button
                onClick={handleSaveICP}
                disabled={!icpForm.name || !icpForm.description}
                className="flex items-center gap-2 px-6 py-3 bg-zinc-950 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={20} />
                Save ICP
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contextData.icps.map((icp) => (
              <div key={icp.id} className="bg-white p-6 rounded-xl border border-zinc-200 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-lg font-bold text-zinc-950">{icp.name}</h4>
                  <div className="flex gap-2">
                    <button onClick={() => handleEditICP(icp)} className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-500 hover:text-zinc-950">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDeleteICP(icp.id)} className="p-2 hover:bg-rose-100 rounded-lg text-zinc-500 hover:text-rose-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-zinc-600 text-sm mb-3">{icp.description}</p>
                {icp.demographics && <p className="text-xs text-zinc-400 mb-1"><strong>Demographics:</strong> {icp.demographics}</p>}
                {icp.painPoints && <p className="text-xs text-zinc-400 mb-1"><strong>Pain Points:</strong> {icp.painPoints}</p>}
                {icp.goals && <p className="text-xs text-zinc-400"><strong>Goals:</strong> {icp.goals}</p>}
              </div>
            ))}
          </div>

          {contextData.icps.length === 0 && !isEditing && (
            <div className="text-center py-16 border-2 border-dashed border-zinc-200 rounded-2xl">
              <Users size={48} className="mx-auto mb-4 text-zinc-300" />
              <p className="text-zinc-500 font-medium">No ICPs yet</p>
              <p className="text-sm text-zinc-400 mt-2">Create your first Ideal Customer Profile</p>
            </div>
          )}
        </div>
      )}

      {/* Product Info Tab */}
      {activeTab === 'product' && (
        <div className="space-y-6">
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-6 py-3 bg-zinc-950 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all"
            >
              <Plus size={20} />
              New Product Info
            </button>
          )}

          {isEditing && (
            <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">{editingId ? 'Edit Product Info' : 'New Product Info'}</h3>
                <button onClick={resetForms} className="p-2 hover:bg-zinc-200 rounded-lg">
                  <X size={20} />
                </button>
              </div>
              
              <input
                type="text"
                placeholder="Product Name"
                value={productForm.name || ''}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:border-zinc-950 focus:outline-none font-medium"
              />
              
              <textarea
                placeholder="Description"
                value={productForm.description || ''}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:border-zinc-950 focus:outline-none font-medium"
                rows={3}
              />
              
              <textarea
                placeholder="Features (optional)"
                value={productForm.features || ''}
                onChange={(e) => setProductForm({ ...productForm, features: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:border-zinc-950 focus:outline-none font-medium"
                rows={2}
              />
              
              <textarea
                placeholder="Target Market (optional)"
                value={productForm.targetMarket || ''}
                onChange={(e) => setProductForm({ ...productForm, targetMarket: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:border-zinc-950 focus:outline-none font-medium"
                rows={2}
              />
              
              <textarea
                placeholder="Value Proposition (optional)"
                value={productForm.valueProposition || ''}
                onChange={(e) => setProductForm({ ...productForm, valueProposition: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:border-zinc-950 focus:outline-none font-medium"
                rows={2}
              />
              
              <button
                onClick={handleSaveProduct}
                disabled={!productForm.name || !productForm.description}
                className="flex items-center gap-2 px-6 py-3 bg-zinc-950 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={20} />
                Save Product Info
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contextData.productInfos.map((product) => (
              <div key={product.id} className="bg-white p-6 rounded-xl border border-zinc-200 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-lg font-bold text-zinc-950">{product.name}</h4>
                  <div className="flex gap-2">
                    <button onClick={() => handleEditProduct(product)} className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-500 hover:text-zinc-950">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDeleteProduct(product.id)} className="p-2 hover:bg-rose-100 rounded-lg text-zinc-500 hover:text-rose-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-zinc-600 text-sm mb-3">{product.description}</p>
                {product.features && <p className="text-xs text-zinc-400 mb-1"><strong>Features:</strong> {product.features}</p>}
                {product.targetMarket && <p className="text-xs text-zinc-400 mb-1"><strong>Target Market:</strong> {product.targetMarket}</p>}
                {product.valueProposition && <p className="text-xs text-zinc-400"><strong>Value Prop:</strong> {product.valueProposition}</p>}
              </div>
            ))}
          </div>

          {contextData.productInfos.length === 0 && !isEditing && (
            <div className="text-center py-16 border-2 border-dashed border-zinc-200 rounded-2xl">
              <Package size={48} className="mx-auto mb-4 text-zinc-300" />
              <p className="text-zinc-500 font-medium">No product info yet</p>
              <p className="text-sm text-zinc-400 mt-2">Add product details to enhance analysis</p>
            </div>
          )}
        </div>
      )}

      {/* Market Feedback Tab */}
      {activeTab === 'market' && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-3">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-6 py-3 bg-zinc-950 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all"
              >
                <Plus size={20} />
                New Market Feedback
              </button>
            )}
            <button
              onClick={() => setShowResearch(prev => !prev)}
              className="flex items-center gap-2 px-6 py-3 bg-white text-zinc-950 rounded-xl font-bold border border-zinc-200 hover:border-zinc-950 transition-all"
            >
              <Sparkles size={20} />
              AI Research
            </button>
          </div>

          {showResearch && (
            <div className="bg-white p-6 rounded-2xl border border-zinc-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Generate Market Research</h3>
                <button onClick={() => setShowResearch(false)} className="p-2 hover:bg-zinc-100 rounded-lg">
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Research name (optional)"
                  value={researchName}
                  onChange={(e) => setResearchName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:border-zinc-950 focus:outline-none font-medium"
                />
                <select
                  value={researchCategory}
                  onChange={(e) => setResearchCategory(e.target.value as any)}
                  className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:border-zinc-950 focus:outline-none font-medium"
                >
                  <option value="competitors">Competitors</option>
                  <option value="pricing">Pricing</option>
                  <option value="market">Market</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <textarea
                placeholder='What do you want to research? (e.g., "Top competitors for X and how they position pricing")'
                value={researchQuery}
                onChange={(e) => setResearchQuery(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:border-zinc-950 focus:outline-none font-medium"
                rows={5}
              />

              <button
                onClick={handleGenerateResearch}
                disabled={!researchQuery.trim() || isResearchLoading}
                className="flex items-center gap-2 px-6 py-3 bg-zinc-950 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResearchLoading ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                Generate & Save
              </button>

              <p className="text-xs text-zinc-400">
                Note: this generates a research brief without live web browsing; it includes a deep-search plan and what to verify.
              </p>
            </div>
          )}

          {isEditing && (
            <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">{editingId ? 'Edit Market Feedback' : 'New Market Feedback'}</h3>
                <button onClick={resetForms} className="p-2 hover:bg-zinc-200 rounded-lg">
                  <X size={20} />
                </button>
              </div>
              
              <input
                type="text"
                placeholder="Research Name"
                value={feedbackForm.name || ''}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, name: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:border-zinc-950 focus:outline-none font-medium"
              />
              
              <input
                type="text"
                placeholder="Source (e.g., Survey, Interview, Reddit)"
                value={feedbackForm.source || ''}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, source: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:border-zinc-950 focus:outline-none font-medium"
              />
              
              <textarea
                placeholder="Content"
                value={feedbackForm.content || ''}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, content: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:border-zinc-950 focus:outline-none font-medium"
                rows={5}
              />
              
              <input
                type="date"
                placeholder="Date (optional)"
                value={feedbackForm.date || ''}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, date: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:border-zinc-950 focus:outline-none font-medium"
              />
              
              <button
                onClick={handleSaveFeedback}
                disabled={!feedbackForm.name || !feedbackForm.content}
                className="flex items-center gap-2 px-6 py-3 bg-zinc-950 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={20} />
                Save Market Feedback
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {contextData.marketFeedbacks.map((feedback) => (
              <div key={feedback.id} className="bg-white p-6 rounded-xl border border-zinc-200 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-lg font-bold text-zinc-950">{feedback.name}</h4>
                    <p className="text-xs text-zinc-400">Source: {feedback.source} {feedback.date && `• ${feedback.date}`}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEditFeedback(feedback)} className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-500 hover:text-zinc-950">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDeleteFeedback(feedback.id)} className="p-2 hover:bg-rose-100 rounded-lg text-zinc-500 hover:text-rose-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-zinc-600 text-sm whitespace-pre-wrap">{feedback.content}</p>
              </div>
            ))}
          </div>

          {contextData.marketFeedbacks.length === 0 && !isEditing && (
            <div className="text-center py-16 border-2 border-dashed border-zinc-200 rounded-2xl">
              <TrendingUp size={48} className="mx-auto mb-4 text-zinc-300" />
              <p className="text-zinc-500 font-medium">No market feedback yet</p>
              <p className="text-sm text-zinc-400 mt-2">Add market research to inform analysis</p>
            </div>
          )}
        </div>
      )}

      {/* Product Principles Tab */}
      {activeTab === 'principles' && (
        <div className="space-y-6">
          {/* Template Selection */}
          {!isEditing && contextData.productPrinciples.length === 0 && (
            <div className="bg-white p-6 rounded-2xl border border-zinc-200">
              <h3 className="text-xl font-bold mb-4">Quick Start: Select Pre-defined Principles</h3>
              <p className="text-zinc-600 mb-4">Choose from common product principles to get started quickly</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {DEFAULT_PRODUCT_PRINCIPLES.map((principle, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      const newPrinciple: ProductPrinciple = {
                        ...principle,
                        id: crypto.randomUUID(),
                        createdAt: new Date().toISOString()
                      };
                      onUpdate({
                        ...contextData,
                        productPrinciples: [...contextData.productPrinciples, newPrinciple]
                      });
                    }}
                    className="text-left p-4 rounded-lg border border-zinc-200 hover:border-zinc-950 hover:bg-zinc-50 transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-bold text-zinc-950">{principle.title}</span>
                      <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${
                        principle.priority === 'high' ? 'bg-rose-100 text-rose-700' :
                        principle.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-zinc-100 text-zinc-600'
                      }`}>{principle.priority}</span>
                    </div>
                    <p className="text-sm text-zinc-600">{principle.description}</p>
                    <span className="text-xs text-zinc-400 mt-2 inline-block">{principle.category}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  DEFAULT_PRODUCT_PRINCIPLES.forEach((principle, index) => {
                    setTimeout(() => {
                      const newPrinciple: ProductPrinciple = {
                        ...principle,
                        id: crypto.randomUUID(),
                        createdAt: new Date().toISOString()
                      };
                      onUpdate({
                        ...contextData,
                        productPrinciples: [...contextData.productPrinciples, newPrinciple]
                      });
                    }, index * 50);
                  });
                }}
                className="w-full py-3 border-2 border-dashed border-zinc-300 rounded-lg hover:border-zinc-950 hover:bg-zinc-50 transition-all text-zinc-600 hover:text-zinc-950 font-bold"
              >
                <Check size={18} className="inline mr-2" />
                Add All Principles
              </button>
            </div>
          )}

          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-6 py-3 bg-zinc-950 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all"
            >
              <Plus size={20} />
              {contextData.productPrinciples.length === 0 ? 'Create Custom Principle' : 'New Product Principle'}
            </button>
          )}

          {isEditing && (
            <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">{editingId ? 'Edit Product Principle' : 'New Product Principle'}</h3>
                <button onClick={resetForms} className="p-2 hover:bg-zinc-200 rounded-lg">
                  <X size={20} />
                </button>
              </div>
              
              <input
                type="text"
                placeholder="Principle Title (e.g., Mobile-First Design)"
                value={principleForm.title || ''}
                onChange={(e) => setPrincipleForm({ ...principleForm, title: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:border-zinc-950 focus:outline-none font-medium"
              />
              
              <textarea
                placeholder="Description (e.g., All features must be optimized for mobile devices first)"
                value={principleForm.description || ''}
                onChange={(e) => setPrincipleForm({ ...principleForm, description: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:border-zinc-950 focus:outline-none font-medium"
                rows={3}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">Category</label>
                  <select
                    value={principleForm.category || 'other'}
                    onChange={(e) => setPrincipleForm({ ...principleForm, category: e.target.value as ProductPrinciple['category'] })}
                    className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:border-zinc-950 focus:outline-none font-medium"
                  >
                    <option value="design">Design</option>
                    <option value="technical">Technical</option>
                    <option value="business">Business</option>
                    <option value="user-experience">User Experience</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">Priority</label>
                  <select
                    value={principleForm.priority || 'medium'}
                    onChange={(e) => setPrincipleForm({ ...principleForm, priority: e.target.value as ProductPrinciple['priority'] })}
                    className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:border-zinc-950 focus:outline-none font-medium"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              
              <button
                onClick={handleSavePrinciple}
                disabled={!principleForm.title || !principleForm.description}
                className="flex items-center gap-2 px-6 py-3 bg-zinc-950 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={20} />
                Save Product Principle
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contextData.productPrinciples.map((principle) => (
              <div key={principle.id} className="bg-white p-6 rounded-xl border border-zinc-200 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-zinc-950">{principle.title}</h4>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs px-2 py-1 rounded bg-zinc-100 text-zinc-600 font-bold uppercase">{principle.category}</span>
                      <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${
                        principle.priority === 'high' ? 'bg-rose-100 text-rose-700' :
                        principle.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-zinc-100 text-zinc-600'
                      }`}>{principle.priority}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEditPrinciple(principle)} className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-500 hover:text-zinc-950">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDeletePrinciple(principle.id)} className="p-2 hover:bg-rose-100 rounded-lg text-zinc-500 hover:text-rose-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-zinc-600 text-sm">{principle.description}</p>
              </div>
            ))}
          </div>

          {contextData.productPrinciples.length === 0 && !isEditing && (
            <div className="text-center py-16 border-2 border-dashed border-zinc-200 rounded-2xl">
              <Compass size={48} className="mx-auto mb-4 text-zinc-300" />
              <p className="text-zinc-500 font-medium">No product principles yet</p>
              <p className="text-sm text-zinc-400 mt-2">Define guiding principles for product recommendations</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
