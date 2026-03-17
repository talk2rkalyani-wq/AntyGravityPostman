import React, { useState } from 'react';
import { Play, Search } from 'lucide-react';

function RequestEditor({ requestState, setRequestState, onSend, onSave }) {
  const { method, url, activeTab, params, headers, body } = requestState;

  const handleMethodChange = (e) => setRequestState({ ...requestState, method: e.target.value });
  const handleUrlChange = (e) => setRequestState({ ...requestState, url: e.target.value });
  const handleTabChange = (tab) => setRequestState({ ...requestState, activeTab: tab });

  // Generic param/header handlers
  const handleItemChange = (type, index, field, value) => {
    const list = [...requestState[type]];
    list[index][field] = value;
    // Add new empty row if last one is typed in
    if (index === list.length - 1 && value !== '') {
      list.push({ key: '', value: '', description: '', active: true });
    }
    setRequestState({ ...requestState, [type]: list });
  };

  const toggleItemActive = (type, index) => {
    const list = [...requestState[type]];
    list[index].active = !list[index].active;
    setRequestState({ ...requestState, [type]: list });
  };

  const deleteItem = (type, index) => {
    const list = [...requestState[type]];
    if (list.length > 1) {
      list.splice(index, 1);
      setRequestState({ ...requestState, [type]: list });
    }
  };

  const renderKeyValueList = (type) => {
    const list = requestState[type];
    return (
      <>
        <div className="flex text-sm text-[var(--text-secondary)] mb-2 px-2">
          <div className="w-8"></div>
          <div className="flex-1 font-semibold">Key</div>
          <div className="flex-1 font-semibold">Value</div>
          <div className="flex-1 font-semibold">Description</div>
          <div className="w-8"></div>
        </div>
        {list.map((item, index) => (
          <div key={index} className="flex gap-2 mb-2 items-center">
            <div className="w-8 flex justify-center">
              {item.key || item.value ? (
                <input 
                  type="checkbox" 
                  checked={item.active} 
                  onChange={() => toggleItemActive(type, index)}
                  className="w-4 h-4 cursor-pointer accent-[var(--accent-cyan)]"
                />
              ) : null}
            </div>
            <input 
              type="text" 
              placeholder="Key" 
              value={item.key}
              onChange={(e) => handleItemChange(type, index, 'key', e.target.value)}
              className="input-field flex-1 text-sm py-1.5"
            />
            <input 
              type="text" 
              placeholder="Value" 
              value={item.value}
              onChange={(e) => handleItemChange(type, index, 'value', e.target.value)}
              className="input-field flex-1 text-sm py-1.5"
            />
            <input 
              type="text" 
              placeholder="Description" 
              value={item.description}
              onChange={(e) => handleItemChange(type, index, 'description', e.target.value)}
              className="input-field flex-1 text-sm py-1.5"
            />
            <div className="w-8 flex justify-center">
              {(item.key || item.value) && (
                <button 
                  onClick={() => deleteItem(type, index)}
                  className="p-1 text-[var(--text-muted)] hover:text-[var(--status-delete)] transition-colors"
                  title="Delete"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}
      </>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-[40%] border-b border-[var(--border-color)] p-4 pt-2">
      <div className="glass-panel p-2 flex gap-2 mb-4 items-center outline outline-1 outline-transparent focus-within:outline-[var(--accent-cyan)] focus-within:shadow-[var(--shadow-glow)] transition-all">
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
        {['Params', 'Headers', 'Body', 'Auth'].map(tab => (
          <div 
            key={tab}
            className={`tab-item ${activeTab === tab ? 'active' : ''}`}
            onClick={() => handleTabChange(tab)}
          >
            {tab}
            {tab === 'Params' && params.length > 1 && <span className="text-xs ml-1 text-[var(--accent-cyan)]">({params.filter(p=>p.active && p.key).length})</span>}
            {tab === 'Headers' && headers.length > 1 && <span className="text-xs ml-1 text-[var(--accent-cyan)]">({headers.filter(h=>h.active && h.key).length})</span>}
          </div>
        ))}
      </div>

      <div className="flex-1 glass-panel p-4 overflow-y-auto custom-scrollbar">
        {activeTab === 'Params' && renderKeyValueList('params')}
        {activeTab === 'Headers' && renderKeyValueList('headers')}
        {activeTab === 'Body' && (
          <div className="h-full flex flex-col">
            <div className="mb-2 text-sm text-[var(--text-secondary)]">Raw JSON:</div>
            <textarea 
              value={body}
              onChange={(e) => setRequestState({...requestState, body: e.target.value})}
              className="flex-1 input-field w-full resize-none font-mono text-sm leading-relaxed"
              placeholder={"{\n  \"key\": \"value\"\n}"}
              spellCheck="false"
            />
          </div>
        )}
        {activeTab === 'Auth' && (
          <div className="text-sm text-[var(--text-muted)] p-4 text-center mt-10">
            Authentication options (Bearer, Basic, etc.) will be implemented soon.
          </div>
        )}
      </div>
    </div>
  );
}

export default RequestEditor;
