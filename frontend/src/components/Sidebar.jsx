import React, { useState, useEffect } from 'react';
import { Plus, Search, Folder, Clock, Settings, ChevronRight, ChevronDown, Star, MoreHorizontal, Archive, LayoutGrid, Network, Grid, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import Logo from './Logo';

function Sidebar({ activeNavTab, setActiveNavTab, historyRefreshTrigger, openAccount, onNewRequest, onImport, onLoadRequest, workspaces, activeWorkspaceId, setActiveWorkspaceId }) {
  const [history, setHistory] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedCollections, setExpandedCollections] = useState({});
  const [menuParams, setMenuParams] = useState(null);
  const [deleteConfirmParams, setDeleteConfirmParams] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const handleClickOutside = () => setMenuParams(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchCollections = () => {
    fetch(`/api/collections?workspace=${activeWorkspaceId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(data => setCollections(data))
    .catch(err => console.error(err));
  };

  useEffect(() => {
    if (activeNavTab === 'History') {
      setLoading(true);
      fetch('/api/history', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
        .then(res => res.json())
        .then(data => { setHistory(data); setLoading(false); })
        .catch(err => { console.error(err); setLoading(false); });
    } else if (activeNavTab === 'Collections') {
      setLoading(true);
      fetchCollections();
      setLoading(false);
    }
  }, [activeNavTab, historyRefreshTrigger, activeWorkspaceId]);

  const getMethodColor = (method) => {
    return `var(--status-${(method || 'GET').toLowerCase()})`;
  };

  const toggleCollection = (id) => {
    setExpandedCollections(prev => ({...prev, [id]: !prev[id]}));
  };

  const normalizeCollectionData = (data) => {
     let parsed = data;
     if (typeof data === 'string') {
        try { parsed = JSON.parse(data); } catch(e) { parsed = {}; }
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

  const updateCollectionData = async (collectionId, modifierFn) => {
      const col = collections.find(c => c.id === collectionId);
      if (!col) return;
      let data = typeof col.data === 'string' ? JSON.parse(col.data) : col.data;
      const items = normalizeCollectionData(data);
      
      modifierFn(items);
      
      const newData = { ...data, items, requests: [] }; // Reset requests to avoid dupes since we migrated
      
      setCollections(prev => prev.map(c => c.id === collectionId ? { ...c, data: newData } : c));
      
      try {
          await fetch(`/api/collections/${collectionId}`, {
              method: 'PUT',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({ data: newData })
          });
      } catch(e) {
          console.error("Failed to update collection", e);
      }
  };

  const handleAddFolder = (collectionId, parentFolderId = null) => {
      const name = prompt("Enter folder name:");
      if (!name) return;
      
      updateCollectionData(collectionId, (items) => {
          const newFolder = {
              type: 'folder',
              id: window.crypto.randomUUID(),
              name: name,
              items: []
          };
          
          if (!parentFolderId) {
              items.push(newFolder);
          } else {
              const addRecursively = (list) => {
                  for (let item of list) {
                      if (item.id === parentFolderId && item.type === 'folder') {
                          if (!item.items) item.items = [];
                          item.items.push(newFolder);
                          return true;
                      }
                      if (item.type === 'folder' && item.items) {
                          if (addRecursively(item.items)) return true;
                      }
                  }
                  return false;
              };
              addRecursively(items);
          }
      });
      if (parentFolderId) {
          setExpandedCollections(prev => ({...prev, [parentFolderId]: true}));
      } else {
          setExpandedCollections(prev => ({...prev, [collectionId]: true}));
      }
      setMenuParams(null);
  };

  const handleDeleteNode = (collectionId, nodeId) => {
      if (!confirm("Are you sure you want to delete this item?")) return;
      
      updateCollectionData(collectionId, (items) => {
          const deleteRecursively = (list) => {
              for (let i = 0; i < list.length; i++) {
                  if (list[i].id === nodeId) {
                      list.splice(i, 1);
                      return true;
                  }
                  if (list[i].type === 'folder' && list[i].items) {
                      if (deleteRecursively(list[i].items)) return true;
                  }
              }
              return false;
          };
          deleteRecursively(items);
      });
      setMenuParams(null);
  };
  
  const handleRenameNode = (collectionId, nodeId, currentName) => {
      const newName = prompt("Enter new name:", currentName);
      if (!newName || newName === currentName) return;
      
      updateCollectionData(collectionId, (items) => {
          const renameRecursively = (list) => {
              for (let i = 0; i < list.length; i++) {
                  if (list[i].id === nodeId) {
                      list[i].name = newName;
                      return true;
                  }
                  if (list[i].type === 'folder' && list[i].items) {
                      if (renameRecursively(list[i].items)) return true;
                  }
              }
              return false;
          };
          renameRecursively(items);
      });
      setMenuParams(null);
  };

  const handleExportCollection = (collection) => {
     setMenuParams(null);
     let data = typeof collection.data === 'string' ? JSON.parse(collection.data) : collection.data;
     const items = normalizeCollectionData(data);
     
     const processItems = (itemList) => {
        return itemList.map(node => {
           if (node.type === 'folder') {
              return {
                 name: node.name,
                 item: processItems(node.items || [])
              };
           } else {
              return {
                 name: node.name || node.url,
                 request: {
                    method: node.method,
                    header: (node.headers || []).filter(h => h.active && h.key).map(h => ({ key: h.key, value: h.value })),
                    url: { raw: node.url, host: node.url.split('/') },
                    body: node.bodyType !== 'none' ? {
                       mode: node.bodyType === 'raw' ? 'raw' : node.bodyType === 'GraphQL' ? 'graphql' : node.bodyType === 'form-data' ? 'formdata' : 'urlencoded',
                       raw: node.bodyRaw,
                       graphql: node.bodyType === 'GraphQL' ? { query: node.bodyGraphQLQuery, variables: node.bodyGraphQLVariables } : undefined,
                       formdata: node.bodyType === 'form-data' ? node.bodyFormData : undefined,
                       urlencoded: node.bodyType === 'x-www-form-urlencoded' ? node.bodyUrlEncoded : undefined
                    } : undefined
                 }
              };
           }
        });
     };

     const exportPayload = {
        info: {
           name: collection.name,
           schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
        },
        item: processItems(items)
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

  const RenderNode = ({ node, collectionId, depth }) => {
     const isExpanded = !!expandedCollections[node.id];
     if (node.type === 'folder') {
         return (
             <div className="flex flex-col">
                <div 
                  className="flex items-center gap-2 p-1.5 hover:bg-[var(--bg-tertiary)] rounded cursor-pointer text-[var(--text-primary)] transition-colors group"
                  style={{ paddingLeft: `${8 + depth * 12}px` }}
                  onClick={() => toggleCollection(node.id)}
                >
                   {isExpanded ? <ChevronDown size={14} className="text-[var(--text-muted)]"/> : <ChevronRight size={14} className="text-[var(--text-muted)]"/>}
                   <Folder size={14} className="text-[var(--text-muted)] opacity-50" />
                   <span className="text-sm font-medium flex-1 truncate">{node.name}</span>
                   <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                      <button 
                        className="p-1 hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] rounded"
                        onClick={(e) => {
                           e.stopPropagation();
                           setMenuParams({ x: e.clientX, y: e.clientY, isFolderMenu: true, node, collectionId });
                        }}
                      >
                        <MoreHorizontal size={14} />
                      </button>
                   </div>
                </div>
                {isExpanded && (
                   <div className="flex flex-col">
                      {(node.items || []).length === 0 && (
                         <div className="text-xs text-[var(--text-muted)] p-1 opacity-50" style={{ paddingLeft: `${28 + depth * 12}px` }}>Empty folder</div>
                      )}
                      {(node.items || []).map(child => <RenderNode key={child.id || Math.random()} node={child} collectionId={collectionId} depth={depth + 1} />)}
                   </div>
                )}
             </div>
         );
     } else {
         return (
             <div 
               className="flex items-center gap-2 p-1.5 hover:bg-[var(--bg-tertiary)] rounded cursor-pointer text-sm group"
               style={{ paddingLeft: `${24 + depth * 12}px` }}
               onClick={() => onLoadRequest && onLoadRequest(node)}
             >
                <span style={{ color: getMethodColor(node.method) }} className="font-bold text-[10px] w-10 shrink-0 text-center">{node.method}</span>
                <span className="truncate text-[var(--text-secondary)] flex-1">{node.name || node.url}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                      className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] rounded"
                      onClick={(e) => {
                         e.stopPropagation();
                         setMenuParams({ x: e.clientX, y: e.clientY, isRequestMenu: true, req: node, collectionId });
                      }}
                   >
                      <MoreHorizontal size={14} />
                   </button>
                </div>
             </div>
         );
     }
  };

  return (
    <div className="flex h-full shrink-0">
      <div className="w-20 border-r border-[var(--border-color)] flex flex-col justify-between py-2 shrink-0 bg-[var(--bg-secondary)] z-10 hidden sm:flex">
         <div className="flex flex-col items-center w-full gap-1">
            <button className={`w-full flex flex-col items-center justify-center py-2 relative text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors ${activeNavTab === 'Collections' ? 'text-[var(--text-primary)]' : ''}`} onClick={() => { setActiveNavTab('Collections'); setIsSidebarOpen(true); }} title="Collections">
               {activeNavTab === 'Collections' && <div className="absolute left-0 w-[2px] h-full bg-[#06B6D4] rounded-r-md"></div>}
               <Archive size={20} strokeWidth={activeNavTab === 'Collections' ? 2 : 1.5} />
               <span className="text-[9px] mt-1 hidden sm:block truncate w-full text-center px-1">Collections</span>
            </button>
            <button className={`w-full flex flex-col items-center justify-center py-2 relative text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors ${activeNavTab === 'Environments' ? 'text-[var(--text-primary)]' : ''}`} onClick={() => { setActiveNavTab('Environments'); setIsSidebarOpen(true); }} title="Environments">
               {activeNavTab === 'Environments' && <div className="absolute left-0 w-[2px] h-full bg-[#06B6D4] rounded-r-md"></div>}
               <LayoutGrid size={20} strokeWidth={activeNavTab === 'Environments' ? 2 : 1.5} />
               <span className="text-[9px] mt-1 hidden sm:block truncate w-full text-center px-1">Environments</span>
            </button>
            <button className={`w-full flex flex-col items-center justify-center py-2 relative text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors ${activeNavTab === 'History' ? 'text-[var(--text-primary)]' : ''}`} onClick={() => { setActiveNavTab('History'); setIsSidebarOpen(true); }} title="History">
               {activeNavTab === 'History' && <div className="absolute left-0 w-[2px] h-full bg-[#06B6D4] rounded-r-md"></div>}
               <Clock size={20} strokeWidth={activeNavTab === 'History' ? 2 : 1.5} />
               <span className="text-[9px] mt-1 hidden sm:block truncate w-full text-center px-1">History</span>
            </button>
            <button className="w-full flex flex-col items-center justify-center py-2 relative text-[var(--text-secondary)] opacity-50 cursor-not-allowed transition-colors" onClick={() => {}} title="Feature coming soon">
               <Network size={20} strokeWidth={1.5} />
               <span className="text-[9px] mt-1 hidden sm:block truncate w-full text-center px-1">Flows</span>
            </button>
         </div>
         <div className="flex flex-col items-center w-full gap-1">
            <button className={`w-full flex flex-col items-center justify-center py-3 relative text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors border-t border-[var(--border-color)] ${activeNavTab === 'Configure Workplace' ? 'text-[var(--text-primary)] bg-[var(--bg-tertiary)]' : ''}`} onClick={() => { setActiveNavTab('Configure Workplace'); setIsSidebarOpen(true); }} title="Configure workspace sidebar">
               {activeNavTab === 'Configure Workplace' && <div className="absolute left-0 w-[2px] h-full bg-[#06B6D4] rounded-r-md"></div>}
               <Grid size={20} strokeWidth={activeNavTab === 'Configure Workplace' ? 2 : 1.5} />
            </button>
            <button className="w-full flex items-center justify-center py-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors border-t border-[var(--border-color)] mt-1" onClick={() => setIsSidebarOpen(!isSidebarOpen)} title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}>
               {isSidebarOpen ? <PanelLeftClose size={18} strokeWidth={1.5} /> : <PanelLeftOpen size={18} strokeWidth={1.5} />}
            </button>
         </div>
      </div>
      {isSidebarOpen && (
        <aside className="w-72 border-r border-[var(--border-color)] flex flex-col h-full shrink-0 relative transition-none bg-[var(--bg-secondary)] overflow-hidden">
      <div className="p-3 border-b border-[var(--border-color)]">
         <select 
            value={activeWorkspaceId || 'default'} 
            onChange={(e) => setActiveWorkspaceId(e.target.value)}
            className="w-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-md px-3 py-2 text-sm font-semibold hover:border-blue-500/50 focus:border-blue-500 outline-none transition-colors cursor-pointer appearance-none"
         >
            {workspaces?.map(w => (
               <option key={w.id} value={w.id}>{w.name}</option>
            ))}
         </select>
         <div className="pointer-events-none absolute right-6 top-[22px] flex items-center px-2 text-[var(--text-muted)]">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
         </div>
      </div>

      <div className="flex gap-1 p-3 pb-1 shrink-0">
        <button className="btn-secondary flex-1 shadow-sm flex items-center justify-center gap-2" onClick={() => onNewRequest('modal')}>
          <Plus size={16} /> New
        </button>
         <button 
           className="bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)] text-[var(--text-primary)] px-3 py-1.5 rounded text-sm font-medium transition-colors border border-[transparent] hover:border-[var(--text-muted)]"
           onClick={onImport}
         >
            Import
         </button>
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
          <div className="flex flex-col gap-1 pb-10">
             {loading ? (
                <div className="p-3 text-sm text-[var(--text-muted)] text-center">Loading...</div>
             ) : collections.length === 0 ? (
                <div className="p-3 text-sm text-[var(--text-muted)] text-center mt-10">
                  No collections yet. Click + to create.
                </div>
             ) : (
                collections.map((collection) => {
                   const isExpanded = !!expandedCollections[collection.id];
                   const items = normalizeCollectionData(collection.data);
                   
                   return (
                     <div key={collection.id} className="flex flex-col">
                        <div 
                          className="flex items-center gap-2 p-2 hover:bg-[var(--bg-tertiary)] rounded-md cursor-pointer text-[var(--text-primary)] transition-colors group"
                          onClick={() => toggleCollection(collection.id)}
                        >
                          {isExpanded ? <ChevronDown size={14} className="text-[var(--text-muted)]"/> : <ChevronRight size={14} className="text-[var(--text-muted)]"/>}
                          <Folder size={14} className="text-[var(--accent-cyan)] fill-[var(--accent-cyan)] opacity-20" />
                          <span className="text-sm font-medium flex-1 truncate">{collection.name}</span>
                          
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                             <button className="p-1 hover:text-[var(--accent-cyan)] hover:bg-[var(--bg-primary)] rounded" title="Add request" onClick={(e) => { e.stopPropagation(); onNewRequest('http'); }}><Plus size={14} /></button>
                             <button className="p-1 hover:text-yellow-400 hover:bg-[var(--bg-primary)] rounded" title="Mark as favorite"><Star size={14} /></button>
                             <button 
                               className="p-1 hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] rounded"
                               onClick={(e) => {
                                  e.stopPropagation();
                                  setMenuParams({ x: e.clientX, y: e.clientY, isCollectionMenu: true, collection });
                               }}
                             >
                               <MoreHorizontal size={14} />
                             </button>
                          </div>
                        </div>
                        
                        {isExpanded && (
                          <div className="flex flex-col gap-0.5 mt-1 border-l ml-3 border-[var(--border-color)]">
                            {items.length === 0 ? (
                               <div className="text-xs text-[var(--text-muted)] p-1 ml-4 opacity-50">Empty collection</div>
                            ) : (
                               items.map(child => <RenderNode key={child.id || Math.random()} node={child} collectionId={collection.id} depth={0} />)
                            )}
                          </div>
                        )}
                     </div>
                   );
                })
             )}
          </div>
        ) : activeNavTab === 'History' ? (
          <div className="flex flex-col gap-1 pb-10">
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
                      <span style={{ color: getMethodColor(item.method) }} className="font-bold text-[10px] w-10 text-center">{item.method}</span>
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
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center opacity-50 mt-10">
             <span className="text-lg font-medium mb-2">{activeNavTab}</span>
             <span className="text-xs max-w-[200px]">This feature is under development and will be available soon.</span>
          </div>
        )}
      </div>

      <div className="px-4 pt-4 border-t border-[var(--border-color)] flex-between text-[var(--text-muted)] mt-auto mb-2 shrink-0">
         <span className="text-xs">Global Env</span>
         <div className="cursor-pointer hover:text-[var(--text-primary)] p-1 rounded hover:bg-[var(--bg-tertiary)] transition-colors" onClick={openAccount} title="Manage Account">
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
                 <button className="flex items-center justify-start w-full px-4 py-1.5 hover:bg-[var(--bg-tertiary)] transition-colors text-left" onClick={() => { onNewRequest('http'); setMenuParams(null); }}>
                    Add request
                 </button>
                 <button className="flex items-center justify-start w-full px-4 py-1.5 hover:bg-[var(--bg-tertiary)] transition-colors text-left" onClick={() => handleAddFolder(menuParams.collection.id)}>
                    Add folder
                 </button>
                 <div className="h-[1px] bg-[var(--border-color)] my-1"></div>
                 <button className="flex items-center justify-between w-full px-4 py-1.5 hover:bg-[var(--bg-tertiary)] transition-colors text-left" onClick={() => handleExportCollection(menuParams.collection)}>
                    Export
                 </button>
                 <div className="h-[1px] bg-[var(--border-color)] my-1"></div>
                 <button className="flex items-center justify-between w-full px-4 py-1.5 hover:bg-red-50 text-red-600 transition-colors text-left group" onClick={() => { setDeleteConfirmParams({ id: menuParams.collection.id }); setMenuParams(null); }}>
                    Delete
                    <span className="text-[10px] opacity-60 font-mono tracking-widest leading-none border border-red-200 bg-red-100 px-1 rounded flex items-center justify-center">⌫</span>
                 </button>
               </>
            ) : menuParams.isFolderMenu ? (
               <>
                 <button className="flex items-center justify-start w-full px-4 py-1.5 hover:bg-[var(--bg-tertiary)] transition-colors text-left" onClick={() => { onNewRequest('http'); setMenuParams(null); }}>
                    Add request
                 </button>
                 <button className="flex items-center justify-start w-full px-4 py-1.5 hover:bg-[var(--bg-tertiary)] transition-colors text-left" onClick={() => handleAddFolder(menuParams.collectionId, menuParams.node.id)}>
                    Add folder
                 </button>
                 <div className="h-[1px] bg-[var(--border-color)] my-1"></div>
                 <button className="flex items-center justify-between w-full px-4 py-1.5 hover:bg-[var(--bg-tertiary)] transition-colors text-left group" onClick={() => handleRenameNode(menuParams.collectionId, menuParams.node.id, menuParams.node.name)}>
                    Rename
                 </button>
                 <button className="flex items-center justify-between w-full px-4 py-1.5 hover:bg-[var(--bg-tertiary)] text-red-500 transition-colors text-left" onClick={() => handleDeleteNode(menuParams.collectionId, menuParams.node.id)}>
                    Delete
                    <span className="text-[10px] text-[var(--status-delete)] opacity-50 font-mono tracking-widest leading-none bg-red-500/10 px-1 rounded">⌫</span>
                 </button>
               </>
            ) : (
               <>
                 <button className="flex items-center justify-between w-full px-4 py-1.5 hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition-colors text-left" onClick={() => { navigator.clipboard.writeText(menuParams.req.url); setMenuParams(null); }}>
                    Copy link
                 </button>
                 <div className="h-[1px] bg-[var(--border-color)] my-1"></div>
                 <button className="flex items-center justify-between w-full px-4 py-1.5 hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition-colors text-left group" onClick={() => handleRenameNode(menuParams.collectionId, menuParams.req.id, menuParams.req.name)}>
                    Rename
                 </button>
                 <button className="flex items-center justify-between w-full px-4 py-1.5 hover:bg-[var(--bg-tertiary)] text-red-500 transition-colors text-left" onClick={() => handleDeleteNode(menuParams.collectionId, menuParams.req.id)}>
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
                     Are you sure want to delete this collection?
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
   )}
   </div>
  );
}

export default Sidebar;
