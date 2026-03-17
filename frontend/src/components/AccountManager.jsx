import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, User, Info, MoreHorizontal, Trash } from 'lucide-react';

function AccountManager({ onClose }) {
  const [activeTab, setActiveTab] = useState('Members');
  const [search, setSearch] = useState('');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('READ ONLY');
  const [openMenuId, setOpenMenuId] = useState(null);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/members');
      const data = await res.json();
      setMembers(data);
    } catch (error) {
      console.error("Failed to fetch members", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) return;
    try {
      await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: inviteName, email: inviteEmail, role: inviteRole })
      });
      setShowInviteModal(false);
      setInviteName('');
      setInviteEmail('');
      setInviteRole('READ ONLY');
      fetchMembers();
    } catch (error) {
      alert("Failed to invite member: " + error.message);
    }
  };

  const handleRoleChange = async (id, newRole) => {
    try {
      setMembers(members.map(m => m.id === id ? { ...m, role: newRole } : m));
      await fetch(`/api/members/${id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
    } catch (error) {
      console.error(error);
      fetchMembers(); // Revert on failure
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to remove this member?")) return;
    try {
      setMembers(members.filter(m => m.id !== id));
      await fetch(`/api/members/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error(error);
      fetchMembers();
    }
    setOpenMenuId(null);
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto bg-white text-gray-900 absolute inset-0 z-50">
      
      {/* Invite Modal */}
      {showInviteModal && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
           <form onSubmit={handleInvite} className="bg-white p-6 rounded-lg shadow-xl w-[400px]">
              <h2 className="text-xl font-bold mb-4">Invite People</h2>
              <div className="mb-4">
                 <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                 <input autoFocus required type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-orange-500" value={inviteName} onChange={e => setInviteName(e.target.value)} />
              </div>
              <div className="mb-4">
                 <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                 <input required type="email" className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-orange-500" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
              </div>
              <div className="mb-6">
                 <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                 <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-orange-500" value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
                    <option value="READ ONLY">READ ONLY</option>
                    <option value="ADMIN">ADMIN</option>
                 </select>
              </div>
              <div className="flex justify-end gap-3">
                 <button type="button" onClick={() => setShowInviteModal(false)} className="px-4 py-2 text-sm font-medium border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
                 <button type="submit" className="px-4 py-2 text-sm font-medium bg-orange-500 text-white rounded hover:bg-orange-600">Send Invite</button>
              </div>
           </form>
        </div>
      )}

      <div className="max-w-5xl mx-auto p-8">
        <div className="flex-between mb-6 border-b border-gray-200 pb-4">
          <h1 className="text-3xl font-bold text-gray-900">Members</h1>
          <div className="flex gap-4">
             <button className="px-4 py-2 border border-gray-300 rounded font-medium hover:bg-gray-50 text-sm" onClick={onClose}>
                Back to Workspace
             </button>
             <button onClick={() => setShowInviteModal(true)} className="px-4 py-2 bg-orange-500 text-white rounded font-medium hover:bg-orange-600 text-sm">
               Invite People
             </button>
          </div>
        </div>

        <div className="flex gap-6 mb-6">
          <button 
            className={`pb-2 font-medium text-sm ${activeTab === 'Members' ? 'border-b-2 border-orange-500 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('Members')}
          >
            Members
          </button>
          <button 
            className={`pb-2 font-medium text-sm ${activeTab === 'Invites' ? 'border-b-2 border-orange-500 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('Invites')}
          >
            Invites and requests
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-6 flex gap-16 border border-gray-100">
           <div>
              <div className="text-gray-500 text-sm mb-1">Team members</div>
              <div className="text-2xl font-bold">{members.length} / {members.length}</div>
           </div>
           <div>
              <div className="text-gray-500 text-sm flex items-center gap-1 mb-1">
                 Support users <Info size={14} className="text-gray-400" />
              </div>
              <div className="text-2xl font-bold">0</div>
           </div>
        </div>

        <div className="flex gap-4 mb-6">
           <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search by name or email" 
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 text-sm bg-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
           </div>
           <div className="relative w-48">
              <select className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-md outline-none appearance-none text-sm text-gray-700 bg-white cursor-pointer hover:border-gray-400">
                 <option>Role</option>
                 <option>ADMIN</option>
                 <option>READ ONLY</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
           </div>
        </div>

        <div className="mb-2 flex-between text-xs font-bold text-gray-500 px-2 mt-8">
           <div className="w-1/2">Name ({filteredMembers.length})</div>
           <div className="w-1/2 text-left">Roles</div>
        </div>

        <div className="border-t border-gray-200 min-h-[300px]">
           {loading ? (
             <div className="py-8 text-center text-gray-500 text-sm">Loading members...</div>
           ) : filteredMembers.length === 0 ? (
             <div className="py-8 text-center text-gray-500 text-sm">No members found.</div>
           ) : (
             filteredMembers.map(member => (
                <div key={member.id} className="flex-between py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors px-2 relative">
                   <div className="w-1/2 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg bg-orange-100 text-orange-700">
                         {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                         <div className="font-bold text-gray-900 text-sm">{member.name}</div>
                         <div className="text-gray-500 text-xs">{member.email}</div>
                      </div>
                   </div>
                   <div className="w-1/2 flex-between pr-4 items-center">
                      <select 
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value)}
                        className={`text-xs font-bold px-2 py-1 rounded border outline-none cursor-pointer hover:border-gray-400 transition-colors ${member.role === 'ADMIN' ? 'border-green-200 text-green-700 bg-green-50' : 'border-gray-200 text-gray-500 bg-gray-50'}`}
                      >
                         <option value="READ ONLY">READ ONLY</option>
                         <option value="ADMIN">ADMIN</option>
                      </select>
                      
                      <div className="relative">
                        <button onClick={() => setOpenMenuId(openMenuId === member.id ? null : member.id)} className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-200">
                           <MoreHorizontal size={16} />
                        </button>
                        {openMenuId === member.id && (
                          <div className="absolute right-0 top-8 bg-white border border-gray-200 shadow-lg rounded w-32 z-10 py-1">
                             <div 
                               className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer flex items-center gap-2"
                               onClick={() => handleDelete(member.id)}
                             >
                               <Trash size={14} /> Remove
                             </div>
                          </div>
                        )}
                      </div>
                   </div>
                </div>
             ))
           )}
        </div>
      </div>
    </div>
  );
}

export default AccountManager;
