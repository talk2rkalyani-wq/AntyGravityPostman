import React from 'react';
import { Play } from 'lucide-react';
import KeyValueEditor from './KeyValueEditor';
import BodyEditor from './BodyEditor';
import AuthEditor from './AuthEditor';
import ScriptEditor from './ScriptEditor';

function RequestEditor({ requestState, setRequestState, onSend, onSave }) {
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
        <button onClick={onSave} className="btn-secondary flex items-center gap-2 px-4 shadow-sm" title="Save to Collection">
          <span>Save</span>
        </button>
        <button onClick={onSend} className="btn-primary flex items-center gap-2 px-6">
          <span>Send</span>
          <Play size={14} fill="currentColor" />
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
