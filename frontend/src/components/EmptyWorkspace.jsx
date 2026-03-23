import React from 'react';
import { Globe, Hexagon, Zap, Database, MoreHorizontal, ExternalLink } from 'lucide-react';

function EmptyWorkspace({ onNewRequest }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)] relative border-t border-[var(--border-color)]">
        {/* Astronaut Circle Graphic */}
        <div className="relative w-48 h-48 mb-8 flex items-center justify-center bg-[var(--bg-secondary)] shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]" style={{ borderRadius: '50%' }}>
            <svg viewBox="0 0 100 100" className="w-24 h-24 text-[var(--accent-cyan)] fill-current opacity-20" xmlns="http://www.w3.org/2000/svg">
                {/* Simplified floating figure mimicking screenshot */}
                <path d="M60 25 A 6 6 0 1 0 72 25 A 6 6 0 1 0 60 25 z" />
                <path d="M48 40 L65 30 L60 22 L42 32 z" />
                <path d="M38 58 L52 46 L62 55 L40 65 z" />
                <path d="M25 65 L40 54 L35 70 z" />
            </svg>
        </div>

        {/* Action Button */}
        <button 
            onClick={() => onNewRequest('modal')}
            className="flex items-center gap-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] hover:border-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] px-5 py-2.5 rounded shadow-sm font-medium text-[13px] transition-colors mb-12"
        >
            <ExternalLink size={14} className="opacity-70" />
            Open Workspace Overview
        </button>

        {/* Action Triggers */}
        <div className="text-[var(--text-secondary)] text-[13px] mb-4 font-medium">Create a new request:</div>
        <div className="flex items-center gap-5 text-[var(--text-muted)]">
            <button onClick={() => onNewRequest('http')} className="hover:text-[var(--accent-cyan)] transition-colors p-1" title="HTTP Request"><Globe strokeWidth={1.5} size={20} /></button>
            <button onClick={() => onNewRequest('modal')} className="hover:text-[var(--accent-cyan)] transition-colors p-1" title="GraphQL Request"><Hexagon strokeWidth={1.5} size={20} /></button>
            <button onClick={() => onNewRequest('modal')} className="hover:text-[var(--accent-cyan)] transition-colors p-1" title="WebSocket Request"><Zap strokeWidth={1.5} size={20} /></button>
            <button onClick={() => onNewRequest('modal')} className="hover:text-[var(--accent-cyan)] transition-colors p-1" title="gRPC Request"><Database strokeWidth={1.5} size={20} /></button>
            <button onClick={() => onNewRequest('modal')} className="hover:text-[var(--accent-cyan)] transition-colors p-1" title="More options"><MoreHorizontal strokeWidth={1.5} size={20} /></button>
        </div>
    </div>
  );
}

export default EmptyWorkspace;
