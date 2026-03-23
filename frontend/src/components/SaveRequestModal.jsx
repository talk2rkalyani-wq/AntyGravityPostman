import React, { useState, useEffect } from 'react';
import { X, Search, Folder, Plus } from 'lucide-react';

function SaveRequestModal({ onClose, onSave, activeRequestName }) {
  const [reqName, setReqName] = useState(activeRequestName || 'Untitled Request');
  const [collections, setCollections] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCol, setSelectedCol] = useState('');
  const [newColName, setNewColName] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  useEffect(() => {
     fetch('/api/collections', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
        .then(res => res.json())
        .then(data => setCollections(data))
        .catch(err => console.error(err));
  }, []);

  const filteredCols = collections.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  const handleSave = () => {
     if (!reqName.trim()) return alert('Request name is required');
     
     if (isCreatingNew) {
        if (!newColName.trim()) return alert('Collection name is required');
        onSave(reqName, newColName);
     } else {
        if (!selectedCol) return alert('Please select a collection');
        onSave(reqName, selectedCol);
     }
  };

  return (
    <div className="absolute inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div 
        className="bg-[var(--bg-primary)] rounded-lg shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden relative border border-[var(--border-color)] fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Save Request</h2>
            <button className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition" onClick={onClose}>
                <X size={20} />
            </button>
        </div>

        <div className="flex flex-col p-6 gap-6">
            <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Request Name</label>
                <input 
                   type="text" 
                   value={reqName}
                   onChange={e => setReqName(e.target.value)}
                   className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[#06B6D4] outline-none transition-colors"
                   placeholder="e.g. Get User Profile"
                   autoFocus
                />
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Save to Collection</label>
                
                {isCreatingNew ? (
                   <div className="flex flex-col gap-3 p-4 border border-[#06B6D4] rounded bg-[#06B6D4]/5">
                      <div className="flex items-center justify-between">
                         <span className="text-sm font-medium text-[var(--accent-cyan)]">Create New Collection</span>
                         <button className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]" onClick={() => setIsCreatingNew(false)}>Cancel</button>
                      </div>
                      <input 
                         type="text" 
                         value={newColName}
                         onChange={e => setNewColName(e.target.value)}
                         className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[#06B6D4] outline-none transition-colors"
                         placeholder="New Collection Name"
                      />
                   </div>
                ) : (
                   <div className="flex flex-col border border-[var(--border-color)] rounded overflow-hidden">
                      <div className="flex items-center p-2 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] gap-2">
                         <Search size={14} className="text-[var(--text-muted)] ml-1" />
                         <input 
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm text-[var(--text-primary)] flex-1 placeholder:text-[var(--text-muted)]"
                            placeholder="Search collections..."
                         />
                         <button 
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)] border border-[var(--border-color)] border-transparent transition-colors rounded text-xs font-medium text-[var(--text-primary)]"
                            onClick={() => setIsCreatingNew(true)}
                         >
                            <Plus size={14} /> New
                         </button>
                      </div>
                      
                      <div className="flex flex-col max-h-[200px] overflow-y-auto p-2 gap-1 custom-scrollbar">
                         {filteredCols.length === 0 ? (
                            <div className="p-4 text-center text-sm text-[var(--text-muted)]">No collections found.</div>
                         ) : (
                            filteredCols.map(c => (
                               <div 
                                  key={c.id}
                                  className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${selectedCol === c.name ? 'bg-[#06B6D4]/10 text-[#06B6D4]' : 'hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)]'}`}
                                  onClick={() => setSelectedCol(c.name)}
                               >
                                  <Folder size={16} className={selectedCol === c.name ? 'text-[#06B6D4]' : 'text-[var(--text-muted)]'} fill={selectedCol === c.name ? 'currentColor' : 'transparent'} fillOpacity={0.2} />
                                  <span className="text-sm font-medium">{c.name}</span>
                               </div>
                            ))
                         )}
                      </div>
                   </div>
                )}
            </div>
        </div>

        <div className="flex items-center justify-end px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] gap-3">
            <button className="px-4 py-2 rounded text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" onClick={onClose}>
               Cancel
            </button>
            <button className="px-6 py-2 rounded text-sm font-semibold bg-[#06B6D4] hover:bg-[#0891b2] text-white transition-colors" onClick={handleSave}>
               Save
            </button>
        </div>
      </div>
    </div>
  );
}

export default SaveRequestModal;
