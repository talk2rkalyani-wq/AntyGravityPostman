import React from 'react';
import { ArrowLeftRight, Hexagon, Cpu, Network, Folder, Box, LayoutGrid, X } from 'lucide-react';

const tiles = [
  { id: 'http', label: 'HTTP', icon: ArrowLeftRight, color: 'text-blue-500', desc: 'Hypertext Transfer Protocol (HTTP) is an application-layer protocol often used to build REST APIs. Test your HTTP API with an HTTP request.' },
  { id: 'graphql', label: 'GraphQL', icon: Hexagon, color: 'text-pink-500', desc: 'Create a GraphQL request to query APIs and get exactly what you need.' },
  { id: 'mcp', label: 'MCP', icon: Cpu, color: 'text-gray-700', desc: 'Connect to an MCP server to orchestrate local AI workflows.' },
  { id: 'grpc', label: 'gRPC', icon: Network, color: 'text-indigo-600', desc: 'Execute a fast, language-agnostic remote procedure call.' },
  { id: 'collection', label: 'Collection', icon: Folder, color: 'text-orange-500', desc: 'Group your requests together into a logical test suite.' },
  { id: 'environment', label: 'Environment', icon: Box, color: 'text-gray-500', desc: 'Manage your variables to quickly cycle through environments.' },
  { id: 'workspace', label: 'Workspace', icon: LayoutGrid, color: 'text-gray-500', desc: 'Collaborate with your team securely on isolated projects.' }
];

function NewFeatureModal({ onClose, onSelect }) {
  const [hovered, setHovered] = React.useState(tiles[0]);

  return (
    <div className="absolute inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-lg shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden relative fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition" onClick={onClose}>
            <X size={20} />
        </button>
        
        <div className="px-8 pt-8 pb-4">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Create New</h2>
            <div className="grid grid-cols-4 gap-4">
               {tiles.map(tile => {
                  const Icon = tile.icon;
                  return (
                     <div 
                        key={tile.id}
                        className="flex flex-col items-center justify-center p-6 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 hover:shadow-sm transition-all gap-3"
                        onMouseEnter={() => setHovered(tile)}
                        onClick={() => {
                            if (tile.id === 'http' || tile.id === 'collection') {
                               onSelect(tile.id);
                            } else {
                               alert('Feature coming soon!');
                               onClose();
                            }
                        }}
                     >
                        <Icon size={36} strokeWidth={1.5} className={tile.color} />
                        <span className="text-[13px] font-medium text-gray-700">{tile.label}</span>
                     </div>
                  );
               })}
            </div>
        </div>

        <div className="bg-gray-50 p-6 border-t border-gray-100 min-h-[100px] flex items-center mt-4">
            <p className="text-[13px] text-gray-600 leading-relaxed">
               {hovered.desc}
            </p>
        </div>
      </div>
    </div>
  );
}

export default NewFeatureModal;
