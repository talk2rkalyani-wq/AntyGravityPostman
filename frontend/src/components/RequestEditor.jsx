import React from 'react';
import { Play } from 'lucide-react';
import KeyValueEditor from './KeyValueEditor';
import BodyEditor from './BodyEditor';
import AuthEditor from './AuthEditor';
import ScriptEditor from './ScriptEditor';
import { resolveVariables, getUnresolvedVariables } from '../utils/variableResolver';

function RequestEditor({ requestState, setRequestState, onSend, onSave, onCodeClick, useProxy, setUseProxy, activeEnvVars, collections }) {
  const { method, url, activeTab, params, headers, id } = requestState;

  const handleMethodChange = (e) => setRequestState({ ...requestState, method: e.target.value });
  const handleUrlChange = (e) => setRequestState({ ...requestState, url: e.target.value });
  const handleTabChange = (tab) => setRequestState({ ...requestState, activeTab: tab });

  // Compute collection variables for the tooltip
  let collectionVars = [];
  if (collections) {
     const findReqRecursively = (items, reqId) => {
         for (const item of items) {
             if (item.id === reqId) return true;
             if (item.type === 'folder' && item.items && findReqRecursively(item.items, reqId)) return true;
         }
         return false;
     };
     for (const col of collections) {
         let items = [];
         try {
             const data = typeof col.data === 'string' ? JSON.parse(col.data) : col.data;
             items = data.items || [];
         } catch(e) {}
         if (findReqRecursively(items, id)) {
            try {
                const data = typeof col.data === 'string' ? JSON.parse(col.data) : col.data;
                collectionVars = data.variables || [];
            } catch(e) {}
            break;
         }
     }
  }

  const resolvedUrl = resolveVariables(url, activeEnvVars || [], collectionVars || []);
  const unresolvedVars = getUnresolvedVariables(url, activeEnvVars || [], collectionVars || []);

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
          title={resolvedUrl !== url ? `Resolved URL: ${resolvedUrl}` : ''}
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
      
      {(resolvedUrl !== url || unresolvedVars.length > 0) && (
        <div className="flex flex-col gap-1 mb-4 mt-[-10px]">
           {resolvedUrl !== url && (
               <div className="flex items-center gap-2">
                   <div className="text-[10px] font-bold text-[#06B6D4] bg-[#06B6D4]/10 border border-[#06B6D4]/20 px-2 py-0.5 rounded-full flex gap-1 items-center w-max">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
                      RESOLVED BASE URL
                   </div>
                   <div className="text-xs text-[var(--text-secondary)] font-mono truncate max-w-[80%]">
                      {resolvedUrl}
                   </div>
               </div>
           )}
           {unresolvedVars.length > 0 && (
               <div className="flex items-center gap-2">
                   <div className="text-[10px] font-bold text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/20 px-2 py-0.5 rounded-full flex gap-1 items-center w-max">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                      VARIABLE NOT FOUND
                   </div>
                   <div className="text-xs text-[#F59E0B] font-mono truncate max-w-[80%]">
                      {unresolvedVars.map(v => `{{${v}}}`).join(', ')}
                   </div>
               </div>
           )}
        </div>
      )}

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
