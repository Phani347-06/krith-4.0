import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const PerformanceDashboard = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('attendance');
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  // Mock Data
  const attendanceData = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    status: i % 7 === 4 ? 'absent' : i % 10 === 0 ? 'late' : 'present'
  }));

  const assignments = [
    { id: 1, title: 'Variable Operations', subject: 'Python Basics', date: 'Oct 12', status: 'completed', marks: 9, total: 10, feedback: 'Excellent grasp of naming conventions.' },
    { id: 2, title: 'Logic Control Flow', subject: 'Loops & Ifs', date: 'Oct 15', status: 'completed', marks: 7, total: 10, feedback: 'Nested loops need more optimization.' },
    { id: 3, title: 'Data Structures', subject: 'Lists & Dicts', date: 'Oct 18', status: 'pending', marks: null, total: 10, feedback: '' },
    { id: 4, title: 'Module Integration', subject: 'Functions', date: 'Oct 22', status: 'late', marks: 8, total: 10, feedback: 'Good integration but missed the deadline.' },
  ];

  const chartData = assignments.filter(a => a.marks !== null).map(a => ({ name: a.title.split(' ')[0], score: a.marks }));
  const pieData = [
    { name: 'Strong', value: 60, color: '#078a52' },
    { name: 'Average', value: 30, color: '#eab308' },
    { name: 'Weak', value: 10, color: '#ef4444' },
  ];

  return (
    <div className="min-h-screen bg-warm-cream text-black p-12 font-['Epilogue'] selection:bg-lemon-400 selection:text-black overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-16 bg-white/80 backdrop-blur-md p-8 rounded-[32px] border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="w-14 h-14 rounded-2xl bg-white border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none">
            <span className="material-symbols-outlined font-black">arrow_back</span>
          </button>
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">Performance Hub</h1>
            <p className="text-stone-400 text-[10px] font-black uppercase tracking-[0.4em] mt-1">Strategic Academic Analytics</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={() => {
              const report = `CORTEX-AI STRATEGIC PERFORMANCE REPORT\nAttendance: 88%\nStreak: 14 Days\nLevel: 4\nGenerated: ${new Date().toLocaleDateString()}`;
              const blob = new Blob([report], { type: 'text/plain' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'CortexAI_Strategic_Report.txt';
              a.click();
            }}
            className="flex items-center gap-3 bg-[#078a52] text-white px-8 py-4 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all group font-black uppercase text-[10px] tracking-widest cursor-pointer"
          >
            <span className="material-symbols-outlined font-black">download</span>
            Download Strategic Report
          </button>
          
          <div className="flex items-center gap-4 bg-stone-50 p-2 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            {['attendance', 'assignments', 'analytics'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-black text-white' : 'text-stone-400 hover:text-black hover:bg-white'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'attendance' && (
            <motion.div 
              key="attendance" 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-10"
            >
              <div className="space-y-8">
                 <div className="bg-white rounded-[40px] border-2 border-black p-10 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex items-center justify-between mb-8">
                       <h3 className="font-black text-xl italic uppercase tracking-tighter">Consistency</h3>
                       <span className="material-symbols-outlined text-orange-500 font-black">local_fire_department</span>
                    </div>
                    <div className="flex flex-col items-center gap-4">
                       <div className="relative w-48 h-48">
                          <svg className="w-full h-full -rotate-90">
                            <circle cx="96" cy="96" r="88" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                            <motion.circle 
                              cx="96" cy="96" r="88" fill="none" stroke="#078a52" strokeWidth="12" 
                              strokeDasharray="552"
                              initial={{ strokeDashoffset: 552 }}
                              animate={{ strokeDashoffset: 552 - (552 * 0.88) }}
                              transition={{ duration: 1.5, ease: "easeOut" }}
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                             <span className="text-4xl font-black italic">88%</span>
                             <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Present</span>
                          </div>
                       </div>
                       <div className="mt-6 text-center">
                          <p className="text-3xl font-black italic uppercase tracking-tighter text-orange-500">14 DAY STREAK 🔥</p>
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white rounded-[32px] border-2 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                       <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Total Classes</p>
                       <p className="text-2xl font-black italic">32</p>
                    </div>
                    <div className="bg-white rounded-[32px] border-2 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                       <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Absent</p>
                       <p className="text-2xl font-black italic text-red-500">4</p>
                    </div>
                 </div>
              </div>

              <div className="lg:col-span-2 bg-white rounded-[40px] border-2 border-black p-10 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
                 <div className="flex justify-between items-center mb-10">
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter">October 2026</h2>
                    <div className="flex items-center gap-4">
                       <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500" /><span className="text-[8px] font-black text-stone-400 uppercase">Present</span></div>
                       <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /><span className="text-[8px] font-black text-stone-400 uppercase">Absent</span></div>
                    </div>
                 </div>
                 <div className="grid grid-cols-7 gap-4">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, idx) => (
                      <div key={`${d}-${idx}`} className="text-center text-[10px] font-black text-stone-300 uppercase mb-4 tracking-widest">{d}</div>
                    ))}
                    {attendanceData.map((d, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.02 }}
                        className={`aspect-square rounded-2xl flex items-center justify-center font-black text-xs transition-all cursor-help border-2
                          ${d.status === 'present' ? 'bg-green-50 border-green-500 text-green-600 hover:bg-green-500 hover:text-white' : 
                            d.status === 'absent' ? 'bg-red-50 border-red-500 text-red-600 hover:bg-red-500 hover:text-white' : 
                            'bg-yellow-50 border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-white'}
                        `}
                      >
                        {d.day}
                      </motion.div>
                    ))}
                 </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'assignments' && (
            <motion.div 
              key="assignments" 
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
               {assignments.map((asgn, i) => (
                 <motion.div 
                   key={asgn.id}
                   whileHover={{ y: -10 }}
                   onClick={() => setSelectedAssignment(asgn)}
                   className="bg-white rounded-[40px] border-2 border-black p-10 cursor-pointer relative overflow-hidden group shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:shadow-2xl transition-all"
                 >
                    <div className={`absolute top-0 right-0 px-8 py-3 rounded-bl-[24px] text-[10px] font-black uppercase tracking-widest border-l-2 border-b-2 border-black ${asgn.status === 'completed' ? 'bg-[#078a52] text-white' : asgn.status === 'late' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-black'}`}>
                       {asgn.status}
                    </div>
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em] mb-4">{asgn.subject}</p>
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-8 group-hover:text-matcha-600 transition-all">{asgn.title}</h3>
                    <div className="flex items-center justify-between pt-8 border-t-2 border-black/5">
                       <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-stone-400 text-sm font-black">calendar_today</span>
                          <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{asgn.date}</span>
                       </div>
                       {asgn.marks !== null && (
                         <div className="flex items-center gap-2">
                            <span className="text-2xl font-black italic">{(asgn.marks/asgn.total*100).toFixed(0)}%</span>
                            <div className={`w-3 h-3 rounded-full border border-black ${asgn.marks >= 8 ? 'bg-green-500' : asgn.marks >= 6 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                         </div>
                       )}
                    </div>
                 </motion.div>
               ))}
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div 
              key="analytics" 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-10"
            >
               <div className="bg-white rounded-[40px] border-2 border-black p-10 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                  <h3 className="text-xl font-black italic uppercase tracking-tighter mb-10">Mark Performance Index</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                        <XAxis dataKey="name" stroke="#000" tick={{ fontSize: 10, fontWeight: '900' }} />
                        <YAxis stroke="#000" tick={{ fontSize: 10, fontWeight: '900' }} />
                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ backgroundColor: '#fff', border: '2px solid #000', borderRadius: '16px', fontSize: '10px', fontWeight: '900' }} />
                        <Bar dataKey="score" fill="#000" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
               </div>

               <div className="bg-white rounded-[40px] border-2 border-black p-10 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center">
                  <h3 className="text-xl font-black italic uppercase tracking-tighter mb-4 w-full">Topic Distribution</h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} innerRadius={80} outerRadius={110} paddingAngle={10} dataKey="value">
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="#000" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#fff', border: '2px solid #000', borderRadius: '16px', fontSize: '10px', fontWeight: '900' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
               </div>

               <div className="lg:col-span-2 bg-matcha-50 rounded-[40px] border-2 border-black p-12 flex gap-10 items-start shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
                  <div className="w-20 h-20 rounded-3xl bg-black flex items-center justify-center shrink-0 shadow-[8px_8px_0px_0px_#078a52]">
                     <span className="material-symbols-outlined text-white text-4xl">psychology</span>
                  </div>
                  <div className="space-y-6">
                     <h3 className="text-2xl font-black italic uppercase tracking-tighter">Cortex-AI Tactical Assessment</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black">Strategic Strengths</p>
                           <div className="flex gap-3 flex-wrap">
                              {['LOOPS', 'VARIABLES', 'CONTROL FLOW'].map(s => (
                                <span key={s} className="px-5 py-2 bg-white text-black text-[10px] font-black rounded-full border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">{s}</span>
                              ))}
                           </div>
                        </div>
                        <div className="space-y-4">
                           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black">Operational Gaps</p>
                           <div className="flex gap-3 flex-wrap">
                              {['EXPRESSIONS', 'LIST SLICING'].map(s => (
                                <span key={s} className="px-5 py-2 bg-red-500 text-white text-[10px] font-black rounded-full border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">{s}</span>
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ASSIGNMENT MODAL */}
      <AnimatePresence>
        {selectedAssignment && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedAssignment(null)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
             <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 50 }} className="relative w-full max-w-3xl bg-white rounded-[48px] border-4 border-black p-16 shadow-[24px_24px_0px_0px_rgba(0,0,0,1)]">
                <button onClick={() => setSelectedAssignment(null)} className="absolute top-10 right-10 w-12 h-12 rounded-2xl bg-stone-50 border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none"><span className="material-symbols-outlined font-black">close</span></button>
                <p className="text-[11px] font-black uppercase tracking-[0.5em] text-stone-400 mb-4">{selectedAssignment.subject}</p>
                <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-10">{selectedAssignment.title}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-8">
                      <div>
                         <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3">Performance Result</p>
                         <div className="flex items-end gap-3"><span className="text-5xl font-black italic text-matcha-600">{selectedAssignment.marks || '0'}</span><span className="text-2xl font-black italic text-stone-300">/ {selectedAssignment.total}</span></div>
                      </div>
                      <div className="space-y-4">
                         <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Analytics Breakdown</p>
                         <div className="space-y-3">
                            <div className="flex justify-between text-[11px] font-black uppercase"><span className="text-stone-400">Accuracy</span><span className="text-black font-black">{(selectedAssignment.marks/selectedAssignment.total*100).toFixed(0)}%</span></div>
                            <div className="h-4 bg-stone-100 rounded-full overflow-hidden border-2 border-black"><div className="h-full bg-matcha-500" style={{ width: `${selectedAssignment.marks/selectedAssignment.total*100}%` }} /></div>
                         </div>
                      </div>
                   </div>
                   <div className="bg-stone-50 rounded-[32px] p-8 border-2 border-black flex flex-col justify-between shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                      <div><p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-4">Tactical Feedback</p><p className="text-sm font-bold text-stone-600 italic">"{selectedAssignment.feedback || 'Strategic review pending...'}"</p></div>
                      <div className="pt-8"><button className="w-full py-5 bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-matcha-600 transition-all">Download Artifact</button></div>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PerformanceDashboard;
