import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

const QuestMap = ({ curriculum, student, onQuestClick }) => {
  const roadmapRef = useRef(null);
  const levelsRef = useRef([]);

  const isAvailable = (id) => {
    if (student.completed.includes(id)) return true;
    
    // Main Level availability
    const coreIndex = curriculum.findIndex(n => n.id === id);
    if (coreIndex !== -1) {
      if (coreIndex === 0) return true;
      // Available if the previous level is completed
      return student.completed.includes(curriculum[coreIndex - 1].id);
    }

    // Sub-topic availability
    for (const level of curriculum) {
      const stIndex = level.subtopics?.findIndex(st => st.id === id);
      if (stIndex !== -1) {
        // First sub-topic is available if the level is available
        if (stIndex === 0) return isAvailable(level.id);
        // Others available if previous sub-topic is completed
        return student.completed.includes(level.subtopics[stIndex - 1].id);
      }
    }

    // Side branch availability
    for (const mainNode of curriculum) {
      if (mainNode.sideBranch && mainNode.sideBranch.id === id) {
        return student.completed.includes(mainNode.id);
      }
    }
    return false;
  };

  const scrollToLevel = (index) => {
    levelsRef.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div ref={roadmapRef} className="relative w-full min-h-screen bg-bg-dark py-20 px-4 md:px-20 overflow-x-hidden bg-grid selection:bg-accent selection:text-black">
      {/* Dynamic Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-purple-500/5 pointer-events-none" />
      
      {/* Background SVG Connectors */}
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ minHeight: '3500px' }}>
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        {curriculum.map((node, i) => {
          const isCompleted = student.completed.includes(node.id);
          const nextIsCompleted = student.completed.includes(curriculum[i+1]?.id);
          const sideIsCompleted = node.sideBranch && student.completed.includes(node.sideBranch.id);

          return (
            <React.Fragment key={`conn-${node.id}`}>
              {/* Vertical path connector */}
              {i < curriculum.length - 1 && (
                <g>
                  <line 
                    x1="50%" y1={`${280 + i * 400}px`} 
                    x2="50%" y2={`${420 + i * 400}px`} 
                    stroke="#334155" strokeWidth="2" strokeDasharray="8,8" 
                  />
                  {isCompleted && nextIsCompleted && (
                    <motion.line 
                      initial={{ strokeDashoffset: 100 }}
                      animate={{ strokeDashoffset: 0 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      x1="50%" y1={`${280 + i * 400}px`} 
                      x2="50%" y2={`${420 + i * 400}px`} 
                      stroke={node.color} strokeWidth="3" strokeDasharray="10,10"
                      style={{ filter: 'url(#glow)' }}
                    />
                  )}
                </g>
              )}
              {/* Side branch connector */}
              {node.sideBranch && (
                <g>
                  <path 
                    d={`M 65% ${180 + i * 400} Q 75% ${180 + i * 400}, 75% ${230 + i * 400}`} 
                    fill="none" stroke="#334155" strokeWidth="2" strokeDasharray="8,8" 
                  />
                  {isCompleted && sideIsCompleted && (
                    <motion.path 
                      initial={{ strokeDashoffset: 100 }}
                      animate={{ strokeDashoffset: 0 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      d={`M 65% ${180 + i * 400} Q 75% ${180 + i * 400}, 75% ${230 + i * 400}`} 
                      fill="none" stroke={node.sideBranch.color} strokeWidth="3" strokeDasharray="10,10"
                      style={{ filter: 'url(#glow)' }}
                    />
                  )}
                </g>
              )}
            </React.Fragment>
          );
        })}
      </svg>

      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center mb-32 text-center relative z-10"
      >
        <div className="relative group">
          <div className="absolute -inset-4 bg-accent/20 rounded-full blur-2xl group-hover:bg-accent/40 transition-all duration-500" />
          <div className="bg-white p-3 rounded-2xl mb-6 shadow-2xl relative">
              <img src="https://img.icons8.com/color/48/000000/python--v1.png" alt="Python Logo" className="w-10 h-10" />
          </div>
        </div>
        <h1 className="text-6xl font-black tracking-tighter text-white mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50">
          PYTHON QUEST <span className="text-accent underline decoration-accent/20 underline-offset-8">AI</span>
        </h1>
        <p className="text-dim text-lg font-medium tracking-widest uppercase">The Definitive Learning Path</p>
      </motion.div>

      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-12 relative z-10">
        {/* Left Sidebar */}
        <div className="col-span-3 hidden lg:flex flex-col gap-8 sticky top-24 h-fit">
          <InfoBox title="ROADMAP INTEL">
            <div className="space-y-6">
              <IntelItem icon="🎯" label="Adaptive Pathing" desc="AI adjusts sub-topics based on your quiz performance." />
              <IntelItem icon="⚡" label="Power Ups" desc="Side branches grant XP multipliers for main path quests." />
              <IntelItem icon="🏆" label="Mastery Status" desc="Complete Level 6 to unlock the Job-Ready Certification." />
            </div>
          </InfoBox>

          <InfoBox title="COLOR CODEX">
            <div className="space-y-3">
              {curriculum.map(n => (
                <div key={n.id} className="flex items-center gap-3 group">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: n.color, boxShadow: `0 0 10px ${n.color}66` }} />
                  <span className="text-[10px] font-bold text-dim group-hover:text-white transition-colors">{n.title}</span>
                </div>
              ))}
            </div>
          </InfoBox>
        </div>

        {/* Center Path */}
        <div className="col-span-12 lg:col-span-6 flex flex-col items-center gap-[200px]">
          {/* Start Node */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-accent rounded-full blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => scrollToLevel(0)}
              className="relative bg-black border-2 border-emerald-500 text-emerald-500 px-10 py-4 rounded-full font-black text-lg flex items-center gap-3 shadow-2xl transition-all"
            >
              <span className="bg-emerald-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-[12px] shadow-lg">▶</span>
              INITIALIZE QUEST
            </motion.button>
          </div>

          {curriculum.map((node, index) => (
            <div key={node.id} className="w-full relative" ref={el => levelsRef.current[index] = el}>
              <AdvancedNode 
                data={node} 
                student={student} 
                available={isAvailable(node.id)}
                onClick={() => onQuestClick(node)}
              />
              
              {node.sideBranch && (
                <div className="absolute left-[110%] top-1/2 -translate-y-1/2 w-[340px] hidden xl:block">
                  <AdvancedSideNode 
                    data={node.sideBranch}
                    student={student}
                    available={isAvailable(node.sideBranch.id)}
                    onClick={() => onQuestClick(node.sideBranch)}
                  />
                </div>
              )}
            </div>
          ))}

          {/* Job Ready Badge */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="group relative"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-accent to-purple-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000" />
            <div className="relative bg-black border border-white/20 text-white px-12 py-5 rounded-full font-black text-lg tracking-[0.2em] shadow-2xl flex items-center gap-4">
              <span>🚀</span> MISSION ACCOMPLISHED: JOB READY
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const AdvancedNode = ({ data, student, available, onClick }) => {
  const completed = student.completed.includes(data.id);
  const locked = !available;

  return (
    <motion.div
      whileHover={!locked ? { y: -10, rotateX: 5, rotateY: -5 } : {}}
      style={{ perspective: 1000 }}
      className={`
        relative w-full glass rounded-[32px] p-1 flex transition-all duration-500 cursor-pointer group overflow-hidden
        ${completed ? 'border-emerald-500/30' : 'border-white/5'}
        ${locked ? 'opacity-30 grayscale pointer-events-none scale-95' : 'opacity-100'}
      `}
    >
      {/* Shine Effect */}
      <motion.div 
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 5 }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12"
      />

      {/* Left Column: Visuals */}
      <div 
        className="w-[180px] p-8 flex flex-col items-center justify-center border-r border-white/5 gap-4 relative"
        style={{ background: `radial-gradient(circle at center, ${data.color}22, transparent)` }}
        onClick={!locked ? () => onClick(data) : undefined}
      >
        <div className="absolute top-4 left-4 text-[9px] font-black tracking-widest text-white/20">#{data.id.toString().padStart(2, '0')}</div>
        <div className="text-[10px] font-black tracking-[0.3em] uppercase" style={{ color: data.color }}>LEVEL {data.level}</div>
        <div className="text-5xl transition-transform duration-700 group-hover:scale-125 group-hover:rotate-6 drop-shadow-2xl">{data.icon}</div>
        <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
                initial={{ width: 0 }}
                animate={{ width: completed ? '100%' : '30%' }}
                className="h-full"
                style={{ backgroundColor: data.color }}
            />
        </div>
      </div>

      {/* Right Column: Content */}
      <div className="flex-1 p-8 relative">
        <h3 className="text-2xl font-black mb-6 group-hover:text-accent transition-colors" onClick={!locked ? () => onClick(data) : undefined}>{data.title}</h3>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          {data.subtopics.map((topic) => (
            <div 
              key={topic.id} 
              className="flex items-center gap-3 group/topic cursor-pointer"
              onClick={!locked ? () => onClick(topic) : undefined}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-white/10 group-topic-hover:bg-accent transition-all" />
              <span className="text-xs font-bold text-white/40 group-topic-hover:text-white transition-colors">{topic.title}</span>
            </div>
          ))}
        </div>
        
        {completed && (
          <div className="absolute bottom-4 right-8 flex items-center gap-2 text-emerald-500 font-black text-[10px] tracking-widest">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
            DATASET SYNCED
          </div>
        )}
      </div>
    </motion.div>
  );
};

const AdvancedSideNode = ({ data, student, available, onClick }) => {
  const completed = student.completed.includes(data.id);
  const locked = !available;

  return (
    <motion.div
      whileHover={!locked ? { scale: 1.02, x: 10 } : {}}
      className={`
        glass rounded-2xl overflow-hidden border transition-all duration-500 cursor-pointer group
        ${completed ? 'border-emerald-500/30' : 'border-white/10'}
        ${locked ? 'opacity-20 grayscale pointer-events-none' : 'opacity-100'}
      `}
    >
      <div 
        className="p-5 flex items-center gap-4 border-b border-white/5 bg-white/5"
        onClick={!locked ? () => onClick(data) : undefined}
      >
        <div className="w-12 h-12 rounded-xl bg-black/40 flex items-center justify-center text-2xl group-hover:rotate-12 transition-transform">
          {data.icon}
        </div>
        <div>
          <div className="text-[10px] font-black text-accent tracking-tighter">SIDE QUEST</div>
          <div className="text-sm font-black">{data.title}</div>
        </div>
      </div>
      <div className="p-5 space-y-3 bg-black/20">
        {data.subtopics.map((topic) => (
          <div 
            key={topic.id} 
            className="flex items-center gap-3 cursor-pointer"
            onClick={!locked ? () => onClick(topic) : undefined}
          >
            <div className="w-1 h-1 rounded-full bg-white/20" />
            <span className="text-[11px] font-medium text-white/50 group-hover:text-white/80 transition-colors">{topic.title}</span>
          </div>
        ))}
      </div>
      {locked && (
        <div className="px-5 py-3 bg-red-500/10 text-[9px] font-black text-red-500/60 text-center tracking-widest">
          ACCESS RESTRICTED: COMPLETE PREREQUISITE
        </div>
      )}
    </motion.div>
  );
};

const InfoBox = ({ title, children }) => (
  <div className="glass rounded-3xl p-8 relative overflow-hidden group">
    <div className="absolute top-0 left-0 w-1 h-full bg-accent/20 group-hover:bg-accent transition-colors" />
    <div className="text-xs font-black tracking-[0.4em] text-accent mb-8">{title}</div>
    {children}
  </div>
);

const IntelItem = ({ icon, label, desc }) => (
  <div className="flex gap-4 group/intel">
    <div className="text-2xl group-intel-hover:scale-125 transition-transform">{icon}</div>
    <div>
      <div className="text-[11px] font-black text-white group-intel-hover:text-accent transition-colors">{label}</div>
      <div className="text-[10px] text-dim leading-relaxed">{desc}</div>
    </div>
  </div>
);

export default QuestMap;
