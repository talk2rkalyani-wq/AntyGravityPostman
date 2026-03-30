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

  const insertSnippet = (snippet) => {
     const newVal = (value || '') + '\n' + snippet;
     if (activeTab === 'Pre-request') {
        setRequestState({ ...requestState, preRequestScript: newVal.trimStart() });
     } else {
        setRequestState({ ...requestState, postResponseScript: newVal.trimStart() });
     }
  };

  const snippets = activeTab === 'Pre-request' ? [
     { label: 'Get an environment variable', code: 'pm.environment.get("variable_key");' },
     { label: 'Set an environment variable', code: 'pm.environment.set("variable_key", "variable_value");' },
     { label: 'Clear an environment variable', code: 'pm.environment.unset("variable_key");' },
     { label: 'Send a request', code: 'pm.sendRequest("https://postman-echo.com/get", function (err, response) {\n    console.log(response.json());\n});' }
  ] : [
     { label: 'Get an environment variable', code: 'pm.environment.get("variable_key");' },
     { label: 'Set an environment variable', code: 'pm.environment.set("variable_key", "variable_value");' },
     { label: 'Status code: Code is 200', code: 'pm.test("Status code is 200", function () {\n    pm.response.to.have.status(200);\n});' },
     { label: 'Response body: JSON value check', code: 'pm.test("Your test name", function () {\n    var jsonData = pm.response.json();\n    pm.expect(jsonData.value).to.eql(100);\n});' },
     { label: 'Response time is less than 200ms', code: 'pm.test("Response time is less than 200ms", function () {\n    pm.expect(pm.response.responseTime).to.be.below(200);\n});' }
  ];

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

      {/* Snippets Sidebar */}
      <div className="w-56 bg-[var(--bg-secondary)] border-l border-[var(--border-color)] flex flex-col pt-2 shrink-0">
         <span className="px-4 py-1 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border-color)] mb-2">Snippets</span>
         <div className="flex-1 overflow-y-auto custom-scrollbar px-2 space-y-1">
            {snippets.map((snip, i) => (
               <button 
                  key={i}
                  onClick={() => insertSnippet(snip.code)}
                  className="w-full text-left rounded px-2 py-1.5 hover:bg-[var(--bg-tertiary)] hover:text-[#06B6D4] text-[13px] text-[var(--text-primary)] transition-colors line-clamp-2"
                  title={snip.code}
               >
                  {snip.label}
               </button>
            ))}
         </div>
      </div>
    </div>
  );
}
