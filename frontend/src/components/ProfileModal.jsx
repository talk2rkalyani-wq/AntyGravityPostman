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
    <div className="fixed inset-0 z-[200] bg-[#F1F5F9] flex flex-col overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
       <div className="h-16 border-b border-gray-200 bg-white px-6 flex items-center shrink-0 shadow-sm sticky top-0 z-10">
          <div className="flex flex-col mr-auto">
             <span className="text-xl font-semibold text-[#1A365D]">Profile</span>
             <div className="flex items-center text-sm text-gray-500 gap-2 cursor-pointer hover:text-gray-800" onClick={onClose}>
                <span>Profile</span>
             </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm font-medium">
             <div className="flex flex-col text-right">
                <span className="text-gray-800">{formData.timezone}</span>
                <span className="text-xs text-gray-500">Timezone</span>
             </div>
             <div className="w-[1px] h-8 bg-gray-200"></div>
             <span className="text-gray-800 flex items-center">
                Hello {user?.first_name || user?.username} 
                <ChevronDownIcon />
             </span>
             <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-300">
                {formData.profile_photo ? (
                   <img src={formData.profile_photo} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                   <User size={20} className="text-gray-500" />
                )}
             </div>
          </div>
       </div>

       <div className="flex-1 w-full max-w-7xl mx-auto p-6">
          <button 
             onClick={onClose}
             className="mb-4 text-sm text-gray-500 hover:text-gray-800 font-medium transition-colors"
          >
             ← Back to Dashboard
          </button>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row gap-12 relative">
             
             {/* Left Column: Avatar */}
             <div className="flex flex-col items-center w-full md:w-1/4 pt-4">
                <div className="relative group mb-4">
                   <div className="w-40 h-40 rounded-full border-[5px] border-[#1A365D] relative overflow-visible bg-gray-100 flex items-center justify-center">
                      {formData.profile_photo ? (
                        <img src={formData.profile_photo} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <User size={64} className="text-gray-400" />
                      )}
                      
                      {/* Green Camera Icon */}
                      <div 
                         className="absolute bottom-0 right-2 w-10 h-10 bg-[#10B981] rounded-full flex items-center justify-center border-4 border-white cursor-pointer hover:bg-emerald-600 transition-colors z-10"
                         onClick={() => fileInputRef.current?.click()}
                         title="Update Profile Picture"
                      >
                         <Camera size={16} className="text-white" />
                      </div>
                      <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} />
                   </div>
                </div>
                <h2 className="text-lg font-semibold text-gray-800">
                   {fullName || user?.username}
                </h2>
             </div>

             {/* Right Column: Form */}
             <div className="flex-1 relative pt-4">
                {/* Actions Button */}
                <div className="absolute top-0 right-0 flex gap-3">
                   {!isEditing ? (
                      <button 
                         onClick={() => setIsEditing(true)}
                         className="w-10 h-10 rounded-full bg-[#5C6BFF] hover:bg-indigo-600 text-white flex items-center justify-center shadow-md transition-transform hover:scale-105"
                      >
                         <Edit2 size={18} fill="currentColor" />
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-y-10 gap-x-8 pr-16">
                   
                   <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-[#1A365D]">First Name <span className="text-red-500">*</span></label>
                      {isEditing ? (
                         <input name="first_name" value={formData.first_name} onChange={handleInputChange} className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500 bg-white text-gray-800 text-sm" placeholder="e.g. John" />
                      ) : (
                         <div className="text-gray-500 text-sm h-9 flex items-center">{formData.first_name || '-'}</div>
                      )}
                   </div>

                   <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-[#1A365D]">Last Name</label>
                      {isEditing ? (
                         <input name="last_name" value={formData.last_name} onChange={handleInputChange} className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500 bg-white text-gray-800 text-sm" placeholder="e.g. Doe" />
                      ) : (
                         <div className="text-gray-500 text-sm h-9 flex items-center">{formData.last_name || '-'}</div>
                      )}
                   </div>

                   <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-[#1A365D]">Contact Number</label>
                      {isEditing ? (
                         <input name="contact_number" value={formData.contact_number} onChange={handleInputChange} className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500 bg-white text-gray-800 text-sm" placeholder="e.g. +91 9041210040" />
                      ) : (
                         <div className="text-gray-500 text-sm h-9 flex items-center gap-2">
                            {formData.contact_number ? (
                               <>
                                 <span role="img" aria-label="India">🇮🇳</span> {formData.contact_number}
                               </>
                            ) : '-'}
                         </div>
                      )}
                   </div>

                   <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-[#1A365D]">User Role</label>
                      <div className="text-gray-500 text-sm h-9 flex items-center">
                         {user?.role || 'Organization Admin'}
                      </div>
                   </div>

                   <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-[#1A365D]">Username/Email</label>
                      <div className="text-gray-500 text-sm h-9 flex items-center">
                         {user?.email || user?.username}
                      </div>
                   </div>

                   <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-[#1A365D]">Time Zone</label>
                      {isEditing ? (
                         <select name="timezone" value={formData.timezone} onChange={handleInputChange} className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500 bg-white text-gray-800 text-sm">
                            <option value="UTC">UTC (Universal Coordinated Time)</option>
                            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                            <option value="America/New_York">America/New_York (EST)</option>
                            <option value="Europe/London">Europe/London (GMT)</option>
                            <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
                         </select>
                      ) : (
                         <div className="text-gray-500 text-sm h-9 flex items-center">{formData.timezone}</div>
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
