import React from 'react';
import { CreditCard, CheckCircle2, Zap, BarChart3, ShieldCheck } from 'lucide-react';

export const BillingView: React.FC = () => {
  return (
    <div className="space-y-12 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="space-y-4 border-b border-zinc-100 pb-8">
        <h1 className="text-5xl font-bold tracking-tighter text-zinc-950">Billing & Plans</h1>
        <p className="text-xl text-zinc-500 font-light">Manage your subscription and usage limits.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Current Plan Card */}
          <div className="md:col-span-2 bg-zinc-950 text-white p-10 rounded-[2.5rem] relative overflow-hidden shadow-2xl">
               <div className="relative z-10">
                   <div className="flex justify-between items-start mb-8">
                       <div>
                           <div className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2">Current Plan</div>
                           <h2 className="text-4xl font-bold tracking-tight">Pro Workspace</h2>
                       </div>
                       <div className="px-4 py-2 bg-indigo-500 rounded-full text-xs font-bold uppercase tracking-widest">Active</div>
                   </div>

                   <div className="space-y-6 mb-10">
                       <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center">
                               <BarChart3 className="w-6 h-6 text-white" />
                           </div>
                           <div>
                               <div className="text-2xl font-bold">12 / 50</div>
                               <div className="text-zinc-400 font-medium">Projects Created</div>
                           </div>
                       </div>
                       <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                           <div className="bg-indigo-500 w-[24%] h-full"></div>
                       </div>
                       <p className="text-zinc-400 text-sm">Resets on Nov 1, 2024</p>
                   </div>

                   <div className="flex gap-4">
                       <button className="px-6 py-3 bg-white text-zinc-950 font-bold rounded-xl hover:bg-zinc-200 transition-colors">
                           Manage Subscription
                       </button>
                       <button className="px-6 py-3 bg-transparent border-2 border-zinc-700 text-white font-bold rounded-xl hover:bg-zinc-800 transition-colors">
                           View Invoices
                       </button>
                   </div>
               </div>
               
               {/* Decor */}
               <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                   <CreditCard size={200} />
               </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white border-2 border-zinc-100 p-8 rounded-[2.5rem] flex flex-col justify-between">
              <div>
                  <h3 className="text-xl font-bold text-zinc-950 mb-6">Payment Method</h3>
                  <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-10 bg-zinc-900 rounded-lg flex items-center justify-center text-white font-bold text-xs italic">VISA</div>
                      <div>
                          <div className="font-bold text-zinc-900">•••• 4242</div>
                          <div className="text-xs text-zinc-500">Expires 12/25</div>
                      </div>
                  </div>
              </div>
              <button className="w-full py-3 text-zinc-500 font-bold hover:text-zinc-950 text-left text-sm mt-4">
                  Update Payment Method →
              </button>
          </div>
      </div>

      {/* Compare Plans */}
      <div className="pt-12">
          <h2 className="text-3xl font-bold text-zinc-950 tracking-tight mb-8">Available Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Free */}
               <div className="p-8 border border-zinc-100 rounded-3xl bg-zinc-50">
                   <h3 className="text-xl font-bold text-zinc-950 mb-2">Starter</h3>
                   <div className="text-3xl font-bold text-zinc-950 mb-6">$0<span className="text-lg text-zinc-400 font-medium">/mo</span></div>
                   <ul className="space-y-4 mb-8">
                       <li className="flex gap-3 text-zinc-600 text-sm font-medium"><CheckCircle2 size={18} className="text-zinc-400"/> 3 Projects</li>
                       <li className="flex gap-3 text-zinc-600 text-sm font-medium"><CheckCircle2 size={18} className="text-zinc-400"/> Basic Analysis</li>
                       <li className="flex gap-3 text-zinc-600 text-sm font-medium"><CheckCircle2 size={18} className="text-zinc-400"/> Community Support</li>
                   </ul>
                   <button className="w-full py-3 border-2 border-zinc-200 rounded-xl font-bold text-zinc-400 cursor-not-allowed">Current Plan</button>
               </div>

               {/* Pro */}
               <div className="p-8 border-2 border-zinc-950 rounded-3xl bg-white relative overflow-hidden">
                   <div className="absolute top-0 right-0 bg-zinc-950 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">POPULAR</div>
                   <h3 className="text-xl font-bold text-zinc-950 mb-2">Pro</h3>
                   <div className="text-3xl font-bold text-zinc-950 mb-6">$29<span className="text-lg text-zinc-400 font-medium">/mo</span></div>
                   <ul className="space-y-4 mb-8">
                       <li className="flex gap-3 text-zinc-900 text-sm font-bold"><Zap size={18} className="text-indigo-600"/> 50 Projects</li>
                       <li className="flex gap-3 text-zinc-900 text-sm font-bold"><Zap size={18} className="text-indigo-600"/> Advanced Trends</li>
                       <li className="flex gap-3 text-zinc-900 text-sm font-bold"><Zap size={18} className="text-indigo-600"/> PDF Exports</li>
                   </ul>
                   <button className="w-full py-3 bg-zinc-950 text-white rounded-xl font-bold shadow-lg">Manage Plan</button>
               </div>

               {/* Enterprise */}
               <div className="p-8 border border-zinc-100 rounded-3xl bg-zinc-50">
                   <h3 className="text-xl font-bold text-zinc-950 mb-2">Enterprise</h3>
                   <div className="text-3xl font-bold text-zinc-950 mb-6">Custom</div>
                   <ul className="space-y-4 mb-8">
                       <li className="flex gap-3 text-zinc-600 text-sm font-medium"><ShieldCheck size={18} className="text-zinc-950"/> Unlimited Projects</li>
                       <li className="flex gap-3 text-zinc-600 text-sm font-medium"><ShieldCheck size={18} className="text-zinc-950"/> SSO & Security</li>
                       <li className="flex gap-3 text-zinc-600 text-sm font-medium"><ShieldCheck size={18} className="text-zinc-950"/> Dedicated Support</li>
                   </ul>
                   <button className="w-full py-3 border-2 border-zinc-200 rounded-xl font-bold text-zinc-900 hover:bg-zinc-100 transition-colors">Contact Sales</button>
               </div>
          </div>
      </div>
    </div>
  );
};