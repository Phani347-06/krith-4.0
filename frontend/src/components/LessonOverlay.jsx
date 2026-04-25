import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import confetti from 'canvas-confetti';

// XP awarded per correct answer by question type
const XP_RULES = { mcq: 20, fill_blank: 30, coding: 50 };
const PASS_THRESHOLD = 0.6; // 60% of max possible XP to pass

const LessonOverlay = ({ topic, difficulty, onClose, onFinish, preWrittenTheory, preWrittenQuestions, xpReward = 100 }) => {
  const [stage, setStage] = useState('theory');
  const [lessonData, setLessonData] = useState({
    theory: preWrittenTheory || 'Lesson content coming soon...',
    questions: preWrittenQuestions || []
  });
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [earnedXP, setEarnedXP] = useState(0);
  const [xpBreakdown, setXpBreakdown] = useState([]);
  const [passed, setPassed] = useState(false);
  const fillInputRef = useRef(null);

  // Max possible XP for this lesson
  const maxPossibleXP = (preWrittenQuestions || []).reduce((sum, q) => {
    const qType = q.type || q.question_type;
    return sum + (XP_RULES[qType] || 20);
  }, 0);

  // Sync state when a new lesson is opened
  useEffect(() => {
    if (preWrittenTheory) {
      setLessonData({ theory: preWrittenTheory, questions: preWrittenQuestions || [] });
      setStage('theory');
      setErrorMessage(null);
      setEarnedXP(0);
      setXpBreakdown([]);
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setFeedback(null);
      setPassed(false);
    } else {
      setErrorMessage("This mission's intelligence files are still being decrypted. Check back soon!");
      setStage('error');
    }
  }, [preWrittenTheory, preWrittenQuestions]);

  // Auto-focus fill-in-blank input when question changes
  useEffect(() => {
    if (stage === 'quiz' && fillInputRef.current) {
      setTimeout(() => fillInputRef.current?.focus(), 100);
    }
  }, [currentQuestionIndex, stage]);

  const handleNextStage = () => {
    if (stage === 'theory') {
      setStage('quiz');
    } else if (stage === 'quiz') {
      if (currentQuestionIndex < (lessonData?.questions?.length || 0) - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setFeedback(null);
      } else {
        // Quiz done — check pass threshold
        // earnedXP state updates asynchronously, so compute from breakdown
        const totalEarned = xpBreakdown.reduce((s, b) => s + b.xpGained, 0);
        const hasPassed = maxPossibleXP === 0 || totalEarned >= maxPossibleXP * PASS_THRESHOLD;
        setPassed(hasPassed);
        setStage('summary');
        if (hasPassed) {
          confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#078a52', '#84e7a5', '#000000'] });
        }
      }
    }
  };

  const handleAnswer = (answer) => {
    if (feedback || !lessonData?.questions?.[currentQuestionIndex]) return;

    const currentQuestion = lessonData.questions[currentQuestionIndex];
    const qType = currentQuestion.type || currentQuestion.question_type;
    // Case-insensitive, trimmed comparison for fill-in-blank
    const isCorrect = answer.trim().toLowerCase() === currentQuestion.correct_answer.trim().toLowerCase();
    const xpGained = isCorrect ? (XP_RULES[qType] || 20) : 0;

    const newTotal = earnedXP + xpGained;
    setEarnedXP(newTotal);
    setXpBreakdown(prev => [...prev, { qType, isCorrect, xpGained }]);

    setFeedback({
      correct: isCorrect,
      xpGained,
      correctAnswer: currentQuestion.correct_answer,
      message: isCorrect
        ? `🎯 Correct! +${xpGained} XP`
        : `❌ Not quite. The correct answer was: "${currentQuestion.correct_answer}"`
    });

    setUserAnswers(prev => ({ ...prev, [currentQuestionIndex]: answer }));
  };

  // ── Loading ──────────────────────────────────────────────────────────
  if (stage === 'loading') {
    return (
      <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-16 h-16 border-4 border-stone-100 border-t-black rounded-full mb-6" />
        <p className="font-display-secondary text-lg font-black uppercase tracking-widest animate-pulse">Forging Your Quest...</p>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────
  if (stage === 'error') {
    return (
      <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-10 text-center">
        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-4xl">warning</span>
        </div>
        <h2 className="text-2xl font-black mb-4 uppercase tracking-tight">Quest Interrupted</h2>
        <p className="text-stone-500 max-w-md mb-10 leading-relaxed">
          {errorMessage || 'We encountered a glitch. Check back soon!'}
        </p>
        <div className="flex gap-4">
          <button onClick={onClose} className="px-10 py-4 bg-stone-100 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-stone-200 transition-all">Dismiss</button>
        </div>
      </div>
    );
  }

  const currentQuestion = lessonData?.questions?.[currentQuestionIndex];
  const qType = currentQuestion ? (currentQuestion.type || currentQuestion.question_type) : null;
  const selectedAnswer = userAnswers[currentQuestionIndex];

  // Helper to get MCQ button style
  const getMCQStyle = (opt) => {
    if (!selectedAnswer) return 'bg-stone-50 border-stone-200 hover:border-black hover:bg-stone-100';
    const isCorrectOpt = opt === feedback?.correctAnswer;
    const isSelected = opt === selectedAnswer;
    if (isCorrectOpt) return 'bg-green-500 border-green-600 text-white shadow-lg';
    if (isSelected && !isCorrectOpt) return 'bg-red-500 border-red-600 text-white';
    return 'bg-stone-50 border-stone-100 opacity-50';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] bg-warm-cream flex flex-col"
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="shrink-0 z-10 bg-white/80 backdrop-blur-md border-b-2 border-stone-100 px-10 py-5 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400">Mission</span>
          <h2 className="font-display-secondary font-black text-xl">{topic}</h2>
        </div>
        <div className="flex items-center gap-6">
          {stage === 'quiz' && lessonData?.questions && (
            <div className="flex items-center gap-2">
              {lessonData.questions.map((_, i) => (
                <div key={i} className={`w-3 h-3 rounded-full border-2 border-black transition-all ${
                  xpBreakdown[i]
                    ? (xpBreakdown[i].isCorrect ? 'bg-green-500 border-green-600' : 'bg-red-400 border-red-500')
                    : i === currentQuestionIndex ? 'bg-black' : 'bg-transparent'
                }`} />
              ))}
            </div>
          )}
          {/* Live XP counter */}
          {stage === 'quiz' && (
            <span className="text-sm font-black text-matcha-600 bg-matcha-50 px-4 py-2 rounded-full border border-matcha-200">
              {earnedXP} XP
            </span>
          )}
          <button onClick={onClose} className="w-10 h-10 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center hover:bg-black hover:text-white transition-all">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      </header>

      {/* ── Scrollable body ─────────────────────────────────────────── */}
      <div style={{ height: 'calc(100vh - 73px)', overflowY: 'auto' }}>
        <main className="max-w-3xl mx-auto px-8 py-12">
          <AnimatePresence mode="wait">

            {/* ── Theory ─────────────────────────────────────────────── */}
            {stage === 'theory' && (
              <motion.div key="theory" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="space-y-10">
                <div className="prose prose-stone max-w-none prose-headings:font-black prose-headings:tracking-tight prose-p:text-lg prose-p:leading-relaxed prose-code:bg-stone-100 prose-code:px-1 prose-code:rounded">
                  <ReactMarkdown>{lessonData.theory}</ReactMarkdown>
                </div>
                <button
                  onClick={handleNextStage}
                  disabled={!lessonData?.questions?.length}
                  className="w-full py-6 bg-black text-white rounded-[28px] font-black text-xs uppercase tracking-[0.4em] shadow-[8px_8px_0px_0px_rgba(7,138,82,1)] hover:translate-y-[-2px] hover:shadow-[10px_10px_0px_0px_rgba(7,138,82,1)] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {lessonData?.questions?.length ? "I'm Ready for the Quest ⚔️" : 'Preparing...'}
                </button>
              </motion.div>
            )}

            {/* ── Quiz ───────────────────────────────────────────────── */}
            {stage === 'quiz' && currentQuestion && (
              <motion.div key={`q-${currentQuestionIndex}`} initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }} className="space-y-6">

                <div className="bg-white p-10 rounded-[40px] border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-400 mb-4">
                    Question {currentQuestionIndex + 1} of {lessonData.questions.length}
                    <span className="ml-4 text-stone-300">|</span>
                    <span className="ml-4 text-matcha-500">{qType === 'fill_blank' ? 'Fill Blank' : qType?.toUpperCase()} · +{XP_RULES[qType] || 20} XP if correct</span>
                  </p>
                  <h3 className="text-xl font-black mb-8 leading-tight">{currentQuestion.question_text}</h3>

                  {/* MCQ options */}
                  {qType === 'mcq' && (
                    <div className="grid grid-cols-1 gap-3">
                      {currentQuestion.options?.map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => handleAnswer(opt)}
                          disabled={!!selectedAnswer}
                          className={`w-full p-5 text-left rounded-2xl border-2 font-bold transition-all text-sm ${getMCQStyle(opt)}`}
                        >
                          <span className="inline-block w-7 h-7 rounded-full bg-black/10 text-center text-xs font-black leading-7 mr-3">
                            {['A','B','C','D'][i]}
                          </span>
                          {opt}
                          {/* Show tick/cross icons after answering */}
                          {selectedAnswer && opt === feedback?.correctAnswer && (
                            <span className="float-right material-symbols-outlined text-white">check_circle</span>
                          )}
                          {selectedAnswer && opt === selectedAnswer && opt !== feedback?.correctAnswer && (
                            <span className="float-right material-symbols-outlined text-white">cancel</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Fill in the blank */}
                  {qType === 'fill_blank' && (
                    <div className="space-y-4">
                      <input
                        ref={fillInputRef}
                        type="text"
                        placeholder="Type your answer and press Enter..."
                        disabled={!!selectedAnswer}
                        className={`w-full p-5 border-2 rounded-2xl font-mono text-lg outline-none transition-all ${
                          selectedAnswer
                            ? (feedback?.correct ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400')
                            : 'bg-stone-50 border-stone-200 focus:border-black'
                        }`}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAnswer(e.target.value); }}
                      />
                      {!selectedAnswer && (
                        <p className="text-[10px] font-black text-stone-400 uppercase text-center tracking-widest">Press Enter to Submit</p>
                      )}
                    </div>
                  )}

                  {/* Coding question */}
                  {qType === 'coding' && (
                    <div className="bg-black text-white p-6 rounded-2xl font-mono text-sm space-y-4">
                      <p className="text-green-400">// Coding Challenge — +50 XP</p>
                      <pre className="overflow-x-auto whitespace-pre-wrap text-stone-200">{currentQuestion.starter_code}</pre>
                      <button
                        onClick={() => handleAnswer(currentQuestion.correct_answer || 'coding_complete')}
                        disabled={!!selectedAnswer}
                        className="w-full py-3 bg-green-600 rounded-xl font-black uppercase tracking-widest disabled:opacity-50"
                      >
                        ✓ Mark as Complete
                      </button>
                    </div>
                  )}
                </div>

                {/* Feedback bar */}
                {feedback && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className={`p-6 rounded-2xl border-2 flex items-center justify-between gap-4 ${feedback.correct ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}
                  >
                    <div>
                      <p className={`font-black text-base ${feedback.correct ? 'text-green-700' : 'text-red-700'}`}>
                        {feedback.message}
                      </p>
                      <p className="text-xs text-stone-400 font-bold mt-1">
                        Running total: <span className="text-matcha-600 font-black">{earnedXP} / {maxPossibleXP} XP</span>
                      </p>
                    </div>
                    <button
                      onClick={handleNextStage}
                      className="shrink-0 px-8 py-3 bg-black text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-105 transition-all"
                    >
                      Next →
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ── Summary ────────────────────────────────────────────── */}
            {stage === 'summary' && (
              <motion.div key="summary" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-8">

                {/* Pass or Fail badge */}
                <div className={`w-32 h-32 rounded-[40px] flex items-center justify-center mx-auto shadow-2xl border-4 border-white rotate-12 ${passed ? 'bg-matcha-500' : 'bg-red-400'}`}>
                  <span className="material-symbols-outlined text-white text-6xl font-black">
                    {passed ? 'emoji_events' : 'sentiment_dissatisfied'}
                  </span>
                </div>

                <div>
                  <h2 className="text-4xl font-black mb-3">{passed ? 'Quest Mastered! 🎉' : 'Not Quite...'}</h2>
                  <p className="text-lg text-stone-500">
                    {passed
                      ? `You passed ${topic} with ${earnedXP}/${maxPossibleXP} XP!`
                      : `You scored ${earnedXP}/${maxPossibleXP} XP. You need ${Math.ceil(maxPossibleXP * PASS_THRESHOLD)} XP to pass (60%).`}
                  </p>
                </div>

                {/* XP Breakdown table */}
                <div className="bg-white p-8 rounded-[32px] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-400 mb-4 text-center">Score Breakdown</p>
                  {xpBreakdown.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${item.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'}`}>
                          {item.isCorrect ? '✓' : '✗'}
                        </span>
                        <span className="text-sm font-bold text-stone-500 uppercase tracking-wider">
                          Q{i + 1} · {item.qType === 'fill_blank' ? 'Fill Blank' : item.qType?.toUpperCase()}
                        </span>
                      </div>
                      <span className={`font-black text-sm ${item.isCorrect ? 'text-green-600' : 'text-stone-300'}`}>
                        {item.isCorrect ? `+${item.xpGained} XP` : '0 XP'}
                      </span>
                    </div>
                  ))}
                  <div className="border-t-2 border-stone-100 pt-4 mt-2 flex justify-between items-center">
                    <span className="font-black uppercase tracking-widest text-sm">Total</span>
                    <span className={`text-2xl font-black ${passed ? 'text-matcha-600' : 'text-red-500'}`}>
                      {earnedXP} / {maxPossibleXP} XP
                    </span>
                  </div>
                  <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${passed ? 'bg-matcha-500' : 'bg-red-400'}`}
                      style={{ width: `${maxPossibleXP ? (earnedXP / maxPossibleXP) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="text-xs text-center text-stone-400 font-bold">
                    {maxPossibleXP ? Math.round((earnedXP / maxPossibleXP) * 100) : 0}% · Pass threshold: 60%
                  </p>
                </div>

                {/* Action buttons */}
                {passed ? (
                  <button
                    onClick={() => onFinish(earnedXP)}
                    className="w-full py-5 bg-black text-white rounded-[28px] font-black text-xs uppercase tracking-[0.4em] shadow-[8px_8px_0px_0px_rgba(132,231,165,1)] transition-all hover:translate-y-[-2px]"
                  >
                    Continue to Next Mission →
                  </button>
                ) : (
                  <div className="flex gap-4">
                    <button
                      onClick={onClose}
                      className="flex-1 py-5 bg-stone-100 rounded-[28px] font-black text-xs uppercase tracking-widest hover:bg-stone-200 transition-all"
                    >
                      Exit
                    </button>
                    <button
                      onClick={() => {
                        setStage('theory');
                        setCurrentQuestionIndex(0);
                        setUserAnswers({});
                        setFeedback(null);
                        setEarnedXP(0);
                        setXpBreakdown([]);
                        setPassed(false);
                      }}
                      className="flex-1 py-5 bg-black text-white rounded-[28px] font-black text-xs uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(7,138,82,1)] hover:translate-y-[-2px] transition-all"
                    >
                      🔄 Retry Mission
                    </button>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>
    </motion.div>
  );
};

export default LessonOverlay;
