import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

function Home({ onStart }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(err => console.warn("Video play blocked", err));
    }
  }, []);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black font-['Plus_Jakarta_Sans']">
      
      {/* Background Video */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="absolute top-0 left-0 w-full h-full object-cover opacity-60"
      >
        <source src="/bg.mp4" type="video/mp4" />
      </video>

      {/* Modern Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/20 to-black/90 pointer-events-none"></div>

      {/* Interactive Content */}
      <div className="relative z-10 flex flex-col justify-center items-center h-full text-white text-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center gap-6"
        >
          {/* Logo/Brand */}
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-4 shadow-[0_0_40px_rgba(255,255,255,0.3)]">
            <span className="material-symbols-outlined text-black text-5xl font-black">bolt</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic leading-none">
            Welcome to <span className="text-matcha-300">CortexAI</span>
          </h1>
          
          <p className="mt-4 text-xl md:text-2xl text-stone-300 font-medium max-w-2xl">
            Experience the future of Python mastery with <span className="text-white border-b-2 border-matcha-500">adaptive 3D quest mapping</span> and AI-driven intelligence.
          </p>

          <motion.button
            whileHover={{ scale: 1.05, rotate: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={onStart}
            className="mt-12 group relative flex items-center gap-4 bg-white text-black px-12 py-6 rounded-[32px] font-black text-xl uppercase tracking-widest shadow-[0_20px_40px_rgba(255,255,255,0.1)] transition-all hover:bg-matcha-400 hover:text-white"
          >
            <span>Initiate Quest</span>
            <span className="material-symbols-outlined font-black transition-transform group-hover:translate-x-2">rocket_launch</span>
          </motion.button>
        </motion.div>

        {/* Footer Stats */}
        <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-12 text-stone-400 opacity-60">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-black text-white">12+</span>
            <span className="text-[10px] font-black uppercase tracking-widest">Modules</span>
          </div>
          <div className="flex flex-col items-center border-x border-white/10 px-12">
            <span className="text-2xl font-black text-white">AI</span>
            <span className="text-[10px] font-black uppercase tracking-widest">Reinforced</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-black text-white">2.5k</span>
            <span className="text-[10px] font-black uppercase tracking-widest">Quests</span>
          </div>
        </div>
      </div>

    </div>
  );
}

export default Home;
