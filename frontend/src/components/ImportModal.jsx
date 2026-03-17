import React, { useState } from 'react';
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
          headers.push({ key: parts[0].trim(), value: parts.slice(1).join(':').trim(), enabled: true });
      }
  }
  
  // Basic data extraction (-d "data" or --data "data" or --data-raw "data")
  // Using a simplistic regex that captures everything until the next quote.
  // This might fail on complex nested quotes, but serves the MVP purpose.
  const dataMatch = curlCommand.match(/(?:-d|--data|--data-raw)\s+'([^']*)'/i) || 
                    curlCommand.match(/(?:-d|--data|--data-raw)\s+"([^"]*)"/i);
  if (dataMatch) {
      bodyData = dataMatch[1];
      if (!methodMatch && method === 'GET') method = 'POST'; // curl defaults to post if -d is present
  }
  
  if (headers.length === 0) headers.push({ key: '', value: '', enabled: true });
  
  return {
      method: method || 'GET',
      url: url || '',
      headers: headers,
      params: [{ key: '', value: '', enabled: true }], // query params are left to the URL string
      bodyType: bodyData ? 'raw' : 'none',
      bodyData: bodyData
  };
}

function ImportModal({ onClose, onImportRequest }) {
  const [inputText, setInputText] = useState('');

  const handleTextPaste = (e) => {
    const val = e.target.value;
    setInputText(val);
    
    // Auto-detect cURL
    if (val.trim().toLowerCase().startsWith('curl')) {
      const requestState = parseCurl(val);
      onImportRequest(requestState);
      onClose();
    } else if (val.trim().toLowerCase().startsWith('http')) {
      // Just a URL
      onImportRequest({
        method: 'GET',
        url: val.trim(),
        headers: [{ key: '', value: '', enabled: true }],
        params: [{ key: '', value: '', enabled: true }],
        bodyType: 'none',
        bodyData: ''
      });
      onClose();
    }
  };

  return (
    <div className="absolute inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl flex flex-col pt-4 overflow-hidden" 
           style={{ minHeight: '500px' }}>
        
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
        <div className="flex-1 px-6 pb-6">
           <div className="h-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer">
              <UploadCloud size={48} className="text-gray-400 mb-4 stroke-1" />
              <div className="text-lg font-semibold text-gray-700">Drop anywhere to import</div>
              <div className="text-sm text-gray-500 mt-1">
                 Or select <span className="text-orange-500 font-medium hover:underline">files</span> or <span className="text-orange-500 font-medium hover:underline">folders</span>
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
           
           <a href="#" className="flex items-center gap-1 text-gray-500 hover:text-gray-800 transition-colors bg-white px-2 py-1 rounded border border-gray-200 shadow-sm">
              Learn more about importing data <ExternalLink size={12} />
           </a>
        </div>
      </div>
    </div>
  );
}

export default ImportModal;
