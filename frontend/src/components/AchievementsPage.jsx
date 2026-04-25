import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { curriculumData } from '../data/curriculum';

// ─── Read live data from localStorage (same keys Dashboard writes) ───────────
const loadStats = () => {
  try {
    const saved = localStorage.getItem('cortexai_userstats_v2');
    return saved ? JSON.parse(saved) : { xp: 0, level: 1, streak: 0 };
  } catch { return { xp: 0, level: 1, streak: 0 }; }
};

const loadCompleted = () => {
  try {
    const saved = localStorage.getItem('cortexai_completed_subtopics_v2');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  } catch { return new Set(); }
};

// ─── XP per question type ─────────────────────────────────────────────────────
const XP_RULES = { mcq: 20, fill_blank: 30, coding: 50 };
const calcModuleXP = (mod) =>
  (mod.questions || []).reduce((s, q) => s + (XP_RULES[q.type || q.question_type] || 20), 0);

// ─── Badge unlock logic ───────────────────────────────────────────────────────
const buildBadges = (stats, completed, curriculum) => {
  const completedCount = completed.size;
  const level1Done = curriculum.find(n => n.id === 1)?.modules.every(m => completed.has(`1:${m.title}`));
  const level2Done = curriculum.find(n => n.id === 2)?.modules.every(m => completed.has(`2:${m.title}`));
  const hasVariables = completed.has('1:1.2 Variables');
  const hasLoops = completed.has('2:2.2 Loops (for, while)');
  const hasFunctions = completed.has('3:3.1 Functions');

  return [
    {
      id: 'b1', name: 'First Quest', icon: 'explore', category: 'Learning',
      desc: 'Complete your very first subtopic.',
      unlocked: completedCount >= 1,
      requirement: 'Complete 1 subtopic'
    },
    {
      id: 'b2', name: 'Variable Master', icon: 'inventory_2', category: 'Learning',
      desc: 'Complete the Variables module.',
      unlocked: !!hasVariables,
      requirement: 'Complete 1.2 Variables'
    },
    {
      id: 'b3', name: 'Consistency King', icon: 'military_tech', category: 'Streak',
      desc: 'Maintain a 3-day learning streak.',
      unlocked: stats.streak >= 3,
      requirement: '3-day streak'
    },
    {
      id: 'b4', name: 'Level 1 Graduate', icon: 'verified', category: 'Learning',
      desc: 'Complete all Programming Basics modules.',
      unlocked: !!level1Done,
      requirement: 'Finish all Level 1 subtopics'
    },
    {
      id: 'b5', name: 'Loop Expert', icon: 'all_inclusive', category: 'Learning',
      desc: 'Complete the Loops module.',
      unlocked: !!hasLoops,
      requirement: 'Complete 2.2 Loops'
    },
    {
      id: 'b6', name: 'XP Hunter', icon: 'workspace_premium', category: 'Performance',
      desc: 'Earn 500 or more total XP.',
      unlocked: stats.xp >= 500,
      requirement: '500 XP total'
    },
    {
      id: 'b7', name: 'Function Wizard', icon: 'bolt', category: 'Learning',
      desc: 'Complete the Functions module.',
      unlocked: !!hasFunctions,
      requirement: 'Complete 3.1 Functions'
    },
    {
      id: 'b8', name: 'Logic Builder', icon: 'psychology', category: 'Learning',
      desc: 'Complete all Logic Building modules.',
      unlocked: !!level2Done,
      requirement: 'Finish all Level 2 subtopics'
    },
    {
      id: 'b9', name: 'Quest Warrior', icon: 'sword', category: 'Performance',
      desc: 'Complete 5 or more subtopics.',
      unlocked: completedCount >= 5,
      requirement: 'Complete 5 subtopics'
    },
    {
      id: 'b10', name: 'XP Legend', icon: 'stars', category: 'Performance',
      desc: 'Earn 1000 or more total XP.',
      unlocked: stats.xp >= 1000,
      requirement: '1000 XP total'
    },
  ];
};

// ─── Dynamic challenges ───────────────────────────────────────────────────────
const buildChallenges = (stats, completed) => {
  const completedCount = completed.size;
  return [
    {
      id: 1, title: 'First Step',
      desc: 'Complete your very first subtopic.',
      icon: 'explore',
      progress: Math.min(completedCount, 1), total: 1, xp: 20,
      completed: completedCount >= 1
    },
    {
      id: 2, title: 'Quest Trio',
      desc: 'Complete 3 subtopics in total.',
      icon: 'filter_3',
      progress: Math.min(completedCount, 3), total: 3, xp: 50,
      completed: completedCount >= 3
    },
    {
      id: 3, title: 'Quest Warrior',
      desc: 'Complete 6 subtopics in total.',
      icon: 'military_tech',
      progress: Math.min(completedCount, 6), total: 6, xp: 100,
      completed: completedCount >= 6
    },
    {
      id: 4, title: 'Level Up!',
      desc: 'Reach Level 2 on your profile.',
      icon: 'trending_up',
      progress: Math.min(stats.level, 2), total: 2, xp: 80,
      completed: stats.level >= 2
    },
    {
      id: 5, title: 'XP Grinder',
      desc: 'Earn 200 total XP from lessons.',
      icon: 'bolt',
      progress: Math.min(stats.xp, 200), total: 200, xp: 60,
      completed: stats.xp >= 200
    },
    {
      id: 6, title: 'XP Hunter',
      desc: 'Earn 500 total XP from lessons.',
      icon: 'stars',
      progress: Math.min(stats.xp, 500), total: 500, xp: 120,
      completed: stats.xp >= 500
    },
    {
      id: 7, title: 'Hot Streak',
      desc: 'Maintain a 3-day learning streak.',
      icon: 'local_fire_department',
      progress: Math.min(stats.streak || 0, 3), total: 3, xp: 75,
      completed: (stats.streak || 0) >= 3
    },
    {
      id: 8, title: 'Dedicated Learner',
      desc: 'Maintain a 7-day learning streak.',
      icon: 'workspace_premium',
      progress: Math.min(stats.streak || 0, 7), total: 7, xp: 200,
      completed: (stats.streak || 0) >= 7
    },
  ];
};

// ─────────────────────────────────────────────────────────────────────────────

const AchievementsPage = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('badges');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Read live data from localStorage every render
  const stats = loadStats();
  const completed = loadCompleted();
  const completedCount = completed.size;

  // Total modules across all curriculum
  const totalModules = curriculumData.reduce((s, n) => s + n.modules.length, 0);
  const totalXPPossible = curriculumData.reduce((s, n) =>
    s + n.modules.reduce((ms, m) => ms + calcModuleXP(m), 0), 0);

  const badges = buildBadges(stats, completed, curriculumData);
  const challenges = buildChallenges(stats, completed);

  const categories = ['All', 'Learning', 'Streak', 'Performance'];
  const filteredBadges = badges.filter(b =>
    selectedCategory === 'All' || b.category === selectedCategory
  );

  const unlockedCount = badges.filter(b => b.unlocked).length;
  const nextLevelXP = (stats.level) * 200;

  return (
    <div className="min-h-screen bg-warm-cream text-black p-12 font-['Epilogue'] selection:bg-lemon-400 selection:text-black overflow-y-auto">

      {/* ── Hero header ── */}
      <div className="max-w-7xl mx-auto mb-12 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Level progress card */}
        <div className="lg:col-span-2 bg-white rounded-[40px] border-2 border-black p-10 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
          <div className="flex items-center gap-8 mb-8">
            <button
              onClick={onBack}
              className="w-14 h-14 rounded-2xl bg-white border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none cursor-pointer"
            >
              <span className="material-symbols-outlined font-black">arrow_back</span>
            </button>
            <div>
              <h1 className="text-4xl font-black tracking-tighter uppercase italic">Hall of Mastery</h1>
              <p className="text-stone-400 text-[10px] font-black uppercase tracking-[0.4em] mt-1">Live Achievements & Progression</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div className="flex items-baseline gap-2">
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Current Rank</span>
                <span className="text-3xl font-black italic uppercase tracking-tighter">LEVEL {stats.level}</span>
              </div>
              <span className="text-sm font-black italic text-stone-400">{stats.xp} / {nextLevelXP} XP</span>
            </div>
            <div className="h-6 bg-stone-100 rounded-full border-2 border-black overflow-hidden relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((stats.xp / nextLevelXP) * 100, 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-matcha-500 border-r-2 border-black"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-[8px] font-black uppercase tracking-[0.5em] text-black/40">Mastery Progression</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live stats card */}
        <div className="bg-matcha-600 rounded-[40px] border-2 border-black p-10 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10 space-y-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-matcha-200 mb-1">Total XP Earned</p>
              <p className="text-4xl font-black">{stats.xp} <span className="text-xl text-matcha-200">XP</span></p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-black/20 rounded-2xl p-4 border border-white/10 text-center">
                <p className="text-[9px] font-black uppercase tracking-widest text-matcha-200 mb-1">Subtopics</p>
                <p className="text-2xl font-black">{completedCount}<span className="text-sm text-matcha-200">/{totalModules}</span></p>
              </div>
              <div className="bg-black/20 rounded-2xl p-4 border border-white/10 text-center">
                <p className="text-[9px] font-black uppercase tracking-widest text-matcha-200 mb-1">Badges</p>
                <p className="text-2xl font-black">{unlockedCount}<span className="text-sm text-matcha-200">/{badges.length}</span></p>
              </div>
              <div className="bg-black/20 rounded-2xl p-4 border border-white/10 text-center">
                <p className="text-[9px] font-black uppercase tracking-widest text-matcha-200 mb-1">🔥 Streak</p>
                <p className="text-2xl font-black">{stats.streak || 0}<span className="text-sm text-matcha-200"> days</span></p>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[9px] font-black uppercase mb-2">
                <span className="text-matcha-200">Curriculum Progress</span>
                <span>{Math.round((completedCount / totalModules) * 100)}%</span>
              </div>
              <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(completedCount / totalModules) * 100}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="h-full bg-lemon-400 rounded-full"
                />
              </div>
            </div>
          </div>
          <div className="absolute -right-8 -bottom-8 opacity-10">
            <span className="material-symbols-outlined text-[120px] font-black">emoji_events</span>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-6 mb-10">
          {['badges', 'challenges'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-10 py-4 rounded-2xl border-2 border-black font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === tab ? 'bg-black text-white shadow-[6px_6px_0px_0px_#078a52]' : 'bg-white hover:bg-stone-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'}`}
            >
              {tab === 'badges' ? `🏅 Badges (${unlockedCount}/${badges.length})` : `⚡ Challenges`}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ── Badges tab ── */}
          {activeTab === 'badges' && (
            <motion.div key="badges" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10">
              <div className="flex flex-wrap gap-3">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-6 py-3 rounded-full border-2 border-black text-[9px] font-black uppercase tracking-widest transition-all ${selectedCategory === cat ? 'bg-lemon-400 shadow-[3px_3px_0px_0px_black]' : 'bg-white hover:bg-stone-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredBadges.map((badge, i) => (
                  <motion.div
                    key={badge.id}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ y: -5 }}
                    className={`relative group bg-white rounded-[32px] border-2 border-black p-8 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all ${
                      badge.unlocked
                        ? 'hover:shadow-[12px_12px_0px_0px_rgba(7,138,82,0.4)]'
                        : 'opacity-60 grayscale'
                    }`}
                  >
                    {!badge.unlocked && (
                      <div className="absolute top-4 right-4 w-8 h-8 bg-stone-100 border-2 border-black rounded-lg flex items-center justify-center z-20 shadow-[2px_2px_0px_0px_black]">
                        <span className="material-symbols-outlined text-sm text-stone-400 font-black">lock</span>
                      </div>
                    )}
                    {badge.unlocked && (
                      <div className="absolute top-4 right-4 w-8 h-8 bg-green-500 border-2 border-black rounded-lg flex items-center justify-center z-20 shadow-[2px_2px_0px_0px_black]">
                        <span className="material-symbols-outlined text-sm text-white font-black">check</span>
                      </div>
                    )}

                    <div className={`w-20 h-20 rounded-3xl border-2 border-black mx-auto mb-5 flex items-center justify-center transition-all ${
                      badge.unlocked
                        ? 'bg-lemon-400 group-hover:rotate-12 group-hover:scale-110 shadow-[6px_6px_0px_0px_black]'
                        : 'bg-stone-100'
                    }`}>
                      <span className="material-symbols-outlined text-4xl font-black">{badge.icon}</span>
                    </div>

                    <h3 className={`text-base font-black uppercase italic tracking-tighter mb-1 ${badge.unlocked ? 'text-black' : 'text-stone-400'}`}>
                      {badge.name}
                    </h3>
                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-3">{badge.category}</p>
                    <p className={`text-[10px] font-bold italic ${badge.unlocked ? 'text-stone-600' : 'text-stone-300'}`}>
                      {badge.unlocked ? `"${badge.desc}"` : `🔒 ${badge.requirement}`}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Challenges tab ── */}
          {activeTab === 'challenges' && (
            <motion.div key="challenges" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {challenges.map((challenge, i) => (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`bg-white rounded-[40px] border-2 border-black p-10 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group ${challenge.completed ? 'bg-green-50 border-green-400' : ''}`}
                >
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className={`w-16 h-16 rounded-2xl border-2 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_black] group-hover:rotate-6 transition-transform ${challenge.completed ? 'bg-green-500' : 'bg-stone-50'}`}>
                      <span className={`material-symbols-outlined text-3xl font-black ${challenge.completed ? 'text-white' : 'text-matcha-600'}`}>
                        {challenge.completed ? 'task_alt' : (challenge.icon || 'bolt')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Reward</span>
                      <p className={`text-2xl font-black italic ${challenge.completed ? 'text-green-600' : 'text-matcha-600'}`}>+{challenge.xp} XP</p>
                    </div>
                  </div>

                  <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-2 relative z-10">{challenge.title}</h3>
                  <p className="text-xs text-stone-400 font-bold mb-6 relative z-10">{challenge.desc}</p>

                  <div className="space-y-2 relative z-10">
                    <div className="flex justify-between text-[10px] font-black uppercase">
                      <span className="text-stone-400">Progress</span>
                      <span className={challenge.completed ? 'text-green-600' : 'text-black'}>
                        {challenge.progress} / {challenge.total}
                      </span>
                    </div>
                    <div className="h-4 bg-stone-100 rounded-full border-2 border-black overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(challenge.progress / challenge.total) * 100}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className={`h-full ${challenge.completed ? 'bg-green-500' : 'bg-matcha-500'}`}
                      />
                    </div>
                  </div>

                  {challenge.completed && (
                    <div className="absolute top-5 right-5 rotate-12 bg-green-600 text-white px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 border-black shadow-[3px_3px_0px_0px_black]">
                      ✓ DONE
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <div className="max-w-7xl mx-auto mt-20 text-center">
        <p className="text-stone-300 text-[10px] font-black uppercase tracking-[0.5em]">Forge your academic legacy</p>
      </div>
    </div>
  );
};

export default AchievementsPage;
