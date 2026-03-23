import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import Sidebar from './components/Sidebar';
import RequestEditor from './components/RequestEditor';
import ResponseViewer from './components/ResponseViewer';
import AccountManager from './components/AccountManager';
import Header from './components/Header';
import ImportModal from './components/ImportModal';
import NewFeatureModal from './components/NewFeatureModal';
import Login from './components/Login';
import Signup from './components/Signup';
import ForgotPassword from './components/ForgotPassword';
import './index.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [authMode, setAuthMode] = useState('login');
  const [activeNavTab, setActiveNavTab] = useState('Collections');
  const [showAccount, setShowAccount] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const handleLoginSuccess = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
    } catch(e) {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setAuthMode('login');
    handleNewRequest();
    setResponseState(null);
  };
  
  const createNewTab = () => ({
    id: window.crypto.randomUUID(),
    name: 'Untitled Request',
    method: 'GET',
    url: '',
    activeTab: 'Params',
    params: [{ key: '', value: '', description: '', active: true }],
    headers: [{ key: '', value: '', description: '', active: true }],
    bodyType: 'none',
    bodyRaw: '',
    bodyFormData: [{ key: '', value: '', description: '', active: true }],
    bodyUrlEncoded: [{ key: '', value: '', description: '', active: true }],
    bodyGraphQLQuery: '',
    bodyGraphQLVariables: '',
    preRequestScript: '',
    postResponseScript: '',
    authType: 'No Auth',
    authData: {}
  });

  const [tabs, setTabs] = useState([createNewTab()]);
  const [activeTabId, setActiveTabId] = useState(tabs[0].id);
  const [showNewFeatureModal, setShowNewFeatureModal] = useState(false);
  
  const [topPaneHeight, setTopPaneHeight] = useState('50%');
  const [isDraggingDivider, setIsDraggingDivider] = useState(false);

  const handleGoHome = () => {
    window.location.reload();
  };

  const startDividerDrag = (e) => {
    e.preventDefault();
    setIsDraggingDivider(true);
    
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (moveEvent) => {
       const newPercentage = (moveEvent.clientY / window.innerHeight) * 100;
       if (newPercentage > 20 && newPercentage < 80) {
          setTopPaneHeight(`${newPercentage}%`);
       }
    };

    const handleMouseUp = () => {
       setIsDraggingDivider(false);
       document.body.style.cursor = '';
       document.body.style.userSelect = '';
       document.removeEventListener('mousemove', handleMouseMove);
       document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const activeRequest = tabs.find(t => t.id === activeTabId) || tabs[0];

  const updateActiveRequest = (newState) => {
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, ...newState } : t));
  };

  const [responseState, setResponseState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);

  const executeRequest = async () => {
    setLoading(true);
    setResponseState(null);

    try {
      // Build URL with params if they exist and are active
      let finalUrl = activeRequest.url;
      try {
        const urlObj = new URL(finalUrl.startsWith('http') ? finalUrl : `http://${finalUrl}`);
        activeRequest.params.forEach(p => {
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
      activeRequest.headers.forEach(h => {
        if (h.active && h.key) {
           compiledHeaders[h.key] = h.value;
        }
      });
      
      // Auth logic
      if (activeRequest.authType === 'Bearer Token' && activeRequest.authData.bearerToken) {
         compiledHeaders['Authorization'] = `Bearer ${activeRequest.authData.bearerToken}`;
      } else if (activeRequest.authType === 'Basic Auth' && (activeRequest.authData.basicUsername || activeRequest.authData.basicPassword)) {
         const encoded = btoa(`${activeRequest.authData.basicUsername || ''}:${activeRequest.authData.basicPassword || ''}`);
         compiledHeaders['Authorization'] = `Basic ${encoded}`;
      } else if (activeRequest.authType === 'API Key' && activeRequest.authData.apiKeyKey && activeRequest.authData.apiKeyValue) {
         if (activeRequest.authData.apiKeyAddTo === 'Header') {
            compiledHeaders[activeRequest.authData.apiKeyKey] = activeRequest.authData.apiKeyValue;
         } else if (activeRequest.authData.apiKeyAddTo === 'Query Params') {
            const urlObj = new URL(finalUrl);
            urlObj.searchParams.append(activeRequest.authData.apiKeyKey, activeRequest.authData.apiKeyValue);
            finalUrl = urlObj.toString();
         }
      }

      // Body logic
      let finalData = undefined;
      if (activeRequest.method !== 'GET' && activeRequest.method !== 'HEAD') {
         if (activeRequest.bodyType === 'raw') {
            finalData = activeRequest.bodyRaw;
            if (!Object.keys(compiledHeaders).some(k => k.toLowerCase() === 'content-type') && finalData) {
                try {
                   JSON.parse(finalData);
                   compiledHeaders['Content-Type'] = 'application/json';
                // eslint-disable-next-line no-unused-vars
                } catch(e) { /* non-json raw */ }
            }
         } else if (activeRequest.bodyType === 'x-www-form-urlencoded') {
            const params = new URLSearchParams();
            activeRequest.bodyUrlEncoded.forEach(item => {
               if (item.active && item.key) params.append(item.key, item.value);
            });
            finalData = params.toString();
            compiledHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
         } else if (activeRequest.bodyType === 'form-data') {
            const fdObj = {};
            activeRequest.bodyFormData.forEach(item => {
               if (item.active && item.key) fdObj[item.key] = item.value;
            });
            finalData = fdObj;
            compiledHeaders['Content-Type'] = 'multipart/form-data'; 
         } else if (activeRequest.bodyType === 'GraphQL') {
            finalData = {
               query: activeRequest.bodyGraphQLQuery,
               variables: activeRequest.bodyGraphQLVariables ? JSON.parse(activeRequest.bodyGraphQLVariables) : {}
            };
            compiledHeaders['Content-Type'] = 'application/json';
         }
      }

      const proxyPayload = {
        url: finalUrl,
        method: activeRequest.method,
        headers: compiledHeaders,
        data: finalData
      };

      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
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
     const reqName = prompt("Enter Request Name:", activeRequest.name || "My Request");
     if (!reqName) return;
     const colName = prompt("Enter Collection Name (or create new):", "My Collection");
     if (!colName) return;

     const dataToSave = {
        ...activeRequest,
        name: reqName,
        params: activeRequest.params.filter(p => p.key || p.value),
        headers: activeRequest.headers.filter(h => h.key || h.value),
        bodyFormData: activeRequest.bodyFormData.filter(p => p.key || p.value),
        bodyUrlEncoded: activeRequest.bodyUrlEncoded.filter(p => p.key || p.value)
     };

     try {
        const colRes = await fetch('/api/collections', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const collections = await colRes.json();
        const existing = collections.find(c => c.name === colName);

        if (existing) {
           const existingData = typeof existing.data === 'string' ? JSON.parse(existing.data) : existing.data;
           if (!existingData.requests) existingData.requests = [];
           existingData.requests.push(dataToSave);
           
           await fetch(`/api/collections/${existing.id}`, {
              method: 'PUT',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({ data: existingData })
           });
        } else {
           const newData = { requests: [dataToSave] };
           await fetch('/api/collections', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
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

   const handleImportCompleteCollection = async (colName, requestsArray) => {
     try {
        const colRes = await fetch('/api/collections', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const collections = await colRes.json();
        const existing = collections.find(c => c.name === colName);

        const dataToSave = { requests: requestsArray };

        if (existing) {
           const existingData = typeof existing.data === 'string' ? JSON.parse(existing.data) : existing.data;
           if (!existingData.requests) existingData.requests = [];
           existingData.requests.push(...requestsArray);
           
           await fetch(`/api/collections/${existing.id}`, {
              method: 'PUT',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({ data: existingData })
           });
        } else {
           await fetch('/api/collections', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({ name: colName, data: dataToSave })
           });
        }
        
        setActiveNavTab('Collections');
        setHistoryRefreshTrigger(prev => prev + 1);
     } catch(e) {
        alert('Failed to import complete collection: ' + e.message);
     }
  };

  const handleImportAndSave = async (parsedRequest, reqName, colName) => {
     const dataToSave = {
        ...parsedRequest,
        name: reqName,
        params: parsedRequest.params.filter(p => p.key || p.value),
        headers: parsedRequest.headers.filter(h => h.key || h.value),
        bodyFormData: parsedRequest.bodyFormData.filter(p => p.key || p.value),
        bodyUrlEncoded: parsedRequest.bodyUrlEncoded.filter(p => p.key || p.value)
     };

     try {
        const colRes = await fetch('/api/collections', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const collections = await colRes.json();
        const existing = collections.find(c => c.name === colName);

        if (existing) {
           const existingData = typeof existing.data === 'string' ? JSON.parse(existing.data) : existing.data;
           if (!existingData.requests) existingData.requests = [];
           existingData.requests.push(dataToSave);
           
           await fetch(`/api/collections/${existing.id}`, {
              method: 'PUT',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({ data: existingData })
           });
        } else {
           const newData = { requests: [dataToSave] };
           await fetch('/api/collections', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({ name: colName, data: newData })
           });
        }
        
        // We do not setRequestState directly here.
        // If they imported from modal, they might want a new tab?
        // But ImportModal pushes directly to new RequestState currently.
        const newTab = { ...createNewTab(), ...parsedRequest };
        setTabs(prev => [...prev, newTab]);
        setActiveTabId(newTab.id);
        
        setResponseState(null);
        setActiveNavTab('Collections');
        setHistoryRefreshTrigger(prev => prev + 1);
     } catch(e) {
        alert('Failed to import and save collection: ' + e.message);
     }
  };

  const handleNewRequest = (type = 'modal') => {
    if (type === 'modal') {
       setShowNewFeatureModal(true);
    } else if (type === 'http') {
       const newTab = createNewTab();
       setTabs(prev => [...prev, newTab]);
       setActiveTabId(newTab.id);
       setShowNewFeatureModal(false);
       setResponseState(null);
    }
  };

  // Render Auth Flow if not logged in
  if (!isAuthenticated) {
    if (authMode === 'login') {
      return <Login onLogin={handleLoginSuccess} onNavigateSignup={() => setAuthMode('signup')} onNavigateForgot={() => setAuthMode('forgot')} />;
    } else if (authMode === 'signup') {
      return <Signup onLogin={handleLoginSuccess} onNavigateLogin={() => setAuthMode('login')} />;
    } else if (authMode === 'forgot') {
      return <ForgotPassword onNavigateLogin={() => setAuthMode('login')} />;
    }
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-[var(--bg-primary)] overflow-hidden">
      <Header onLogout={handleLogout} onGoHome={handleGoHome} />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar 
          activeNavTab={activeNavTab} 
          setActiveNavTab={setActiveNavTab} 
          historyRefreshTrigger={historyRefreshTrigger} 
          openAccount={() => setShowAccount(true)}
          onNewRequest={handleNewRequest}
          onImport={() => setShowImportModal(true)}
          onLoadRequest={(req) => {
             const existingIdx = tabs.findIndex(t => t.url === req.url && t.method === req.method);
             if (existingIdx !== -1) {
                // If already open as a tab, just switch to it
                setActiveTabId(tabs[existingIdx].id);
             } else {
                // Open new tab
                const newTab = {
                   ...createNewTab(),
                   name: req.name || 'Saved Request',
                   method: req.method || 'GET',
                   url: req.url || '',
                   headers: (req.headers && req.headers.length > 0) ? req.headers : [{ key: '', value: '', description: '', active: true }],
                   params: (req.params && req.params.length > 0) ? req.params : [{ key: '', value: '', description: '', active: true }],
                   bodyType: req.bodyType || (req.body ? 'raw' : 'none'),
                   bodyRaw: req.bodyRaw || req.body || '',
                   bodyFormData: (req.bodyFormData && req.bodyFormData.length > 0) ? req.bodyFormData : [{ key: '', value: '', description: '', active: true }],
                   bodyUrlEncoded: (req.bodyUrlEncoded && req.bodyUrlEncoded.length > 0) ? req.bodyUrlEncoded : [{ key: '', value: '', description: '', active: true }],
                   bodyGraphQLQuery: req.bodyGraphQLQuery || '',
                   bodyGraphQLVariables: req.bodyGraphQLVariables || '',
                   authType: req.authType || 'No Auth',
                   authData: req.authData || {},
                };
                setTabs(prev => [...prev, newTab]);
                setActiveTabId(newTab.id);
             }
             setResponseState(null);
          }}
        />
        {showAccount ? (
          <AccountManager onClose={() => setShowAccount(false)} />
        ) : (
          <main className="main-content flex-col w-full bg-white relative">
            
            {/* Top Tab Bar */}
            <div className="flex items-center overflow-x-auto border-b border-[var(--border-color)] bg-[var(--bg-secondary)] hide-scrollbar shrink-0 h-[42px] pt-1">
               {tabs.map((tab) => {
                  let displayUrl = tab.name;
                  if (tab.name === 'Untitled Request' && tab.url) {
                      try { displayUrl = new URL(tab.url.startsWith('http') ? tab.url : `http://${tab.url}`).pathname.split('/').pop() || tab.url; } 
                      catch(e) { displayUrl = tab.url; }
                  }
                  
                  return (
                  <div 
                     key={tab.id}
                     onClick={() => setActiveTabId(tab.id)}
                     className={`flex items-center gap-2 px-3 h-full cursor-pointer min-w-[150px] max-w-[200px] border-t-2 border-r border-[var(--border-color)] rounded-tr-md transition-colors ${activeTabId === tab.id ? 'bg-[var(--bg-primary)] border-t-[#06B6D4]' : 'bg-transparent border-t-transparent hover:bg-[var(--bg-tertiary)]'}`}
                  >
                     <span className="text-[10px] font-bold" style={{ color: `var(--status-${tab.method.toLowerCase()})` }}>{tab.method}</span>
                     <span className={`text-sm truncate flex-1 ${activeTabId === tab.id ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>{displayUrl}</span>
                     <button 
                        className="text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 p-0.5 rounded transition-colors ml-1"
                        onClick={(e) => {
                           e.stopPropagation();
                           const newTabs = tabs.filter(t => t.id !== tab.id);
                           if (newTabs.length === 0) {
                              const newTab = createNewTab();
                              setTabs([newTab]);
                              setActiveTabId(newTab.id);
                           } else {
                              setTabs(newTabs);
                              if (activeTabId === tab.id) setActiveTabId(newTabs[newTabs.length - 1].id);
                           }
                        }}
                     >
                        <X size={12} strokeWidth={3} />
                     </button>
                  </div>
               )})}
               <button 
                  className="p-2 ml-1 text-[var(--text-secondary)] hover:text-[#06B6D4] hover:bg-[var(--bg-tertiary)] rounded transition-colors shrink-0"
                  onClick={() => handleNewRequest('http')}
                  title="Open new tab"
               >
                  <Plus size={16} />
               </button>
            </div>
            <div style={{ flex: `0 0 ${topPaneHeight}` }} className="flex flex-col shrink-0 relative overflow-hidden transition-none">
              <RequestEditor 
                requestState={activeRequest} 
                setRequestState={updateActiveRequest} 
                onSend={executeRequest} 
                onSave={handleSaveToCollection}
              />
            </div>
            
            {/* Drag Divider */}
            <div 
               className={`h-2 !min-h-[8px] bg-[var(--bg-primary)] border-y border-[var(--border-color)] cursor-row-resize flex justify-center items-center z-[100] shrink-0 ${isDraggingDivider ? 'bg-[var(--accent-cyan)] opacity-80 shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'hover:bg-[var(--bg-tertiary)]'} transition-colors`}
               onMouseDown={startDividerDrag}
            >
               <div className={`w-8 h-1 rounded-full ${isDraggingDivider ? 'bg-white' : 'bg-[var(--border-color)]'} transition-colors`}></div>
            </div>

            {/* Bottom Response Viewer */}
            <div className="flex-1 flex flex-col relative overflow-hidden">
              <ResponseViewer 
                response={responseState} 
                loading={loading} 
              />
            </div>
          </main>
        )}
      </div>
      {showNewFeatureModal && (
        <NewFeatureModal 
           onClose={() => setShowNewFeatureModal(false)}
           onSelect={handleNewRequest}
        />
      )}
      {showImportModal && (
        <ImportModal 
          onClose={() => setShowImportModal(false)}
          onImportRequest={(parsedState) => {
            setRequestState(parsedState);
            setResponseState(null);
          }}
          onImportAndSave={handleImportAndSave}
          onImportCompleteCollection={handleImportCompleteCollection}
        />
      )}
    </div>
  );
}

export default App;
