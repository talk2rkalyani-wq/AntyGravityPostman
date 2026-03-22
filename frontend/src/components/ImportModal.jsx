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

            requests.push({
               name: parsedName,
               method, url, headers, bodyType, bodyRaw, bodyFormData, bodyUrlEncoded, params,
               bodyGraphQLQuery: '', bodyGraphQLVariables: '', authType: 'No Auth', authData: {}, activeTab: 'Params'
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
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl flex flex-col pt-4 overflow-hidden" 
           style={{ minHeight: '500px' }}>
        
        {step === 1 ? (
          <>
            {/* Header */}
            <div className="flex justify-between items-center px-6 pb-4 border-b border-gray-200">
               <h2 className="text-xl font-bold text-gray-800 tracking-tight">Import your API or Connect Your Local Repo</h2>
               <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                 <X size={20} />
               </button>
            </div>

            {/* Input Area */}
            <div className="px-6 py-4">
               <input 
                 type="text"
                 autoFocus
                 placeholder="Paste cURL, gRPCurl, Raw text or URL..."
                 className="w-full border-2 border-orange-500 rounded px-4 py-3 text-sm outline-none text-gray-700 shadow-[0_0_0_4px_rgba(249,115,22,0.1)] focus:shadow-[0_0_0_4px_rgba(249,115,22,0.2)] transition-shadow placeholder-gray-400"
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
               
               <div className={`h-full border-2 border-dashed ${isDragging ? 'border-orange-500 bg-orange-50' : 'border-gray-300 bg-gray-50/50 hover:bg-gray-50'} rounded-lg flex flex-col items-center justify-center transition-colors cursor-pointer`}
                    onClick={() => fileInputRef.current?.click()}
               >
                  <UploadCloud size={48} className={`${isDragging ? 'text-orange-500' : 'text-gray-400'} mb-4 stroke-1`} />
                  <div className="text-lg font-semibold text-gray-700">{isDragging ? 'Drop folders or files here...' : 'Drop anywhere to import'}</div>
                  <div className="text-sm text-gray-500 mt-1" onClick={(e) => e.stopPropagation()}>
                     Or select <span className="text-orange-500 font-medium hover:underline cursor-pointer" onClick={() => fileInputRef.current?.click()}>files</span> or <span className="text-orange-500 font-medium hover:underline cursor-pointer" onClick={() => folderInputRef.current?.click()}>folders</span>
                  </div>
               </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex items-center justify-between text-xs font-semibold text-gray-600">
               <div className="flex items-center gap-6">
                  <button className="flex items-center gap-1 hover:text-gray-900 transition-colors">
                     <div className="w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center text-[10px]">P</div>
                     Migrate to Postman <ChevronDown size={14} className="text-gray-400 ml-1" />
                  </button>
                  <div className="text-gray-300">|</div>
                  <button className="flex items-center gap-1 hover:text-gray-900 transition-colors">
                     <Github size={14} /> Other Sources <ChevronDown size={14} className="text-gray-400 ml-1" />
                  </button>
               </div>
               
               <div className="flex items-center gap-4">
                 <a href="#" className="flex items-center gap-1 text-gray-500 hover:text-gray-800 transition-colors bg-white px-2 py-1 rounded border border-gray-200 shadow-sm">
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
                    className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-4 py-1.5 rounded transition-colors text-sm font-medium shadow-sm"
                 >
                    Continue
                 </button>
               </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col h-full bg-white flex-1">
             {/* Step 2 Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 shrink-0">
               <h2 className="text-xl font-bold text-gray-800 tracking-tight">Import cURL into a collection</h2>
               <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                 <X size={20} />
               </button>
            </div>
            
            <div className="px-6 py-4 flex flex-col gap-5 flex-1 overflow-y-auto">
              {/* Highlighted text area */}
              <div className="bg-gray-50 border border-gray-200 rounded p-4 text-sm font-mono text-blue-600 overflow-x-auto whitespace-pre-wrap break-all" style={{ maxHeight: '150px' }}>
                {inputText}
              </div>

              {/* Request name */}
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Request name</label>
                <input 
                  type="text"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-gray-800"
                  value={requestName}
                  onChange={(e) => setRequestName(e.target.value)}
                  placeholder="Enter request name"
                />
              </div>

              {/* Collection name */}
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1 flex items-center gap-1">
                  Collection name <span className="text-gray-400 border border-gray-400 rounded-full w-4 h-4 flex items-center justify-center text-[10px] cursor-help" title="Select a collection to import into">i</span>
                </label>
                <div className="relative">
                  <select 
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 appearance-none bg-white text-gray-800"
                    value={selectedCollection}
                    onChange={(e) => setSelectedCollection(e.target.value)}
                  >
                    {!collections.length && <option value="">No collections available. A default will be created.</option>}
                    {collections.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                </div>
              </div>
            </div>

            {/* Step 2 Footer */}
            <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3 bg-white shrink-0">
              <button 
                onClick={handleImportWithoutSaving}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded transition-colors"
              >
                Import Without Saving
              </button>
              <button 
                onClick={handleImportIntoCollection}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded shadow-sm transition-colors"
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
