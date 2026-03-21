import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const PasswordField = ({ value, onChange, placeholder, className }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative w-full">
      <input
        type={show ? "text" : "password"}
        className={`${className} pr-8`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
      <button 
        type="button" 
        onClick={() => setShow(!show)} 
        className="absolute inset-y-0 right-0 pr-2 flex items-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
};

const authTypes = [
  'No Auth', 'API Key', 'Bearer Token', 'JWT Bearer', 'Basic Auth', 'Digest Auth', 
  'OAuth 1.0', 'OAuth 2.0', 'Hawk Authentication', 'AWS Signature', 'NTLM Authentication', 
  'Akamai EdgeGrid', 'ASAP (Atlassian)'
];

function AuthEditor({ requestState, setRequestState }) {
  const { authType, authData } = requestState;

  const handleTypeChange = (e) => {
    setRequestState({ ...requestState, authType: e.target.value });
  };

  const updateData = (field, value) => {
    setRequestState({ 
      ...requestState, 
      authData: { ...authData, [field]: value } 
    });
  };

  // Helper for rendering horizontal form rows
  const FormRow = ({ label, children }) => (
    <div className="flex items-center gap-4 mb-3">
      <div className="w-1/4 text-sm font-semibold text-[var(--text-secondary)] text-right">{label}</div>
      <div className="flex-1 max-w-[400px]">
        {children}
      </div>
    </div>
  );

  return (
    <div className="flex h-full min-h-[300px]">
      {/* Left Pane - Auth Dropdown */}
      <div className="w-64 border-r border-[var(--border-color)] pr-4 flex flex-col pt-2">
        <label className="text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wide">Auth Type</label>
        <div className="relative">
          <select 
            value={authType} 
            onChange={handleTypeChange}
            className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded px-3 py-2 text-sm appearance-none outline-none focus:border-[#06B6D4] cursor-pointer"
          >
            {authTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-[var(--text-muted)] border-l border-[var(--border-color)] pl-2">
             ▼
          </div>
        </div>
        
        {authType !== 'No Auth' && (
          <div className="mt-8 text-xs text-[var(--text-muted)] bg-[var(--bg-tertiary)] p-3 rounded border border-transparent">
             The authorization header will be automatically generated when you send the request.
          </div>
        )}
      </div>

      {/* Right Pane - Dynamic Forms */}
      <div className="flex-1 pl-6 pt-2 overflow-y-auto">
        {authType === 'No Auth' && (
          <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] text-sm">
             <div className="text-3xl text-[var(--border-color)] mb-4">-</div>
             <div className="font-semibold text-[var(--text-primary)] mb-1 text-lg">No Auth</div>
             This request does not use any authorization.
          </div>
        )}

        {authType === 'API Key' && (
          <div className="max-w-2xl">
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-6">API Key Details</h3>
            <FormRow label="Key">
              <input type="text" className="input-field w-full text-sm font-mono px-3 py-1.5 outline-none" placeholder="Key" value={authData.apiKeyKey || ''} onChange={e => updateData('apiKeyKey', e.target.value)} />
            </FormRow>
            <FormRow label="Value">
              <input type="text" className="input-field w-full text-sm font-mono px-3 py-1.5 outline-none" placeholder="Value" value={authData.apiKeyValue || ''} onChange={e => updateData('apiKeyValue', e.target.value)} />
            </FormRow>
            <FormRow label="Add to">
              <select className="input-field w-full text-sm px-3 py-1.5 outline-none cursor-pointer" value={authData.apiKeyAddTo || 'Header'} onChange={e => updateData('apiKeyAddTo', e.target.value)}>
                <option value="Header">Header</option>
                <option value="Query Params">Query Params</option>
              </select>
            </FormRow>
          </div>
        )}

        {authType === 'Bearer Token' && (
          <div className="max-w-2xl">
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-6">Bearer Token</h3>
            <FormRow label="Token">
              <textarea 
                className="input-field w-full text-sm font-mono px-3 py-2 outline-none resize-y min-h-[60px]" 
                placeholder="Token" 
                value={authData.bearerToken || ''} 
                onChange={e => updateData('bearerToken', e.target.value)}
                spellCheck="false"
              />
            </FormRow>
          </div>
        )}

        {authType === 'Basic Auth' && (
          <div className="max-w-2xl">
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-6">Basic Auth Details</h3>
            <FormRow label="Username">
              <input type="text" className="input-field w-full text-sm font-mono px-3 py-1.5 outline-none" placeholder="Username" value={authData.basicUsername || ''} onChange={e => updateData('basicUsername', e.target.value)} />
            </FormRow>
            <FormRow label="Password">
              <PasswordField className="input-field w-full text-sm font-mono px-3 py-1.5 outline-none" placeholder="Password" value={authData.basicPassword || ''} onChange={e => updateData('basicPassword', e.target.value)} />
            </FormRow>
          </div>
        )}

        {(authType === 'OAuth 1.0' || authType === 'OAuth 2.0' || authType === 'AWS Signature' || authType === 'Hawk Authentication' || authType === 'Digest Auth' || authType === 'NTLM Authentication' || authType === 'JWT Bearer' || authType === 'Akamai EdgeGrid' || authType === 'ASAP (Atlassian)') && (
          <div className="max-w-2xl">
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4">{authType}</h3>
            
            {/* Generic placeholder grids to mimic complex auth forms */}
            {authType === 'OAuth 2.0' ? (
              <>
                <h4 className="text-xs font-bold text-[var(--text-secondary)] mb-4 border-b border-[var(--border-color)] pb-1">Configure New Token</h4>
                <FormRow label="Token Name"><input type="text" className="input-field w-full text-sm py-1" /></FormRow>
                <FormRow label="Grant Type">
                   <select className="input-field w-full text-sm py-1"><option>Authorization Code</option></select>
                </FormRow>
                <FormRow label="Callback URL"><input type="text" className="input-field w-full text-sm py-1" /></FormRow>
                <FormRow label="Auth URL"><input type="text" className="input-field w-full text-sm py-1" /></FormRow>
                <FormRow label="Access Token URL"><input type="text" className="input-field w-full text-sm py-1" /></FormRow>
                <FormRow label="Client ID"><input type="text" className="input-field w-full text-sm py-1" /></FormRow>
                <FormRow label="Client Secret"><PasswordField className="input-field w-full text-sm py-1" /></FormRow>
                <FormRow label="Scope"><input type="text" className="input-field w-full text-sm py-1" /></FormRow>
                <div className="flex justify-end mt-4"><button className="btn-secondary py-1 px-4 text-xs font-medium border border-[#06B6D4] text-[#06B6D4]">Get New Access Token</button></div>
              </>
            ) : authType === 'AWS Signature' ? (
              <>
                <FormRow label="AccessKey"><input type="text" className="input-field w-full text-sm py-1" /></FormRow>
                <FormRow label="SecretKey"><PasswordField className="input-field w-full text-sm py-1" /></FormRow>
                <FormRow label="AWS Region"><input type="text" className="input-field w-full text-sm py-1" /></FormRow>
                <FormRow label="Service Name"><input type="text" className="input-field w-full text-sm py-1" /></FormRow>
                <FormRow label="Session Token"><input type="text" className="input-field w-full text-sm py-1" /></FormRow>
              </>
            ) : (
              <div className="text-sm text-[var(--text-muted)]">
                The setup fields for {authType} will be displayed here securely. This complex authentication mechanism is structurally ready for local storage integration.
                <div className="animate-pulse bg-[var(--bg-tertiary)] rounded h-8 w-full mt-4"></div>
                <div className="animate-pulse bg-[var(--bg-tertiary)] rounded h-8 w-2/3 mt-3"></div>
                <div className="animate-pulse bg-[var(--bg-tertiary)] rounded h-8 w-3/4 mt-3"></div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default AuthEditor;
