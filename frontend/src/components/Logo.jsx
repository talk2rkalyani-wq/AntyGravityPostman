import React from 'react';

export default function Logo({ className = "w-8 h-8" }) {
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="url(#neonGradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <defs>
          <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
        <path d="M8 21V7L16 17V3" />
        <circle cx="8" cy="21" r="1.5" fill="#06B6D4" stroke="none" />
        <circle cx="8" cy="7" r="1.5" fill="#8B5CF6" stroke="none" />
        <circle cx="16" cy="17" r="1.5" fill="#06B6D4" stroke="none" />
        <circle cx="16" cy="3" r="1.5" fill="#8B5CF6" stroke="none" />
        <path d="M3 14h5" />
        <circle cx="3" cy="14" r="1" fill="#06B6D4" stroke="none" />
        <path d="M16 10h5" />
        <circle cx="21" cy="10" r="1" fill="#8B5CF6" stroke="none" />
      </svg>
    </div>
  );
}
