import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { API_URL } from '../config';

const SignUp = ({ onBack, onLogin, onSignUp }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('student');
  const [schoolId, setSchoolId] = useState('');
  
  // OTP Flow State
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Use our custom backend to send a 6-digit OTP via Resend
      const response = await fetch(`${API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setShowOtpInput(true);
      } else {
        setError(data.detail || "Failed to send verification code.");
      }
    } catch (err) {
      setError("Server connection failed. Please ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Verify the 6-digit OTP via our backend
      const verifyRes = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        throw new Error(verifyData.detail || "Invalid verification code.");
      }

      // 2. OTP verified! Now create the user in Supabase
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
            role: role,
            school_id: schoolId
          }
        }
      });

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      // 3. Send the TFI-styled welcome email via backend
      try {
        await fetch(`${API_URL}/auth/welcome`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, username }),
        });
      } catch (e) {
        console.error("Welcome email failed:", e);
      }
      
      setLoading(false);
      // Success! Move to next state (e.g., login or dashboard)
      if (onSignUp) onSignUp();
      else if (onLogin) onLogin();
      
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="bg-warm-cream min-h-screen flex flex-col justify-center items-center p-8 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-lemon-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 z-0 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-slushie-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 z-0 pointer-events-none"></div>
      
      <main className="w-full max-w-md z-10">
        {/* Logo */}
        <div className="text-center mb-12">
          <h1 
            onClick={onBack}
            className="font-display-secondary text-display-secondary text-clay-black tracking-tighter cursor-pointer font-black uppercase text-2xl"
          >
            Campus Cortex
          </h1>
          <p className="font-body-large text-body-large text-warm-charcoal mt-2 text-center">Crafted for learners.</p>
        </div>
        
        {/* Main Card */}
        <div className="bg-pure-white border border-oat-border rounded-[24px] p-10 clay-shadow">
          {!showOtpInput ? (
            <>
              <h2 className="font-card-heading text-card-heading text-clay-black mb-10">Create Account</h2>
              <form className="space-y-6" onSubmit={handleSignUp}>
                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm font-monospace-ui">
                    {error}
                  </div>
                )}

                {/* Email */}
                <div>
                  <label className="block font-label-uppercase text-label-uppercase text-warm-charcoal mb-4 uppercase tracking-wider text-left" htmlFor="email">Email</label>
                  <input 
                    className="w-full bg-pure-white border border-outline rounded px-6 py-3 font-body-standard text-body-standard text-clay-black focus:border-focus-ring focus:ring-1 focus:ring-focus-ring transition-colors" 
                    id="email" 
                    placeholder="jane@university.edu" 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="block font-label-uppercase text-label-uppercase text-warm-charcoal mb-4 uppercase tracking-wider text-left" htmlFor="username">Username</label>
                  <input 
                    className="w-full bg-pure-white border border-outline rounded px-6 py-3 font-body-standard text-body-standard text-clay-black focus:border-focus-ring focus:ring-1 focus:ring-focus-ring transition-colors" 
                    id="username" 
                    placeholder="janesmith123" 
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                {/* Password --> */}
                <div>
                  <label className="block font-label-uppercase text-label-uppercase text-warm-charcoal mb-4 uppercase tracking-wider text-left" htmlFor="password">Password</label>
                  <input 
                    className="w-full bg-pure-white border border-outline rounded px-6 py-3 font-body-standard text-body-standard text-clay-black focus:border-focus-ring focus:ring-1 focus:ring-focus-ring transition-colors" 
                    id="password" 
                    placeholder="••••••••" 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {/* Role --> */}
                <div>
                  <label className="block font-label-uppercase text-label-uppercase text-warm-charcoal mb-4 uppercase tracking-wider text-left" htmlFor="role">Role</label>
                  <select 
                    className="w-full bg-pure-white border border-outline rounded px-6 py-3 font-body-standard text-body-standard text-clay-black focus:border-focus-ring focus:ring-1 focus:ring-focus-ring transition-colors" 
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="student">Student</option>
                    <option value="parent">Parent</option>
                  </select>
                </div>
                {/* School ID --> */}
                <div>
                  <label className="block font-label-uppercase text-label-uppercase text-warm-charcoal mb-4 uppercase tracking-wider text-left" htmlFor="schoolId">School ID</label>
                  <input 
                    className="w-full bg-pure-white border border-outline rounded px-6 py-3 font-body-standard text-body-standard text-clay-black focus:border-focus-ring focus:ring-1 focus:ring-focus-ring transition-colors" 
                    id="schoolId" 
                    placeholder="Enter your School ID" 
                    type="text"
                    value={schoolId}
                    onChange={(e) => setSchoolId(e.target.value)}
                    required
                  />
                </div>
                {/* Create Account Button --> */}
                <div className="pt-2">
                  <button 
                    disabled={loading}
                    className="w-full bg-clay-black text-pure-white font-button text-button rounded-[12px] py-4 btn-interaction hover:bg-dragonfruit-magenta flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" 
                    type="submit"
                  >
                    <span>{loading ? 'Sending Code...' : 'Get Verification Code'}</span>
                    {!loading && <span className="material-symbols-outlined text-[20px]">arrow_forward</span>}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <h2 className="font-card-heading text-card-heading text-clay-black mb-4 text-center">Check Your Email</h2>
              <p className="font-body-standard text-body-standard text-warm-charcoal mb-8 text-center">
                We've sent a verification code to <br/><b className="text-primary">{email}</b>
              </p>
              
              <form className="space-y-6" onSubmit={handleVerifyOtp}>
                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm font-monospace-ui text-center">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block font-label-uppercase text-label-uppercase text-warm-charcoal mb-4 uppercase tracking-wider text-center" htmlFor="otp">Verification Code</label>
                  <input 
                    className="w-full bg-pure-white border border-outline rounded px-4 py-4 text-center font-display-secondary text-2xl tracking-[0.3em] text-clay-black focus:border-focus-ring focus:ring-1 focus:ring-focus-ring transition-colors" 
                    id="otp" 
                    placeholder="000000" 
                    type="text"
                    maxLength="6"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>

                <div className="pt-2">
                  <button 
                    disabled={loading}
                    className="w-full bg-dragonfruit-magenta text-pure-white font-button text-button rounded-[12px] py-4 btn-interaction hover:scale-105 shadow-[0_4px_0_0_#9d174d] active:shadow-none active:translate-y-1 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" 
                    type="submit"
                  >
                    <span>{loading ? 'Verifying...' : 'Verify & Sign Up'}</span>
                    {!loading && <span className="material-symbols-outlined text-[20px]">verified_user</span>}
                  </button>
                </div>

                <button 
                  type="button"
                  onClick={() => setShowOtpInput(false)}
                  className="w-full text-center font-label-uppercase text-xs text-warm-silver hover:text-clay-black transition-colors"
                >
                  Edit details or resend email
                </button>
              </form>
            </>
          )}
          
          {/* Login Link --> */}
          <div className="text-center mt-10">
            <p className="font-body-standard text-body-standard text-warm-charcoal">
              Already have an account? 
              <button 
                onClick={onLogin}
                className="font-button text-button text-clay-black underline hover:text-dragonfruit-magenta transition-colors ml-2"
              >
                Log in
              </button>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SignUp;
