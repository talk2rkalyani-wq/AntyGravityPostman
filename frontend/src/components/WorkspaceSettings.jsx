import React, { useState, useEffect } from 'react';
import { Lock, User, Moon, Sun } from 'lucide-react';

function WorkspaceSettings({ sidebarConfig, setSidebarConfig, themeConfig, setThemeConfig, onDeleteWorkspace, activeWorkspaceId, workspaces, fetchWorkspaces, currentUserId }) {
  const [localTheme, setLocalTheme] = useState(themeConfig);
  const [members, setMembers] = useState([]);
  const [inviteIdentifier, setInviteIdentifier] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');

  const activeWorkspace = workspaces?.find(w => w.id === activeWorkspaceId);
  const isPersonal = !activeWorkspace || activeWorkspace.type === 'personal';
  const currentUserMember = members.find(m => m.user_id === currentUserId);
  const isAdmin = activeWorkspace?.owner_id === currentUserId || currentUserMember?.role === 'admin';

  const fetchMembers = async () => {
     if (activeWorkspaceId === 'default' || isPersonal) return;
     try {
        const res = await fetch(`/api/workspaces/${activeWorkspaceId}/members`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
        if (res.ok) setMembers(await res.json());
     } catch(e) {}
  };

  useEffect(() => {
     if (activeWorkspaceId && activeWorkspaceId !== 'default') fetchMembers();
     else setMembers([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkspaceId]);

  useEffect(() => {
    setLocalTheme(themeConfig);
  }, [themeConfig]);

  const handleInvite = async () => {
     if (!inviteIdentifier) return;
     try {
       const res = await fetch(`/api/workspaces/${activeWorkspaceId}/members`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
         body: JSON.stringify({ identifier: inviteIdentifier, role: inviteRole })
       });
       if(res.ok) {
         setInviteIdentifier('');
         fetchMembers();
       } else {
         const data = await res.json();
         alert(data.error || 'Failed to invite user');
       }
     } catch(e) {}
  };

  const handleRoleChange = async (userId, role) => {
     try {
        await fetch(`/api/workspaces/${activeWorkspaceId}/members/${userId}/role`, {
           method: 'PUT',
           headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
           body: JSON.stringify({ role })
        });
        fetchMembers();
     } catch(e){}
  };

  const handleRemoveMember = async (userId) => {
     if(!confirm('Remove this member?')) return;
     try {
        await fetch(`/api/workspaces/${activeWorkspaceId}/members/${userId}`, {
           method: 'DELETE',
           headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        fetchMembers();
     } catch(e){}
  };

  const sidebarItems = [
    { id: 'Collections', label: 'Collections' },
    { id: 'Environments', label: 'Environments' },
    { id: 'History', label: 'History' },
    { id: 'APIs', label: 'APIs' },
    { id: 'Mock servers', label: 'Mock servers' },
    { id: 'Specs', label: 'Specs' },
    { id: 'Monitors', label: 'Monitors' },
    { id: 'Flows', label: 'Flows' },
    { id: 'Files', label: 'Files' },
    { id: 'Insights', label: 'Insights' }
  ];

  const handleSidebarToggle = (id) => {
    setSidebarConfig(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleApplyTheme = () => {
    setThemeConfig(localTheme);
  };

  const handleResetTheme = () => {
    const defaultTheme = {
      accentColor: '#06B6D4',
      themeColor: 'dark'
    };
    setLocalTheme(defaultTheme);
    setThemeConfig(defaultTheme);
  };

  return (
    <div className="flex-1 w-full bg-[var(--bg-primary)] overflow-y-auto text-[var(--text-primary)]">
      <div className="max-w-3xl mx-auto py-10 px-6">
        <h1 className="text-2xl font-bold mb-8">Workspace settings</h1>

        <div className="mb-10">
          <h2 className="text-sm font-semibold mb-3">Workspace type & Name</h2>
          <div className="border border-[var(--border-color)] rounded-lg p-4 flex items-center justify-between bg-[var(--bg-secondary)]">
            <div className="flex items-start gap-3">
              <Lock size={18} className="text-[var(--text-muted)] mt-0.5" />
              <div>
                <h3 className="text-sm font-medium">{activeWorkspace?.name || 'Personal Workspace'} <span className="ml-2 text-[10px] bg-[var(--bg-tertiary)] px-2 py-0.5 rounded uppercase tracking-wider">{activeWorkspace?.type || 'personal'}</span></h3>
                <p className="text-xs text-[var(--text-muted)] mt-1">{isPersonal ? 'For your eyes only.' : 'Collaborate with your team.'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* People in this workspace */}
        <div className="mb-10 pb-6 border-b border-[var(--border-color)]">
          <h2 className="text-sm font-semibold mb-3">People in this workspace</h2>
          
          {isPersonal ? (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-orange-400 to-red-500 flex items-center justify-center text-[10px] font-bold text-white">
                <User size={12} />
              </div>
              <span className="text-sm">You (Personal Workspace)</span>
            </div>
          ) : (
             <div className="flex flex-col gap-4">
                {isAdmin && (
                   <div className="flex items-center gap-3 p-3 bg-[var(--bg-secondary)] rounded-md border border-[var(--border-color)] mb-2">
                      <input 
                         type="text" 
                         placeholder="Invite by Username or Email" 
                         className="flex-1 bg-transparent text-sm border-none outline-none text-[var(--text-primary)]" 
                         value={inviteIdentifier}
                         onChange={(e) => setInviteIdentifier(e.target.value)}
                      />
                      <select 
                         className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-sm rounded px-2 py-1 outline-none text-[var(--text-primary)]"
                         value={inviteRole}
                         onChange={(e) => setInviteRole(e.target.value)}
                      >
                         <option value="viewer">Viewer</option>
                         <option value="editor">Editor</option>
                         <option value="admin">Admin</option>
                      </select>
                      <button onClick={handleInvite} className="btn-primary py-1 px-3 text-sm">Invite</button>
                   </div>
                )}
                
                <div className="flex flex-col gap-3">
                   {members.map(m => (
                      <div key={m.id} className="flex items-center justify-between p-3 border border-[var(--border-color)] rounded bg-[var(--bg-secondary)]">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-400 to-indigo-500 flex items-center justify-center text-[12px] font-bold text-white uppercase">
                               {m.name.substring(0,2)}
                            </div>
                            <div>
                               <div className="text-sm font-medium">{m.name} {m.user_id === currentUserId ? '(You)' : ''}</div>
                               <div className="text-xs text-[var(--text-muted)]">{m.email}</div>
                            </div>
                         </div>
                         <div className="flex items-center gap-3">
                            {isAdmin && m.user_id !== activeWorkspace?.owner_id ? (
                               <select 
                                  className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-xs rounded px-2 py-1 outline-none text-[var(--text-primary)]"
                                  value={m.role}
                                  onChange={(e) => handleRoleChange(m.user_id, e.target.value)}
                               >
                                  <option value="viewer">Viewer</option>
                                  <option value="editor">Editor</option>
                                  <option value="admin">Admin</option>
                               </select>
                            ) : (
                               <span className="text-xs text-[var(--text-muted)] uppercase">{m.user_id === activeWorkspace?.owner_id ? 'Owner' : m.role}</span>
                            )}
                            
                            {isAdmin && m.user_id !== activeWorkspace?.owner_id && (
                               <button onClick={() => handleRemoveMember(m.user_id)} className="text-red-500 text-xs hover:underline">Remove</button>
                            )}
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}
        </div>

        {/* Configure sidebar */}
        <div className="mb-10 pb-6 border-b border-[var(--border-color)]">
          <h2 className="text-sm font-semibold mb-1">Configure sidebar</h2>
          <p className="text-xs text-[var(--text-muted)] mb-4">Show or hide the elements that are visible to everyone in this workspace.</p>
          
          <div className="flex flex-col gap-4">
            {sidebarItems.map(item => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[var(--text-secondary)]">{item.label}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={sidebarConfig[item.id] ?? false}
                    onChange={() => handleSidebarToggle(item.id)}
                  />
                  <div className="w-9 h-5 bg-[var(--bg-tertiary)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--accent-cyan)]"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Workspace theme */}
        <div className="mb-10 pb-6 border-b border-[var(--border-color)]">
          <h2 className="text-sm font-semibold mb-1">Workspace theme</h2>
          <p className="text-xs text-[var(--text-muted)] mb-6">Make the workspace unique by having its theme reflect its content and your team's identity. These changes will reflect for all your members.</p>
          
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between max-w-sm">
              <div>
                <h3 className="text-sm font-medium">Accent color</h3>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">Color for buttons and highlights.</p>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="color" 
                  value={localTheme.accentColor} 
                  onChange={(e) => setLocalTheme(prev => ({...prev, accentColor: e.target.value}))}
                  className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                />
                <span className="text-xs font-mono bg-[var(--bg-tertiary)] px-2 py-1 rounded">{localTheme.accentColor}</span>
              </div>
            </div>

            <div className="flex items-center justify-between max-w-sm">
              <div>
                <h3 className="text-sm font-medium">Theme color</h3>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">Overall interface color.</p>
              </div>
              <div className="flex gap-2">
                 <button 
                   className={`p-2 rounded-md border ${localTheme.themeColor === 'light' ? 'border-[var(--accent-cyan)] text-[var(--accent-cyan)]' : 'border-[var(--border-color)] text-[var(--text-muted)]'}`}
                   onClick={() => setLocalTheme(prev => ({...prev, themeColor: 'light'}))}
                 >
                    <Sun size={16} />
                 </button>
                 <button 
                   className={`p-2 rounded-md border ${localTheme.themeColor === 'dark' ? 'border-[var(--accent-cyan)] text-[var(--accent-cyan)]' : 'border-[var(--border-color)] text-[var(--text-muted)]'}`}
                   onClick={() => setLocalTheme(prev => ({...prev, themeColor: 'dark'}))}
                 >
                    <Moon size={16} />
                 </button>
              </div>
            </div>

            {/* Preview Component */}
            <div className={`mt-4 p-6 rounded-xl border border-[var(--border-color)] flex items-center justify-center ${localTheme.themeColor === 'light' ? 'bg-gray-100' : 'bg-slate-900'}`}>
              <div className={`w-80 h-48 rounded-lg border shadow-xl flex flex-col overflow-hidden ${localTheme.themeColor === 'light' ? 'bg-white border-gray-200' : 'bg-[#0F172A] border-slate-700'}`}>
                 <div className={`h-8 border-b flex items-center px-3 gap-2 ${localTheme.themeColor === 'light' ? 'border-gray-200 bg-gray-50' : 'border-slate-800 bg-[#1E293B]'}`}>
                    <div className="w-16 h-3 rounded bg-slate-300 dark:bg-slate-700"></div>
                    <div className="w-8 h-3 rounded bg-slate-300 dark:bg-slate-700"></div>
                 </div>
                 <div className="flex flex-1">
                    <div className={`w-20 border-r p-2 flex flex-col gap-2 ${localTheme.themeColor === 'light' ? 'border-gray-200' : 'border-slate-800'}`}>
                       <div className="w-full h-2 rounded bg-slate-300 dark:bg-slate-700"></div>
                       <div className="w-3/4 h-2 rounded bg-slate-300 dark:bg-slate-700"></div>
                    </div>
                    <div className="flex-1 p-3">
                       <div className="w-full h-6 rounded flex items-center mb-3" style={{ border: `1px solid ${localTheme.accentColor}` }}>
                          <div className="w-10 h-full rounded-l font-bold text-[8px] flex items-center justify-center text-white" style={{ backgroundColor: localTheme.accentColor }}>GET</div>
                          <div className={`h-full flex-1 ${localTheme.themeColor === 'light' ? 'bg-white' : 'bg-[#0F172A]'}`}></div>
                          <div className="w-12 h-full rounded-r flex items-center justify-center text-[8px] font-bold text-white" style={{ backgroundColor: localTheme.accentColor }}>Send</div>
                       </div>
                       <div className="w-1/2 h-2 rounded bg-slate-300 dark:bg-slate-700 mb-2"></div>
                       <div className="w-full h-12 border rounded border-dashed opacity-50" style={{ borderColor: localTheme.accentColor }}></div>
                    </div>
                 </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-2">
              <button className="btn-primary" style={{ background: localTheme.accentColor }} onClick={handleApplyTheme}>Apply Theme</button>
              <button className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]" onClick={handleResetTheme}>Reset to Default</button>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold mb-1">{isAdmin ? 'Delete workspace' : 'Leave workspace'}</h2>
          <p className="text-xs text-[var(--text-muted)] mb-4">{isAdmin ? 'Once deleted, a workspace is gone forever along with its data.' : 'If you leave, you must be reinvited to join.'}</p>
          <button 
             className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded transition-colors"
             onClick={isAdmin ? onDeleteWorkspace : () => handleRemoveMember(currentUserId).then(() => { fetchWorkspaces(); window.location.reload();})}
          >
             {isAdmin ? 'Delete Workspace' : 'Leave Workspace'}
          </button>
        </div>
        
      </div>
    </div>
  );
}

export default WorkspaceSettings;
