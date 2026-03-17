import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import RequestEditor from './components/RequestEditor';
import ResponseViewer from './components/ResponseViewer';
import AccountManager from './components/AccountManager';
import Header from './components/Header';
import ImportModal from './components/ImportModal';
import './index.css';

function App() {
  const [activeNavTab, setActiveNavTab] = useState('Collections');
  const [showAccount, setShowAccount] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  
  // Main Request State
  const [requestState, setRequestState] = useState({
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/todos/1',
    activeTab: 'Params',
    params: [{ key: '', value: '', description: '', active: true }],
    headers: [{ key: '', value: '', description: '', active: true }],
    body: ''
  });

  const [responseState, setResponseState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);

  const executeRequest = async () => {
    setLoading(true);
    setResponseState(null);

    try {
      // Build URL with params if they exist and are active
      let finalUrl = requestState.url;
      try {
        const urlObj = new URL(finalUrl.startsWith('http') ? finalUrl : `http://${finalUrl}`);
        requestState.params.forEach(p => {
          if (p.active && p.key) {
             urlObj.searchParams.append(p.key, p.value);
          }
        });
        finalUrl = urlObj.toString();
      // eslint-disable-next-line no-unused-vars
      } catch (e) {
        // Ignore invalid URL parsing for now
      }

      // Build Headers object
      const compiledHeaders = {};
      requestState.headers.forEach(h => {
        if (h.active && h.key) {
           compiledHeaders[h.key] = h.value;
        }
      });
      
      // Auto-add Content-Type for JSON body if not present
      if (requestState.body && requestState.method !== 'GET' && requestState.method !== 'HEAD') {
         if (!Object.keys(compiledHeaders).some(k => k.toLowerCase() === 'content-type')) {
            try {
               JSON.parse(requestState.body);
               compiledHeaders['Content-Type'] = 'application/json';
            // eslint-disable-next-line no-unused-vars
            } catch(e) { /* ignore */ }
         }
      }

      const proxyPayload = {
        url: finalUrl,
        method: requestState.method,
        headers: compiledHeaders,
        data: requestState.method !== 'GET' && requestState.method !== 'HEAD' && requestState.body ? 
                 (compiledHeaders['Content-Type'] === 'application/json' ? JSON.parse(requestState.body) : requestState.body) 
                 : undefined
      };

      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proxyPayload)
      });

      const data = await res.json();
      setResponseState(data);

      setHistoryRefreshTrigger(prev => prev + 1);

    } catch (error) {
       setResponseState({
          status: 0,
          statusText: 'Network Error',
          error: error.message || 'Failed to connect to proxy server',
          time: 0,
          size: 0
       });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToCollection = async () => {
     const reqName = prompt("Enter Request Name:", "My Request");
     if (!reqName) return;
     const colName = prompt("Enter Collection Name (or create new):", "My Collection");
     if (!colName) return;

     const dataToSave = {
        name: reqName,
        method: requestState.method,
        url: requestState.url,
        params: requestState.params.filter(p => p.active && p.key),
        headers: requestState.headers.filter(h => h.active && h.key),
        body: requestState.body
     };

     try {
        const colRes = await fetch('/api/collections');
        const collections = await colRes.json();
        const existing = collections.find(c => c.name === colName);

        if (existing) {
           const existingData = typeof existing.data === 'string' ? JSON.parse(existing.data) : existing.data;
           if (!existingData.requests) existingData.requests = [];
           existingData.requests.push(dataToSave);
           
           await fetch(`/api/collections/${existing.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ data: existingData })
           });
        } else {
           const newData = { requests: [dataToSave] };
           await fetch('/api/collections', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: colName, data: newData })
           });
        }
        
        // Switch to collections tab and re-fetch to show new data
        setActiveNavTab('Collections');
        setHistoryRefreshTrigger(prev => prev + 1); // We can reuse this trigger for collections too in Sidebar
        alert(`Saved "${reqName}" to collection "${colName}"`);
     } catch(e) {
        alert('Failed to save collection: ' + e.message);
     }
  };

  const handleNewRequest = () => {
    setRequestState({
      method: 'GET',
      url: '',
      headers: [{ key: '', value: '', enabled: true }],
      params: [{ key: '', value: '', enabled: true }],
      bodyType: 'none',
      bodyData: ''
    });
    setResponseState(null);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[var(--bg-primary)] overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar 
          activeNavTab={activeNavTab} 
          setActiveNavTab={setActiveNavTab} 
          historyRefreshTrigger={historyRefreshTrigger} 
          openAccount={() => setShowAccount(true)}
          onNewRequest={handleNewRequest}
          onImport={() => setShowImportModal(true)}
        />
        {showAccount ? (
          <AccountManager onClose={() => setShowAccount(false)} />
        ) : (
          <main className="main-content flex-col w-full">
            <RequestEditor 
              requestState={requestState} 
              setRequestState={setRequestState} 
              onSend={executeRequest} 
              onSave={handleSaveToCollection}
            />
            <ResponseViewer 
              response={responseState} 
              loading={loading} 
            />
          </main>
        )}
      </div>
      {showImportModal && (
        <ImportModal 
          onClose={() => setShowImportModal(false)}
          onImportRequest={(parsedState) => {
            setRequestState(parsedState);
            setResponseState(null);
          }}
        />
      )}
    </div>
  );
}

export default App;
