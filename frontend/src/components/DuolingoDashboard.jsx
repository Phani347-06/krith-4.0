import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const INITIAL_TOPICS = [
  { id: 't1', title: 'Variables', type: 'core', status: 'completed', question: 'Which is a valid variable name?', options: ['123var', 'my_var', 'var!', 'my-var'], answer: 1, xp: 100 },
  { id: 't2', title: 'Data Types', type: 'core', status: 'active', question: 'What type is "Hello"?', options: ['int', 'float', 'string', 'bool'], answer: 2, xp: 100 },
  { id: 't3', title: 'Loops', type: 'core', status: 'locked', question: 'Which keyword starts a loop?', options: ['for', 'if', 'else', 'return'], answer: 0, xp: 100 },
  { id: 't4', title: 'Functions', type: 'core', status: 'locked', question: 'How do you define a function?', options: ['func', 'def', 'function', 'void'], answer: 1, xp: 100 },
  { id: 't5', title: 'Classes', type: 'core', status: 'locked', question: 'What is an instance of a class?', options: ['Object', 'Method', 'Attribute', 'Variable'], answer: 0, xp: 100 },
];

const DuolingoDashboard = ({ onLogout, onViewStats, onViewSettings, onViewAchievements }) => {
  const [path, setPath] = useState(INITIAL_TOPICS);
  const [userStats, setUserStats] = useState({ xp: 150, streak: 3, level: 2, profile: 'average' });
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const handleProfileChange = (profile) => {
    setUserStats(prev => ({ ...prev, profile }));
  };

  const startQuiz = (node) => {
    if (node.status !== 'active') return;
    setActiveQuiz(node);
  };

  const handleAnswer = (optionIdx) => {
    if (!activeQuiz) return;

    if (optionIdx === activeQuiz.answer) {
      setFeedback({ type: 'success', msg: `CORRECT! +${activeQuiz.xp} XP` });
      
      const newPath = [...path];
      const currentIndex = newPath.findIndex(n => n.id === activeQuiz.id);
      newPath[currentIndex].status = 'completed';
      if (currentIndex + 1 < newPath.length) {
        newPath[currentIndex + 1].status = 'active';
      }
      setPath(newPath);
      setUserStats(prev => ({ ...prev, xp: prev.xp + activeQuiz.xp }));

      setTimeout(() => {
        setFeedback(null);
        setActiveQuiz(null);
      }, 2000);
    } else {
      setFeedback({ type: 'error', msg: 'WRONG! REFRESHER QUEST INSERTED.' });
      
      const newPath = [...path];
      const currentIndex = newPath.findIndex(n => n.id === activeQuiz.id);
      const refresherId = `ref-${Date.now()}`;
      const refresherNode = {
        id: refresherId,
        title: `Refresher: ${activeQuiz.title}`,
        type: 'refresher',
        status: 'active',
        question: `Let's review ${activeQuiz.title}. What's basic?`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        answer: 0,
        xp: 50
      };

      newPath[currentIndex].status = 'locked';
      newPath.splice(currentIndex, 0, refresherNode);
      setPath(newPath);

      setTimeout(() => {
        setFeedback(null);
        setActiveQuiz(null);
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-['Epilogue'] overflow-x-hidden selection:bg-matcha-500 selection:text-black">
      {/* Dynamic Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-8 py-6 bg-black/60 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center cursor-pointer">
            <span className="material-symbols-outlined text-white text-sm">bolt</span>
          </div>
          <h1 className="text-xl font-black uppercase tracking-tighter italic">Cortex Duo</h1>
        </div>

        <div className="flex items-center gap-6">
          <select 
            value={userStats.profile}
            onChange={(e) => handleProfileChange(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-blue-500"
          >
            <option value="struggling">Struggling</option>
            <option value="average">Average</option>
            <option value="advanced">Advanced</option>
          </select>

          <div 
            onClick={onViewAchievements}
            className="flex items-center gap-4 bg-white/5 px-6 py-2 rounded-full border border-white/10 cursor-pointer hover:bg-white/10 transition-all"
          >
            <div className="flex items-center gap-2">
               <span className="material-symbols-outlined text-orange-500 text-sm">local_fire_department</span>
               <span className="text-xs font-black">{userStats.streak}</span>
            </div>
            <div className="w-[1px] h-4 bg-white/10" />
            <div className="flex items-center gap-2">
               <span className="material-symbols-outlined text-blue-500 text-sm">stars</span>
               <span className="text-xs font-black">{userStats.xp} XP</span>
            </div>
          </div>
          
          <button onClick={onLogout} className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
            <span className="material-symbols-outlined text-sm">logout</span>
          </button>
        </div>
      </header>

      {/* PERSISTENT GLOBAL SIDEBAR (LEFT) */}
      <aside className="fixed top-[94px] bottom-0 left-0 w-24 bg-black/60 backdrop-blur-xl border-r border-white/5 z-50 flex flex-col items-center py-10 gap-8">
        {['Curriculum', 'Stats', 'Achievements', 'Settings'].map((item, idx) => (
          <motion.a 
            key={item} 
            onClick={(e) => {
              e.preventDefault();
              if (item === 'Stats') onViewStats();
              if (item === 'Achievements') onViewAchievements();
              if (item === 'Settings') onViewSettings();
            }}
            whileHover={{ scale: 1.1 }}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${idx === 0 ? 'bg-blue-500 text-white shadow-lg' : 'text-stone-500 hover:text-white hover:bg-white/5'}`} 
            href="#"
            title={item}
          >
            <span className="material-symbols-outlined text-2xl">{['school', 'bar_chart', 'emoji_events', 'settings'][idx]}</span>
          </motion.a>
        ))}
      </aside>

      {/* Main Path Area */}
      <main className="pt-32 pb-20 flex flex-col items-center">
        <div className="max-w-md w-full relative">
          {/* Vertical Path Line */}
          <div className="absolute top-0 bottom-0 left-1/2 w-2 bg-white/5 -translate-x-1/2 rounded-full" />
          
          <div className="flex flex-col gap-24 relative z-10">
            {path.map((node, i) => {
              const isActive = node.status === 'active';
              const isCompleted = node.status === 'completed';
              const isRefresher = node.type === 'refresher';
              
              // Duolingo wiggle pattern
              const xOffset = Math.sin(i * 1.2) * 50;

              return (
                <div key={node.id} className="flex flex-col items-center">
                  <motion.div
                    style={{ x: xOffset }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => startQuiz(node)}
                    className={`
                      relative w-24 h-24 rounded-full flex items-center justify-center cursor-pointer transition-all duration-500
                      ${isCompleted ? 'bg-green-500 shadow-[0_0_30px_rgba(34,197,94,0.3)]' : 
                        isActive ? 'bg-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.5)]' : 
                        'bg-[#1a1a1a] border-4 border-white/5'}
                    `}
                  >
                    {isActive && (
                      <motion.div 
                        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute inset-0 bg-blue-500 rounded-full"
                      />
                    )}

                    <div className="relative z-10 flex flex-col items-center">
                       <span className="material-symbols-outlined text-3xl font-black">
                         {isCompleted ? 'check' : isRefresher ? 'history_edu' : 'menu_book'}
                       </span>
                    </div>

                    {/* Progress Circle (for active) */}
                    {isActive && (
                      <svg className="absolute -inset-4 w-32 h-32 -rotate-90">
                        <circle cx="64" cy="64" r="58" fill="none" stroke="white" strokeWidth="4" strokeOpacity="0.1" />
                        <motion.circle 
                          cx="64" cy="64" r="58" fill="none" stroke="#3b82f6" strokeWidth="4" 
                          strokeDasharray="364" 
                          initial={{ strokeDashoffset: 364 }}
                          animate={{ strokeDashoffset: 180 }}
                        />
                      </svg>
                    )}
                  </motion.div>
                  <motion.p 
                    style={{ x: xOffset }}
                    className={`mt-4 text-[10px] font-black uppercase tracking-[0.3em] ${isActive ? 'text-blue-500' : 'text-stone-500'}`}
                  >
                    {node.title}
                  </motion.p>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* MCQ MODAL */}
      <AnimatePresence>
        {activeQuiz && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md" 
              onClick={() => setActiveQuiz(null)}
            />
            
            <motion.div 
              initial={{ y: 100, scale: 0.9 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 100, scale: 0.9 }}
              className="relative w-full max-w-lg bg-[#111] rounded-[40px] border border-white/10 p-12 overflow-hidden shadow-2xl"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-white/5">
                <motion.div 
                  initial={{ width: 0 }} animate={{ width: '60%' }}
                  className="h-full bg-blue-500" 
                />
              </div>

              <div className="mb-10 text-center">
                 <span className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500 mb-4 block">Unit Assessment</span>
                 <h2 className="text-2xl font-black leading-tight">{activeQuiz.question}</h2>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {activeQuiz.options.map((opt, i) => (
                  <button 
                    key={i}
                    onClick={() => handleAnswer(i)}
                    className="group relative w-full p-6 bg-white/5 border-2 border-white/5 rounded-2xl text-left hover:border-blue-500 hover:bg-blue-500/5 transition-all"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black group-hover:bg-blue-500 group-hover:text-white">
                        {String.fromCharCode(65 + i)}
                      </div>
                      <span className="font-bold text-stone-300 group-hover:text-white">{opt}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Internal Feedback Overlay */}
              <AnimatePresence>
                {feedback && (
                  <motion.div 
                    initial={{ y: 200 }} animate={{ y: 0 }} exit={{ y: 200 }}
                    className={`absolute inset-x-0 bottom-0 p-10 flex items-center justify-between z-20 ${feedback.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="material-symbols-outlined text-3xl font-black">
                        {feedback.type === 'success' ? 'check_circle' : 'error'}
                      </span>
                      <span className="font-black uppercase tracking-widest text-sm">{feedback.msg}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Particles/Background Glows */}
      <div className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-500/10 blur-[150px] -z-10 animate-pulse" />
      <div className="fixed bottom-1/4 right-1/4 w-[500px] h-[500px] bg-green-500/10 blur-[150px] -z-10 animate-pulse delay-1000" />
    </div>
  );
};

export default DuolingoDashboard;
