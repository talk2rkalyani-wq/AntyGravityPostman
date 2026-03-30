import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Send, Trash2 } from 'lucide-react';

// Global map to preserve connections across tab switches
window.wsConnections = window.wsConnections || {};

function WebSocketEditor({ requestState, setRequestState, onSave }) {
  const { id, url } = requestState;
  const [inputUrl, setInputUrl] = useState(url || 'wss://echo.websocket.org');
  const [status, setStatus] = useState('DISCONNECTED'); // CONNECTING, CONNECTED, DISCONNECTED
  const [message, setMessage] = useState('');
  const [logs, setLogs] = useState(requestState.wsLogs || []);
  const messagesEndRef = useRef(null);

  // Sync logs back to tab state so they persist
  useEffect(() => {
     setRequestState({ ...requestState, url: inputUrl, wsLogs: logs });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logs, inputUrl]);

  useEffect(() => {
     const existingWs = window.wsConnections[id];
     if (existingWs) {
        setStatus(existingWs.readyState === WebSocket.OPEN ? 'CONNECTED' : (existingWs.readyState === WebSocket.CONNECTING ? 'CONNECTING' : 'DISCONNECTED'));
        
        // reattach handlers just in case
        existingWs.onmessage = (e) => {
           setLogs(prev => [...prev, { type: 'rx', data: e.data, time: new Date().toLocaleTimeString() }]);
        };
        existingWs.onclose = () => setStatus('DISCONNECTED');
        existingWs.onerror = () => setStatus('DISCONNECTED');
     } else {
        setStatus('DISCONNECTED');
     }
  }, [id]);

  useEffect(() => {
     if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
     }
  }, [logs]);

  const connect = () => {
     if (window.wsConnections[id]) {
        window.wsConnections[id].close();
     }
     try {
       setStatus('CONNECTING');
       const ws = new WebSocket(inputUrl);
       
       ws.onopen = () => {
          setStatus('CONNECTED');
          setLogs(prev => [...prev, { type: 'system', data: 'Connected to ' + inputUrl, time: new Date().toLocaleTimeString() }]);
       };
       ws.onmessage = (e) => {
          setLogs(prev => [...prev, { type: 'rx', data: e.data, time: new Date().toLocaleTimeString() }]);
       };
       ws.onclose = () => {
          setStatus('DISCONNECTED');
          setLogs(prev => [...prev, { type: 'system', data: 'Disconnected', time: new Date().toLocaleTimeString() }]);
       };
       ws.onerror = (e) => {
          setStatus('DISCONNECTED');
          setLogs(prev => [...prev, { type: 'error', data: 'Connection Error', time: new Date().toLocaleTimeString() }]);
       };
       
       window.wsConnections[id] = ws;
     } catch (err) {
       setStatus('DISCONNECTED');
       setLogs(prev => [...prev, { type: 'error', data: 'Invalid WebSocket URL: ' + err.message, time: new Date().toLocaleTimeString() }]);
     }
  };

  const disconnect = () => {
     if (window.wsConnections[id]) {
        window.wsConnections[id].close();
        delete window.wsConnections[id];
     }
     setStatus('DISCONNECTED');
  };

  const sendMessage = () => {
     if (!message.trim()) return;
     const ws = window.wsConnections[id];
     if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(message);
        setLogs(prev => [...prev, { type: 'tx', data: message, time: new Date().toLocaleTimeString() }]);
        setMessage('');
     } else {
        setLogs(prev => [...prev, { type: 'error', data: 'Cannot send message. Socket is not connected.', time: new Date().toLocaleTimeString() }]);
     }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-primary)] p-4 pt-2">
      {/* URL Connection Bar */}
      <div className="glass-panel p-2 flex gap-2 mb-4 items-center outline outline-1 outline-transparent focus-within:outline-[#10B981] focus-within:shadow-[0_0_10px_rgba(16,185,129,0.2)] transition-all shrink-0">
        <div className="font-bold w-[100px] pl-2 text-purple-500 tracking-wide text-sm flex items-center h-full">WS</div>
        <div className="w-[1px] h-8 bg-[var(--border-color)]"></div>
        <input 
          type="text" 
          value={inputUrl}
          onChange={e => setInputUrl(e.target.value)}
          placeholder="wss://echo.websocket.org" 
          className="flex-1 bg-transparent border-none text-[var(--text-primary)] px-2 outline-none font-mono text-sm"
          disabled={status === 'CONNECTED' || status === 'CONNECTING'}
        />
        <button onClick={onSave} className="btn-secondary flex items-center gap-2 px-4 shadow-sm" title="Save to Collection">
          <span>Save</span>
        </button>

        {status === 'CONNECTED' || status === 'CONNECTING' ? (
           <button onClick={disconnect} className="btn-secondary !bg-red-500/10 !text-red-500 !border-red-500/20 hover:!bg-red-500/20 flex items-center gap-2 px-6">
             <span>Disconnect</span>
             <Square size={12} fill="currentColor" />
           </button>
        ) : (
           <button onClick={connect} className="btn-primary !bg-purple-600 hover:!bg-purple-700 flex items-center gap-2 px-6">
             <span>Connect</span>
             <Play size={14} fill="currentColor" />
           </button>
        )}
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
         {/* Live Log Area */}
         <div className="flex-1 flex flex-col glass-panel overflow-hidden relative">
            <div className="flex items-center justify-between p-2 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] shrink-0">
               <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider ml-2">Message Log</span>
               <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                     <div className={`w-2 h-2 rounded-full ${status === 'CONNECTED' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : status === 'CONNECTING' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`}></div>
                     <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">{status}</span>
                  </div>
                  <button onClick={() => setLogs([])} className="p-1 hover:bg-[var(--bg-tertiary)] rounded text-[var(--text-muted)] hover:text-red-500 transition" title="Clear Logs">
                     <Trash2 size={14} />
                  </button>
               </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-2 font-mono text-[13px]">
               {logs.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-[var(--text-muted)] text-sm">No messages yet. Connect and send a payload.</div>
               ) : (
                  logs.map((log, i) => (
                     <div key={i} className={`flex flex-col max-w-[85%] ${log.type === 'tx' ? 'self-end items-end' : 'self-start items-start'}`}>
                        <span className="text-[10px] text-[var(--text-muted)] mb-0.5 px-1">{log.type === 'tx' ? 'SENT' : log.type === 'rx' ? 'RECEIVED' : 'SYSTEM'} • {log.time}</span>
                        <div className={`px-3 py-2 rounded-lg break-words text-[var(--text-primary)] w-full ${
                           log.type === 'tx' ? 'bg-purple-500/20 border border-purple-500/30' : 
                           log.type === 'rx' ? 'bg-[#06B6D4]/10 border border-[#06B6D4]/20' : 
                           log.type === 'error' ? 'bg-red-500/10 border border-red-500/20 text-red-400' :
                           'bg-[var(--bg-tertiary)] border border-[var(--border-color)] italic text-[var(--text-secondary)]'
                        }`}>
                           {log.data}
                        </div>
                     </div>
                  ))
               )}
               <div ref={messagesEndRef} />
            </div>
         </div>

         {/* Message Composer */}
         <div className="w-[300px] flex flex-col glass-panel shrink-0 h-full overflow-hidden">
            <div className="p-2 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] shrink-0">
               <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider ml-2">Compose</span>
            </div>
            <textarea
               value={message}
               onChange={(e) => setMessage(e.target.value)}
               className="flex-1 bg-transparent p-3 text-[var(--text-primary)] resize-none outline-none font-mono text-sm custom-scrollbar"
               placeholder="Enter message here... (JSON, raw text, etc.)"
            />
            <div className="p-2 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] flex justify-end shrink-0">
               <button 
                  onClick={sendMessage} 
                  disabled={status !== 'CONNECTED' || !message.trim()}
                  className="btn-primary !bg-purple-600 hover:!bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 px-4 py-1.5"
               >
                  <span>Send Matrix</span>
                  <Send size={14} />
               </button>
            </div>
         </div>
      </div>
    </div>
  );
}

export default WebSocketEditor;
