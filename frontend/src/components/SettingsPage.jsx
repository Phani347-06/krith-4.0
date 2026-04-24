import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SettingsPage = ({ onBack }) => {
  const [activeSection, setActiveSection] = useState('profile');
  const [saveStatus, setSaveStatus] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);

  const [settings, setSettings] = useState({
    name: 'Pranav Aditya',
    email: 'pranav@cortex.ai',
    difficulty: 'Medium',
    xpGoal: 500,
    adaptiveLearning: true,
    refresherQuests: true,
    notifications: {
      assignments: true,
      attendance: true,
      streaks: true,
      quests: true
    },
    appearance: {
      theme: 'light',
      accent: 'green',
      fontSize: 'medium'
    },
    gamification: {
      sounds: true,
      animations: true,
      intensity: 'Normal'
    }
  });

  const handleSave = () => {
    setSaveStatus('saving');
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 2000);
    }, 1500);
  };

  const Toggle = ({ active, onToggle }) => (
    <button 
      onClick={onToggle}
      className={`w-14 h-8 rounded-full border-2 border-black relative transition-all ${active ? 'bg-matcha-500' : 'bg-stone-200'}`}
    >
      <motion.div 
        animate={{ x: active ? 24 : 2 }}
        className="w-6 h-6 rounded-full bg-white border-2 border-black absolute top-0.5"
      />
    </button>
  );

  return (
    <div className="min-h-screen bg-warm-cream text-black p-12 font-['Epilogue'] selection:bg-lemon-400 selection:text-black overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-16 bg-white p-8 rounded-[32px] border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="w-14 h-14 rounded-2xl bg-white border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none">
            <span className="material-symbols-outlined font-black">arrow_back</span>
          </button>
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">Command Center</h1>
            <p className="text-stone-400 text-[10px] font-black uppercase tracking-[0.4em] mt-1">Platform Configuration & Identity</p>
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={saveStatus === 'saving'}
          className={`flex items-center gap-3 px-10 py-4 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all font-black uppercase text-[10px] tracking-widest ${saveStatus === 'saved' ? 'bg-[#078a52] text-white' : 'bg-black text-white'}`}
        >
          {saveStatus === 'saving' ? 'Synchronizing...' : saveStatus === 'saved' ? 'Config Updated' : 'Save Changes'}
          <span className="material-symbols-outlined text-sm">{saveStatus === 'saved' ? 'done_all' : 'save'}</span>
        </button>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Navigation Sidebar */}
        <div className="space-y-4">
          {[
            { id: 'profile', icon: 'person', label: 'User Profile' },
            { id: 'learning', icon: 'psychology', label: 'Preferences' },
            { id: 'notifications', icon: 'notifications', label: 'Alerts' },
            { id: 'appearance', icon: 'palette', label: 'Appearance' },
            { id: 'security', icon: 'lock', label: 'Security' },
            { id: 'data', icon: 'database', label: 'Data & Privacy' }
          ].map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-black transition-all ${activeSection === section.id ? 'bg-black text-white shadow-[6px_6px_0px_0px_#078a52]' : 'bg-white hover:bg-stone-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'}`}
            >
              <span className="material-symbols-outlined">{section.icon}</span>
              <span className="text-[10px] font-black uppercase tracking-widest">{section.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {activeSection === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                <div className="bg-white rounded-[40px] border-2 border-black p-12 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
                   <div className="flex items-center gap-10 mb-12">
                      <div className="relative group">
                         <div className="w-32 h-32 rounded-full border-4 border-black overflow-hidden bg-lemon-400">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Pranav" alt="Avatar" className="w-full h-full object-cover" />
                         </div>
                         <button className="absolute bottom-0 right-0 w-10 h-10 bg-black text-white rounded-full border-2 border-white flex items-center justify-center hover:bg-matcha-500 transition-all">
                            <span className="material-symbols-outlined text-sm">edit</span>
                         </button>
                      </div>
                      <div>
                         <h2 className="text-3xl font-black italic uppercase tracking-tighter">Pranav Aditya</h2>
                         <p className="text-stone-400 text-xs font-black uppercase tracking-widest mt-1">Cortex Rank: Code Knight</p>
                      </div>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Full Name</label>
                         <input type="text" value={settings.name} onChange={(e) => setSettings({...settings, name: e.target.value})} className="w-full bg-stone-50 border-2 border-black p-5 rounded-2xl font-bold focus:shadow-[4px_4px_0px_0px_#078a52] outline-none transition-all" />
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Email Address</label>
                         <input type="email" value={settings.email} onChange={(e) => setSettings({...settings, email: e.target.value})} className="w-full bg-stone-50 border-2 border-black p-5 rounded-2xl font-bold focus:shadow-[4px_4px_0px_0px_#078a52] outline-none transition-all" />
                      </div>
                   </div>
                </div>
              </motion.div>
            )}

            {activeSection === 'learning' && (
              <motion.div key="learning" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                <div className="bg-white rounded-[40px] border-2 border-black p-12 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
                   <h3 className="text-xl font-black italic uppercase tracking-tighter mb-10 underline decoration-matcha-500 decoration-4 underline-offset-8">Cognitive Load & Optimization</h3>
                   
                   <div className="space-y-12">
                      <div className="space-y-6">
                         <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Global Difficulty Profile</p>
                         <div className="flex gap-4">
                            {['Easy', 'Medium', 'Hard'].map(level => (
                              <button 
                                key={level}
                                onClick={() => setSettings({...settings, difficulty: level})}
                                className={`flex-1 py-4 rounded-xl border-2 border-black font-black uppercase text-[10px] tracking-widest transition-all ${settings.difficulty === level ? 'bg-black text-white shadow-[4px_4px_0px_0px_#078a52]' : 'bg-white hover:bg-stone-50'}`}
                              >
                                {level}
                              </button>
                            ))}
                         </div>
                      </div>

                      <div className="space-y-6">
                         <div className="flex justify-between items-end">
                            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Daily XP Target</p>
                            <span className="text-xl font-black italic">{settings.xpGoal} XP</span>
                         </div>
                         <input 
                           type="range" min="100" max="2000" step="100" 
                           value={settings.xpGoal}
                           onChange={(e) => setSettings({...settings, xpGoal: parseInt(e.target.value)})}
                           className="w-full accent-black h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer"
                         />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-6">
                         <div className="flex items-center justify-between p-6 bg-stone-50 rounded-[32px] border-2 border-black">
                            <div>
                               <p className="font-black text-sm uppercase tracking-tighter">Adaptive Engine</p>
                               <p className="text-[10px] font-bold text-stone-400">Real-time path restructuring</p>
                            </div>
                            <Toggle active={settings.adaptiveLearning} onToggle={() => setSettings({...settings, adaptiveLearning: !settings.adaptiveLearning})} />
                         </div>
                         <div className="flex items-center justify-between p-6 bg-stone-50 rounded-[32px] border-2 border-black">
                            <div>
                               <p className="font-black text-sm uppercase tracking-tighter">Refresher Loops</p>
                               <p className="text-[10px] font-bold text-stone-400">Review gaps before advancing</p>
                            </div>
                            <Toggle active={settings.refresherQuests} onToggle={() => setSettings({...settings, refresherQuests: !settings.refresherQuests})} />
                         </div>
                      </div>
                   </div>
                </div>
              </motion.div>
            )}

            {activeSection === 'notifications' && (
              <motion.div key="notifications" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                  { id: 'assignments', label: 'Assignment Alerts', desc: 'Deadlines & evaluations', icon: 'assignment' },
                  { id: 'attendance', label: 'Attendance Monitor', desc: 'Low attendance warnings', icon: 'calendar_month' },
                  { id: 'streaks', label: 'Streak Safeguard', desc: 'Reminders to maintain daily streak', icon: 'local_fire_department' },
                  { id: 'quests', label: 'New Quest Alerts', desc: 'Syllabus updates & expansions', icon: 'explore' }
                ].map(item => (
                  <div key={item.id} className="bg-white rounded-[32px] border-2 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
                    <div className="flex items-center gap-6">
                       <div className="w-12 h-12 bg-stone-50 border-2 border-black rounded-2xl flex items-center justify-center">
                          <span className="material-symbols-outlined text-black">{item.icon}</span>
                       </div>
                       <div>
                          <p className="font-black text-sm uppercase tracking-tighter">{item.label}</p>
                          <p className="text-[10px] font-bold text-stone-400">{item.desc}</p>
                       </div>
                    </div>
                    <Toggle active={settings.notifications[item.id]} onToggle={() => setSettings({...settings, notifications: {...settings.notifications, [item.id]: !settings.notifications[item.id]}})} />
                  </div>
                ))}
              </motion.div>
            )}

            {activeSection === 'appearance' && (
              <motion.div key="appearance" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                <div className="bg-white rounded-[40px] border-2 border-black p-12 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-6">
                         <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">System Theme</p>
                         <div className="flex gap-4">
                            {['light', 'dark'].map(t => (
                              <button 
                                key={t}
                                onClick={() => setSettings({...settings, appearance: {...settings.appearance, theme: t}})}
                                className={`flex-1 py-10 rounded-[28px] border-2 border-black flex flex-col items-center gap-4 transition-all ${settings.appearance.theme === t ? 'bg-black text-white shadow-[6px_6px_0px_0px_#078a52]' : 'bg-stone-50 hover:bg-white'}`}
                              >
                                 <span className="material-symbols-outlined text-3xl">{t === 'light' ? 'light_mode' : 'dark_mode'}</span>
                                 <span className="text-[10px] font-black uppercase tracking-widest">{t}</span>
                              </button>
                            ))}
                         </div>
                      </div>
                      <div className="space-y-6">
                         <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Accent Identity</p>
                         <div className="grid grid-cols-3 gap-4">
                            {['blue', 'green', 'purple'].map(color => (
                              <button 
                                key={color}
                                onClick={() => setSettings({...settings, appearance: {...settings.appearance, accent: color}})}
                                className={`aspect-square rounded-2xl border-2 border-black flex items-center justify-center transition-all ${settings.appearance.accent === color ? 'shadow-[4px_4px_0px_0px_black] scale-105' : 'opacity-40 hover:opacity-100'}`}
                                style={{ backgroundColor: color === 'green' ? '#078a52' : color === 'blue' ? '#3b82f6' : '#a855f7' }}
                              >
                                {settings.appearance.accent === color && <span className="material-symbols-outlined text-white font-black">done</span>}
                              </button>
                            ))}
                         </div>
                      </div>
                   </div>
                </div>
              </motion.div>
            )}

            {activeSection === 'security' && (
              <motion.div key="security" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                <div className="bg-white rounded-[40px] border-2 border-black p-12 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] max-w-2xl">
                   <h3 className="text-xl font-black italic uppercase tracking-tighter mb-10">Authentication Shield</h3>
                   <div className="space-y-8">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Current Password</label>
                         <input type="password" placeholder="••••••••" className="w-full bg-stone-50 border-2 border-black p-5 rounded-2xl font-bold outline-none" />
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">New Password</label>
                         <input type="password" placeholder="••••••••" className="w-full bg-stone-50 border-2 border-black p-5 rounded-2xl font-bold outline-none" />
                      </div>
                      <button className="w-full py-5 bg-black text-white rounded-2xl border-2 border-black font-black uppercase text-[10px] tracking-widest shadow-[6px_6px_0px_0px_#078a52] active:shadow-none transition-all">Update Security Access</button>
                   </div>
                   <div className="mt-12 pt-12 border-t-2 border-stone-100 flex items-center justify-between">
                      <div>
                         <p className="font-black text-sm uppercase tracking-tighter">Two-Factor Authentication</p>
                         <p className="text-[10px] font-bold text-stone-400">Added layer of cryptographic security</p>
                      </div>
                      <Toggle active={false} onToggle={() => {}} />
                   </div>
                </div>
              </motion.div>
            )}

            {activeSection === 'data' && (
              <motion.div key="data" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                      { label: 'Total XP', value: '450', icon: 'stars' },
                      { label: 'Completed Quests', value: '12', icon: 'task_alt' },
                      { label: 'Active Days', value: '14', icon: 'calendar_today' }
                    ].map(stat => (
                      <div key={stat.label} className="bg-white rounded-3xl border-2 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                         <span className="material-symbols-outlined text-stone-300 mb-4">{stat.icon}</span>
                         <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">{stat.label}</p>
                         <p className="text-3xl font-black italic tracking-tighter">{stat.value}</p>
                      </div>
                    ))}
                 </div>
                 
                 <div className="bg-white rounded-[40px] border-2 border-black p-12 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
                    <h3 className="text-xl font-black italic uppercase tracking-tighter mb-10">Data Sovereignty</h3>
                    <div className="flex flex-col md:flex-row gap-6">
                       <button className="flex-1 flex items-center justify-center gap-4 p-8 rounded-[32px] border-2 border-black bg-stone-50 hover:bg-black hover:text-white transition-all group">
                          <span className="material-symbols-outlined group-hover:animate-bounce">download</span>
                          <span className="text-[10px] font-black uppercase tracking-widest">Export Comprehensive Archive</span>
                       </button>
                       <button 
                         onClick={() => setShowResetModal(true)}
                         className="flex-1 flex items-center justify-center gap-4 p-8 rounded-[32px] border-2 border-red-500 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all group"
                       >
                          <span className="material-symbols-outlined">delete_forever</span>
                          <span className="text-[10px] font-black uppercase tracking-widest">Purge Learning Progress</span>
                       </button>
                    </div>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* RESET MODAL */}
      <AnimatePresence>
        {showResetModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-8">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowResetModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
             <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 50 }} className="relative w-full max-w-lg bg-white rounded-[48px] border-4 border-black p-16 text-center shadow-[32px_32px_0px_0px_rgba(0,0,0,1)]">
                <div className="w-24 h-24 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-10 border-4 border-red-500">
                   <span className="material-symbols-outlined text-5xl">warning</span>
                </div>
                <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-4">Tactical Reset?</h2>
                <p className="text-stone-500 font-bold mb-10">This action will permanently purge all XP, streaks, and curriculum mastery. This cannot be undone.</p>
                <div className="flex gap-4">
                   <button onClick={() => setShowResetModal(false)} className="flex-1 py-5 bg-stone-100 rounded-2xl border-2 border-black font-black uppercase text-[10px] tracking-widest hover:bg-stone-200 transition-all">Abort Action</button>
                   <button onClick={() => setShowResetModal(false)} className="flex-1 py-5 bg-red-600 text-white rounded-2xl border-2 border-black font-black uppercase text-[10px] tracking-widest shadow-[6px_6px_0px_0px_#000] active:shadow-none transition-all">Confirm Purge</button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsPage;
