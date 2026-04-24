import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, X, Terminal, Code2 } from 'lucide-react';

const PythonCompiler = ({ onClose, initialCode = "" }) => {
  const [code, setCode] = useState(initialCode || "print('Hello, Python Explorer!')\n\n# Try writing some code here\nx = 10\ny = 20\nprint(f'The sum of {x} and {y} is {x + y}')");
  const [output, setOutput] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pyodideRef = useRef(null);

  useEffect(() => {
    const initPyodide = async () => {
      try {
        pyodideRef.current = await window.loadPyodide();
        setIsLoading(false);
        setOutput([{ type: 'system', content: 'Python engine initialized. Ready for execution.' }]);
      } catch (err) {
        setOutput([{ type: 'error', content: 'Failed to initialize Python engine: ' + err.message }]);
        setIsLoading(false);
      }
    };
    initPyodide();
  }, []);

  const runCode = async () => {
    if (!pyodideRef.current || isRunning) return;

    setIsRunning(true);
    setOutput(prev => [...prev, { type: 'system', content: 'Executing script...' }]);

    try {
      // Capture stdout
      pyodideRef.current.runPython(`
import sys
import io
sys.stdout = io.StringIO()
      `);

      await pyodideRef.current.runPythonAsync(code);
      
      const result = pyodideRef.current.runPython("sys.stdout.getvalue()");
      setOutput(prev => [...prev, { type: 'output', content: result || '(Execution successful with no output)' }]);
    } catch (err) {
      const lines = err.message.split('\n').filter(l => l.trim());
      let cleanMessage = lines[lines.length - 1];
      const lineInfo = lines.find(l => l.includes('File "<exec>", line'));
      if (lineInfo) {
        const lineNum = lineInfo.match(/line (\d+)/)?.[1];
        cleanMessage = `Line ${lineNum}: ${cleanMessage}`;
      }
      setOutput(prev => [...prev, { type: 'error', content: cleanMessage }]);
    } finally {
      setIsRunning(false);
    }
  };

  const clearOutput = () => setOutput([]);

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[100] flex items-center justify-center p-4 md:p-10 selection:bg-accent selection:text-black">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-6xl h-full max-h-[85vh] glass rounded-[40px] border border-white/10 flex flex-col overflow-hidden shadow-[0_0_100px_rgba(0,242,255,0.1)]"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center border border-accent/20">
              <Terminal size={20} className="text-accent" />
            </div>
            <div>
              <h2 className="font-black tracking-tight text-white">PYTHON LABORATORY</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent/60">Execution Environment v3.0</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 rounded-full hover:bg-white/10 transition-colors text-dim hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Editor Section */}
          <div className="flex-1 flex flex-col border-r border-white/5 bg-black/20">
            <div className="p-4 flex items-center gap-2 border-b border-white/5 text-[10px] font-black tracking-widest text-dim uppercase bg-white/5">
              <Code2 size={12} /> Source Editor
            </div>
            <div className="flex-1 relative overflow-hidden group">
              {/* Syntax Highlighting Layer */}
              <div 
                className="absolute inset-0 p-8 font-mono text-sm leading-relaxed pointer-events-none whitespace-pre-wrap break-all"
                aria-hidden="true"
              >
                {code.split('\n').map((line, i) => (
                  <div key={i} className="min-h-[1.5em]">
                    {line.split(/(\s+)/).map((word, j) => {
                      if (/^(print|def|class|if|else|elif|for|while|return|import|from|as|try|except|finally|with|lambda|in|is|and|or|not)$/.test(word)) {
                        return <span key={j} className="text-accent">{word}</span>;
                      }
                      if (/^(True|False|None)$/.test(word)) {
                        return <span key={j} className="text-emerald-400">{word}</span>;
                      }
                      if (/^".*?"|'.*?'$/.test(word)) {
                        return <span key={j} className="text-amber-300">{word}</span>;
                      }
                      if (/^\d+$/.test(word)) {
                        return <span key={j} className="text-orange-400">{word}</span>;
                      }
                      if (word.startsWith('#')) {
                        return <span key={j} className="text-dim/50 italic">{word}</span>;
                      }
                      return <span key={j}>{word}</span>;
                    })}
                  </div>
                ))}
              </div>

              {/* Input Layer */}
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="absolute inset-0 w-full h-full p-8 bg-transparent text-transparent caret-accent font-mono text-sm resize-none outline-none leading-relaxed spell-check-false selection:bg-accent/20"
                placeholder="# Write your Python code here..."
                spellCheck="false"
              />
            </div>
            
            {/* Actions Bar */}
            <div className="p-4 border-t border-white/5 bg-white/5 flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={runCode}
                disabled={isLoading || isRunning}
                className={`
                  flex items-center gap-2 px-8 py-3 rounded-xl font-black text-xs tracking-widest uppercase transition-all
                  ${isLoading || isRunning ? 'bg-dim/20 text-dim cursor-not-allowed' : 'bg-accent text-black shadow-[0_0_20px_rgba(0,242,255,0.3)]'}
                `}
              >
                {isRunning ? (
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  <Play size={14} fill="currentColor" />
                )}
                {isLoading ? 'Initializing...' : isRunning ? 'Executing...' : 'Run Module'}
              </motion.button>

              <button 
                onClick={() => setCode("")}
                className="p-3 rounded-xl border border-white/5 hover:bg-white/5 text-dim transition-colors"
                title="Clear Editor"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>

          {/* Console Section */}
          <div className="w-full lg:w-[400px] bg-black/40 flex flex-col">
            <div className="p-4 flex items-center justify-between border-b border-white/5 bg-white/5 text-[10px] font-black tracking-widest text-dim uppercase">
              <span className="flex items-center gap-2"><Terminal size={12} /> Console Output</span>
              <button onClick={clearOutput} className="hover:text-white transition-colors">Clear</button>
            </div>
            <div className="flex-1 p-6 font-mono text-xs overflow-y-auto space-y-2">
              {output.length === 0 && (
                <div className="text-dim/40 italic">Waiting for execution...</div>
              )}
              {output.map((line, i) => (
                <div 
                  key={i} 
                  className={`
                    leading-relaxed break-all
                    ${line.type === 'error' ? 'text-red-400' : ''}
                    ${line.type === 'system' ? 'text-accent/50 italic' : ''}
                    ${line.type === 'output' ? 'text-white' : ''}
                  `}
                >
                  {line.type === 'system' ? `[SYSTEM]: ${line.content}` : line.content}
                </div>
              ))}
              {isRunning && (
                <div className="animate-pulse text-accent">_</div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PythonCompiler;
