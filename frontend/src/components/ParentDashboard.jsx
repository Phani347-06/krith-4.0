import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { curriculumData } from '../data/curriculum';
import { API_URL } from '../config';

const ParentDashboard = ({ onBack }) => {
  const [connectedStudentId, setConnectedStudentId] = useState(() => {
    const stored = localStorage.getItem('cortexai_parent_linked_student');
    if (!stored) return null;
    const clean = stored.replace(/^CTX-0*/i, '') || stored;
    if (clean !== stored) localStorage.setItem('cortexai_parent_linked_student', clean);
    return clean;
  });
  const [studentStats, setStudentStats] = useState(null);
  // Start in loading state if already linked so we never flash "0 XP"
  const [loading, setLoading] = useState(() => !!localStorage.getItem('cortexai_parent_linked_student'));
  const [linkInput, setLinkInput] = useState('');
  const [error, setError] = useState(null);
  const [weeklyActivity, setWeeklyActivity] = useState([]);

  // Always show the highest known XP — API value wins over stale localStorage
  const localStats = (() => {
    try { return JSON.parse(localStorage.getItem('cortexai_userstats_v2') || '{}'); }
    catch { return {}; }
  })();
  const displayXP    = Math.max(localStats.xp || 0, studentStats?.xp || 0);
  const displayLevel = Math.max(localStats.level || 1, studentStats?.current_level || 1);
  const displayStreak = localStats.streak || 0;

  const parentId = "PAR-882-991";

  useEffect(() => {
    if (!connectedStudentId) return;
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/rl/student-progress/${connectedStudentId}`);
        if (res.ok) {
          const data = await res.json();
          setStudentStats(data);
          setError(null);
        } else {
          setError("Student not found or access denied.");
        }
      } catch (err) {
        console.error("Failed to fetch child progress", err);
        setError("Connection failure to brain server.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();

    // Also fetch the real weekly activity for the chart
    fetch(`${API_URL}/api/rl/weekly-activity/${connectedStudentId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setWeeklyActivity(data); })
      .catch(() => {});
  }, [connectedStudentId]);

  const handleLinkStudent = (e) => {
    e.preventDefault();
    if (linkInput.trim()) {
      // Strip any "CTX-" prefix and leading zeros so backend always gets a plain number
      const raw = linkInput.trim().replace(/^CTX-0*/i, '') || linkInput.trim();
      localStorage.setItem('cortexai_parent_linked_student', raw);
      setConnectedStudentId(raw);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('cortexai_parent_linked_student');
    setConnectedStudentId(null);
    setStudentStats(null);
  };

  if (!connectedStudentId) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-['Outfit']">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-3xl p-10 border border-slate-100 shadow-xl"
        >
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-8">
            <span className="material-symbols-outlined text-indigo-600 text-3xl">family_restroom</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Guardian Portal</h1>
          <p className="text-slate-500 text-sm mb-8">Enter your child's unique Student ID to synchronize academic progress and AI insights.</p>
          
          <form onSubmit={handleLinkStudent} className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Student Access Code</label>
              <input 
                type="text"
                placeholder="e.g. 1"
                className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
              />
            </div>
            <button type="submit" className="w-full h-14 bg-[#1e293b] text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg">
              Synchronize Data
            </button>
            <button type="button" onClick={onBack} className="w-full text-slate-400 text-sm font-bold hover:text-slate-600 transition-all">
              Back to Login
            </button>
          </form>
          <div className="mt-10 pt-8 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Your Guardian ID: {parentId}</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-12 h-12 border-4 border-[#1e293b] border-t-transparent rounded-full" />
      </div>
    );
  }

  // Fallback to mock data if real data is all zeros or empty
  let chartData = weeklyActivity.length > 0 && weeklyActivity.some(d => d.xp > 0)
    ? weeklyActivity
    : [];

  if (chartData.length === 0) {
    chartData = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return { day: d.toLocaleDateString('en-US', { weekday: 'short' }), xp: 100 };
    });
  }
  // Dynamic Insights
  const sortedMastery = [...(studentStats?.mastery || [])].sort((a, b) => b.score - a.score);
  const strongest = sortedMastery[0];
  const weakest = sortedMastery[sortedMastery.length - 1];
  const strongName = strongest ? curriculumData.find(t => t.id === strongest.topic_id)?.topic_name || "Programming Basics" : "Programming Basics";
  const weakName = weakest ? curriculumData.find(t => t.id === weakest.topic_id)?.topic_name || "Data Structures" : "Data Structures";
  
  // Dynamic Momentum
  const avgMastery = studentStats?.mastery?.length 
    ? studentStats.mastery.reduce((acc, m) => acc + m.score, 0) / studentStats.mastery.length 
    : 0;
  const masteryVal = Math.round(avgMastery * 100);
  const coreTopics = curriculumData.filter(d => d.track_type === 'core').length || 4;
  const coverageVal = Math.round(((studentStats?.completed_topics?.length || 0) / coreTopics) * 100) || 0;
  
  const todayXP = chartData.length >= 2 ? Math.max(0, chartData[chartData.length - 1].xp - chartData[chartData.length - 2].xp) : 0;
  const dailyGoalVal = Math.min(100, Math.round((todayXP / 100) * 100));

  // Dynamic Heatmap
  const getHeatmapLevel = (xp) => {
    if (xp <= 0) return 0;
    if (xp < 50) return 1;
    if (xp < 100) return 2;
    if (xp < 200) return 3;
    return 4;
  };
  const heatmapData = Array.from({ length: 40 }).map((_, i) => {
    if (i < 33) return 0;
    const dayIdx = i - 33;
    const dailyXP = dayIdx === 0 
      ? Math.max(0, chartData[0].xp - 100) 
      : Math.max(0, chartData[dayIdx].xp - chartData[dayIdx - 1].xp);
    return getHeatmapLevel(dailyXP);
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] font-['Outfit'] p-8 md:p-12 pb-24 overflow-y-auto">
      {/* Header */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div className="flex items-center gap-6">
          <button 
            onClick={handleDisconnect}
            className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-slate-600">logout</span>
          </button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Guardian Overview</h1>
            <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Linked to Student: {connectedStudentId}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all shadow-sm">
            Generate PDF Report
          </button>
          <button className="px-5 py-2.5 bg-[#1e293b] text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">settings</span>
            Guardian Settings
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Quick Stats */}
        <div className="lg:col-span-1 space-y-8">
          {/* Profile Card */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                P
              </div>
              <div>
                <h2 className="font-bold text-xl">Pranav Aditya</h2>
                <p className="text-slate-400 text-sm">Level {displayLevel} · {displayStreak} Day Streak 🔥</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Total XP</p>
                <p className="text-2xl font-bold">{loading ? "..." : displayXP}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Rank</p>
                <p className="text-lg font-bold text-indigo-600 truncate">{loading ? "Syncing..." : (studentStats?.rank || "Novice")}</p>
              </div>
            </div>
          </div>

          {/* Krith's AI Insight */}
          <div className="bg-[#1e293b] text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full -mr-16 -mt-16"></div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">psychology</span>
              </div>
              <h3 className="font-bold text-lg">Krith's Insight</h3>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed mb-6 italic">
              "Pranav is showing exceptional grit in **{strongName}**. However, I recommend focusing on **{weakName}** this week to balance his foundation."
            </p>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
              Recommendation: Micro-lesson in {weakName}
            </div>
          </div>

          {/* Achievement Progress */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
            <h3 className="font-bold text-lg mb-6">Learning Momentum</h3>
            <div className="space-y-6">
              {[
                { label: 'Mastery Progress', val: masteryVal, color: 'bg-indigo-500' },
                { label: 'Daily Goal', val: dailyGoalVal, color: 'bg-emerald-500' },
                { label: 'Syllabus Coverage', val: coverageVal, color: 'bg-amber-500' }
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-slate-500 uppercase tracking-wider">{item.label}</span>
                    <span className="text-slate-900">{item.val}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${item.val}%` }} 
                      className={`h-full ${item.color} rounded-full`} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Middle/Right Column: Charts and Mastery */}
        <div className="lg:col-span-2 space-y-8">
          {/* Weekly Activity Area Chart */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-bold text-xl tracking-tight">Learning Engagement</h3>
              <select className="bg-slate-50 border-none rounded-lg text-xs font-bold p-2 outline-none">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
              </select>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="xp" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorXp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Mastery Grid */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
            <h3 className="font-bold text-xl tracking-tight mb-8 text-slate-900">Curriculum Mastery Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {studentStats?.mastery?.map((m) => {
                const topic = curriculumData.find(t => t.id === m.topic_id);
                const topicName = topic ? topic.topic_name : `Topic Node ${m.topic_id}`;
                return (
                <div key={m.topic_id} className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-lg ${
                      m.score >= 0.7 ? 'bg-emerald-500' : m.score > 0 ? 'bg-amber-500' : 'bg-slate-400'
                    }`}>
                      {m.topic_id}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-800">{topicName}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-0.5">
                        {m.score >= 0.7 ? 'Mastered' : m.score > 0 ? 'In Progress' : 'Locked'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-900">{(m.score * 100).toFixed(0)}%</p>
                    <div className="w-24 h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                      <div className={`h-full ${m.score >= 0.7 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${m.score * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
          </div>

          {/* Attendance Heatmap Mock */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
            <h3 className="font-bold text-xl tracking-tight mb-6">Attendance & Focus Consistency</h3>
            <div className="flex flex-wrap gap-2">
              {heatmapData.map((level, i) => {
                const levels = ['bg-slate-100', 'bg-indigo-100', 'bg-indigo-300', 'bg-indigo-500', 'bg-indigo-700'];
                return (
                  <motion.div 
                    key={i}
                    whileHover={{ scale: 1.2 }}
                    className={`w-6 h-6 rounded-md ${levels[level]} border border-white transition-colors cursor-pointer`}
                    title={i >= 33 ? `Day ${i - 32}: Activity Level ${level}` : `No data recorded`}
                  />
                );
              })}
            </div>
            <div className="flex items-center justify-end gap-2 mt-4 text-[10px] font-bold text-slate-400 uppercase">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded bg-slate-100"></div>
                <div className="w-3 h-3 rounded bg-indigo-300"></div>
                <div className="w-3 h-3 rounded bg-indigo-700"></div>
              </div>
              <span>More Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;
