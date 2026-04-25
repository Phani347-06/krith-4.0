import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { API_URL } from '../config';

const ChatbotPanel = ({ isOpen, onClose, userContext }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I'm Krith, your CortexAI companion. What are we hacking on today? ⚡" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, userMessage],
          userContext: userContext 
        })
      });

      if (!response.ok) throw new Error('API Error');

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, { role: 'assistant', content: "⚠️ Systems offline. I couldn't reach the backend. Check your terminal to make sure the server is running." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/10 backdrop-blur-[2px]"
          />

          {/* Side Panel */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 bottom-0 w-full md:w-[450px] z-[70] bg-white/90 backdrop-blur-xl border-l-2 border-stone-100 shadow-[20px_0_40px_rgba(0,0,0,0.1)] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b-2 border-stone-100 flex justify-between items-center bg-white/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-matcha-600 rounded-xl flex items-center justify-center shadow-inner">
                  <span className="material-symbols-outlined text-white text-xl">smart_toy</span>
                </div>
                <div>
                  <h3 className="font-display-secondary font-black text-lg leading-tight">Krith AI</h3>
                  <p className="text-[10px] font-bold text-matcha-600 uppercase tracking-widest flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-matcha-500 animate-pulse" /> Online
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-stone-500 text-xl">close</span>
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-[20px] px-5 py-4 ${
                    msg.role === 'user' 
                      ? 'bg-black text-white rounded-br-sm' 
                      : 'bg-stone-100 text-black rounded-bl-sm border border-stone-200'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm prose-stone max-w-none prose-p:leading-snug prose-p:my-1 prose-pre:bg-stone-200 prose-pre:text-black">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="font-medium text-sm">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-stone-100 rounded-[20px] rounded-bl-sm border border-stone-200 px-5 py-4 flex items-center gap-1">
                    <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t-2 border-stone-100 bg-white/50">
              <form onSubmit={handleSend} className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Krith anything..."
                  className="w-full bg-stone-100 border-2 border-stone-200 rounded-[24px] pl-6 pr-14 py-4 text-sm font-bold focus:outline-none focus:border-black focus:bg-white transition-all placeholder:font-medium"
                />
                <button 
                  type="submit" 
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 w-10 h-10 bg-black rounded-full flex items-center justify-center text-white hover:bg-matcha-600 disabled:opacity-50 disabled:hover:bg-black transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ChatbotPanel;
