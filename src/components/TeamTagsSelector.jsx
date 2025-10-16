import React, { useState, useRef, useEffect } from 'react';
import { X, Users, ChevronDown, Search } from 'lucide-react';

export const TEAM_MEMBERS = [
  { name: 'Ara', color: '#e11d48' },
  { name: 'Nalle', color: '#0891b2' },
  { name: 'Mau', color: '#7c3aed' },
  { name: 'Ana', color: '#db2777' },
  { name: 'Memo', color: '#059669' },
  { name: 'Erick', color: '#2563eb' },
  { name: 'Mar', color: '#dc2626' },
  { name: 'Lau', color: '#ca8a04' },
  { name: 'DataLab', color: '#8e64e1' }
];

export const TeamTag = ({ name, color, onRemove, size = 'md' }) => {
  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizes[size]}`}
      style={{
        backgroundColor: `${color}15`,
        color: color,
        border: `1px solid ${color}40`
      }}
    >
      {name}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(name);
          }}
          className="hover:opacity-70 transition-opacity"
          type="button"
        >
          <X size={size === 'sm' ? 12 : 14} />
        </button>
      )}
    </span>
  );
};

export const TeamTagsSelector = ({ selectedTags = [], onChange, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const toggleTag = (name) => {
    if (selectedTags.includes(name)) {
      onChange(selectedTags.filter(tag => tag !== name));
    } else {
      onChange([...selectedTags, name]);
    }
    setSearchTerm('');
  };

  const removeTag = (name) => {
    onChange(selectedTags.filter(tag => tag !== name));
  };

  const availableMembers = TEAM_MEMBERS.filter(
    member => !selectedTags.includes(member.name)
  );

  const filteredMembers = availableMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && filteredMembers.length === 1) {
      e.preventDefault();
      toggleTag(filteredMembers[0].name);
      setIsOpen(false);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Asignado a
      </label>
      <div className="flex flex-wrap gap-2 min-h-[36px] p-2 border border-gray-200 rounded-lg bg-white">
        {selectedTags.length === 0 ? (
          <span className="text-sm text-gray-400 flex items-center gap-2">
            <Users size={16} />
            Sin asignar
          </span>
        ) : (
          selectedTags.map(tagName => {
            const member = TEAM_MEMBERS.find(m => m.name === tagName);
            return member ? (
              <TeamTag
                key={tagName}
                name={member.name}
                color={member.color}
                onRemove={disabled ? null : removeTag}
                size="md"
              />
            ) : null;
          })
        )}
      </div>
      {!disabled && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-gray-600">
              {availableMembers.length === 0
                ? 'Todo el equipo asignado'
                : 'Buscar o seleccionar miembro'}
            </span>
            <ChevronDown
              size={16}
              className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {isOpen && availableMembers.length > 0 && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => { setIsOpen(false); setSearchTerm(''); }} />
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
                <div className="p-2 border-b border-gray-200">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Buscar miembro..."
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {filteredMembers.length === 0 ? (
                    <div className="px-3 py-4 text-center text-sm text-gray-500">
                      No se encontraron miembros
                    </div>
                  ) : (
                    filteredMembers.map(member => (
                      <button
                        key={member.name}
                        type="button"
                        onClick={() => {
                          toggleTag(member.name);
                          setIsOpen(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-2"
                      >
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: member.color }} />
                        <span className="text-sm text-gray-700">{member.name}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TeamTagsSelector;