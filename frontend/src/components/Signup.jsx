import React, { useState } from 'react';
import Logo from './Logo';
import { Eye, EyeOff } from 'lucide-react';

export default function Signup({ onLogin, onNavigateLogin }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isHuman, setIsHuman] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isHuman) {
      setError('Please verify you are human by clicking the checkbox.');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;
    if (!passwordRegex.test(password)) {
      setError('Password must be at least 6 characters and include uppercase, lowercase, numbers, and symbols.');
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccessMsg('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        onNavigateLogin();
      }, 1500);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4 font-sans relative overflow-hidden" style={{ zoom: '0.7' }}>
      {/* Background glowing orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>

      <div className="w-full max-w-md bg-[#1E293B]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative z-10">
        
        {/* Branding Area */}
        <div className="p-8 text-center pb-0">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-cyan-400 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30 mb-6 relative">
            <div className="absolute inset-[2px] rounded-full bg-[#0F172A] flex items-center justify-center">
              <Logo className="w-8 h-8" />
            </div>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Create a free account</h2>
          <p className="text-gray-400 text-sm">Join NeonAPI today. It's free!</p>
        </div>

        {/* Form Area */}
        <div className="p-8 pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg text-center font-medium">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="bg-green-500/10 border border-green-500/50 text-green-500 text-sm p-3 rounded-lg text-center font-medium">
                {successMsg}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Username</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                maxLength={15}
                className="w-full bg-[#0F172A]/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all placeholder-gray-500"
                placeholder="Choose a username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={100}
                className="w-full bg-[#0F172A]/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all placeholder-gray-500"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-[#0F172A]/50 border border-white/10 rounded-lg px-4 py-3 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all placeholder-gray-500"
                  placeholder="Create a strong password"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-purple-400 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <div className="bg-white/5 border border-purple-500/30 rounded p-3 text-xs text-purple-200/70 mt-3">
                <strong>Password Guidelines:</strong> Minimum 6 characters combining uppercase, lowercase, numbers, and symbols.
              </div>
            </div>

            {/* Verify Human Checkbox (Visual imitation) */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex flex-col justify-center mt-6">
               <label className="flex items-center space-x-3 cursor-pointer select-none">
                 <div className="relative flex items-center justify-center">
                   <input 
                     type="checkbox" 
                     className="peer appearance-none w-6 h-6 border-2 border-gray-500 rounded bg-[#0F172A] checked:bg-purple-500 checked:border-purple-500 transition-all cursor-pointer"
                     checked={isHuman}
                     onChange={(e) => setIsHuman(e.target.checked)}
                   />
                   <svg className="absolute w-4 h-4 text-[#0F172A] pointer-events-none opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                     <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                   </svg>
                 </div>
                 <span className="text-gray-300 font-medium tracking-wide">Verify you are human</span>
               </label>
            </div>

            <button 
              type="submit" 
              className="w-full mt-4 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold py-3.5 px-4 rounded-lg shadow-lg shadow-purple-500/25 transform transition-all hover:-translate-y-0.5"
            >
              Sign Up
            </button>
          </form>

        </div>

        {/* Footer Area */}
        <div className="bg-black/20 p-4 text-center border-t border-white/10 mt-2">
          <p className="text-gray-400 text-sm">
            Already have an account?{' '}
            <button onClick={onNavigateLogin} className="text-purple-400 hover:text-purple-300 font-bold transition-colors">
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
