import React, { useState } from 'react';

export default function Login({ onLogin, onNavigateSignup }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isHuman, setIsHuman] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isHuman) {
      setError('Please verify you are human by clicking the checkbox.');
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      onLogin(data.token, data.user);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background glowing orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>

      <div className="w-full max-w-md bg-[#1E293B]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative z-10">
        
        {/* Branding Area */}
        <div className="p-8 text-center pb-0">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/30 mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Sign in to API Client</h2>
          <p className="text-gray-400 text-sm">Welcome back! Please enter your details.</p>
        </div>

        {/* Form Area */}
        <div className="p-8 pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Error Banner */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg text-center font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email or username</label>
              <input 
                type="text" 
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="w-full bg-[#0F172A]/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all placeholder-gray-500"
                placeholder="Enter email or username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#0F172A]/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all placeholder-gray-500"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center space-x-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-cyan-500 focus:ring-cyan-500/50 focus:ring-1 focus:ring-offset-0 transition-all" />
                <span className="text-gray-400 group-hover:text-gray-200 transition-colors">Stay signed in</span>
              </label>
              <a href="#" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">Forgot password?</a>
            </div>

            {/* Verify Human Checkbox (Visual imitation) */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 flex flex-col justify-center">
               <label className="flex items-center space-x-3 cursor-pointer select-none">
                 <div className="relative flex items-center justify-center">
                   <input 
                     type="checkbox" 
                     className="peer appearance-none w-6 h-6 border-2 border-gray-500 rounded bg-[#0F172A] checked:bg-cyan-500 checked:border-cyan-500 transition-all cursor-pointer"
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
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold py-3.5 px-4 rounded-lg shadow-lg shadow-purple-500/25 transform transition-all hover:-translate-y-0.5"
            >
              Sign In
            </button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-[#1E293B] text-gray-400">or</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button disabled className="w-full flex items-center justify-center space-x-3 bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2.5 px-4 rounded-lg transition-colors border border-transparent shadow-sm opacity-50 cursor-not-allowed">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>Sign In with Google</span>
              </button>
              
              <button disabled className="w-full flex items-center justify-center space-x-3 bg-[#24292E] hover:bg-[#1b1f23] text-white font-semibold py-2.5 px-4 rounded-lg transition-colors shadow-sm opacity-50 cursor-not-allowed">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.03-2.682-.103-.254-.447-1.27.098-2.646 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.376.202 2.394.1 2.646.64.699 1.026 1.591 1.026 2.682 0 3.841-2.337 4.687-4.565 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
                <span>Sign In with GitHub</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Area */}
        <div className="bg-black/20 p-4 text-center border-t border-white/10">
          <p className="text-gray-400 text-sm">
            Don't have an account?{' '}
            <button onClick={onNavigateSignup} className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors">
              Create a free account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
