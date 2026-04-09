import React, { useState, useRef } from 'react';
import { ArrowLeft, Edit2, Check, X, Camera, User } from 'lucide-react';

export default function ProfileModal({ user, setUser, onClose }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    contact_number: user?.contact_number || '',
    timezone: user?.timezone || 'UTC',
    profile_photo: user?.profile_photo || ''
  });
  
  const fileInputRef = useRef(null);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profile_photo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Failed to update profile", err);
    }
  };

  const handleCancel = () => {
    setFormData({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      contact_number: user?.contact_number || '',
      timezone: user?.timezone || 'UTC',
      profile_photo: user?.profile_photo || ''
    });
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[var(--bg-secondary)] flex flex-col overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
       <div className="h-16 border-b border-[var(--border-color)] bg-[var(--bg-primary)] px-6 flex items-center shrink-0 shadow-sm sticky top-0 z-10">
          <button 
             onClick={onClose}
             className="flex items-center gap-2 text-[var(--accent-cyan)] hover:text-[var(--accent-cyan-hover)] transition-colors font-medium mr-auto"
          >
             <ArrowLeft size={18} /> Back to Dashboard
          </button>
          
          <div className="flex items-center gap-4 text-sm font-medium">
             <div className="flex flex-col text-right">
                <span className="text-[var(--text-secondary)]">{formData.timezone}</span>
                <span className="text-xs text-[var(--text-muted)]">Timezone</span>
             </div>
             <div className="w-[1px] h-8 bg-[var(--border-color)]"></div>
             <span className="text-[var(--text-primary)]">Hello {user?.first_name || user?.username} <ChevronDownIcon /></span>
             <div className="w-10 h-10 rounded-full border-2 border-[var(--border-color)] overflow-hidden bg-[var(--bg-tertiary)] flex items-center justify-center">
                {formData.profile_photo ? (
                   <img src={formData.profile_photo} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                   <User size={20} className="text-[var(--text-secondary)]" />
                )}
             </div>
          </div>
       </div>

       <div className="flex-1 flex justify-center py-12 px-4">
          <div className="w-full max-w-5xl bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl shadow-xl flex flex-col md:flex-row shadow-glow overflow-hidden h-max">
             
             {/* Left Column: Avatar */}
             <div className="w-full md:w-1/3 p-10 flex flex-col items-center justify-center border-r border-[var(--border-color)] bg-gradient-to-b from-[var(--bg-secondary)] to-[var(--bg-primary)]">
                <div className="relative group mb-6">
                   <div className="w-40 h-40 rounded-full border-4 border-[var(--accent-cyan)] p-1">
                      <div className="w-full h-full rounded-full bg-[var(--bg-tertiary)] overflow-hidden flex items-center justify-center relative">
                         {formData.profile_photo ? (
                           <img src={formData.profile_photo} alt="Avatar" className="w-full h-full object-cover" />
                         ) : (
                           <User size={64} className="text-[var(--text-muted)]" />
                         )}
                         {isEditing && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                               <Camera size={32} className="text-white" />
                            </div>
                         )}
                      </div>
                   </div>
                   <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} />
                </div>
                <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-wide">
                   {formData.first_name || formData.last_name ? `${formData.first_name} ${formData.last_name}` : user?.username}
                </h2>
             </div>

             {/* Right Column: Form */}
             <div className="w-full md:w-2/3 p-10 relative bg-[var(--bg-primary)]">
                {/* Actions Button */}
                <div className="absolute top-8 right-8 flex gap-2">
                   {!isEditing ? (
                      <button 
                         onClick={() => setIsEditing(true)}
                         className="w-10 h-10 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105"
                      >
                         <Edit2 size={16} fill="currentColor" />
                      </button>
                   ) : (
                      <>
                         <button 
                            onClick={handleSave}
                            className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105"
                         >
                            <Check strokeWidth={3} size={20} />
                         </button>
                         <button 
                            onClick={handleCancel}
                            className="w-10 h-10 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105"
                         >
                            <X strokeWidth={3} size={20} />
                         </button>
                      </>
                   )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                   
                   <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[var(--text-secondary)]">First Name <span className="text-red-500">*</span></label>
                      {isEditing ? (
                         <input name="first_name" value={formData.first_name} onChange={handleInputChange} className="input-field shadow-inner font-sans" placeholder="e.g. John" />
                      ) : (
                         <div className="text-[var(--text-primary)] font-medium h-10 flex items-center px-2">{formData.first_name || <span className="text-[var(--text-muted)] italic">Not set</span>}</div>
                      )}
                   </div>

                   <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[var(--text-secondary)]">Last Name</label>
                      {isEditing ? (
                         <input name="last_name" value={formData.last_name} onChange={handleInputChange} className="input-field shadow-inner font-sans" placeholder="e.g. Doe" />
                      ) : (
                         <div className="text-[var(--text-primary)] font-medium h-10 flex items-center px-2">{formData.last_name || <span className="text-[var(--text-muted)] italic">Not set</span>}</div>
                      )}
                   </div>

                   <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[var(--text-secondary)]">Contact Number</label>
                      {isEditing ? (
                         <input name="contact_number" value={formData.contact_number} onChange={handleInputChange} className="input-field shadow-inner font-sans" placeholder="e.g. +1 555 123 4567" />
                      ) : (
                         <div className="text-[var(--text-primary)] font-medium h-10 flex items-center px-2">{formData.contact_number || <span className="text-[var(--text-muted)] italic">Not set</span>}</div>
                      )}
                   </div>

                   <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[var(--text-secondary)]">User Role</label>
                      <div className="text-[var(--text-primary)] font-medium h-10 flex items-center px-2 opacity-80 cursor-not-allowed">
                         {user?.role || 'Organization Admin'}
                      </div>
                   </div>

                   <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[var(--text-secondary)]">Username/Email</label>
                      <div className="text-[var(--text-primary)] font-medium h-10 flex items-center px-2 opacity-80 cursor-not-allowed">
                         {user?.email || user?.username}
                      </div>
                   </div>

                   <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[var(--text-secondary)]">Time Zone</label>
                      {isEditing ? (
                         <select name="timezone" value={formData.timezone} onChange={handleInputChange} className="input-field shadow-inner font-sans cursor-pointer bg-[var(--bg-primary)]">
                            <option value="UTC">UTC (Universal Coordinated Time)</option>
                            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                            <option value="America/New_York">America/New_York (EST)</option>
                            <option value="Europe/London">Europe/London (GMT)</option>
                            <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
                         </select>
                      ) : (
                         <div className="text-[var(--text-primary)] font-medium h-10 flex items-center px-2">{formData.timezone}</div>
                      )}
                   </div>

                </div>
             </div>
          </div>
       </div>

    </div>
  );
}

const ChevronDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block ml-1 opacity-70"><polyline points="6 9 12 15 18 9"></polyline></svg>
);
