import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Plus, Trash, Edit2, Check, X, Settings2, User, Moon, Sun, LogOut } from 'lucide-react';
import Logo from './Logo';

function Header({ user, onLogout, onGoHome, environments, activeEnvId, setActiveEnvId, openEnvManager, onProfileClick, themeConfig, setThemeConfig }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newWpName, setNewWpName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const dropdownRef = useRef(null);
  const profileMenuRef = useRef(null);

  const fetchWorkspaces = async () => {
    try {
      const res = await fetch('/api/workspaces', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setWorkspaces(data);
      if (data.length > 0 && !activeWorkspace) {
        setActiveWorkspace(data[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreate = async () => {
    if (!newWpName.trim()) return;
    try {
      await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name: newWpName })
      });
      setNewWpName('');
      setIsCreating(false);
      fetchWorkspaces();
    } catch (e) {
      console.error("Failed to create workspace", e);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Delete this workspace?")) return;
    try {
      await fetch(`/api/workspaces/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (activeWorkspace?.id === id) setActiveWorkspace(null); // Will default to first in fetch
      fetchWorkspaces();
    } catch (e) {
      alert("Cannot delete default workspace");
    }
  };

  const startEdit = (e, wp) => {
    e.stopPropagation();
    setEditingId(wp.id);
    setEditName(wp.name);
  };

  const handleSaveEdit = async (e, id) => {
    e.stopPropagation();
    try {
      await fetch(`/api/workspaces/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name: editName })
      });
      setEditingId(null);
      if (activeWorkspace?.id === id) {
         setActiveWorkspace({ ...activeWorkspace, name: editName });
      }
      fetchWorkspaces();
    } catch (e) {
      console.error("Edit failed");
    }
  };

  return (
    <header className="h-12 border-b border-[var(--border-color)] bg-[var(--bg-primary)] flex items-center px-4 shrink-0 transition-colors">
      <div className="flex gap-6 items-center flex-1">
        <div className="flex items-center gap-2 cursor-pointer select-none group" onClick={onGoHome}>
          <Logo className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <div className="font-bold text-xl tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-[#06B6D4] to-[#8B5CF6] group-hover:opacity-80 transition-opacity">
             NeonAPI
          </div>
        </div>

        <nav className="flex gap-4 ml-4">
           <button className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium text-sm transition-colors">
              Home
           </button>
           
           {/* Workspaces Dropdown */}
           <div className="relative" ref={dropdownRef}>
              <button 
                className={`flex gap-1 items-center font-medium text-sm transition-colors ${showDropdown ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                onClick={() => setShowDropdown(!showDropdown)}
              >
                 Workspaces 
                 <ChevronDown size={14} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showDropdown && (
                <div className="absolute top-10 left-0 w-80 glass-panel shadow-lg z-50 overflow-hidden flex flex-col max-h-[80vh]">
                   <div className="p-3 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-secondary)]">
                      <span className="font-semibold text-sm">Your Workspaces</span>
                      <button 
                        className="text-[var(--accent-cyan)] hover:text-[var(--accent-cyan-hover)] p-1"
                        onClick={() => setIsCreating(true)}
                        title="New Workspace"
                      >
                         <Plus size={16} />
                      </button>
                   </div>
                   
                   <div className="overflow-y-auto flex-1 p-2">
                       {isCreating && (
                         <div className="flex items-center gap-2 mb-2 p-2 border border-[var(--accent-cyan)] rounded bg-[var(--bg-primary)]">
                            <input 
                              autoFocus
                              className="bg-transparent border-none outline-none text-sm flex-1 text-[var(--text-primary)] font-medium"
                              placeholder="Workspace Name"
                              value={newWpName}
                              onChange={e => setNewWpName(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleCreate()}
                            />
                            <Check size={14} className="text-green-500 cursor-pointer hover:text-green-400" onClick={handleCreate} />
                            <X size={14} className="text-red-500 cursor-pointer hover:text-red-400" onClick={() => setIsCreating(false)} />
                         </div>
                       )}

                       {workspaces.map(wp => (
                         <div 
                            key={wp.id} 
                            onClick={() => { setActiveWorkspace(wp); setShowDropdown(false); }}
                            className={`flex justify-between items-center p-2 rounded cursor-pointer transition-colors group ${activeWorkspace?.id === wp.id ? 'bg-[var(--bg-tertiary)]' : 'hover:bg-[var(--bg-tertiary)] hover:bg-opacity-50'}`}
                         >
                            {editingId === wp.id ? (
                               <div className="flex items-center gap-2 w-full" onClick={e => e.stopPropagation()}>
                                  <input 
                                    autoFocus
                                    className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded px-2 py-1 outline-none text-sm w-full"
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSaveEdit(e, wp.id)}
                                  />
                                  <Check size={14} className="text-green-500 cursor-pointer hover:text-green-400 shrink-0" onClick={(e) => handleSaveEdit(e, wp.id)} />
                                  <X size={14} className="text-gray-400 cursor-pointer hover:text-white shrink-0" onClick={(e) => { e.stopPropagation(); setEditingId(null); }} />
                               </div>
                            ) : (
                               <>
                                 <div className="flex items-center gap-2">
                                    <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white ${activeWorkspace?.id === wp.id ? 'bg-gradient-to-br from-[#06B6D4] to-[#8B5CF6]' : 'bg-[var(--bg-primary)] border border-[var(--border-color)]'}`}>
                                       {wp.name.charAt(0)}
                                    </div>
                                    <span className="text-sm font-medium">{wp.name}</span>
                                 </div>
                                 <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-[var(--bg-primary)]" onClick={(e) => startEdit(e, wp)}>
                                       <Edit2 size={12} />
                                    </button>
                                    {wp.id !== 'default' && (
                                       <button className="p-1.5 text-gray-400 hover:text-red-400 rounded hover:bg-[var(--bg-primary)]" onClick={(e) => handleDelete(e, wp.id)}>
                                          <Trash size={12} />
                                       </button>
                                    )}
                                 </div>
                               </>
                            )}
                         </div>
                       ))}
                   </div>
                </div>
              )}
           </div>

           <button className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium text-sm transition-colors">
              API Network
           </button>
        </nav>
      </div>
      
      {/* Right side Header Icons could go here (Sync, Settings, Profile) */}
      <div className="flex items-center gap-4">
        
        {/* Environment Selector */}
        <div className="flex items-center border border-[var(--border-color)] rounded bg-[var(--bg-secondary)] h-7 transition-colors">
            <select 
               className="bg-transparent text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] outline-none cursor-pointer pl-2 py-1 appearance-none w-[130px] border-r border-[var(--border-color)] leading-none"
               value={activeEnvId || ''}
               onChange={(e) => setActiveEnvId(e.target.value)}
            >
               <option className="bg-[var(--bg-secondary)]" value="">No Environment</option>
               {environments && environments.map(env => (
                  <option className="bg-[var(--bg-secondary)]" key={env.id} value={env.id}>{env.name}</option>
               ))}
            </select>
            <button 
               onClick={openEnvManager}
               className="px-2 h-full flex items-center justify-center hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors rounded-r"
               title="Manage Environments"
            >
               <Settings2 size={12} />
            </button>
        </div>

        <div className="text-xs text-[var(--accent-cyan)] font-medium border border-[var(--accent-cyan)] rounded px-3 py-1.5 bg-cyan-900 bg-opacity-20 cursor-default">
           {activeWorkspace ? activeWorkspace.name : 'Loading Workspace...'}
        </div>

        {/* Profile Dropdown */}
        <div className="relative ml-2" ref={profileMenuRef}>
           <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] overflow-hidden hover:border-[var(--accent-cyan)] transition-colors"
           >
              {user?.profile_photo ? (
                 <img src={user.profile_photo} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                 <User size={16} className="text-[var(--text-secondary)]" />
              )}
           </button>

           {showProfileMenu && (
              <div className="absolute right-0 top-10 w-56 glass-panel shadow-2xl z-[100] flex flex-col py-1 overflow-hidden animate-in fade-in slide-in-from-top-2 text-sm font-medium">
                 <div className="px-4 py-3 border-b border-[var(--border-color)] mb-1 flex flex-col gap-0.5">
                    <span className="text-[var(--text-primary)] font-bold truncate">Hello {user?.first_name || user?.username || 'User'}</span>
                    <span className="text-xs text-[var(--text-muted)] truncate">{user?.timezone || 'Timezone Not Set'}</span>
                 </div>
                 
                 <button 
                    className="flex items-center gap-2 px-4 py-2 hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    onClick={() => { setShowProfileMenu(false); onProfileClick?.(); }}
                 >
                    <User size={14} /> My Profile
                 </button>
                 
                 <button className="flex items-center gap-2 px-4 py-2 hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                    <Settings2 size={14} /> Settings
                 </button>

                 <div className="h-[1px] bg-[var(--border-color)] my-1"></div>

                 <button 
                    className="flex items-center justify-between px-4 py-2 hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    onClick={() => {
                        const newTheme = themeConfig.themeColor === 'dark' ? 'light' : 'dark';
                        setThemeConfig({ ...themeConfig, themeColor: newTheme });
                    }}
                 >
                    <span className="flex items-center gap-2">
                       {themeConfig?.themeColor === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
                       {themeConfig?.themeColor === 'dark' ? 'Dark Theme' : 'Light Theme'}
                    </span>
                    <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${themeConfig?.themeColor === 'dark' ? 'bg-[#06B6D4]' : 'bg-[var(--bg-tertiary)] border border-[var(--border-color)]'}`}>
                       <div className={`w-3 h-3 rounded-full bg-white transition-transform ${themeConfig?.themeColor === 'dark' ? 'translate-x-4' : 'translate-x-0'}`}></div>
                    </div>
                 </button>

                 <div className="h-[1px] bg-[var(--border-color)] my-1"></div>

                 {onLogout && (
                    <button 
                       className="flex items-center gap-2 px-4 py-2 hover:bg-red-500/10 text-red-400 hover:text-red-500 transition-colors"
                       onClick={() => { setShowProfileMenu(false); onLogout(); }}
                    >
                       <LogOut size={14} /> Logout
                    </button>
                 )}
              </div>
           )}
        </div>

      </div>
    </header>
  );
}

export default Header;
