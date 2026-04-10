import React, { useState, useMemo } from 'react';
import { X, Copy, Check } from 'lucide-react';

const generateCurl = (req) => {
   let cmd = `curl --location --request ${req.method} '${req.url || 'http://localhost'}'`;
   
   const activeHeaders = req.headers.filter(h => h.active && h.key);
   activeHeaders.forEach(h => {
      cmd += ` \\\n--header '${h.key}: ${h.value}'`;
   });

   if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (req.bodyType === 'raw' && req.bodyRaw) {
         if (!activeHeaders.some(h => h.key.toLowerCase() === 'content-type')) {
            cmd += ` \\\n--header 'Content-Type: text/plain'`;
         }
         cmd += ` \\\n--data-raw '${req.bodyRaw.replace(/'/g, "'\\''")}'`;
      } else if (req.bodyType === 'GraphQL') {
         cmd += ` \\\n--header 'Content-Type: application/json'`;
         const gqlData = JSON.stringify({ query: req.bodyGraphQLQuery, variables: req.bodyGraphQLVariables ? JSON.parse(req.bodyGraphQLVariables || '{}') : {} });
         cmd += ` \\\n--data-raw '${gqlData.replace(/'/g, "'\\''")}'`;
      }
      // Form data / url encoded omitted for brevity in MVP
   }
   return cmd;
};

const generateFetch = (req) => {
   let code = `const myHeaders = new Headers();\n`;
   const activeHeaders = req.headers.filter(h => h.active && h.key);
   activeHeaders.forEach(h => {
      code += `myHeaders.append("${h.key}", "${h.value}");\n`;
   });

   let raw = "";
   if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (req.bodyType === 'raw' && req.bodyRaw) {
         if (!activeHeaders.some(h => h.key.toLowerCase() === 'content-type')) {
            code += `myHeaders.append("Content-Type", "text/plain");\n`;
         }
         raw = `\nconst raw = JSON.stringify(${JSON.stringify(req.bodyRaw)});\n`;
      }
   }

   code += raw;
   code += `\nconst requestOptions = {\n  method: "${req.method}",\n  headers: myHeaders,\n`;
   if (raw) code += `  body: raw,\n`;
   code += `  redirect: "follow"\n};\n\n`;
   code += `fetch("${req.url || 'http://localhost'}", requestOptions)\n  .then((response) => response.text())\n  .then((result) => console.log(result))\n  .catch((error) => console.error(error));`;
   
   return code;
};

const generatePython = (req) => {
   let code = `import requests\nimport json\n\nurl = "${req.url || 'http://localhost'}"\n\n`;
   
   let payload = "payload = {}\n";
   if (req.method !== 'GET' && req.method !== 'HEAD' && req.bodyType === 'raw' && req.bodyRaw) {
      payload = `payload = json.dumps(${JSON.stringify(req.bodyRaw)})\n`;
   }
   code += payload;

   let headersStr = "headers = {\n";
   const activeHeaders = req.headers.filter(h => h.active && h.key);
   activeHeaders.forEach(h => {
      headersStr += `  '${h.key}': '${h.value}',\n`;
   });
   if (req.bodyType === 'raw' && req.bodyRaw && !activeHeaders.some(h => h.key.toLowerCase() === 'content-type')) {
      headersStr += `  'Content-Type': 'text/plain'\n`;
   }
   headersStr += "}\n\n";
   code += headersStr;

   code += `response = requests.request("${req.method}", url, headers=headers, data=payload)\n\nprint(response.text)`;
   return code;
};

function CodeSnippetModal({ requestState, onClose }) {
  const [lang, setLang] = useState('cURL');
  const [copied, setCopied] = useState(false);

  const snippet = useMemo(() => {
     if (lang === 'cURL') return generateCurl(requestState);
     if (lang === 'JavaScript (Fetch)') return generateFetch(requestState);
     if (lang === 'Python (Requests)') return generatePython(requestState);
     return '';
  }, [lang, requestState]);

  const handleCopy = () => {
     navigator.clipboard.writeText(snippet);
     setCopied(true);
     setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="absolute inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4">
      <div 
        className="bg-[var(--bg-primary)] rounded-lg shadow-2xl w-full max-w-4xl h-[600px] flex overflow-hidden relative border border-[var(--border-color)] fade-in flex-col"
        onClick={(e) => e.stopPropagation()}
      >
         <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] shrink-0">
            <h3 className="font-semibold text-[var(--text-primary)]">Code Snippets</h3>
            <button onClick={onClose} className="p-1 text-[var(--text-muted)] hover:text-red-500 transition-colors">
               <X size={18} />
            </button>
         </div>
         <div className="flex flex-1 overflow-hidden">
            <div className="w-48 border-r border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col pt-2">
               {['cURL', 'JavaScript (Fetch)', 'Python (Requests)'].map(l => (
                  <button 
                     key={l}
                     className={`text-left px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors ${lang === l ? 'bg-[var(--bg-tertiary)] border-l-2 border-[#10B981] font-medium' : 'border-l-2 border-transparent'}`}
                     onClick={() => setLang(l)}
                  >
                     {l}
                  </button>
               ))}
            </div>
            <div className="flex-1 bg-[var(--bg-primary)] relative group flex flex-col">
               <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                     onClick={handleCopy}
                     className="bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded p-1.5 flex items-center justify-center backdrop-blur-sm transition-all shadow-lg border border-[var(--border-color)]"
                  >
                     {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                  </button>
               </div>
               <pre className="p-4 text-[var(--text-primary)] font-mono text-xs overflow-auto h-full whitespace-pre-wrap">
                  <code>{snippet}</code>
               </pre>
            </div>
         </div>
      </div>
    </div>
  );
}

export default CodeSnippetModal;
