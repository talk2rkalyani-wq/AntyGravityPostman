import React from 'react';

function KeyValueEditor({ items, onChange }) {
  const handleItemChange = (index, field, value) => {
    const list = [...items];
    list[index][field] = value;
    if (index === list.length - 1 && value !== '') {
      list.push({ key: '', value: '', description: '', active: true });
    }
    onChange(list);
  };

  const toggleItemActive = (index) => {
    const list = [...items];
    list[index].active = !list[index].active;
    onChange(list);
  };

  const deleteItem = (index) => {
    const list = [...items];
    if (list.length > 1) {
      list.splice(index, 1);
      onChange(list);
    }
  };

  return (
    <>
      <div className="flex text-sm text-[var(--text-secondary)] mb-2 px-2 border-b border-[var(--border-color)] pb-2 font-medium">
        <div className="w-8"></div>
        <div className="flex-1">Key</div>
        <div className="flex-1 border-l border-[var(--border-color)] pl-3">Value</div>
        <div className="flex-1 border-l border-[var(--border-color)] pl-3">Description</div>
        <div className="w-8"></div>
      </div>
      {items.map((item, index) => (
        <div key={index} className="flex mb-[1px] items-center group border border-transparent hover:border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] rounded transition-colors overflow-hidden">
          <div className="w-8 flex justify-center py-2 h-full">
            {item.key || item.value || index < items.length - 1 ? (
              <input 
                type="checkbox" 
                checked={item.active} 
                onChange={() => toggleItemActive(index)}
                className="w-3.5 h-3.5 cursor-pointer accent-[var(--accent-cyan)] outline-none"
              />
            ) : null}
          </div>
          <input 
            type="text" 
            placeholder="Key" 
            value={item.key}
            onChange={(e) => handleItemChange(index, 'key', e.target.value)}
            className="flex-1 text-sm py-1.5 px-2 bg-transparent border-r border-[var(--border-color)] outline-none text-[var(--text-primary)] font-mono placeholder-[var(--text-muted)]"
          />
          <input 
            type="text" 
            placeholder="Value" 
            value={item.value}
            onChange={(e) => handleItemChange(index, 'value', e.target.value)}
            className="flex-1 text-sm py-1.5 px-3 bg-transparent border-r border-[var(--border-color)] outline-none text-[var(--text-primary)] font-mono placeholder-[var(--text-muted)]"
          />
          <input 
            type="text" 
            placeholder="Description" 
            value={item.description}
            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
            className="flex-1 text-sm py-1.5 px-3 bg-transparent outline-none text-[var(--text-primary)] placeholder-[var(--text-muted)]"
          />
          <div className="w-8 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {(item.key || item.value || index < items.length - 1) && (
              <button 
                onClick={() => deleteItem(index)}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--status-delete)] transition-colors"
                title="Delete"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      ))}
    </>
  );
}

export default KeyValueEditor;
