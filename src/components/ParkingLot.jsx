import React, { useState } from 'react';
import { Lightbulb, MessageSquare, Bug, HelpCircle, TrendingUp, Calendar, User, ArrowRight, Archive, Trash2 } from 'lucide-react';

export default function ParkingLot({ parkingItems, clients, onPromoteToStory, onArchive, onDelete, onItemClick }) {
  const [selectedClient, setSelectedClient] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'idea', label: 'Idea', icon: Lightbulb, color: 'yellow' },
    { id: 'feature', label: 'Feature', icon: TrendingUp, color: 'blue' },
    { id: 'bug', label: 'Bug', icon: Bug, color: 'red' },
    { id: 'question', label: 'Pregunta', icon: HelpCircle, color: 'purple' },
    { id: 'improvement', label: 'Mejora', icon: TrendingUp, color: 'green' }
  ];

  const getCategoryIcon = (category) => {
    const cat = categories.find(c => c.id === category);
    return cat ? cat.icon : Lightbulb;
  };

  const getCategoryColor = (category) => {
    const colors = {
      idea: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      feature: 'bg-blue-50 text-blue-700 border-blue-200',
      bug: 'bg-red-50 text-red-700 border-red-200',
      question: 'bg-purple-50 text-primary border-primary',
      improvement: 'bg-green-50 text-green-700 border-green-200'
    };
    return colors[category] || colors.idea;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'text-red-600',
      medium: 'text-yellow-600',
      low: 'text-gray-600'
    };
    return colors[priority] || colors.medium;
  };

  const filteredItems = parkingItems
    .filter(item => item.status === 'parked')
    .filter(item => selectedClient === 'all' || item.client_id === parseInt(selectedClient))
    .filter(item => selectedCategory === 'all' || item.category === selectedCategory);

  const ParkingCard = ({ item }) => {
    const client = clients.find(c => c.id === item.client_id);
    const CategoryIcon = getCategoryIcon(item.category);
    const daysParked = Math.floor((new Date() - new Date(item.created_at)) / (1000 * 60 * 60 * 24));

    return (
      <div className="bg-white rounded-xl border border-gray-100 p-4 hover:border-primary hover:shadow-lg transition-all duration-200">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-lg text-xs font-semibold border ${getCategoryColor(item.category)} flex items-center gap-1`}>
              <CategoryIcon size={14} />
              {item.category}
            </span>
            <span className={`text-xs font-semibold ${getPriorityColor(item.priority)}`}>
              {item.priority === 'high' && '🔴'}
              {item.priority === 'medium' && '🟡'}
              {item.priority === 'low' && '⚪'}
            </span>
          </div>
        </div>

        <h3 className="font-bold text-gray-900 mb-2 cursor-pointer hover:text-primary" onClick={() => onItemClick(item)}>
          {item.title}
        </h3>

        {item.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <div className="flex items-center gap-3">
            {client && (
              <span className="flex items-center gap-1">
                <User size={12} />
                {client.name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {daysParked === 0 ? 'Hoy' : `${daysParked}d`}
            </span>
          </div>
          {item.created_by && (
            <span className="text-gray-400">por {item.created_by}</span>
          )}
        </div>

        {item.notes && (
          <div className="bg-gray-50 rounded p-2 mb-3 text-xs text-gray-600 italic">
            💡 {item.notes}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => onPromoteToStory(item)}
            className="flex-1 bg-primary text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-opacity-90 transition-all flex items-center justify-center gap-1"
          >
            <ArrowRight size={14} />
            Convertir a User Story
          </button>
          <button
            onClick={() => onArchive(item.id)}
            className="bg-gray-100 text-gray-600 px-3 py-2 rounded-lg text-xs hover:bg-gray-200 transition-all"
          >
            <Archive size={14} />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-xs hover:bg-red-100 transition-all"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="text-primary" size={28} />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Estacionamiento de Ideas</h2>
            <p className="text-sm text-gray-500">Ideas y conceptos que aún no son user stories</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
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

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="all">Todas las categorías</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>

          <div className="flex items-center gap-2 text-sm text-gray-600 ml-auto">
            <span className="font-semibold">{filteredItems.length}</span>
            ideas estacionadas
          </div>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-100">
          <Lightbulb className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-500">No hay ideas estacionadas</p>
          <p className="text-sm text-gray-400 mt-1">Usa el botón "Agregar Idea" para crear una</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => (
            <ParkingCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

