import React from 'react';
import { User, Award, Calendar, BarChart3, Brain } from 'lucide-react';

const Sidebar = ({ student }) => {
  return (
    <aside className="w-[300px] border-r border-border-dark p-8 flex flex-col gap-8 bg-card-dark/20">
      <div className="flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full border border-accent flex items-center justify-center text-4xl mb-4 bg-accent/5">
          {student.avatar}
        </div>
        <h2 className="text-xl font-bold">{student.name}</h2>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent mt-1">
          {student.level}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatCard icon={<Award size={14} />} value={student.xp} label="XP" />
        <StatCard icon={<BarChart3 size={14} />} value={student.rank} label="Global Rank" />
        <StatCard icon={<Calendar size={14} />} value={`${student.attendance}%`} label="Attendance" />
        <StatCard icon={<BarChart3 size={14} />} value={`${student.grade}%`} label="Avg Grade" />
      </div>

      <div className="mt-auto p-4 rounded-xl border border-border-dark bg-accent/[0.02] border-dashed">
        <div className="flex items-center gap-2 text-accent text-[10px] font-black tracking-widest uppercase mb-2">
          <Brain size={14} /> AI Insight
        </div>
        <p 
          className="text-xs text-dim leading-relaxed"
          dangerouslySetInnerHTML={{ __html: student.insight }}
        />
      </div>
    </aside>
  );
};

const StatCard = ({ icon, value, label }) => (
  <div className="p-3 border border-border-dark rounded-lg bg-white/[0.02] flex flex-col gap-1">
    <div className="flex items-center gap-1.5 text-accent">
      {icon}
      <span className="text-[9px] font-bold uppercase tracking-wider text-dim">{label}</span>
    </div>
    <span className="text-sm font-black">{value}</span>
  </div>
);

export default Sidebar;
