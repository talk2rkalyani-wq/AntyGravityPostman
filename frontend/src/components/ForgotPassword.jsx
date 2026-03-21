import React, { useState } from 'react';
import Logo from './Logo';

export default function ForgotPassword({ onNavigateLogin }) {
  const [stage, setStage] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [isHuman, setIsHuman] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!isHuman) {
      setError('Please verify you are human by clicking the checkbox.');
      return;
    }

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to request reset');
      }

      setStage(2);
      // We show the OTP on screen just for local testing since we don't have an email provider
      setSuccessMsg(`OTP generated! (Dev mode: ${data._dev_otp}) Check console for actual log imitation.`);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Invalid OTP');
      }

      setResetToken(data.resetToken);
      setStage(3);
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // Password Guideline Validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
    if (!passwordRegex.test(newPassword)) {
      setError('Password must be at least 6 characters and include uppercase, lowercase, numbers, and symbols.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, resetToken, newPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setSuccessMsg('Password successfully reset! You can now log in.');
      setTimeout(() => {
        onNavigateLogin();
      }, 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4 font-sans relative overflow-hidden" style={{ zoom: '0.7' }}>
      {/* Background glowing orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-orange-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-amber-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>

      <div className="w-full max-w-md bg-[#1E293B]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative z-10">
        
        {/* Branding Area */}
        <div className="p-8 text-center pb-0">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30 mb-6 relative">
            <div className="absolute inset-[2px] rounded-full bg-[#0F172A] flex items-center justify-center">
              <Logo className="w-8 h-8" />
            </div>
          </div>
          
          {stage === 1 && (
            <>
              <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Reset your password</h2>
              <p className="text-gray-400 text-sm">Don't worry, we've got your back! Just enter your email address and we'll send you an OTP.</p>
            </>
          )}

          {stage === 2 && (
            <>
              <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Check your email</h2>
              <p className="text-gray-400 text-sm">Please enter the 6-digit OTP sent to {email}.</p>
            </>
          )}

          {stage === 3 && (
            <>
              <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Create new password</h2>
              <p className="text-gray-400 text-sm">Please enter your new strong password below.</p>
            </>
          )}
        </div>

        {/* Form Area */}
        <div className="p-8 pt-6">
          
          {/* Messages */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg text-center font-medium mb-4">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="bg-green-500/10 border border-green-500/50 text-green-500 text-sm p-3 rounded-lg text-center font-medium mb-4">
              {successMsg}
            </div>
          )}

          {/* STAGE 1: EMAIL */}
          {stage === 1 && (
            <form onSubmit={handleEmailSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                <div className="relative">
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    maxLength={100}
                    className="w-full bg-[#0F172A]/50 border border-white/10 rounded-lg px-4 py-3 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all placeholder-gray-500"
                    placeholder="Enter your email"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Verify Human Checkbox (Visual imitation) */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 flex flex-col justify-center">
                 <label className="flex items-center space-x-3 cursor-pointer select-none">
                   <div className="relative flex items-center justify-center">
                     <input 
                       type="checkbox" 
                       className="peer appearance-none w-6 h-6 border-2 border-gray-500 rounded bg-[#0F172A] checked:bg-orange-500 checked:border-orange-500 transition-all cursor-pointer"
                       checked={isHuman}
                       onChange={(e) => setIsHuman(e.target.checked)}
                     />
                     <svg className="absolute w-4 h-4 text-[#0F172A] pointer-events-none opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                       <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                     </svg>
                   </div>
                   <div>
                     <span className="text-gray-300 font-medium tracking-wide block">I'm not a robot</span>
                     <span className="text-gray-500 text-xs">reCAPTCHA imitation</span>
                   </div>
                 </label>
              </div>

              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-bold py-3.5 px-4 rounded-lg shadow-lg shadow-orange-500/25 transform transition-all hover:-translate-y-0.5"
              >
                Submit
              </button>
            </form>
          )}

          {/* STAGE 2: OTP */}
          {stage === 2 && (
            <form onSubmit={handleOtpSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">6-Digit OTP</label>
                <input 
                  type="text" 
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  className="w-full text-center tracking-[0.5em] font-mono text-2xl bg-[#0F172A]/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all placeholder-gray-600"
                  placeholder="------"
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-bold py-3.5 px-4 rounded-lg shadow-lg shadow-orange-500/25 transform transition-all hover:-translate-y-0.5"
              >
                Verify OTP
              </button>
            </form>
          )}

          {/* STAGE 3: NEW PASSWORD */}
          {stage === 3 && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              
              <div className="bg-white/5 border border-amber-500/30 rounded p-3 text-xs text-amber-200/70 mb-2">
                <strong>Password Guidelines:</strong> Minimum 6 characters combining uppercase, lowercase, numbers, and symbols (@$!%*?&).
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">New Password</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full bg-[#0F172A]/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all placeholder-gray-500"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirm Password</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full bg-[#0F172A]/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all placeholder-gray-500"
                  placeholder="••••••••"
                />
              </div>

              <button 
                type="submit" 
                className="w-full mt-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-bold py-3.5 px-4 rounded-lg shadow-lg shadow-orange-500/25 transform transition-all hover:-translate-y-0.5"
              >
                Set New Password
              </button>
            </form>
          )}

        </div>

        {/* Footer Area */}
        <div className="bg-black/20 p-4 text-center border-t border-white/10 mt-2">
          <p className="text-gray-400 text-sm">
            Return to{' '}
            <button onClick={onNavigateLogin} className="text-orange-400 hover:text-orange-300 font-bold transition-colors">
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
