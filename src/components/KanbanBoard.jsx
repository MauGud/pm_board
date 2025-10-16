import React, { useState } from 'react';
import { Calendar, User } from 'lucide-react';

const formatStoryId = (id) => {
  const number = id.replace('US-', '').replace(/^0+/, '');
  return `#${number}`;
};

export default function KanbanBoard({ userStories, clients, onUpdateStory, onStoryClick }) {
  const [activeId, setActiveId] = useState(null);
  const [selectedClient, setSelectedClient] = useState('all');

  const columns = [
    { id: 'pending', title: 'Backlog', color: 'bg-gray-50 border-gray-100' },
    { id: 'ready', title: 'To Do', color: 'bg-purple-50 border-primary' },
    { id: 'in-progress', title: 'In Progress', color: 'bg-purple-50 border-primary' },
    { id: 'review', title: 'In Review', color: 'bg-purple-50 border-primary' },
    { id: 'completed', title: 'Done', color: 'bg-green-50 border-green-200' }
  ];

  const filteredStories = selectedClient === 'all' ? userStories : userStories.filter(s => s.client_id === parseInt(selectedClient));
  const getStoriesByColumn = (columnId) => filteredStories.filter(story => story.status === columnId);

  const handleDragStart = (e, storyId) => {
    setActiveId(storyId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, columnId) => {
    e.preventDefault();
    if (activeId && columnId) {
      await onUpdateStory(activeId, columnId);
    }
    setActiveId(null);
  };

  const StoryCard = ({ story }) => {
    const client = clients.find(c => c.id === story.client_id);
    const daysRemaining = story.end_date ? Math.ceil((new Date(story.end_date) - new Date()) / (1000 * 60 * 60 * 24)) : null;

    return (
      <div 
        draggable 
        onDragStart={(e) => handleDragStart(e, story.id)} 
        className={`bg-white rounded-xl border border-gray-100 hover:border-primary transition-all duration-200 p-3 cursor-move hover:shadow-lg ${activeId === story.id ? 'opacity-50' : ''}`} 
        onClick={(e) => { e.stopPropagation(); onStoryClick(story); }}
      >
        <div className="flex items-start justify-between mb-2">
          <span className="font-mono text-xs text-slate-500 font-semibold">{formatStoryId(story.id)}</span>
          {story.story_points && (
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">
              {story.story_points} pts
            </span>
          )}
        </div>
        <h4 className="font-semibold text-slate-800 text-sm mb-2 line-clamp-2">{story.title}</h4>
        <div className="flex items-center gap-2 text-xs text-slate-600 mb-2">
          <User size={12} />
          <span className="truncate">{story.assignee || 'Sin asignar'}</span>
        </div>
        {selectedClient === 'all' && client && (
          <div className="text-xs text-slate-500 mb-2 truncate">{client.name}</div>
        )}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-slate-500">
            <Calendar size={12} />
            <span>{story.end_date || 'Sin fecha'}</span>
          </div>
          {story.status !== 'completed' && daysRemaining && daysRemaining <= 3 && (
            <span className={`font-semibold ${daysRemaining < 0 ? 'text-red-600' : 'text-orange-600'}`}>
              {daysRemaining < 0 ? `${Math.abs(daysRemaining)}d atrasado` : `${daysRemaining}d`}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <label className="text-sm font-semibold text-gray-700">Filtrar por cliente:</label>
        <select 
          value={selectedClient} 
          onChange={(e) => setSelectedClient(e.target.value)} 
          className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
        >
          <option value="all">Todos los clientes</option>
          {clients.map(client => (
            <option key={client.id} value={client.id}>{client.name}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {columns.map(column => {
          const stories = getStoriesByColumn(column.id);
          const totalPoints = stories.reduce((sum, s) => sum + (s.story_points || 0), 0);
          return (
            <div 
              key={column.id} 
              onDragOver={handleDragOver} 
              onDrop={(e) => handleDrop(e, column.id)} 
              className={`${column.color} rounded-lg border-2 p-4 min-h-[600px]`}
            >
              <div className="mb-4">
                <h3 className="font-bold text-slate-800 text-sm mb-1">{column.title}</h3>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>{stories.length} stories</span>
                  <span className="font-semibold">{totalPoints} pts</span>
                </div>
              </div>
              <div className="space-y-3">
                {stories.map(story => (
                  <StoryCard key={story.id} story={story} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
