import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import confetti from 'canvas-confetti';
import SurvivalCompiler from './SurvivalCompiler';

const SurvivalOverlay = ({ onClose, onXPUpdate, userStats }) => {
  const [stage, setStage] = useState('loading'); // 'loading', 'mission', 'quiz', 'feedback'
  const [currentRLData, setCurrentRLData] = useState(null);
  const [lastQuestionId, setLastQuestionId] = useState(null);
  const [sessionXP, setSessionXP] = useState(0);
  const [feedbackData, setFeedbackData] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);

  const fillInputRef = useRef(null);

  // Fetch next action
  const fetchNextAction = async () => {
    setStage('loading');
    setErrorMessage(null);
    setUserAnswer('');

    try {
      const res = await fetch('http://localhost:8000/api/rl/next-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: 1,
          last_question_id: lastQuestionId
        })
      });
      if (!res.ok) throw new Error('Failed to fetch RL action');
      const data = await res.json();
      setCurrentRLData(data);
      if (data.question_data?.id) {
        setLastQuestionId(data.question_data.id);
      }
      setStage('mission');
    } catch (err) {
      setErrorMessage("Connection to CortexAI lost. The mission cannot proceed.");
      setStage('error');
    }
  };

  useEffect(() => {
    fetchNextAction();
  }, []);

  useEffect(() => {
    if (stage === 'quiz' && fillInputRef.current) {
      setTimeout(() => fillInputRef.current?.focus(), 100);
    }
  }, [stage]);

  const handleStartQuiz = () => setStage('quiz');

  const handleSubmitAnswer = async (answer) => {
    if (!currentRLData?.question_data) return;

    const q = currentRLData.question_data;
    const safeAnswer = (answer || "").trim().toLowerCase();
    const safeCorrect = (q.correct_answer || "").trim().toLowerCase();

    // Check for direct match, label match (A, B, C, D), or option key match (option_a, etc.)
    let isCorrect = safeAnswer === safeCorrect;

    if (!isCorrect) {
      const optionMap = {
        'a': q.option_a?.trim().toLowerCase(),
        'b': q.option_b?.trim().toLowerCase(),
        'c': q.option_c?.trim().toLowerCase(),
        'd': q.option_d?.trim().toLowerCase(),
        'option_a': q.option_a?.trim().toLowerCase(),
        'option_b': q.option_b?.trim().toLowerCase(),
        'option_c': q.option_c?.trim().toLowerCase(),
        'option_d': q.option_d?.trim().toLowerCase(),
      };

      // If student answered full text and correct is label
      if (optionMap[safeCorrect] === safeAnswer) isCorrect = true;
      // If student clicked label and correct is full text
      if (optionMap[safeAnswer] === safeCorrect) isCorrect = true;
    }

    setStage('loading');

    try {
      const res = await fetch('http://localhost:8000/api/rl/submit-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: 1,
          topic_id: parseInt(currentRLData.topic_id || 1),
          question_id: currentRLData.question_data.id,
          action: currentRLData.action,
          correct: isCorrect
        })
      });

      if (!res.ok) throw new Error('Failed to submit answer');
      const data = await res.json();

      const getHumanCorrect = () => {
        const key = q.correct_answer?.toLowerCase();
        if (key === 'a' || key === 'option_a') return q.option_a;
        if (key === 'b' || key === 'option_b') return q.option_b;
        if (key === 'c' || key === 'option_c') return q.option_c;
        if (key === 'd' || key === 'option_d') return q.option_d;
        return q.correct_answer;
      };

      setFeedbackData({
        isCorrect,
        correctAnswer: getHumanCorrect(),
        consequence: data
      });

      if (onXPUpdate) {
        onXPUpdate({
          total_xp: data.total_xp,
          mastery_updated: data.mastery_updated,
          topic_id: currentRLData.topic_id,
          xp_change: data.xp_change
        });
      }

      setSessionXP(prev => prev + (isCorrect ? 50 : -10));

      if (isCorrect) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }

      setStage('feedback');
    } catch (err) {
      setErrorMessage("Failed to sync answer with the grid.");
      setStage('error');
    }
  };

  const renderContent = () => {
    if (stage === 'loading') {
      return (
        <div className="flex flex-col items-center justify-center h-full text-blue-400">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-400 rounded-full animate-spin mb-4" />
          <p className="font-mono animate-pulse">Syncing with Adaptive Engine...</p>
        </div>
      );
    }

    if (stage === 'error') {
      return (
        <div className="flex flex-col items-center justify-center h-full text-red-400">
          <p className="font-mono text-xl">{errorMessage}</p>
          <button onClick={fetchNextAction} className="mt-6 px-6 py-2 bg-red-900/50 hover:bg-red-800 rounded text-red-200 transition-colors">
            Retry Connection
          </button>
        </div>
      );
    }

    if (stage === 'mission') {
      return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto h-full flex flex-col justify-center px-4">
          <div className="bg-slate-900/90 p-8 sm:p-10 rounded-2xl border border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.2)] backdrop-blur-md relative overflow-hidden">

            {/* Decorative tech lines */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>
            <div className="absolute -left-4 top-10 w-8 h-1 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,1)]"></div>

            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 mb-2 uppercase tracking-widest">
              Mission Briefing
            </h2>
            <h3 className="text-lg text-slate-400 mb-8 font-mono tracking-wider border-b border-slate-800 pb-4">
              TARGET_TOPIC // {currentRLData.topic}
            </h3>

            <div className="mb-10 border-l-4 border-cyan-400 pl-6 bg-slate-800/40 p-6 rounded-r-xl relative">
              <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] opacity-20 pointer-events-none"></div>
              <p className="font-mono text-lg text-slate-200 leading-relaxed tracking-wide drop-shadow-md">
                {currentRLData.mission_story}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mt-8">
              <div className="flex items-center gap-3">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <div className="text-sm font-bold font-mono text-emerald-400 tracking-wider">
                  REWARD: {currentRLData.reward}
                </div>
              </div>

              <button
                onClick={handleStartQuiz}
                className="w-full sm:w-auto px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-lg shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all hover:-translate-y-1 active:translate-y-0 border border-blue-400 uppercase tracking-widest"
              >
                Accept Mission
              </button>
            </div>
          </div>
        </motion.div>
      );
    }

    if (stage === 'quiz' && currentRLData?.question_data) {
      const q = currentRLData.question_data;
      const qType = q.question_type || q.type;

      const options = [q.option_a, q.option_b, q.option_c, q.option_d].filter(Boolean);

      return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-4xl mx-auto py-8 h-full flex flex-col px-4">
          <div className="mb-6 flex justify-between items-center text-xs font-black font-mono tracking-widest bg-slate-900/80 p-4 rounded-lg border border-slate-800">
            <span className="text-cyan-400 flex items-center gap-2">
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
              TOPIC: {currentRLData.topic}
            </span>
            <span className="text-purple-400 bg-purple-900/30 px-3 py-1 rounded-full border border-purple-500/30">
              LEVEL: {q.difficulty}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div className="bg-slate-900/90 p-8 sm:p-10 rounded-2xl border border-slate-700 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
              <h3 className="text-2xl text-white font-bold mb-10 leading-relaxed drop-shadow-sm">
                {q.question_text}
              </h3>

              {qType === 'mcq' && (
                <div className="space-y-4">
                  {options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSubmitAnswer(opt)}
                      className="w-full text-left p-5 rounded-xl border border-slate-600 hover:border-cyan-400 hover:bg-cyan-900/20 text-slate-200 text-lg transition-all hover:pl-8 group relative overflow-hidden"
                    >
                      <span className="font-bold text-slate-500 mr-4 group-hover:text-cyan-400 transition-colors">
                        {String.fromCharCode(65 + i)}.
                      </span>
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {qType === 'fill_blank' && (
                <div className="mt-6 space-y-4">
                  <input
                    ref={fillInputRef}
                    type="text"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmitAnswer(userAnswer)}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-4 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors font-mono"
                    placeholder="Enter your answer..."
                  />
                  <button
                    onClick={() => handleSubmitAnswer(userAnswer)}
                    disabled={!userAnswer.trim()}
                    className="px-6 py-3 bg-blue-600 disabled:bg-slate-700 disabled:text-slate-500 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors"
                  >
                    Submit
                  </button>
                </div>
              )}

              {qType === 'coding' && (
                <div className="mt-6 space-y-4">
                  <SurvivalCompiler
                    initialCode={q.starter_code || "# Write your code here..."}
                    onOutputChange={(out) => setUserAnswer(out)}
                  />
                  <div className="flex flex-col sm:flex-row items-center gap-4 mt-6">
                    <div className="flex-1 w-full">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Final Output Submission</p>
                      <input
                        ref={fillInputRef}
                        type="text"
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmitAnswer(userAnswer)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-4 text-emerald-400 focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                        placeholder="Compiler output will appear here..."
                      />
                    </div>
                    <button
                      onClick={() => handleSubmitAnswer(userAnswer)}
                      disabled={!userAnswer?.trim()}
                      className="w-full sm:w-auto px-10 py-4 bg-cyan-600 hover:bg-cyan-500 text-black font-black rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.2)] transition-all uppercase tracking-widest disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none"
                    >
                      Submit Response
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      );
    }

    if (stage === 'feedback' && feedbackData) {
      return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto h-full flex flex-col justify-center text-center">
          <div className="bg-slate-800/50 p-8 rounded-xl border border-slate-700 backdrop-blur-sm">
            <div className={`text-6xl mb-6 ${feedbackData.isCorrect ? 'text-emerald-500' : 'text-rose-500'}`}>
              {feedbackData.isCorrect ? '🎯' : '💀'}
            </div>

            <h2 className="text-2xl font-bold text-slate-100 mb-4">
              {feedbackData.isCorrect ? 'Mission Accomplished' : 'Mission Failed'}
            </h2>

            {!feedbackData.isCorrect && (
              <div className="bg-rose-900/20 text-rose-300 p-4 rounded-lg mb-6 text-sm">
                The correct answer was: <span className="font-mono block mt-2 text-rose-200">{feedbackData.correctAnswer}</span>
              </div>
            )}

            <div className="font-mono text-lg text-slate-300 mb-8 bg-slate-900/50 p-4 rounded border border-slate-700/50">
              Consequence: <span className={feedbackData.isCorrect ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {feedbackData.isCorrect ? feedbackData.consequence.reward : feedbackData.consequence.penalty}
              </span>
              <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center">
                <span className="text-xs text-slate-500 uppercase tracking-widest">Total XP</span>
                <span className="text-xl text-blue-400 font-black">{feedbackData.consequence.total_xp}</span>
              </div>
              <div className="mt-2 flex justify-between items-center">
                <span className="text-xs text-slate-500 uppercase tracking-widest">Mastery</span>
                <span className="text-sm text-slate-300">{feedbackData.consequence.mastery_updated}</span>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-800 flex justify-center">
                <span className={`text-sm font-black uppercase tracking-tighter ${sessionXP >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  Session Delta: {sessionXP > 0 ? '+' : ''}{sessionXP} XP
                </span>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-slate-600 hover:bg-slate-700 rounded text-slate-300 transition-colors"
              >
                Retreat to Base
              </button>
              <button
                onClick={fetchNextAction}
                className="px-8 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white font-medium transition-colors"
              >
                Next Mission
              </button>
            </div>
          </div>
        </motion.div>
      );
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex flex-col"
      >
        <div className="h-16 border-b border-slate-800/50 flex items-center justify-between px-6 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-slate-200 tracking-tight">Adaptive Survival</h1>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 relative overflow-hidden p-6">
          {renderContent()}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SurvivalOverlay;
