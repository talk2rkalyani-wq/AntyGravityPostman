import React from 'react';
import KeyValueEditor from './KeyValueEditor';

const bodyTypes = ['none', 'form-data', 'x-www-form-urlencoded', 'raw', 'binary', 'GraphQL'];

function BodyEditor({ requestState, setRequestState }) {
  const { bodyType, bodyRaw, bodyFormData, bodyUrlEncoded, bodyGraphQLQuery, bodyGraphQLVariables } = requestState;

  const handleTypeChange = (type) => {
    setRequestState({ ...requestState, bodyType: type });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-5 mb-4 text-xs font-semibold text-[var(--text-secondary)] border-b border-transparent pb-2 flex-wrap px-2">
        {bodyTypes.map(type => (
          <label key={type} className="flex items-center gap-1.5 cursor-pointer hover:text-[var(--text-primary)] transition-colors">
            <input 
              type="radio" 
              name="bodyType"
              value={type}
              checked={bodyType === type}
              onChange={() => handleTypeChange(type)}
              className="accent-[#06B6D4] cursor-pointer w-3.5 h-3.5"
            />
            {type}
          </label>
        ))}
        {bodyType === 'raw' && (
          <select className="ml-auto text-xs bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded px-2 py-1 outline-none text-[var(--text-primary)] cursor-pointer">
            <option value="JSON">JSON</option>
            <option value="Text">Text</option>
            <option value="JavaScript">JavaScript</option>
            <option value="HTML">HTML</option>
            <option value="XML">XML</option>
          </select>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {bodyType === 'none' && (
          <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] text-sm mt-10">
            <div className="text-4xl text-[var(--border-color)] mb-4">-</div>
            This request does not have a body
          </div>
        )}

        {bodyType === 'form-data' && (
          <KeyValueEditor 
            items={bodyFormData} 
            onChange={(newList) => setRequestState({...requestState, bodyFormData: newList})} 
          />
        )}

        {bodyType === 'x-www-form-urlencoded' && (
          <KeyValueEditor 
            items={bodyUrlEncoded} 
            onChange={(newList) => setRequestState({...requestState, bodyUrlEncoded: newList})} 
          />
        )}

        {bodyType === 'raw' && (
          <textarea 
            value={bodyRaw}
            onChange={(e) => setRequestState({...requestState, bodyRaw: e.target.value})}
            className="w-full h-full min-h-[200px] resize-none font-mono text-sm leading-relaxed p-3 bg-transparent border border-[var(--border-color)] rounded outline-none focus:border-[#06B6D4] transition-colors text-[var(--text-primary)]"
            spellCheck="false"
          />
        )}

        {bodyType === 'binary' && (
           <div className="flex flex-col items-center justify-center h-[200px] text-[var(--text-muted)] text-sm gap-3 border border-dashed border-[var(--border-color)] rounded bg-[var(--bg-tertiary)] bg-opacity-50">
             <span>Select a file to send as binary body</span>
             <button className="btn-secondary px-4 py-1.5 text-xs font-medium border border-[var(--border-color)] rounded hover:bg-[var(--bg-primary)] transition-colors">Select File</button>
           </div>
        )}

        {bodyType === 'GraphQL' && (
          <div className="flex h-[300px] border border-[var(--border-color)] rounded overflow-hidden">
            <div className="flex-1 flex flex-col border-r border-[var(--border-color)] bg-[var(--bg-primary)]">
              <div className="bg-[var(--bg-secondary)] px-3 py-2 text-xs font-bold tracking-wide text-[var(--text-secondary)] border-b border-[var(--border-color)]">Query</div>
              <textarea 
                value={bodyGraphQLQuery}
                onChange={(e) => setRequestState({...requestState, bodyGraphQLQuery: e.target.value})}
                className="flex-1 bg-transparent w-full resize-none font-mono text-xs p-3 outline-none text-[var(--text-primary)] leading-loose"
                spellCheck="false"
              />
            </div>
            <div className="w-1/3 flex flex-col bg-[var(--bg-primary)]">
              <div className="bg-[var(--bg-secondary)] px-3 py-2 text-xs font-bold tracking-wide text-[var(--text-secondary)] border-b border-[var(--border-color)]">GraphQL Variables</div>
              <textarea 
                value={bodyGraphQLVariables}
                onChange={(e) => setRequestState({...requestState, bodyGraphQLVariables: e.target.value})}
                className="flex-1 bg-transparent w-full resize-none font-mono text-xs p-3 outline-none text-[var(--text-primary)] leading-loose"
                spellCheck="false"
                placeholder="{}"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BodyEditor;
