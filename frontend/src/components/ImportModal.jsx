import React, { useState, useEffect } from 'react';
import { X, UploadCloud, ChevronDown, Github, ExternalLink } from 'lucide-react';

function parseCurl(curlCommand) {
  let method = 'GET';
  let url = '';
  let headers = [];
  let bodyData = '';
  
  // Basic URL extraction
  const urlMatch = curlCommand.match(/['"]?(https?:\/\/[^\s'"]+)['"]?/);
  if (urlMatch) url = urlMatch[1];
  
  // Basic method extraction (-X POST or --request POST)
  const methodMatch = curlCommand.match(/(?:-X|--request)\s+['"]?([A-Z]+)['"]?/i);
  if (methodMatch) method = methodMatch[1].toUpperCase();
  
  // Basic header extraction (-H "Key: Value")
  const headerRegex = /(?:-H|--header)\s+['"]([^'"]+)['"]/ig;
  let match;
  while ((match = headerRegex.exec(curlCommand)) !== null) {
      const parts = match[1].split(':');
      if (parts.length >= 2) {
          headers.push({ key: parts[0].trim(), value: parts.slice(1).join(':').trim(), active: true });
      }
  }
  
  // Basic data extraction (-d "data" or --data "data" or --data-raw "data" or --data-urlencode)
  let foundData = false;
  
  if (curlCommand.match(/--data-urlencode/i)) {
      foundData = true;
      // Extract all data-urlencode parts
      const encodeRegex = /--data-urlencode\s+['"]([^'"]+)['"]/ig;
      let m;
      let encodeData = [];
      while ((m = encodeRegex.exec(curlCommand)) !== null) {
          encodeData.push(m[1]);
      }
      bodyData = encodeData.join('&');
  } else {
      const dataMatch = curlCommand.match(/(?:-d|--data|--data-raw)\s+'([^']*)'/i) || 
                        curlCommand.match(/(?:-d|--data|--data-raw)\s+"([^"]*)"/i);
      if (dataMatch) {
          bodyData = dataMatch[1];
          foundData = true;
      }
  }

  if (foundData && !methodMatch && method === 'GET') {
      method = 'POST'; // curl defaults to post if data is present
  }
  
  if (headers.length === 0) headers.push({ key: '', value: '', active: true });
  
  return {
      method: method || 'GET',
      url: url || '',
      headers: headers.map(h => ({ ...h, description: '' })),
      params: [{ key: '', value: '', description: '', active: true }],
      bodyType: bodyData ? 'raw' : 'none',
      bodyRaw: bodyData || '',
      bodyFormData: [{ key: '', value: '', description: '', active: true }],
      bodyUrlEncoded: [{ key: '', value: '', description: '', active: true }],
      bodyGraphQLQuery: '',
      bodyGraphQLVariables: '',
      authType: 'No Auth',
      authData: {},
      activeTab: 'Params'
  };
}

function ImportModal({ onClose, onImportRequest, onImportAndSave, onImportCompleteCollection }) {
  const [step, setStep] = useState(1);
  const [inputText, setInputText] = useState('');
  const [parsedRequest, setParsedRequest] = useState(null);
  
  // Step 2 state
  const [requestName, setRequestName] = useState('');
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState('');

  // File Upload State
  const fileInputRef = React.useRef(null);
  const folderInputRef = React.useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (step === 2) {
      // Fetch collections
      fetch('/api/collections', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      .then(res => res.json())
      .then(data => {
        setCollections(data);
        if (data.length > 0) {
          setSelectedCollection(data[0].name);
        }
      })
      .catch(console.error);
    }
  }, [step]);

  const handleTextPaste = (e) => {
    setInputText(e.target.value);
  };

  const handleImportWithoutSaving = () => {
    onImportRequest(parsedRequest);
    onClose();
  };

  const handleImportIntoCollection = () => {
    if (!requestName.trim()) {
      alert("Please provide Request Name.");
      return;
    }
    onImportAndSave(parsedRequest, requestName, selectedCollection || 'My Collection');
    onClose();
  };

  const extractRequestsFromPostman = (itemArray, parentPath = '') => {
      let requests = [];
      for (const item of itemArray) {
         if (item.request) {
            let method = item.request.method || 'GET';
            let url = item.request.url?.raw || item.request.url || '';
            let parsedName = parentPath ? `${parentPath} / ${item.name}` : item.name;
            
            let headers = [{ key: '', value: '', description: '', active: true }];
            if (item.request.header) {
               headers = item.request.header.map(h => ({
                  key: h.key, value: h.value, description: h.description || '', active: true
               }));
            }
            if (headers.length === 0) headers.push({ key: '', value: '', description: '', active: true });

            let bodyType = 'none';
            let bodyRaw = '';
            let bodyFormData = [{ key: '', value: '', description: '', active: true }];
            let bodyUrlEncoded = [{ key: '', value: '', description: '', active: true }];
            
            if (item.request.body) {
               if (item.request.body.mode === 'raw') {
                  bodyType = 'raw';
                  bodyRaw = item.request.body.raw || '';
               } else if (item.request.body.mode === 'formdata') {
                  bodyType = 'form-data';
                  bodyFormData = item.request.body.formdata.map(f => ({
                     key: f.key, value: f.value, description: f.description || '', active: true
                  }));
               } else if (item.request.body.mode === 'urlencoded') {
                  bodyType = 'x-www-form-urlencoded';
                  bodyUrlEncoded = item.request.body.urlencoded.map(f => ({
                     key: f.key, value: f.value, description: f.description || '', active: true
                  }));
               }
            }
            if (bodyFormData.length === 0) bodyFormData.push({ key: '', value: '', description: '', active: true });
            if (bodyUrlEncoded.length === 0) bodyUrlEncoded.push({ key: '', value: '', description: '', active: true });

            let params = [{ key: '', value: '', description: '', active: true }];
            if (item.request.url?.query) {
               params = item.request.url.query.map(q => ({
                  key: q.key, value: q.value, description: q.description || '', active: true
               }));
            }
            if (params.length === 0) params.push({ key: '', value: '', description: '', active: true });

            let preRequestScript = '';
            let postResponseScript = '';
            if (item.event && Array.isArray(item.event)) {
               item.event.forEach(ev => {
                  if (ev.listen === 'prerequest' && ev.script && Array.isArray(ev.script.exec)) {
                     preRequestScript = ev.script.exec.join('\n');
                  } else if (ev.listen === 'test' && ev.script && Array.isArray(ev.script.exec)) {
                     postResponseScript = ev.script.exec.join('\n');
                  }
               });
            }

            requests.push({
               name: parsedName,
               method, url, headers, bodyType, bodyRaw, bodyFormData, bodyUrlEncoded, params,
               bodyGraphQLQuery: '', bodyGraphQLVariables: '', preRequestScript, postResponseScript, authType: 'No Auth', authData: {}, activeTab: 'Params'
            });
         } else if (item.item) {
            const newPath = parentPath ? `${parentPath} / ${item.name}` : item.name;
            requests = requests.concat(extractRequestsFromPostman(item.item, newPath));
         }
      }
      return requests;
   };

  const processFiles = async (fileList) => {
      let files = Array.from(fileList).filter(f => f.name.endsWith('.json'));
      if (files.length === 0) {
         alert("No JSON files found to import.");
         return;
      }
      for (const file of files) {
         const reader = new FileReader();
         reader.onload = async (e) => {
            try {
               const content = JSON.parse(e.target.result);
               if (content.info && content.item) {
                  const colName = content.info.name || file.name.replace('.json', '');
                  const requests = extractRequestsFromPostman(content.item);
                  if (requests.length > 0) {
                     await onImportCompleteCollection(colName, requests);
                     onClose();
                  } else {
                     alert(`Found empty collection in ${file.name}`);
                  }
               } else if (content.requests && Array.isArray(content.requests)) {
                  await onImportCompleteCollection(file.name.replace('.json', ''), content.requests);
                  onClose();
               } else {
                  alert(`File ${file.name} does not seem to be a valid Postman collection.`);
               }
            } catch (err) {
               alert(`Error parsing ${file.name}: ` + err.message);
            }
         };
         reader.readAsText(file);
      }
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = async (e) => {
     e.preventDefault(); setIsDragging(false);
     if (e.dataTransfer.files?.length > 0) { await processFiles(e.dataTransfer.files); }
  };


  return (
    <div className="absolute inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-[var(--bg-secondary)] rounded-lg shadow-2xl w-full max-w-3xl flex flex-col pt-4 overflow-hidden border border-[var(--border-color)]" 
           style={{ minHeight: '500px' }}>
        
        {step === 1 ? (
          <>
            {/* Header */}
            <div className="flex justify-between items-center px-6 pb-4 border-b border-[var(--border-color)]">
               <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Import your API or Connect Your Local Repo</h2>
               <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                 <X size={20} />
               </button>
            </div>

            {/* Input Area */}
            <div className="px-6 py-4">
               <input 
                 type="text"
                 autoFocus
                 placeholder="Paste cURL, gRPCurl, Raw text or URL..."
                 className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded px-4 py-3 text-sm outline-none text-[var(--text-primary)] focus:border-[var(--accent-cyan)] transition-colors placeholder-[var(--text-muted)]"
                 value={inputText}
                 onChange={handleTextPaste}
               />
            </div>

            {/* Dropzone */}
            <div className="flex-1 px-6 pb-6"
                 onDragOver={handleDragOver}
                 onDragLeave={handleDragLeave}
                 onDrop={handleDrop}
            >
               <input type="file" ref={fileInputRef} className="hidden" multiple accept=".json" onChange={(e) => processFiles(e.target.files)} />
               <input type="file" ref={folderInputRef} className="hidden" webkitdirectory="true" directory="true" onChange={(e) => processFiles(e.target.files)} />
               
               <div className={`h-full border border-dashed ${isDragging ? 'border-[var(--accent-cyan)] bg-[var(--bg-tertiary)]' : 'border-[var(--border-color)] bg-[var(--bg-primary)] hover:bg-[var(--bg-tertiary)]'} rounded-lg flex flex-col items-center justify-center transition-colors cursor-pointer`}
                    onClick={() => fileInputRef.current?.click()}
               >
                  <UploadCloud size={48} className={`${isDragging ? 'text-[var(--accent-cyan)]' : 'text-[var(--text-muted)]'} mb-4 stroke-1`} />
                  <div className="text-lg font-semibold text-[var(--text-primary)]">{isDragging ? 'Drop folders or files here...' : 'Drop anywhere to import'}</div>
                  <div className="text-sm text-[var(--text-secondary)] mt-1" onClick={(e) => e.stopPropagation()}>
                     Or select <span className="text-[var(--accent-cyan)] font-medium hover:underline cursor-pointer" onClick={() => fileInputRef.current?.click()}>files</span> or <span className="text-[var(--accent-cyan)] font-medium hover:underline cursor-pointer" onClick={() => folderInputRef.current?.click()}>folders</span>
                  </div>
               </div>
            </div>

            {/* Footer */}
            <div className="bg-[var(--bg-primary)] border-t border-[var(--border-color)] px-6 py-3 flex items-center justify-between text-xs font-semibold text-[var(--text-muted)]">
               <div className="flex items-center gap-6">
                  <button className="flex items-center gap-1 hover:text-[var(--text-primary)] transition-colors">
                     <div className="w-4 h-4 rounded-full border border-[var(--text-muted)] flex items-center justify-center text-[10px]">P</div>
                     Migrate to Postman <ChevronDown size={14} className="text-[var(--text-muted)] ml-1" />
                  </button>
                  <div className="text-[var(--text-muted)] opacity-50">|</div>
                  <button className="flex items-center gap-1 hover:text-[var(--text-primary)] transition-colors">
                     <Github size={14} /> Other Sources <ChevronDown size={14} className="text-[var(--text-muted)] ml-1" />
                  </button>
               </div>
               
               <div className="flex items-center gap-4">
                 <a href="#" className="flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors bg-[var(--bg-tertiary)] px-2 py-1 rounded border border-transparent hover:border-[var(--border-color)]">
                    Learn more about importing data <ExternalLink size={12} />
                 </a>
                 <button 
                    onClick={() => {
                       const val = inputText.trim();
                       if (val.toLowerCase().startsWith('curl')) {
                          const requestState = parseCurl(val);
                          setParsedRequest(requestState);
                          setRequestName(requestState.url || 'New Request');
                          setStep(2);
                       } else if (val.toLowerCase().startsWith('http')) {
                          const requestState = {
                             method: 'GET',
                             url: val,
                             headers: [{ key: '', value: '', description: '', active: true }],
                             params: [{ key: '', value: '', description: '', active: true }],
                             bodyType: 'none',
                             bodyRaw: '',
                             bodyFormData: [{ key: '', value: '', description: '', active: true }],
                             bodyUrlEncoded: [{ key: '', value: '', description: '', active: true }],
                             bodyGraphQLQuery: '',
                             bodyGraphQLVariables: '',
                             authType: 'No Auth',
                             authData: {},
                             activeTab: 'Params'
                          };
                          setParsedRequest(requestState);
                          setRequestName(val);
                          setStep(2);
                       } else {
                          alert("Unrecognized format. Please paste a valid cURL or URL.");
                       }
                    }}
                    disabled={!inputText.trim()}
                    className="bg-[var(--accent-cyan)] hover:bg-[#0891B2] disabled:opacity-50 text-white px-4 py-1.5 rounded transition-colors text-sm font-medium shadow-sm transition-opacity"
                 >
                    Continue
                 </button>
               </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col h-full bg-[var(--bg-secondary)] flex-1">
             {/* Step 2 Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-[var(--border-color)] shrink-0">
               <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Import cURL into a collection</h2>
               <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                 <X size={20} />
               </button>
            </div>
            
            <div className="px-6 py-4 flex flex-col gap-5 flex-1 overflow-y-auto">
              {/* Highlighted text area */}
              <div className="bg-[var(--bg-primary)] border border-transparent rounded p-4 text-sm font-mono text-[var(--accent-cyan)] overflow-x-auto whitespace-pre-wrap break-all" style={{ maxHeight: '150px' }}>
                {inputText}
              </div>

              {/* Request name */}
              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1">Request name</label>
                <input 
                  type="text"
                  className="w-full bg-[var(--bg-primary)] border border-transparent rounded px-3 py-2 text-sm outline-none focus:border-[var(--accent-cyan)] focus:ring-1 focus:ring-[var(--accent-cyan)] text-[var(--text-primary)]"
                  value={requestName}
                  onChange={(e) => setRequestName(e.target.value)}
                  placeholder="Enter request name"
                />
              </div>

              {/* Collection name */}
              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1 flex items-center gap-1">
                  Collection name <span className="text-[var(--text-muted)] border border-[var(--text-muted)] rounded-full w-4 h-4 flex items-center justify-center text-[10px] cursor-help" title="Select a collection to import into">i</span>
                </label>
                <div className="relative">
                  <select 
                    className="w-full bg-[var(--bg-primary)] border border-transparent rounded px-3 py-2 text-sm outline-none focus:border-[var(--accent-cyan)] focus:ring-1 focus:ring-[var(--accent-cyan)] appearance-none text-[var(--text-primary)] cursor-pointer"
                    value={selectedCollection}
                    onChange={(e) => setSelectedCollection(e.target.value)}
                  >
                    {!collections.length && <option value="">No collections available. A default will be created.</option>}
                    {collections.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" size={16} />
                </div>
              </div>
            </div>

            {/* Step 2 Footer */}
            <div className="border-t border-[var(--border-color)] px-6 py-4 flex items-center justify-end gap-3 bg-[var(--bg-primary)] shrink-0">
              <button 
                onClick={handleImportWithoutSaving}
                className="px-4 py-2 bg-[var(--bg-tertiary)] hover:border-[var(--border-color)] text-[var(--text-primary)] border border-transparent text-sm font-medium rounded transition-colors"
              >
                Import Without Saving
              </button>
              <button 
                onClick={handleImportIntoCollection}
                className="px-4 py-2 bg-[var(--accent-cyan)] hover:bg-[#0891B2] disabled:opacity-50 text-white text-sm font-medium rounded shadow-sm transition-all"
                disabled={!requestName}
              >
                Import Into Collection
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default ImportModal;
