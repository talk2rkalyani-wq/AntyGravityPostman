import React, { useState } from 'react';

export default function ScriptEditor({ requestState, setRequestState }) {
  const [activeTab, setActiveTab] = useState('Pre-request');

  const handleChange = (e) => {
    if (activeTab === 'Pre-request') {
      setRequestState({ ...requestState, preRequestScript: e.target.value });
    } else {
      setRequestState({ ...requestState, postResponseScript: e.target.value });
    }
  };

  const value = activeTab === 'Pre-request' ? requestState.preRequestScript : requestState.postResponseScript;

  return (
    <div className="flex h-full min-h-[200px] border border-[var(--border-color)] rounded-lg overflow-hidden bg-[var(--bg-primary)]">
      {/* Sidebar */}
      <div className="w-48 bg-[var(--bg-secondary)] border-r border-[var(--border-color)] flex flex-col py-2 shrink-0">
        <button 
          onClick={() => setActiveTab('Pre-request')}
          className={`text-left px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'Pre-request' ? 'text-[var(--accent-cyan)] bg-[var(--bg-tertiary)] border-r-2 border-[var(--accent-cyan)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] border-r-2 border-transparent'}`}
        >
          Pre-request
        </button>
        <button 
          onClick={() => setActiveTab('Post-response')}
          className={`text-left px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'Post-response' ? 'text-[var(--accent-cyan)] bg-[var(--bg-tertiary)] border-r-2 border-[var(--accent-cyan)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] border-r-2 border-transparent'}`}
        >
          Post-response
        </button>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col bg-[var(--bg-primary)]">
        <div className="px-4 py-2 text-xs text-[var(--text-muted)] border-b border-[var(--border-color)] bg-[var(--bg-secondary)] flex items-center justify-between">
          <span>{activeTab === 'Pre-request' ? '// Scripts to execute before sending the request' : '// Scripts to execute after receiving the response'}</span>
        </div>
        <textarea 
          value={value || ''}
          onChange={handleChange}
          className="flex-1 w-full bg-transparent border-none outline-none resize-none px-4 py-4 font-mono text-sm text-[#E2E8F0] leading-relaxed custom-scrollbar placeholder-[var(--text-muted)] focus:ring-0"
          placeholder={activeTab === 'Pre-request' ? `// Write JavaScript code here\npm.environment.set("variable_key", "variable_value");` : `// Validate that the response code should be 200\npm.test("Status code is 200", function () {\n    pm.response.to.have.status(200);\n});`}
          spellCheck="false"
        />
      </div>
    </div>
  );
}
