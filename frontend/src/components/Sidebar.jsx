import React, { useState, useEffect } from 'react';
import { Plus, Search, Folder, Clock, Settings, LayoutPanelLeft, ChevronRight, ChevronDown } from 'lucide-react';
import Logo from './Logo';

function Sidebar({ activeNavTab, setActiveNavTab, historyRefreshTrigger, openAccount, onNewRequest, onImport }) {
  const [history, setHistory] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedCollections, setExpandedCollections] = useState({});

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

  return (
    <aside className="sidebar shrink-0 relative bg-[var(--bg-secondary)] border-r border-[var(--border-color)]">
      
      {/* New / Import Buttons */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-2 border-b border-[var(--border-color)]">
         <button 
           className="bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)] text-[var(--text-primary)] px-3 py-1.5 rounded text-sm font-medium transition-colors border border-[transparent] hover:border-[var(--text-muted)]"
           onClick={onNewRequest}
         >
            New
         </button>
         <button 
           className="bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)] text-[var(--text-primary)] px-3 py-1.5 rounded text-sm font-medium transition-colors border border-[transparent] hover:border-[var(--text-muted)]"
           onClick={onImport}
         >
            Import
         </button>
         <div className="flex-1" />
         <button className="text-[var(--text-secondary)] hover:text-[#06B6D4] p-1 transition-colors" onClick={onNewRequest} title="New Request">
            <Plus size={20} />
         </button>
      </div>

      <div className="p-4 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          <Logo className="w-6 h-6" />
          <span className="font-bold text-xl tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-[#06B6D4] to-[#8B5CF6]">
            NeonAPI
          </span>
        </div>
        <button className="btn-secondary p-2 flex-center" title="New Request">
          <Plus size={16} />
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

      <div className="px-4 py-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-muted)]" size={14} />
          <input 
            type="text" 
            placeholder="Filter..." 
            className="input-field w-full pl-9 py-1.5 text-sm bg-[var(--bg-primary)]"
          />
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
                          className="flex items-center gap-2 p-2 hover:bg-[var(--bg-tertiary)] rounded-md cursor-pointer text-[var(--text-primary)] transition-colors"
                          onClick={() => toggleCollection(item.id)}
                        >
                          {isExpanded ? <ChevronDown size={14} className="text-[var(--text-muted)]"/> : <ChevronRight size={14} className="text-[var(--text-muted)]"/>}
                          <Folder size={14} className="text-[var(--accent-cyan)] fill-[var(--accent-cyan)] opacity-20" />
                          <span className="text-sm font-medium">{item.name}</span>
                        </div>
                        
                        {isExpanded && (
                          <div className="ml-6 flex flex-col gap-1 mt-1 border-l border-[var(--border-color)] pl-2">
                            {requests.length === 0 ? (
                               <div className="text-xs text-[var(--text-muted)] p-1">Empty collection</div>
                            ) : (
                               requests.map((req, idx) => (
                                 <div key={idx} className="flex items-center gap-2 p-1.5 hover:bg-[var(--bg-tertiary)] rounded cursor-pointer text-sm">
                                    <span style={{ color: getMethodColor(req.method) }} className="font-bold text-[10px] w-10">{req.method}</span>
                                    <span className="truncate text-[var(--text-secondary)]">{req.name || req.url}</span>
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
                <div key={item.id} className="p-2 hover:bg-[var(--bg-tertiary)] rounded-md cursor-pointer transition-colors border border-transparent hover:border-[var(--border-color)] group flex flex-col gap-1">
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
    </aside>
  );
}

export default Sidebar;
