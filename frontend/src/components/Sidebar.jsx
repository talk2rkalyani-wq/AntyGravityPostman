import React, { useState, useEffect } from 'react';
import { Plus, Search, Folder, Clock, Settings, LayoutPanelLeft, ChevronRight, ChevronDown, Star, MoreHorizontal } from 'lucide-react';
import Logo from './Logo';

function Sidebar({ activeNavTab, setActiveNavTab, historyRefreshTrigger, openAccount, onNewRequest, onImport, onLoadRequest }) {
  const [history, setHistory] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedCollections, setExpandedCollections] = useState({});
  const [menuParams, setMenuParams] = useState(null);
  const [deleteConfirmParams, setDeleteConfirmParams] = useState(null);

  useEffect(() => {
    const handleClickOutside = () => setMenuParams(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (activeNavTab === 'History') {
      setLoading(true);
      fetch('/api/history', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
        .then(res => res.json())
        .then(data => {
            setHistory(data);
            setLoading(false);
        })
        .catch(err => {
            console.error(err);
            setLoading(false);
        });
    } else if (activeNavTab === 'Collections') {
      setLoading(true);
      fetch('/api/collections', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
        .then(res => res.json())
        .then(data => {
            setCollections(data);
            setLoading(false);
        })
        .catch(err => {
            console.error(err);
            setLoading(false);
        });
    }
  }, [activeNavTab, historyRefreshTrigger]);

  const getMethodColor = (method) => {
    return `var(--status-${(method || 'GET').toLowerCase()})`;
  };

  const toggleCollection = (id) => {
    setExpandedCollections(prev => ({...prev, [id]: !prev[id]}));
  };

  const handleExportCollection = (collection) => {
     setMenuParams(null);
     let data = {};
     try {
       data = typeof collection.data === 'string' ? JSON.parse(collection.data) : collection.data;
     } catch(e) { data = {}; }
     
     const exportPayload = {
        info: {
           name: collection.name,
           schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
        },
        item: (data.requests || []).map(req => ({
           name: req.name || req.url,
           request: {
              method: req.method,
              header: (req.headers || []).filter(h => h.active && h.key).map(h => ({ key: h.key, value: h.value })),
              url: {
                 raw: req.url,
                 host: req.url.split('/')
              },
              body: req.bodyType !== 'none' ? {
                 mode: req.bodyType === 'raw' ? 'raw' : req.bodyType === 'GraphQL' ? 'graphql' : req.bodyType === 'form-data' ? 'formdata' : 'urlencoded',
                 raw: req.bodyRaw,
                 graphql: req.bodyType === 'GraphQL' ? { query: req.bodyGraphQLQuery, variables: req.bodyGraphQLVariables } : undefined,
                 formdata: req.bodyType === 'form-data' ? req.bodyFormData : undefined,
                 urlencoded: req.bodyType === 'x-www-form-urlencoded' ? req.bodyUrlEncoded : undefined
              } : undefined
           }
        }))
     };
     
     const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = `${(collection.name || 'Export').replace(/\s+/g, '_')}_collection.json`;
     document.body.appendChild(a);
     a.click();
     document.body.removeChild(a);
     URL.revokeObjectURL(url);
  };

  return (
    <aside className="sidebar shrink-0 relative bg-[var(--bg-secondary)] border-r border-[var(--border-color)]">
      
      {/* New / Import Buttons */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-2 border-b border-[var(--border-color)]">
         <button 
           className="bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)] text-[var(--text-primary)] px-3 py-1.5 rounded text-sm font-medium transition-colors border border-[transparent] hover:border-[var(--text-muted)]"
           onClick={() => onNewRequest('modal')}
         >
            New
         </button>
         <button 
           className="bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)] text-[var(--text-primary)] px-3 py-1.5 rounded text-sm font-medium transition-colors border border-[transparent] hover:border-[var(--text-muted)]"
           onClick={onImport}
         >
            Import
         </button>
      </div>



      <div className="tab-nav mb-2">
        <div 
          className={`tab-item flex items-center gap-2 ${activeNavTab === 'Collections' ? 'active' : ''}`}
          onClick={() => setActiveNavTab('Collections')}
        >
          <Folder size={14} /> Collections
        </div>
        <div 
          className={`tab-item flex items-center gap-2 ${activeNavTab === 'History' ? 'active' : ''}`}
          onClick={() => setActiveNavTab('History')}
        >
          <Clock size={14} /> History
        </div>
      </div>

      <div className="px-4 py-2 mt-2 border-b border-transparent">
        <div className="flex items-center gap-2">
          {activeNavTab === 'Collections' && (
             <button className="text-[var(--text-secondary)] hover:text-[#06B6D4] p-1 transition-colors shrink-0" onClick={() => onNewRequest('http')} title="New Request">
                <Plus size={16} strokeWidth={2} />
             </button>
          )}
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-[var(--text-muted)] opacity-50" size={14} />
            <input 
              type="text" 
              placeholder={`Search ${activeNavTab.toLowerCase()}...`}
              className="input-field w-full !pl-8 py-1.5 text-xs bg-[var(--bg-primary)] border border-transparent focus:border-[var(--border-color)] hover:border-[var(--border-color)] transition-colors rounded"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 mt-2 custom-scrollbar">
        {activeNavTab === 'Collections' ? (
          <div className="flex flex-col gap-1">
             {loading ? (
                <div className="p-3 text-sm text-[var(--text-muted)] text-center">Loading...</div>
             ) : collections.length === 0 ? (
                <div className="p-3 text-sm text-[var(--text-muted)] text-center mt-10">
                  No collections yet. Click + to create.
                </div>
             ) : (
                collections.map((item) => {
                   const isExpanded = !!expandedCollections[item.id];
                   const data = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
                   const requests = data.requests || [];
                   
                   return (
                     <div key={item.id} className="flex flex-col">
                        <div 
                          className="flex items-center gap-2 p-2 hover:bg-[var(--bg-tertiary)] rounded-md cursor-pointer text-[var(--text-primary)] transition-colors group"
                          onClick={() => toggleCollection(item.id)}
                        >
                          {isExpanded ? <ChevronDown size={14} className="text-[var(--text-muted)]"/> : <ChevronRight size={14} className="text-[var(--text-muted)]"/>}
                          <Folder size={14} className="text-[var(--accent-cyan)] fill-[var(--accent-cyan)] opacity-20" />
                          <span className="text-sm font-medium flex-1">{item.name}</span>
                          
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                             <button className="p-1 hover:text-[var(--accent-cyan)] hover:bg-[var(--bg-primary)] rounded" title="Add request"><Plus size={14} /></button>
                             <button className="p-1 hover:text-yellow-400 hover:bg-[var(--bg-primary)] rounded" title="Mark as favorite"><Star size={14} /></button>
                             <button 
                               className="p-1 hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] rounded"
                               onClick={(e) => {
                                  e.stopPropagation();
                                  setMenuParams({ x: e.clientX, y: e.clientY, isCollectionMenu: true, collection: item });
                               }}
                             >
                               <MoreHorizontal size={14} />
                             </button>
                          </div>
                        </div>
                        
                        {isExpanded && (
                          <div className="ml-6 flex flex-col gap-1 mt-1 border-l border-[var(--border-color)] pl-2">
                            {requests.length === 0 ? (
                               <div className="text-xs text-[var(--text-muted)] p-1">Empty collection</div>
                            ) : (
                               requests.map((req, idx) => (
                               <div 
                                 key={idx} 
                                 className="flex items-center gap-2 p-1.5 hover:bg-[var(--bg-tertiary)] rounded cursor-pointer text-sm group"
                                 onClick={() => onLoadRequest && onLoadRequest(req)}
                               >
                                    <span style={{ color: getMethodColor(req.method) }} className="font-bold text-[10px] w-10 shrink-0">{req.method}</span>
                                    <span className="truncate text-[var(--text-secondary)] flex-1">{req.name || req.url}</span>
                                     <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                           className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] rounded"
                                           onClick={(e) => {
                                              e.stopPropagation();
                                              setMenuParams({ x: e.clientX, y: e.clientY, isCollectionMenu: false, req, collectionId: item.id, idx });
                                           }}
                                        >
                                           <MoreHorizontal size={14} />
                                        </button>
                                     </div>
                                 </div>
                               ))
                            )}
                          </div>
                        )}
                     </div>
                   );
                })
             )}
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {loading ? (
              <div className="p-3 text-sm text-[var(--text-muted)] text-center">Loading...</div>
            ) : history.length === 0 ? (
              <div className="p-3 text-sm text-[var(--text-muted)] text-center mt-10">
                No history.
              </div>
            ) : (
              history.map((item) => (
                <div 
                  key={item.id} 
                  className="p-2 hover:bg-[var(--bg-tertiary)] rounded-md cursor-pointer transition-colors border border-transparent hover:border-[var(--border-color)] group flex flex-col gap-1"
                  onClick={() => onLoadRequest && onLoadRequest(item)}
                >
                   <div className="flex items-center gap-2 text-sm">
                      <span style={{ color: getMethodColor(item.method) }} className="font-bold text-[10px] w-10">{item.method}</span>
                      <span className="truncate text-[var(--text-primary)] flex-1">{item.url}</span>
                   </div>
                   <div className="flex justify-between text-xs text-[var(--text-muted)] pl-12">
                      <span className={item.status >= 400 ? 'text-[var(--status-delete)]' : 'text-[var(--status-get)]'}>{item.status}</span>
                      <span>{new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                   </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="px-4 pt-4 border-t border-[var(--border-color)] flex-between text-[var(--text-muted)] mt-auto mb-2">
         <span className="text-xs">Global Env</span>
         <div 
           className="cursor-pointer hover:text-[var(--text-primary)] p-1 rounded hover:bg-[var(--bg-tertiary)] transition-colors"
           onClick={openAccount}
           title="Manage Account"
         >
            <Settings size={14} />
         </div>
      </div>

      {menuParams && (
         <div 
            className="fixed bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded shadow-2xl z-[9999] flex flex-col min-w-[220px] py-1 text-[13px] font-medium text-[var(--text-primary)]"
            style={{ top: menuParams.y, left: menuParams.x }}
            onClick={(e) => e.stopPropagation()}
         >
            {menuParams.isCollectionMenu ? (
               <>
                 <button className="flex items-center justify-start w-full px-4 py-1.5 hover:bg-[var(--bg-tertiary)] transition-colors text-left" onClick={() => setMenuParams(null)}>
                    Add request
                 </button>
                 <button className="flex items-center justify-start w-full px-4 py-1.5 hover:bg-[var(--bg-tertiary)] transition-colors text-left" onClick={() => setMenuParams(null)}>
                    Add folder
                 </button>
                 <div className="h-[1px] bg-[var(--border-color)] my-1"></div>
                 <button className="flex items-center justify-start w-full px-4 py-1.5 hover:bg-[var(--bg-tertiary)] transition-colors text-left" onClick={() => setMenuParams(null)}>
                    Run
                 </button>
                 <div className="h-[1px] bg-[var(--border-color)] my-1"></div>
                 <button className="flex items-center justify-start w-full px-4 py-1.5 hover:bg-[var(--bg-tertiary)] transition-colors text-left" onClick={() => setMenuParams(null)}>
                    Share
                 </button>
                 <button className="flex items-center justify-start w-full px-4 py-1.5 hover:bg-[var(--bg-tertiary)] transition-colors text-left" onClick={() => setMenuParams(null)}>
                    Copy link
                 </button>
                 <div className="h-[1px] bg-[var(--border-color)] my-1"></div>
                 <button className="flex items-center justify-start w-full px-4 py-1.5 hover:bg-[var(--bg-tertiary)] transition-colors text-left" onClick={() => setMenuParams(null)}>
                    Ask AI
                 </button>
                 <button className="flex items-center justify-start w-full px-4 py-1.5 hover:bg-[var(--bg-tertiary)] transition-colors text-left" onClick={() => setMenuParams(null)}>
                    Move
                 </button>
                 <div className="h-[1px] bg-[var(--border-color)] my-1"></div>
                 <button className="flex items-center justify-between w-full px-4 py-1.5 hover:bg-[var(--bg-tertiary)] transition-colors text-left" onClick={() => setMenuParams(null)}>
                    Fork
                    <span className="text-[10px] text-[var(--text-muted)] opacity-60 font-mono tracking-widest leading-none">⌥⌘F</span>
                 </button>
                 <div className="h-[1px] bg-[var(--border-color)] my-1"></div>
                 <button className="flex items-center justify-between w-full px-4 py-1.5 hover:bg-[var(--bg-tertiary)] transition-colors text-left" onClick={() => setMenuParams(null)}>
                    Rename
                    <span className="text-[10px] text-[var(--text-muted)] opacity-60 font-mono tracking-widest leading-none">⌘E</span>
                 </button>
                 <button className="flex items-center justify-between w-full px-4 py-1.5 hover:bg-[var(--bg-tertiary)] transition-colors text-left" onClick={() => setMenuParams(null)}>
                    Duplicate
                    <span className="text-[10px] text-[var(--text-muted)] opacity-60 font-mono tracking-widest leading-none">⌘D</span>
                 </button>
                 <button className="flex items-center justify-between w-full px-4 py-1.5 hover:bg-[var(--bg-tertiary)] transition-colors text-left" onClick={() => handleExportCollection(menuParams.collection)}>
                    Export
                 </button>
                 <button className="flex items-center justify-between w-full px-4 py-1.5 hover:bg-[var(--bg-tertiary)] transition-colors text-left group" onClick={() => setMenuParams(null)}>
                    Sort
                    <ChevronRight size={14} className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)]" />
                 </button>
                 <button className="flex items-center justify-between w-full px-4 py-1.5 hover:bg-red-50 text-red-600 transition-colors text-left group" onClick={() => { setDeleteConfirmParams({ id: menuParams.collection.id }); setMenuParams(null); }}>
                    Delete
                    <span className="text-[10px] opacity-60 font-mono tracking-widest leading-none border border-red-200 bg-red-100 px-1 rounded flex items-center justify-center">⌫</span>
                 </button>
                 <div className="h-[1px] bg-[var(--border-color)] my-1"></div>
                 <button className="flex items-center justify-between w-full px-4 py-1.5 hover:bg-[var(--bg-tertiary)] transition-colors text-left group" onClick={() => setMenuParams(null)}>
                    More
                    <ChevronRight size={14} className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)]" />
                 </button>
               </>
            ) : (
               <>
                 <button className="flex items-center justify-between w-full px-4 py-1.5 hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition-colors text-left" onClick={() => setMenuParams(null)}>
                    Add example
                 </button>
            <div className="h-[1px] bg-[var(--border-color)] my-1"></div>
            <button className="flex items-center justify-between w-full px-4 py-1.5 hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition-colors text-left" onClick={() => setMenuParams(null)}>
               Share
            </button>
            <button className="flex items-center justify-between w-full px-4 py-1.5 hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition-colors text-left" onClick={() => { navigator.clipboard.writeText(menuParams.req.url); setMenuParams(null); }}>
               Copy link
            </button>
            <div className="h-[1px] bg-[var(--border-color)] my-1"></div>
            <button className="flex items-center justify-between w-full px-4 py-1.5 hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition-colors text-left" onClick={() => setMenuParams(null)}>
               Ask AI
            </button>
            <div className="h-[1px] bg-[var(--border-color)] my-1"></div>
            <button className="flex items-center justify-between w-full px-4 py-1.5 hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition-colors text-left group" onClick={() => setMenuParams(null)}>
               Rename
               <span className="text-[10px] text-[var(--text-muted)] opacity-50 font-mono tracking-widest leading-none">⌘E</span>
            </button>
            <button className="flex items-center justify-between w-full px-4 py-1.5 hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition-colors text-left" onClick={() => setMenuParams(null)}>
               Copy
               <span className="text-[10px] text-[var(--text-muted)] opacity-50 font-mono tracking-widest leading-none">⌘C</span>
            </button>
            <button className="flex items-center justify-between w-full px-4 py-1.5 hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition-colors text-left" onClick={() => setMenuParams(null)}>
               Duplicate
               <span className="text-[10px] text-[var(--text-muted)] opacity-50 font-mono tracking-widest leading-none">⌘D</span>
            </button>
            <button className="flex items-center justify-between w-full px-4 py-1.5 hover:bg-[var(--bg-tertiary)] text-red-500 transition-colors text-left" onClick={() => setMenuParams(null)}>
               Delete
               <span className="text-[10px] text-[var(--status-delete)] opacity-50 font-mono tracking-widest leading-none bg-red-500/10 px-1 rounded">⌫</span>
            </button>
               </>
            )}
         </div>
      )}

      {deleteConfirmParams && (
         <div className="fixed inset-0 bg-black/50 z-[10000] flex items-center justify-center p-4">
            <div className="bg-[var(--bg-primary)] rounded-lg shadow-2xl w-full max-w-sm flex flex-col overflow-hidden relative border border-[var(--border-color)] fade-in">
               <div className="p-6">
                  <h3 className="text-[15px] font-semibold text-[var(--text-primary)] mb-2 mt-2 leading-relaxed">
                     Are you sure want to delete this collection
                  </h3>
               </div>
               <div className="flex items-center justify-end px-6 py-4 bg-[var(--bg-secondary)] border-t border-[var(--border-color)] gap-3 mt-4">
                  <button 
                     className="px-4 py-2 rounded text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors border border-[var(--border-color)] bg-[var(--bg-primary)] hover:bg-[var(--bg-tertiary)]"
                     onClick={() => setDeleteConfirmParams(null)}
                  >
                     Cancel
                  </button>
                  <button 
                     className="px-6 py-2 rounded text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors border border-red-700"
                     onClick={async () => {
                        try {
                           await fetch(`/api/collections/${deleteConfirmParams.id}`, {
                              method: 'DELETE',
                              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                           });
                           setActiveNavTab('History'); 
                           setTimeout(() => setActiveNavTab('Collections'), 10);
                        } catch(e) {}
                        setDeleteConfirmParams(null);
                     }}
                  >
                     Delete
                  </button>
               </div>
            </div>
         </div>
      )}
    </aside>
  );
}

export default Sidebar;
