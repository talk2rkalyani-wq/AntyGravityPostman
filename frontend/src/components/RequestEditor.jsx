import React from 'react';
import { Play } from 'lucide-react';
import KeyValueEditor from './KeyValueEditor';
import BodyEditor from './BodyEditor';
import AuthEditor from './AuthEditor';
import ScriptEditor from './ScriptEditor';

function RequestEditor({ requestState, setRequestState, onSend, onSave, onCodeClick, useProxy, setUseProxy }) {
  const { method, url, activeTab, params, headers } = requestState;

  const handleMethodChange = (e) => setRequestState({ ...requestState, method: e.target.value });
  const handleUrlChange = (e) => setRequestState({ ...requestState, url: e.target.value });
  const handleTabChange = (tab) => setRequestState({ ...requestState, activeTab: tab });

  return (
    <div className="flex-1 flex flex-col min-h-[40%] border-b border-[var(--border-color)] p-4 pt-2">
      <div className="glass-panel p-2 flex gap-2 mb-4 items-center outline outline-1 outline-transparent focus-within:outline-[#06B6D4] focus-within:shadow-[0_0_10px_rgba(6,182,212,0.2)] transition-all">
        <select 
          value={method} 
          onChange={handleMethodChange}
          className="input-field bg-transparent border-none font-bold w-[100px] outline-none cursor-pointer p-0 pl-2 focus:ring-0"
          style={{ color: `var(--status-${method.toLowerCase()})` }}
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
          <option value="PATCH">PATCH</option>
        </select>
        <div className="w-[1px] h-8 bg-[var(--border-color)]"></div>
        <input 
          type="text" 
          value={url}
          onChange={handleUrlChange}
          placeholder="Enter request URL" 
          className="flex-1 bg-transparent border-none text-[var(--text-primary)] px-2 outline-none font-mono text-sm"
        />
        <div className="flex items-center gap-2 px-2 border-r border-[var(--border-color)]">
          <label className="flex items-center gap-1.5 cursor-pointer" title="Route requests through the cloud backend (fixes CORS but blocks localhost) or send directly from your browser.">
             <input type="checkbox" checked={useProxy} onChange={e => setUseProxy(e.target.checked)} className="rounded border-[var(--border-color)] text-[#06B6D4] focus:ring-0 focus:ring-offset-0 bg-transparent w-3 h-3 cursor-pointer" />
             <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Cloud Proxy</span>
          </label>
        </div>
        <button onClick={onCodeClick} className="btn-secondary flex items-center justify-center min-w-[32px] h-8 shadow-sm p-0 rounded-md bg-[var(--bg-tertiary)] hover:text-[#06B6D4] transition border border-transparent hover:border-[#06B6D4]/30" title="Generate Code Snippet">
           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
        </button>
        <button onClick={onSave} className="btn-secondary flex items-center justify-center min-w-[32px] h-8 shadow-sm p-0 rounded-md" title="Save to Collection">
          <span className="text-xs px-3 font-semibold">Save</span>
        </button>
        <button onClick={onSend} className="btn-primary flex items-center justify-center gap-1.5 min-w-[80px] h-8 rounded-md hover:shadow-lg transition-all" title="Execute Request">
          <span className="text-xs font-bold tracking-wide">Send</span>
          <Play size={13} fill="currentColor" />
        </button>
      </div>

      <div className="tab-nav mb-4">
        {['Params', 'Headers', 'Body', 'Scripts', 'Auth'].map(tab => (
          <div 
            key={tab}
            className={`tab-item ${activeTab === tab ? 'active' : ''}`}
            onClick={() => handleTabChange(tab)}
          >
            {tab}
            {tab === 'Params' && params.length > 1 && <span className="text-xs ml-1 text-[#06B6D4]">({params.filter(p=>p.active && p.key).length})</span>}
            {tab === 'Headers' && headers.length > 1 && <span className="text-xs ml-1 text-[#06B6D4]">({headers.filter(h=>h.active && h.key).length})</span>}
            {tab === 'Body' && requestState.bodyType && requestState.bodyType !== 'none' && <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] ml-2 inline-block"></span>}
            {tab === 'Scripts' && (requestState.preRequestScript || requestState.postResponseScript) && <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] ml-2 inline-block"></span>}
          </div>
        ))}
      </div>

      <div className="flex-1 glass-panel p-4 overflow-y-auto custom-scrollbar">
        {activeTab === 'Params' && (
           <KeyValueEditor items={params} onChange={(newList) => setRequestState({...requestState, params: newList})} />
        )}
        {activeTab === 'Headers' && (
           <KeyValueEditor items={headers} onChange={(newList) => setRequestState({...requestState, headers: newList})} />
        )}
        {activeTab === 'Body' && (
           <BodyEditor requestState={requestState} setRequestState={setRequestState} />
        )}
        {activeTab === 'Scripts' && (
           <ScriptEditor requestState={requestState} setRequestState={setRequestState} />
        )}
        {activeTab === 'Auth' && (
           <AuthEditor requestState={requestState} setRequestState={setRequestState} />
        )}
      </div>
    </div>
  );
}

export default RequestEditor;
