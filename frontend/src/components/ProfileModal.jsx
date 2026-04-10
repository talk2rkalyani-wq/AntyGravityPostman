import React, { useState, useRef } from 'react';
import { Edit2, Check, X, Camera, User } from 'lucide-react';

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

  const fullName = `${formData.first_name} ${formData.last_name}`.trim();

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-[var(--bg-primary)] animate-in fade-in zoom-in-95 duration-200 pb-10">
       <div className="w-full max-w-7xl mx-auto p-6 flex-1 flex flex-col pt-8">
          <button 
             onClick={onClose}
             className="mr-auto mb-6 flex items-center gap-2 text-sm text-[var(--accent-cyan)] hover:opacity-80 font-medium transition-opacity"
          >
             <ArrowLeft size={16} /> Back to Dashboard
          </button>

          <div className="bg-[var(--bg-secondary)] rounded-2xl shadow-sm border border-[var(--border-color)] p-8 flex flex-col md:flex-row gap-12 relative flex-1 mb-8">
             
             {/* Left Column: Avatar */}
             <div className="flex flex-col items-center w-full md:w-1/4 pt-8 border-r border-[var(--border-color)] border-opacity-50">
                <div className="relative group mb-6">
                   <div className="w-40 h-40 rounded-full border-[3px] border-[var(--accent-cyan)] relative overflow-visible bg-[var(--bg-tertiary)] flex items-center justify-center shadow-lg">
                      {formData.profile_photo ? (
                        <img src={formData.profile_photo} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <User size={64} className="text-[var(--text-muted)]" />
                      )}
                      
                      {/* Green Camera Icon */}
                      <div 
                         className="absolute bottom-0 right-2 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-[var(--bg-secondary)] cursor-pointer hover:bg-emerald-600 transition-colors z-10"
                         onClick={() => fileInputRef.current?.click()}
                         title="Update Profile Picture"
                      >
                         <Camera size={16} className="text-white" />
                      </div>
                      <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} />
                   </div>
                </div>
                <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-wide">
                   {fullName || user?.username}
                </h2>
             </div>

             {/* Right Column: Form */}
             <div className="flex-1 relative pt-8 md:pl-4">
                {/* Actions Button */}
                <div className="absolute top-0 right-0 flex gap-3">
                   {!isEditing ? (
                      <button 
                         onClick={() => setIsEditing(true)}
                         className="w-10 h-10 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white flex items-center justify-center shadow-md transition-transform hover:scale-105"
                      >
                         <Edit2 size={16} fill="currentColor" />
                      </button>
                   ) : (
                      <>
                         <button 
                            onClick={handleSave}
                            className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-md transition-transform hover:scale-105"
                            title="Save Changes"
                         >
                            <Check strokeWidth={3} size={20} />
                         </button>
                         <button 
                            onClick={handleCancel}
                            className="w-10 h-10 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-md transition-transform hover:scale-105"
                            title="Cancel"
                         >
                            <X strokeWidth={3} size={20} />
                         </button>
                      </>
                   )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-10 gap-x-8 pr-16 mt-4">
                   
                   <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[var(--text-secondary)]">First Name <span className="text-red-500">*</span></label>
                      {isEditing ? (
                         <input name="first_name" value={formData.first_name} onChange={handleInputChange} className="px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-md focus:outline-none focus:border-[var(--accent-cyan)] text-[var(--text-primary)] text-sm shadow-inner" placeholder="e.g. John" />
                      ) : (
                         <div className="text-[var(--text-primary)] font-medium text-sm h-9 flex items-center">{formData.first_name || <span className="text-[var(--text-muted)] italic">Not set</span>}</div>
                      )}
                   </div>

                   <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[var(--text-secondary)]">Last Name</label>
                      {isEditing ? (
                         <input name="last_name" value={formData.last_name} onChange={handleInputChange} className="px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-md focus:outline-none focus:border-[var(--accent-cyan)] text-[var(--text-primary)] text-sm shadow-inner" placeholder="e.g. Doe" />
                      ) : (
                         <div className="text-[var(--text-primary)] font-medium text-sm h-9 flex items-center">{formData.last_name || <span className="text-[var(--text-muted)] italic">Not set</span>}</div>
                      )}
                   </div>

                   <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[var(--text-secondary)]">Contact Number</label>
                      {isEditing ? (
                         <input name="contact_number" value={formData.contact_number} onChange={handleInputChange} className="px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-md focus:outline-none focus:border-[var(--accent-cyan)] text-[var(--text-primary)] text-sm shadow-inner" placeholder="e.g. +91 9041210040" />
                      ) : (
                         <div className="text-[var(--text-primary)] font-medium text-sm h-9 flex items-center gap-2">
                            {formData.contact_number ? (
                               <>
                                 {formData.contact_number}
                               </>
                            ) : <span className="text-[var(--text-muted)] italic">Not set</span>}
                         </div>
                      )}
                   </div>

                   <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[var(--text-secondary)]">User Role</label>
                      <div className="text-[var(--text-primary)] font-medium text-sm h-9 flex items-center opacity-90 cursor-not-allowed">
                         {user?.role || 'Organization Admin'}
                      </div>
                   </div>

                   <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[var(--text-secondary)]">Username/Email</label>
                      <div className="text-[var(--text-primary)] font-medium text-sm h-9 flex items-center opacity-90 cursor-not-allowed">
                         {user?.email || user?.username}
                      </div>
                   </div>

                   <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[var(--text-secondary)]">Time Zone</label>
                      {isEditing ? (
                         <select name="timezone" value={formData.timezone} onChange={handleInputChange} className="px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-md focus:outline-none focus:border-[var(--accent-cyan)] text-[var(--text-primary)] text-sm shadow-inner cursor-pointer">
                            <option value="UTC">UTC (Universal Coordinated Time)</option>
                            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                            <option value="America/New_York">America/New_York (EST)</option>
                            <option value="Europe/London">Europe/London (GMT)</option>
                            <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
                         </select>
                      ) : (
                         <div className="text-[var(--text-primary)] font-medium text-sm h-9 flex items-center">{formData.timezone}</div>
                      )}
                   </div>

                </div>
             </div>
          </div>
       </div>

    </div>
  );
}

