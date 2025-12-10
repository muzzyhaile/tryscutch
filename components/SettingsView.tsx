import React from 'react';
import { User, Lock, Trash2, Bell, Save } from 'lucide-react';

export const SettingsView: React.FC = () => {
  return (
    <div className="space-y-12 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-4 border-b border-zinc-100 pb-8">
        <h1 className="text-5xl font-bold tracking-tighter text-zinc-950">Settings</h1>
        <p className="text-xl text-zinc-500 font-light">Manage your account preferences and workspace configuration.</p>
      </div>

      <div className="space-y-12">
        {/* Profile Section */}
        <section className="space-y-6">
           <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-zinc-100 rounded-xl">
                    <User className="w-6 h-6 text-zinc-950" />
                </div>
                <h2 className="text-2xl font-bold text-zinc-950 tracking-tight">Profile</h2>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-2">
                   <label className="text-sm font-bold text-zinc-950 uppercase tracking-widest">Full Name</label>
                   <input 
                      type="text" 
                      defaultValue="Jane Doe"
                      className="w-full px-6 py-4 text-lg rounded-2xl border-2 border-zinc-100 bg-white text-zinc-900 focus:outline-none focus:border-zinc-950 transition-all font-medium placeholder-zinc-400"
                   />
               </div>
               <div className="space-y-2">
                   <label className="text-sm font-bold text-zinc-950 uppercase tracking-widest">Email Address</label>
                   <input 
                      type="email" 
                      defaultValue="jane@workspace.team"
                      className="w-full px-6 py-4 text-lg rounded-2xl border-2 border-zinc-100 bg-white text-zinc-900 focus:outline-none focus:border-zinc-950 transition-all font-medium placeholder-zinc-400"
                   />
               </div>
           </div>
        </section>

        {/* Notifications */}
        <section className="space-y-6 pt-8 border-t border-zinc-100">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-zinc-100 rounded-xl">
                    <Bell className="w-6 h-6 text-zinc-950" />
                </div>
                <h2 className="text-2xl font-bold text-zinc-950 tracking-tight">Notifications</h2>
           </div>

           <div className="space-y-4">
               <div className="flex items-center justify-between p-6 rounded-2xl border border-zinc-100 bg-zinc-50/50">
                   <div>
                       <h3 className="font-bold text-zinc-900 text-lg">Analysis Complete</h3>
                       <p className="text-zinc-500">Receive an email when your large datasets finish processing.</p>
                   </div>
                   <div className="relative inline-block w-14 h-8 align-middle select-none transition duration-200 ease-in">
                        <input type="checkbox" name="toggle" id="toggle1" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer translate-x-7 bg-zinc-950" defaultChecked/>
                        <label htmlFor="toggle1" className="toggle-label block overflow-hidden h-8 rounded-full bg-zinc-300 cursor-pointer"></label>
                   </div>
               </div>
               <div className="flex items-center justify-between p-6 rounded-2xl border border-zinc-100 bg-zinc-50/50">
                   <div>
                       <h3 className="font-bold text-zinc-900 text-lg">Weekly Digest</h3>
                       <p className="text-zinc-500">A summary of new insights across all your projects.</p>
                   </div>
                   <div className="relative inline-block w-14 h-8 align-middle select-none transition duration-200 ease-in">
                        <input type="checkbox" name="toggle" id="toggle2" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer translate-x-1" />
                        <label htmlFor="toggle2" className="toggle-label block overflow-hidden h-8 rounded-full bg-zinc-300 cursor-pointer"></label>
                   </div>
               </div>
           </div>
        </section>

        {/* Security */}
        <section className="space-y-6 pt-8 border-t border-zinc-100">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-zinc-100 rounded-xl">
                    <Lock className="w-6 h-6 text-zinc-950" />
                </div>
                <h2 className="text-2xl font-bold text-zinc-950 tracking-tight">Security</h2>
           </div>
           <button className="px-6 py-4 border-2 border-zinc-200 rounded-2xl text-zinc-950 font-bold hover:bg-zinc-50 transition-colors">
               Change Password
           </button>
        </section>

        {/* Danger Zone */}
        <section className="space-y-6 pt-8 border-t border-zinc-100">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-rose-50 rounded-xl">
                    <Trash2 className="w-6 h-6 text-rose-600" />
                </div>
                <h2 className="text-2xl font-bold text-rose-600 tracking-tight">Danger Zone</h2>
           </div>
           <div className="p-6 border-2 border-rose-100 rounded-3xl bg-rose-50/30 flex items-center justify-between">
               <div>
                   <h3 className="font-bold text-rose-900 text-lg">Delete Workspace</h3>
                   <p className="text-rose-700/80">Permanently remove all projects, data, and account information.</p>
               </div>
               <button className="px-6 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-colors">
                   Delete Account
               </button>
           </div>
        </section>

        <div className="pt-12 pb-24">
            <button className="w-full md:w-auto px-10 py-5 bg-zinc-950 text-white text-xl font-bold rounded-2xl hover:bg-zinc-800 transition-all flex items-center justify-center gap-3 shadow-xl">
                <Save className="w-5 h-5" />
                Save Changes
            </button>
        </div>
      </div>
    </div>
  );
};