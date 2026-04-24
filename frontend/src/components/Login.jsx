import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const Login = ({ onBack, onSignUp }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
    // Session change will be handled by App.jsx listener
  };

  return (
    <div className="bg-warm-cream min-h-screen flex flex-col text-primary selection:bg-dragonfruit-magenta selection:text-pure-white overflow-x-hidden">
      {/* TopAppBar */}
      <header className="bg-[#fcfaf2] text-black font-['Epilogue'] tracking-tight border-b border-[#dad4c8] shadow-[0_1px_1px_rgba(0,0,0,0.05),0_-1px_1px_inset_rgba(0,0,0,0.05)] sticky top-0 z-50 flex justify-between items-center w-full px-8 py-4 max-w-7xl mx-auto active:scale-95 transition-transform">
        <div 
          onClick={onBack}
          className="text-2xl font-black text-black tracking-tighter uppercase cursor-pointer"
        >
          Campus Cortex AI
        </div>
        <button 
          onClick={onSignUp}
          className="font-button text-button border border-outline rounded-full px-6 py-2 hover:rotate-[-8deg] hover:-translate-y-1 hover:shadow-[rgb(0,0,0)_-7px_7px] hover:bg-lemon-400 transition-all duration-200"
        >
          Sign Up
        </button>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-grow flex items-center justify-center p-6 w-full relative z-10">
        {/* Login Card */}
        <div className="w-full max-w-md bg-pure-white border border-oat-border rounded-[24px] clay-shadow p-8 sm:p-12 flex flex-col gap-8 relative z-20">
          <div className="text-center flex flex-col gap-2">
            <h1 className="font-card-heading text-card-heading text-primary">Log In</h1>
            <p className="font-body-standard text-body-standard text-warm-charcoal text-center">Access your craft workspace.</p>
          </div>
          <form className="flex flex-col gap-6" onSubmit={handleLogin}>
            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm font-monospace-ui">
                {error}
              </div>
            )}
            
            {/* Email Input */}
            <div className="flex flex-col gap-2">
              <label className="font-label-uppercase text-label-uppercase text-warm-charcoal text-left" htmlFor="email">Email</label>
              <div className="relative">
                <input 
                  className="w-full h-12 px-4 bg-pure-white border border-oat-border rounded focus:outline-none focus:ring-2 focus:ring-focus-ring focus:border-transparent font-monospace-ui text-monospace-ui text-primary placeholder:text-outline-variant transition-all" 
                  id="email" 
                  placeholder="name@university.edu" 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            {/* Password Input */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="font-label-uppercase text-label-uppercase text-warm-charcoal" htmlFor="password">Password</label>
                <a className="font-monospace-ui text-monospace-ui text-warm-charcoal hover:text-primary hover:rotate-[-2deg] transition-all duration-200" href="#">Forgot password?</a>
              </div>
              <div className="relative">
                <input 
                  className="w-full h-12 px-4 bg-pure-white border border-oat-border rounded focus:outline-none focus:ring-2 focus:ring-focus-ring focus:border-transparent font-monospace-ui text-monospace-ui text-primary placeholder:text-outline-variant transition-all" 
                  id="password" 
                  placeholder="••••••••" 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            {/* CTA Button */}
            <button 
              disabled={loading}
              className="mt-4 w-full h-14 bg-primary text-on-primary font-button text-button rounded-full hover:rotate-[-4deg] hover:-translate-y-2 hover:bg-dragonfruit-magenta hover:shadow-[rgb(0,0,0)_-7px_7px] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" 
              type="submit"
            >
              {loading ? 'Logging in...' : 'Log In'}
              {!loading && <span className="material-symbols-outlined text-[20px]">arrow_forward</span>}
            </button>
          </form>
          {/* Divider */}
          <div className="flex items-center gap-4 my-2 opacity-60">
            <div className="h-px bg-oat-border flex-grow"></div>
            <span className="font-label-uppercase text-label-uppercase text-warm-silver">Or</span>
            <div className="h-px bg-oat-border flex-grow"></div>
          </div>
          {/* Social Logins */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button className="flex-1 h-12 flex items-center justify-center gap-2 bg-pure-white border border-oat-border rounded hover:bg-oat-light hover:rotate-[-2deg] hover:shadow-[rgb(0,0,0)_-4px_4px] transition-all duration-200" type="button">
              <img alt="Google Logo" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD1OoEAW8_fi7yDwJ4TP4vpSCNxyuMlgLFJsd-K7rxwSZSeCIuc2mr2wVEkRJKdg50zXOZ_Ps99y2A__JBJ_jPPTJWcWytcoF3Rp1A8SOK1OBJ1e9cgLlqVNFVimaVS371uc3OEl-NWjMxEPTfsIPAjE-WaixID-eUZDgGmDDE1AEHgSE7oqGElnA6enD0rp7qjekMJs8QuCwtUBFPG-RG404tUvUK8ycgrV5AQ3KSlsfJRzzHonMjOrgP8KTpqc-n_wSpWI7zXC54"/>
              <span className="font-button text-button text-primary">Google</span>
            </button>
            <button className="flex-1 h-12 flex items-center justify-center gap-2 bg-pure-white border border-oat-border rounded hover:bg-oat-light hover:rotate-[2deg] hover:shadow-[rgb(0,0,0)_4px_4px] transition-all duration-200" type="button">
              <img alt="Discord Logo" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBNBbZbS9tl5UDxEzOOmgJ2RSzUiIY0n_DkR3JvE0Yr8ty2zS2JyAxottARoCXw4XYvhVVhY8SCXw7V9V3oqIcZWRP2tkArjWFotNu4AsYVJ3LMBwCLC3JC6cTE_-8l3EjGT0XV9OET274J1aCHgPi4WlchIABuomCxYs8TJFrVFEcgDsOhbOZCt7Mpd7iJJJ9CcqWq-m44iv4ysf91wrXGDraGiPN0sbwOgxg3C5uImR4d6uT0HvioaNfD3SQJbyd3Lfg4SP2vFrE"/>
              <span className="font-button text-button text-primary">Discord</span>
            </button>
          </div>
          <p className="text-center font-body-standard text-body-standard text-warm-charcoal mt-2">
            Don't have an account? <button onClick={onSignUp} className="text-primary hover:text-slushie-800 underline decoration-2 underline-offset-4 hover:rotate-[-2deg] inline-block transition-all duration-200">Sign up</button>
          </p>
        </div>
        {/* Decorative background elements */}
        <div className="absolute top-1/4 left-10 w-32 h-32 bg-lemon-400 rounded-full blur-3xl opacity-20 -z-10 pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-10 w-40 h-40 bg-slushie-500 rounded-full blur-3xl opacity-20 -z-10 pointer-events-none"></div>
      </main>

      {/* Footer */}
      <footer className="bg-[#fcfaf2] text-stone-600 font-['Epilogue'] text-xs uppercase tracking-[1.08px] border-t border-dashed border-[#dad4c8] transition-all duration-200 w-full py-12 px-8 flex flex-col md:flex-row justify-between items-center gap-6 max-w-7xl mx-auto relative z-10">
        <div>
          © 2024 Campus Cortex AI. Crafted for learners.
        </div>
        <div className="flex flex-wrap justify-center gap-6">
          <a className="text-stone-500 hover:text-black transition-colors" href="#">Privacy Policy</a>
          <a className="text-stone-500 hover:text-black transition-colors" href="#">Terms of Service</a>
          <a className="text-stone-500 hover:text-black transition-colors" href="#">Help Center</a>
          <a className="text-stone-500 hover:text-black transition-colors" href="#">Contact</a>
        </div>
      </footer>
    </div>
  );
};

export default Login;
