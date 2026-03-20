import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import RequestEditor from './components/RequestEditor';
import ResponseViewer from './components/ResponseViewer';
import AccountManager from './components/AccountManager';
import Header from './components/Header';
import ImportModal from './components/ImportModal';
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
  };
  
  const [requestState, setRequestState] = useState({
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/todos/1',
    activeTab: 'Params',
    params: [{ key: '', value: '', description: '', active: true }],
    headers: [{ key: '', value: '', description: '', active: true }],
    bodyType: 'none',
    bodyRaw: '',
    bodyFormData: [{ key: '', value: '', description: '', active: true }],
    bodyUrlEncoded: [{ key: '', value: '', description: '', active: true }],
    bodyGraphQLQuery: '',
    bodyGraphQLVariables: '',
    authType: 'No Auth',
    authData: {}
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
      
      // Auth logic
      if (requestState.authType === 'Bearer Token' && requestState.authData.bearerToken) {
         compiledHeaders['Authorization'] = `Bearer ${requestState.authData.bearerToken}`;
      } else if (requestState.authType === 'Basic Auth' && (requestState.authData.basicUsername || requestState.authData.basicPassword)) {
         const encoded = btoa(`${requestState.authData.basicUsername || ''}:${requestState.authData.basicPassword || ''}`);
         compiledHeaders['Authorization'] = `Basic ${encoded}`;
      } else if (requestState.authType === 'API Key' && requestState.authData.apiKeyKey && requestState.authData.apiKeyValue) {
         if (requestState.authData.apiKeyAddTo === 'Header') {
            compiledHeaders[requestState.authData.apiKeyKey] = requestState.authData.apiKeyValue;
         } else if (requestState.authData.apiKeyAddTo === 'Query Params') {
            const urlObj = new URL(finalUrl);
            urlObj.searchParams.append(requestState.authData.apiKeyKey, requestState.authData.apiKeyValue);
            finalUrl = urlObj.toString();
         }
      }

      // Body logic
      let finalData = undefined;
      if (requestState.method !== 'GET' && requestState.method !== 'HEAD') {
         if (requestState.bodyType === 'raw') {
            finalData = requestState.bodyRaw;
            if (!Object.keys(compiledHeaders).some(k => k.toLowerCase() === 'content-type') && finalData) {
                try {
                   JSON.parse(finalData);
                   compiledHeaders['Content-Type'] = 'application/json';
                // eslint-disable-next-line no-unused-vars
                } catch(e) { /* non-json raw */ }
            }
         } else if (requestState.bodyType === 'x-www-form-urlencoded') {
            const params = new URLSearchParams();
            requestState.bodyUrlEncoded.forEach(item => {
               if (item.active && item.key) params.append(item.key, item.value);
            });
            finalData = params.toString();
            compiledHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
         } else if (requestState.bodyType === 'form-data') {
            const fdObj = {};
            requestState.bodyFormData.forEach(item => {
               if (item.active && item.key) fdObj[item.key] = item.value;
            });
            finalData = fdObj;
            compiledHeaders['Content-Type'] = 'multipart/form-data'; 
         } else if (requestState.bodyType === 'GraphQL') {
            finalData = {
               query: requestState.bodyGraphQLQuery,
               variables: requestState.bodyGraphQLVariables ? JSON.parse(requestState.bodyGraphQLVariables) : {}
            };
            compiledHeaders['Content-Type'] = 'application/json';
         }
      }

      const proxyPayload = {
        url: finalUrl,
        method: requestState.method,
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
     const reqName = prompt("Enter Request Name:", "My Request");
     if (!reqName) return;
     const colName = prompt("Enter Collection Name (or create new):", "My Collection");
     if (!colName) return;

     const dataToSave = {
        ...requestState,
        name: reqName,
        params: requestState.params.filter(p => p.key || p.value),
        headers: requestState.headers.filter(h => h.key || h.value),
        bodyFormData: requestState.bodyFormData.filter(p => p.key || p.value),
        bodyUrlEncoded: requestState.bodyUrlEncoded.filter(p => p.key || p.value)
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
        
        setRequestState(parsedRequest);
        setResponseState(null);
        setActiveNavTab('Collections');
        setHistoryRefreshTrigger(prev => prev + 1);
     } catch(e) {
        alert('Failed to import and save collection: ' + e.message);
     }
  };

  const handleNewRequest = () => {
    setRequestState({
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
      authType: 'No Auth',
      authData: {}
    });
    setResponseState(null);
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
      <Header onLogout={handleLogout} />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar 
          activeNavTab={activeNavTab} 
          setActiveNavTab={setActiveNavTab} 
          historyRefreshTrigger={historyRefreshTrigger} 
          openAccount={() => setShowAccount(true)}
          onNewRequest={handleNewRequest}
          onImport={() => setShowImportModal(true)}
          onLoadRequest={(req) => {
             setRequestState({
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
                activeTab: 'Params'
             });
             setResponseState(null);
          }}
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
          onImportAndSave={handleImportAndSave}
        />
      )}
    </div>
  );
}

export default App;
