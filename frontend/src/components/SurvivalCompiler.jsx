import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const SurvivalCompiler = ({ initialCode, onOutputChange }) => {
  const [code, setCode] = useState(initialCode || '');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pyodideRef = useRef(null);

  useEffect(() => {
    const initPyodide = async () => {
      try {
        if (!window.loadPyodide) {
           throw new Error("Pyodide not loaded. Check connection.");
        }
        pyodideRef.current = await window.loadPyodide();
        setIsLoading(false);
      } catch (err) {
        setOutput('Error: ' + err.message);
        setIsLoading(false);
      }
    };
    initPyodide();
  }, []);

  const runCode = async () => {
    if (!pyodideRef.current || isRunning) return;

    setIsRunning(true);
    setOutput('Executing...');

    try {
      pyodideRef.current.runPython(`
import sys
import io
sys.stdout = io.StringIO()
      `);

      await pyodideRef.current.runPythonAsync(code);
      const result = pyodideRef.current.runPython("sys.stdout.getvalue()");
      const finalOutput = result.trim();
      setOutput(finalOutput || '(No output)');
      if (onOutputChange) onOutputChange(finalOutput);
    } catch (err) {
      setOutput('Error: ' + err.message);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 bg-black/40 rounded-xl p-4 border border-slate-700/50">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Neural Compiler</span>
        <button
          onClick={runCode}
          disabled={isLoading || isRunning}
          className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
            isLoading || isRunning 
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
            : 'bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
          }`}
        >
          {isLoading ? 'Booting...' : isRunning ? 'Running...' : 'Execute'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[250px]">
        {/* Editor */}
        <div className="relative border border-slate-800 rounded-lg overflow-hidden bg-slate-950/50">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-full p-4 bg-transparent text-cyan-50 font-mono text-sm resize-none outline-none"
            placeholder="# Write your Python code here..."
            spellCheck="false"
          />
        </div>

        {/* Console */}
        <div className="border border-slate-800 rounded-lg bg-black/60 p-4 font-mono text-xs overflow-y-auto">
          <div className="text-slate-500 mb-2 border-b border-slate-800 pb-1 uppercase text-[9px] tracking-widest">Output Log</div>
          <pre className={`whitespace-pre-wrap break-all ${output.startsWith('Error') ? 'text-rose-400' : 'text-emerald-400'}`}>
            {output || 'Waiting for execution...'}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default SurvivalCompiler;
