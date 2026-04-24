import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Info, Sword } from 'lucide-react';

const QuizModal = ({ quest, onSubmit, onClose }) => {
  const [mode, setMode] = useState('briefing'); // 'briefing' or 'challenge'

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-50 p-6 selection:bg-accent selection:text-black">
      <AnimatePresence mode="wait">
        <motion.div 
          key={mode}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          className="bg-card-dark/80 border border-white/10 p-12 rounded-[40px] w-full max-w-xl relative overflow-hidden backdrop-blur-2xl shadow-2xl"
        >
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent" />
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent/10 rounded-full blur-3xl" />
          
          <header className="mb-10 text-center relative">
            <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center border border-accent/20">
                    {mode === 'briefing' ? <Info className="text-accent" size={32} /> : <Sword className="text-accent" size={32} />}
                </div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-accent/60 mb-2 block">
                {mode === 'briefing' ? 'MISSION BRIEFING' : 'SKILL CHALLENGE'}
            </span>
            <h2 className="text-4xl font-black tracking-tight">{quest.title}</h2>
          </header>

          <div className="space-y-10 relative">
            {mode === 'briefing' ? (
              <div className="space-y-8">
                <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/5 leading-relaxed">
                  <p className="text-xl font-medium text-white/90">
                    {quest.description || "In this module, you'll learn the core concepts and practical applications of this topic. Mastery of this skill is essential for your Python journey."}
                  </p>
                </div>

                <div className="flex gap-4">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setMode('challenge')}
                    className="flex-1 py-5 rounded-2xl bg-accent text-black font-black text-sm tracking-widest uppercase shadow-[0_0_20px_rgba(0,242,255,0.3)] hover:shadow-[0_0_30px_rgba(0,242,255,0.5)] transition-all"
                  >
                    Start Skill Test
                  </motion.button>

                  <button 
                    onClick={onPractice}
                    className="px-6 rounded-2xl border border-accent/30 text-accent hover:bg-accent/5 transition-all flex items-center justify-center"
                    title="Open Code Playground"
                  >
                    <Code2 size={20} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/5">
                  <p className="text-lg font-medium text-white/80 leading-relaxed">
                    {quest.quiz?.question || `Identify the correct Python implementation for ${quest.title.toLowerCase()}?`}
                  </p>
                </div>

                <div className="grid gap-4">
                  {quest.quiz?.options ? (
                    quest.quiz.options.map((opt, i) => (
                      <OptionButton 
                        key={i}
                        label={opt.text} 
                        onClick={() => onSubmit(opt.isCorrect)} 
                        primary={i === 0} 
                      />
                    ))
                  ) : (
                    <>
                      <OptionButton 
                        label="Optimized Standard Approach" 
                        onClick={() => onSubmit(true)} 
                        primary 
                      />
                      <OptionButton 
                        label="Generic Legacy Method" 
                        onClick={() => onSubmit(false)} 
                      />
                    </>
                  )}
                </div>
              </div>
            )}

            <button 
              onClick={onClose}
              className="w-full text-[10px] font-black uppercase tracking-[0.3em] text-dim hover:text-white transition-colors"
            >
              Abort Mission
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const OptionButton = ({ label, onClick, primary }) => (
  <button 
    onClick={onClick}
    className={`
      w-full p-6 rounded-2xl border-2 font-black text-xs tracking-widest uppercase transition-all duration-300 text-left flex items-center justify-between group
      ${primary ? 'border-accent/40 bg-accent/5 text-accent hover:border-accent hover:bg-accent/10' : 'border-white/5 bg-white/5 text-white/60 hover:border-white/20 hover:bg-white/10'}
    `}
  >
    {label}
    <div className={`w-6 h-6 rounded-lg border-2 border-current flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110`}>
      <CheckCircle2 size={14} />
    </div>
  </button>
);

export default QuizModal;
