import React, { useState, useEffect } from 'react';
import { Plus, Trash, X, Save } from 'lucide-react';

function EnvironmentManager({ onClose, environments, fetchEnvironments }) {
  const [activeEnv, setActiveEnv] = useState(null);
  const [formData, setFormData] = useState([]);
  const [name, setName] = useState('');

  useEffect(() => {
    if (environments.length > 0 && !activeEnv) {
      handleSelectEnv(environments[0]);
    }
  }, [environments]);

  const handleSelectEnv = (env) => {
    if (activeEnv?.id === env.id) return;
    setActiveEnv(env);
    setName(env.name);
    try {
      setFormData(typeof env.data === 'string' ? JSON.parse(env.data) : env.data);
    } catch {
      setFormData([{ key: '', value: '' }]);
    }
  };

  const handleCreate = async () => {
    const newName = 'New Environment';
    const newData = [{ key: '', value: '' }];
    const res = await fetch('/api/environments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ name: newName, data: newData })
    });
    if (res.ok) {
      await fetchEnvironments();
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Delete this environment?")) return;
    await fetch(`/api/environments/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (activeEnv?.id === id) {
      setActiveEnv(null);
      setFormData([]);
    }
    await fetchEnvironments();
  };

  const handleSave = async () => {
    if (!activeEnv) return;
    const cleanData = formData.filter(item => item.key.trim() !== '');
    if (cleanData.length === 0) cleanData.push({ key: '', value: '' });

    await fetch(`/api/environments/${activeEnv.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ name, data: cleanData })
    });
    await fetchEnvironments();
  };

  const updateRow = (index, field, value) => {
    const newData = [...formData];
    newData[index][field] = value;
    if (index === newData.length - 1 && value.trim() !== '') {
      newData.push({ key: '', value: '' });
    }
    setFormData(newData);
  };

  const removeRow = (index) => {
    let newData = [...formData];
    newData.splice(index, 1);
    if (newData.length === 0) newData.push({ key: '', value: '' });
    setFormData(newData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[99999] p-4">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl relative">
        <div className="flex justify-between items-center p-4 border-b border-[var(--border-color)] bg-[var(--bg-primary)] rounded-t-lg">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Manage Environments</h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-white transition-colors">
             <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
           {/* Sidebar */}
           <div className="w-1/3 border-r border-[var(--border-color)] flex flex-col bg-[var(--bg-primary)]">
              <div className="p-2 border-b border-[var(--border-color)] flex justify-end">
                 <button 
                   className="p-1 hover:bg-[var(--bg-tertiary)] rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                   onClick={handleCreate}
                   title="New Environment"
                 >
                   <Plus size={16} />
                 </button>
              </div>
              <div className="overflow-y-auto flex-1 p-2 flex flex-col gap-1 hide-scrollbar">
                 {environments.length === 0 ? (
                    <div className="text-center text-[var(--text-muted)] text-sm p-4">No environments</div>
                 ) : (
                    environments.map(env => (
                       <div 
                         key={env.id}
                         onClick={() => handleSelectEnv(env)}
                         className={`flex items-center justify-between p-2 rounded cursor-pointer text-sm font-medium transition-colors ${activeEnv?.id === env.id ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-color)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:bg-opacity-50 border border-transparent'}`}
                       >
                         <span>{env.name}</span>
                         <button className="text-[var(--text-muted)] hover:text-red-500 p-1 rounded" onClick={(e) => handleDelete(e, env.id)}>
                            <Trash size={14} />
                         </button>
                       </div>
                    ))
                 )}
              </div>
           </div>

           {/* Editor */}
           <div className="w-2/3 flex flex-col bg-[var(--bg-secondary)] overflow-hidden">
              {activeEnv ? (
                 <>
                   <div className="p-4 border-b border-[var(--border-color)] flex items-center gap-4 bg-[var(--bg-primary)]">
                      <input 
                         className="bg-transparent border-none text-lg font-semibold outline-none text-[var(--text-primary)] flex-1"
                         value={name}
                         onChange={e => setName(e.target.value)}
                         placeholder="Environment Name"
                      />
                      <button 
                         className="flex items-center gap-1 bg-[var(--accent-cyan)] hover:bg-[var(--accent-cyan-hover)] text-white px-3 py-1.5 rounded text-sm font-medium transition-colors shadow-sm"
                         onClick={handleSave}
                      >
                         <Save size={14} /> Save
                      </button>
                   </div>
                   <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                      <table className="w-full text-left text-sm text-[var(--text-secondary)] border-collapse">
                         <thead>
                            <tr className="border-b border-[var(--border-color)]">
                               <th className="pb-2 font-medium w-[45%]">VARIABLE</th>
                               <th className="pb-2 font-medium w-[45%]">VALUE</th>
                               <th className="pb-2 font-medium w-[10%] text-center"></th>
                            </tr>
                         </thead>
                         <tbody>
                            {formData.map((row, idx) => (
                               <tr key={idx} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] transition-colors group">
                                  <td className="p-0 border-r border-[var(--border-color)]">
                                     <input 
                                       className="w-full bg-transparent outline-none p-2 text-[var(--text-primary)] font-mono text-xs placeholder:opacity-40"
                                       placeholder="New variable"
                                       value={row.key}
                                       onChange={(e) => updateRow(idx, 'key', e.target.value)}
                                     />
                                  </td>
                                  <td className="p-0 border-r border-[var(--border-color)]">
                                     <input 
                                       className="w-full bg-transparent outline-none p-2 text-[var(--text-primary)] font-mono text-xs placeholder:opacity-40"
                                       placeholder="Value"
                                       value={row.value || ''}
                                       onChange={(e) => updateRow(idx, 'value', e.target.value)}
                                     />
                                  </td>
                                  <td className="p-0 text-center align-middle">
                                     <button 
                                       className="p-1.5 text-[var(--text-muted)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity mx-auto rounded"
                                       onClick={() => removeRow(idx)}
                                     >
                                        <Trash size={14} />
                                     </button>
                                  </td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                 </>
              ) : (
                 <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] text-sm">
                    Select or create an environment
                 </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}

export default EnvironmentManager;
