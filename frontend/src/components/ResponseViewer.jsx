import React, { useState } from 'react';

function ResponseViewer({ response, loading }) {
  const [activeTab, setActiveTab] = useState('Body');

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 bg-[var(--bg-primary)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[var(--bg-tertiary)] border-t-[var(--accent-cyan)] rounded-full animate-spin"></div>
          <span className="text-[var(--text-muted)] animate-pulse">Sending request...</span>
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="flex-1 flex flex-col p-4 bg-[var(--bg-primary)] border-t border-[var(--border-color)] justify-center items-center h-full">
         <div className="text-center text-[var(--text-muted)]">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-20" fill="currentColor" viewBox="0 0 20 20">
               <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM5.5 10a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0z" clipRule="evenodd" />
            </svg>
            <p>Enter a URL and click Send to get a response</p>
         </div>
      </div>
    );
  }

  const { status, statusText, time, size, data, headers, error } = response;
  
  // Format body for display
  let displayBody = data;
  if (typeof data === 'object') {
    displayBody = JSON.stringify(data, null, 2);
  } else if (error) {
    displayBody = error;
  }

  const isErrorStatus = status < 200 || status >= 400 || error;
  const statusColor = isErrorStatus ? 'var(--status-delete)' : 'var(--status-get)';

  return (
    <div className="flex-1 flex flex-col h-[50%] p-4 bg-[var(--bg-primary)] border-t border-[var(--bg-primary)] border-t-[var(--border-color)]">
      <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
        <div className="tab-nav border-none w-auto p-0 m-0">
            {['Body', 'Headers'].map(tab => (
              <div 
                key={tab}
                className={`tab-item ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </div>
            ))}
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-[var(--text-secondary)]">
          <div>Status: <span style={{ color: statusColor }} className="font-bold">{status ? `${status} ${statusText}` : 'Error'}</span></div>
          <div>Time: <span className="text-[var(--accent-cyan)] font-bold">{time} ms</span></div>
          <div>Size: <span className="text-[var(--accent-cyan)] font-bold">{size} B</span></div>
        </div>
      </div>
      
      <div className="flex-1 glass-panel p-0 relative group overflow-hidden flex flex-col bg-[rgba(15,23,42,0.5)]">
         {activeTab === 'Body' && (
           <pre className="m-0 p-4 font-mono text-sm overflow-auto text-[var(--text-primary)] h-full break-all whitespace-pre-wrap">
             <code>{displayBody || ''}</code>
           </pre>
         )}
         
         {activeTab === 'Headers' && (
           <div className="p-4 overflow-auto h-full">
              {headers && Object.keys(headers).length > 0 ? (
                <table className="w-full text-sm text-left font-mono">
                  <tbody>
                    {Object.entries(headers).map(([key, value]) => (
                      <tr key={key} className="border-b border-[var(--border-color)] last:border-0 hover:bg-[rgba(255,255,255,0.02)]">
                        <td className="py-2 pr-4 text-[var(--text-secondary)] font-semibold align-top whitespace-nowrap">{key}</td>
                        <td className="py-2 text-[var(--text-primary)] break-all">{typeof value === 'object' ? JSON.stringify(value) : value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-[var(--text-muted)] text-center py-8">No headers in response</div>
              )}
           </div>
         )}
         
         <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
           <button 
              className="btn-secondary text-xs py-1 px-2"
              onClick={() => {
                 if (activeTab === 'Body') {
                    navigator.clipboard.writeText(typeof displayBody === 'string' ? displayBody : JSON.stringify(displayBody));
                 } else if (headers) {
                    navigator.clipboard.writeText(JSON.stringify(headers, null, 2));
                 }
              }}
           >
              Copy
           </button>
         </div>
      </div>
    </div>
  );
}

export default ResponseViewer;
