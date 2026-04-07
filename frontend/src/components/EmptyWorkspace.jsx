import React from 'react';
import Logo from './Logo';

function EmptyWorkspace({ onNewRequest }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)] relative border-t border-[var(--border-color)]">
        {/* NeonAPI Logo Graphic */}
        <div className="flex flex-col items-center gap-4 animate-pulse opacity-80">
            <Logo className="w-20 h-20" />
            <div className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-violet-500">
               NeonAPI
            </div>
        </div>

        {/* Action Triggers */}
        <div className="mt-12 text-[var(--text-muted)] text-[13px] font-medium opacity-60">Ready for requests</div>
        <button 
           onClick={() => onNewRequest('http')} 
           className="mt-4 px-4 py-2 border border-[var(--border-color)] hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan)] rounded text-sm transition-colors text-[var(--text-secondary)]"
        >
           Create a New Request
        </button>
    </div>
  );
}

export default EmptyWorkspace;
