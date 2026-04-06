import React, { useState } from 'react';
import { Plus, X, Globe, Hexagon, Zap, Database, MoreHorizontal } from 'lucide-react';
import Logo from './components/Logo';
import Sidebar from './components/Sidebar';
import EmptyWorkspace from './components/EmptyWorkspace';
import RequestEditor from './components/RequestEditor';
import ResponseViewer from './components/ResponseViewer';
import AccountManager from './components/AccountManager';
import Header from './components/Header';
import EnvironmentManager from './components/EnvironmentManager';
import ImportModal from './components/ImportModal';
import NewFeatureModal from './components/NewFeatureModal';
import SaveRequestModal from './components/SaveRequestModal';
import WebSocketEditor from './components/WebSocketEditor';
import CodeSnippetModal from './components/CodeSnippetModal';
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
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showCodeSnippetModal, setShowCodeSnippetModal] = useState(false);
  const [draggedTabId, setDraggedTabId] = useState(null);
  
  const [topPaneHeight, setTopPaneHeight] = useState('50%');
  const [isDraggingDivider, setIsDraggingDivider] = useState(false);

  const [environments, setEnvironments] = useState([]);
  const [activeEnvId, setActiveEnvId] = useState('');
  const [isEnvManagerOpen, setIsEnvManagerOpen] = useState(false);

  // Workspaces implementation
  const [workspaces, setWorkspaces] = useState([{id: 'default', name: 'Personal Workspace'}]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(localStorage.getItem('activeWorkspaceId') || 'default');

  React.useEffect(() => {
     localStorage.setItem('activeWorkspaceId', activeWorkspaceId);
  }, [activeWorkspaceId]);

  const fetchWorkspaces = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await fetch('/api/workspaces', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }});
      const data = await res.json();
      if (data && data.length > 0) setWorkspaces(data);
    } catch(e) {}
  };

  const fetchEnvironments = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await fetch(`/api/environments?workspace=${activeWorkspaceId}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }});
      const data = await res.json();
      setEnvironments(data);
    } catch(e) {}
  };

  React.useEffect(() => {
    if (isAuthenticated) {
       fetchWorkspaces();
       fetchEnvironments();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, activeWorkspaceId]);

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

  const handleDragStart = (e, id) => {
     setDraggedTabId(id);
     e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };

  const handleDrop = (e, dropTabId) => {
     e.preventDefault();
     if (!draggedTabId || draggedTabId === dropTabId) return;
     const fromIndex = tabs.findIndex(t => t.id === draggedTabId);
     const toIndex = tabs.findIndex(t => t.id === dropTabId);
     if (fromIndex !== -1 && toIndex !== -1) {
        const newTabs = [...tabs];
        const [movedTab] = newTabs.splice(fromIndex, 1);
        newTabs.splice(toIndex, 0, movedTab);
        setTabs(newTabs);
     }
     setDraggedTabId(null);
  };

  const [responseState, setResponseState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);
  const [useProxy, setUseProxy] = useState(true);

  const executeRequest = async () => {
    setLoading(true);
    setResponseState(null);

    try {
      const replaceEnvVars = (str, envData) => {
         if (!str || typeof str !== 'string') return str;
         return str.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
            const row = envData.find(e => e.key === key.trim());
            return row ? row.value : match;
         });
      };

      let activeEnvVars = [];
      if (activeEnvId) {
         const env = environments.find(e => e.id === activeEnvId);
         if (env) {
            try { activeEnvVars = typeof env.data === 'string' ? JSON.parse(env.data) : env.data; } catch(e) {}
         }
      }

      let envMutated = false;
      let pm = {
         environment: {
            get: (key) => {
               const row = activeEnvVars.find(e => e.key === key);
               return row ? row.value : undefined;
            },
            set: (key, value) => {
               envMutated = true;
               const row = activeEnvVars.find(e => e.key === key);
               if (row) row.value = String(value);
               else activeEnvVars.push({ key, value: String(value), active: true });
            }
         },
         variables: {
            get: (key) => pm.environment.get(key),
            set: (key, value) => pm.environment.set(key, value)
         },
         request: {
            url: activeRequest.url,
            method: activeRequest.method
         },
         response: null // Populated post-fetch
      };

      const reqClone = JSON.parse(JSON.stringify(activeRequest));

      if (reqClone.preRequestScript) {
         try {
            const runner = new Function('pm', reqClone.preRequestScript);
            runner(pm);
         } catch(e) { console.error("Pre-request script error:", e); }
      }

      // Build URL with params if they exist and are active
      let finalUrl = replaceEnvVars(reqClone.url, activeEnvVars);
      try {
        const urlObj = new URL(finalUrl.startsWith('http') ? finalUrl : `http://${finalUrl}`);
        reqClone.params.forEach(p => {
          if (p.active && p.key) {
             urlObj.searchParams.append(replaceEnvVars(p.key, activeEnvVars), replaceEnvVars(p.value, activeEnvVars));
          }
        });
        finalUrl = urlObj.toString();
      // eslint-disable-next-line no-unused-vars
      } catch (e) {
        // Ignore invalid URL parsing for now
      }

      // Build Headers object
      const compiledHeaders = {};
      reqClone.headers.forEach(h => {
        if (h.active && h.key) {
           compiledHeaders[replaceEnvVars(h.key, activeEnvVars)] = replaceEnvVars(h.value, activeEnvVars);
        }
      });
      
      // Auth logic
      if (reqClone.authType === 'Bearer Token' && reqClone.authData.bearerToken) {
         compiledHeaders['Authorization'] = `Bearer ${replaceEnvVars(reqClone.authData.bearerToken, activeEnvVars)}`;
      } else if (reqClone.authType === 'Basic Auth' && (reqClone.authData.basicUsername || reqClone.authData.basicPassword)) {
         const encoded = btoa(`${replaceEnvVars(reqClone.authData.basicUsername, activeEnvVars) || ''}:${replaceEnvVars(reqClone.authData.basicPassword, activeEnvVars) || ''}`);
         compiledHeaders['Authorization'] = `Basic ${encoded}`;
      } else if (reqClone.authType === 'API Key' && reqClone.authData.apiKeyKey && reqClone.authData.apiKeyValue) {
         const keyResolved = replaceEnvVars(reqClone.authData.apiKeyKey, activeEnvVars);
         const valResolved = replaceEnvVars(reqClone.authData.apiKeyValue, activeEnvVars);
         if (reqClone.authData.apiKeyAddTo === 'Header') {
            compiledHeaders[keyResolved] = valResolved;
         } else if (reqClone.authData.apiKeyAddTo === 'Query Params') {
            const urlObj = new URL(finalUrl);
            urlObj.searchParams.append(keyResolved, valResolved);
            finalUrl = urlObj.toString();
         }
      }

      // Body logic
      let finalData = undefined;
      if (reqClone.method !== 'GET' && reqClone.method !== 'HEAD') {
         if (reqClone.bodyType === 'raw') {
            finalData = replaceEnvVars(reqClone.bodyRaw, activeEnvVars);
            if (!Object.keys(compiledHeaders).some(k => k.toLowerCase() === 'content-type') && finalData) {
                try {
                   JSON.parse(finalData);
                   compiledHeaders['Content-Type'] = 'application/json';
                // eslint-disable-next-line no-unused-vars
                } catch(e) { /* non-json raw */ }
            }
         } else if (reqClone.bodyType === 'x-www-form-urlencoded') {
            const params = new URLSearchParams();
            reqClone.bodyUrlEncoded.forEach(item => {
               if (item.active && item.key) params.append(replaceEnvVars(item.key, activeEnvVars), replaceEnvVars(item.value, activeEnvVars));
            });
            finalData = params.toString();
            compiledHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
         } else if (reqClone.bodyType === 'form-data') {
            const fdObj = {};
            reqClone.bodyFormData.forEach(item => {
               if (item.active && item.key) fdObj[replaceEnvVars(item.key, activeEnvVars)] = replaceEnvVars(item.value, activeEnvVars);
            });
            finalData = fdObj;
            compiledHeaders['Content-Type'] = 'multipart/form-data'; 
         } else if (reqClone.bodyType === 'GraphQL') {
            finalData = {
               query: replaceEnvVars(reqClone.bodyGraphQLQuery, activeEnvVars),
               variables: reqClone.bodyGraphQLVariables ? JSON.parse(replaceEnvVars(reqClone.bodyGraphQLVariables, activeEnvVars)) : {}
            };
            compiledHeaders['Content-Type'] = 'application/json';
         }
      }

      const proxyPayload = {
        url: finalUrl,
        method: reqClone.method,
        headers: compiledHeaders,
        data: finalData
      };

      let responseWrapper = {};

      if (useProxy) {
          const res = await fetch('/api/proxy', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(proxyPayload)
          });
          responseWrapper = await res.json();
      } else {
          // Send Directly from Browser
          const fetchOptions = {
              method: reqClone.method,
              headers: compiledHeaders
          };
          // Body payload injection
          if (finalData && reqClone.method !== 'GET' && reqClone.method !== 'HEAD') {
             fetchOptions.body = typeof finalData === 'string' ? finalData : JSON.stringify(finalData);
          }
          
          const startTime = performance.now();
          const res = await fetch(finalUrl, fetchOptions);
          const endTime = performance.now();
          
          let responseData = await res.text();
          try { responseData = JSON.parse(responseData); } catch(e) {}
          
          const headersObj = {};
          res.headers.forEach((v, k) => headersObj[k] = v);

          responseWrapper = {
             status: res.status,
             statusText: res.statusText,
             data: responseData,
             headers: headersObj,
             time: Math.round(endTime - startTime),
             size: new Blob([typeof responseData === 'string' ? responseData : JSON.stringify(responseData)]).size
          };
      }

      setResponseState(responseWrapper);

      pm.response = {
         json: () => responseWrapper.data,
         text: () => typeof responseWrapper.data === 'string' ? responseWrapper.data : JSON.stringify(responseWrapper.data),
         code: responseWrapper.status
      };

      if (reqClone.postResponseScript) {
         try {
            const runner = new Function('pm', reqClone.postResponseScript);
            runner(pm);
         } catch(e) { console.error("Post-response script error:", e); }
      }

      if (envMutated && activeEnvId) {
         const env = environments.find(e => e.id === activeEnvId);
         if (env) {
            fetch(`/api/environments/${activeEnvId}`, {
               method: 'PUT',
               headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
               body: JSON.stringify({ name: env.name, data: activeEnvVars })
            }).then(() => fetchEnvironments());
         }
      }

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

   const insertIntoFolder = (items, folderId, dataToInsert) => {
      for (let item of items) {
          if (item.id === folderId && item.type === 'folder') {
              if (!item.items) item.items = [];
              if (Array.isArray(dataToInsert)) {
                 item.items.push(...dataToInsert);
              } else {
                 item.items.push(dataToInsert);
              }
              return true;
          }
          if (item.type === 'folder' && item.items) {
              if (insertIntoFolder(item.items, folderId, dataToInsert)) return true;
          }
      }
      return false;
   };

   const normalizeCollectionData = (data) => {
      let parsed = data;
      if (typeof parsed === 'string') {
         try { parsed = JSON.parse(parsed); } catch(e) { parsed = {}; }
      }
      let items = parsed.items || [];
      if (parsed.requests && parsed.requests.length > 0 && items.length === 0) {
          items = parsed.requests.map(req => ({
              ...req,
              type: 'request',
              id: req.id || window.crypto.randomUUID()
          }));
      }
      return items;
   };

   const handleSaveToCollectionModal = async (payload) => {
     const { requestName, collectionName, targetCollection, targetFolderId } = payload;
     const colName = collectionName || targetCollection?.name;

     const dataToSave = {
        ...activeRequest,
        type: 'request',
        id: activeRequest.id || window.crypto.randomUUID(),
        name: requestName,
        params: activeRequest.params.filter(p => p.key || p.value),
        headers: activeRequest.headers.filter(h => h.key || h.value),
        bodyFormData: activeRequest.bodyFormData.filter(p => p.key || p.value),
        bodyUrlEncoded: activeRequest.bodyUrlEncoded.filter(p => p.key || p.value)
     };

     try {
        const colRes = await fetch(`/api/collections?workspace=${activeWorkspaceId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const collections = await colRes.json();
        const existing = targetCollection || collections.find(c => c.name === colName);

        if (existing) {
           let items = normalizeCollectionData(existing.data);
           
           if (targetFolderId) {
               insertIntoFolder(items, targetFolderId, dataToSave);
           } else {
               items.push(dataToSave);
           }
           
           await fetch(`/api/collections/${existing.id}`, {
              method: 'PUT',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({ data: { items, requests: [] } })
           });
        } else {
           const newData = { items: [dataToSave] };
           await fetch('/api/collections', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({ name: colName, data: newData, workspace_id: activeWorkspaceId })
           });
        }
        
        setActiveNavTab('Collections');
        setHistoryRefreshTrigger(prev => prev + 1);
        setShowSaveModal(false);
     } catch(e) {
        alert('Failed to save collection: ' + e.message);
     }
   };

   const handleSaveToCollection = () => {
      setShowSaveModal(true);
   };

   const handleImportCompleteCollection = async (colName, requestsArray) => {
     try {
        const mappedRequests = requestsArray.map(req => ({
             ...req,
             type: 'request',
             id: window.crypto.randomUUID()
        }));

        const colRes = await fetch(`/api/collections?workspace=${activeWorkspaceId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const collections = await colRes.json();
        const existing = collections.find(c => c.name === colName);

        if (existing) {
           let items = normalizeCollectionData(existing.data);
           items.push(...mappedRequests);
           
           await fetch(`/api/collections/${existing.id}`, {
              method: 'PUT',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({ data: { items, requests: [] } })
           });
        } else {
           await fetch('/api/collections', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({ name: colName, data: { items: mappedRequests }, workspace_id: activeWorkspaceId })
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
        type: 'request',
        id: window.crypto.randomUUID(),
        name: reqName,
        params: parsedRequest.params.filter(p => p.key || p.value),
        headers: parsedRequest.headers.filter(h => h.key || h.value),
        bodyFormData: parsedRequest.bodyFormData.filter(p => p.key || p.value),
        bodyUrlEncoded: parsedRequest.bodyUrlEncoded.filter(p => p.key || p.value)
     };

     try {
        const colRes = await fetch(`/api/collections?workspace=${activeWorkspaceId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const collections = await colRes.json();
        const existing = collections.find(c => c.name === colName);

        if (existing) {
           let items = normalizeCollectionData(existing.data);
           items.push(dataToSave);
           
           await fetch(`/api/collections/${existing.id}`, {
              method: 'PUT',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({ data: { items, requests: [] } })
           });
        } else {
           const newData = { items: [dataToSave] };
           await fetch('/api/collections', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({ name: colName, data: newData, workspace_id: activeWorkspaceId })
           });
        }
        
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
    } else if (type === 'collection') {
       setShowNewFeatureModal(false);
       setShowSaveModal(true);
    } else if (type === 'websocket') {
       const newTab = { ...createNewTab(), method: 'WS', url: 'wss://echo.websocket.org' };
       setTabs(prev => [...prev, newTab]);
       setActiveTabId(newTab.id);
       setShowNewFeatureModal(false);
       setResponseState(null);
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
      <Header 
         onLogout={handleLogout} 
         onGoHome={handleGoHome} 
         environments={environments}
         activeEnvId={activeEnvId}
         setActiveEnvId={setActiveEnvId}
         openEnvManager={() => setIsEnvManagerOpen(true)}
      />
      {isEnvManagerOpen && (
         <EnvironmentManager 
            onClose={() => setIsEnvManagerOpen(false)}
            environments={environments}
            fetchEnvironments={fetchEnvironments}
         />
      )}
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar 
          activeNavTab={activeNavTab} 
          setActiveNavTab={setActiveNavTab} 
          historyRefreshTrigger={historyRefreshTrigger} 
          openAccount={() => setShowAccount(true)}
          onNewRequest={handleNewRequest}
          onImport={() => setShowImportModal(true)}
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspaceId}
          setActiveWorkspaceId={setActiveWorkspaceId}
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
                   preRequestScript: req.preRequestScript || '',
                   postResponseScript: req.postResponseScript || '',
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
               <button 
                  className="p-2 mr-2 ml-2 text-[var(--accent-cyan)] hover:text-white hover:bg-[var(--accent-cyan)] rounded transition-colors shrink-0"
                  onClick={() => handleNewRequest('http')}
                  title="Open new tab"
               >
                  <Plus size={16} />
               </button>
               {tabs.map((tab) => {
                  let displayUrl = tab.name;
                  if (tab.name === 'Untitled Request' && tab.url) {
                      try { displayUrl = new URL(tab.url.startsWith('http') ? tab.url : `http://${tab.url}`).pathname.split('/').pop() || tab.url; } 
                      catch(e) { displayUrl = tab.url; }
                  }
                  
                  return (
                  <div 
                     key={tab.id}
                     draggable
                     onDragStart={(e) => handleDragStart(e, tab.id)}
                     onDragOver={handleDragOver}
                     onDrop={(e) => handleDrop(e, tab.id)}
                     onDragEnd={() => setDraggedTabId(null)}
                     onClick={() => setActiveTabId(tab.id)}
                     className={`flex items-center gap-2 px-3 h-full cursor-pointer min-w-[150px] max-w-[200px] border-t-2 border-r border-[var(--border-color)] rounded-tr-md transition-colors ${activeTabId === tab.id ? 'bg-[var(--bg-primary)] border-t-[#06B6D4]' : 'bg-transparent border-t-transparent hover:bg-[var(--bg-tertiary)]'} ${draggedTabId === tab.id ? 'opacity-50' : ''}`}
                  >
                     <span className="text-[10px] font-bold" style={{ color: `var(--status-${tab.method.toLowerCase()})` }}>{tab.method}</span>
                     <span className={`text-sm truncate flex-1 ${activeTabId === tab.id ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>{displayUrl}</span>
                     <button 
                        className="text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 p-0.5 rounded transition-colors ml-1"
                        onClick={(e) => {
                           e.stopPropagation();
                           const newTabs = tabs.filter(t => t.id !== tab.id);
                           setTabs(newTabs);
                           if (newTabs.length > 0) {
                              if (activeTabId === tab.id) setActiveTabId(newTabs[newTabs.length - 1].id);
                           } else {
                              setActiveTabId(null);
                           }
                        }}
                     >
                        <X size={12} strokeWidth={3} />
                     </button>
                  </div>
               )})}
            </div>

            {tabs.length === 0 ? (
               <EmptyWorkspace onNewRequest={handleNewRequest} />
            ) : (
               <>
             {activeRequest.method === 'WS' ? (
                <div className="flex-1 flex overflow-hidden">
                   <WebSocketEditor 
                     requestState={activeRequest} 
                     setRequestState={updateActiveRequest} 
                     onSave={handleSaveToCollection}
                   />
                </div>
             ) : (
                <>
                   <div style={{ flex: `0 0 ${topPaneHeight}` }} className="flex flex-col shrink-0 relative overflow-hidden transition-none">
                     <RequestEditor 
                        requestState={activeRequest} 
                        setRequestState={updateActiveRequest} 
                        onSend={executeRequest} 
                        onSave={handleSaveToCollection}
                        onCodeClick={() => setShowCodeSnippetModal(true)}
                        useProxy={useProxy}
                        setUseProxy={setUseProxy}
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
                </>
             )}
               </>
            )}
          </main>
        )}
      </div>
      {showNewFeatureModal && (
        <NewFeatureModal 
           onClose={() => setShowNewFeatureModal(false)}
           onSelect={handleNewRequest}
        />
      )}
      {showSaveModal && (
         <SaveRequestModal 
            onClose={() => setShowSaveModal(false)}
            onSave={handleSaveToCollectionModal}
            activeRequestName={activeRequest.name || activeRequest.url.split('/').pop()}
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
      {showCodeSnippetModal && (
         <CodeSnippetModal 
            requestState={activeRequest} 
            onClose={() => setShowCodeSnippetModal(false)} 
         />
      )}
    </div>
  );
}

export default App;
