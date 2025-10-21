import React, { useState } from 'react';
import { 
  Plus, 
  Check, 
  GripVertical, 
  Trash2, 
  Edit3,
  X,
  Save
} from 'lucide-react';

export default function SubTasks({ 
  subTasks = [], 
  onUpdateSubTasks, 
  disabled = false 
}) {
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [draggedId, setDraggedId] = useState(null);

  // Generate unique ID for new sub-task
  const generateSubTaskId = () => {
    return `subtask_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Add new sub-task
  const handleAddSubTask = () => {
    if (disabled) return;
    
    const newSubTask = {
      id: generateSubTaskId(),
      title: '',
      completed: false,
      order: subTasks.length
    };
    
    const updatedSubTasks = [...subTasks, newSubTask];
    onUpdateSubTasks(updatedSubTasks);
    
    // Start editing the new sub-task
    setEditingId(newSubTask.id);
    setEditingTitle('');
  };

  // Update sub-task title
  const handleUpdateTitle = (id, newTitle) => {
    if (!newTitle.trim()) {
      // If empty, remove the sub-task
      handleDeleteSubTask(id);
      return;
    }
    
    const updatedSubTasks = subTasks.map(subTask =>
      subTask.id === id ? { ...subTask, title: newTitle.trim() } : subTask
    );
    onUpdateSubTasks(updatedSubTasks);
    setEditingId(null);
    setEditingTitle('');
  };

  // Toggle sub-task completion
  const handleToggleComplete = (id) => {
    if (disabled) return;
    
    const updatedSubTasks = subTasks.map(subTask =>
      subTask.id === id ? { ...subTask, completed: !subTask.completed } : subTask
    );
    onUpdateSubTasks(updatedSubTasks);
  };

  // Delete sub-task
  const handleDeleteSubTask = (id) => {
    if (disabled) return;
    
    const updatedSubTasks = subTasks
      .filter(subTask => subTask.id !== id)
      .map((subTask, index) => ({ ...subTask, order: index }));
    onUpdateSubTasks(updatedSubTasks);
    setEditingId(null);
  };

  // Start editing
  const handleStartEdit = (subTask) => {
    if (disabled) return;
    setEditingId(subTask.id);
    setEditingTitle(subTask.title);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  // Drag and drop handlers
  const handleDragStart = (e, id) => {
    if (disabled) return;
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    if (disabled || !draggedId || draggedId === targetId) return;

    const draggedIndex = subTasks.findIndex(st => st.id === draggedId);
    const targetIndex = subTasks.findIndex(st => st.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newSubTasks = [...subTasks];
    const draggedSubTask = newSubTasks[draggedIndex];
    
    // Remove dragged item
    newSubTasks.splice(draggedIndex, 1);
    
    // Insert at new position
    newSubTasks.splice(targetIndex, 0, draggedSubTask);
    
    // Update order values
    const updatedSubTasks = newSubTasks.map((subTask, index) => ({
      ...subTask,
      order: index
    }));
    
    onUpdateSubTasks(updatedSubTasks);
    setDraggedId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  // Sort sub-tasks by order
  const sortedSubTasks = [...subTasks].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          📋 Sub-tareas
          {subTasks.length > 0 && (
            <span className="text-xs text-gray-500">
              ({subTasks.filter(st => st.completed).length}/{subTasks.length} completadas)
            </span>
          )}
        </h4>
        {!disabled && (
          <button
            onClick={handleAddSubTask}
            className="flex items-center gap-1 px-2 py-1 text-xs text-primary hover:bg-purple-50 rounded transition-colors"
            title="Agregar sub-tarea"
          >
            <Plus size={14} />
            Agregar
          </button>
        )}
      </div>

      {/* Sub-tasks list */}
      {sortedSubTasks.length > 0 ? (
        <div className="space-y-1">
          {sortedSubTasks.map((subTask) => (
            <div
              key={subTask.id}
              draggable={!disabled}
              onDragStart={(e) => handleDragStart(e, subTask.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, subTask.id)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-2 p-2 rounded-lg border transition-all duration-200 ${
                draggedId === subTask.id
                  ? 'opacity-50 bg-gray-100'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              } ${disabled ? 'cursor-default' : 'cursor-move'}`}
            >
              {/* Drag handle */}
              {!disabled && (
                <div className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing">
                  <GripVertical size={14} />
                </div>
              )}

              {/* Checkbox */}
              <button
                onClick={() => handleToggleComplete(subTask.id)}
                disabled={disabled}
                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                  subTask.completed
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300 hover:border-gray-400'
                } ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
              >
                {subTask.completed && <Check size={10} />}
              </button>

              {/* Title */}
              {editingId === subTask.id ? (
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleUpdateTitle(subTask.id, editingTitle);
                      } else if (e.key === 'Escape') {
                        handleCancelEdit();
                      }
                    }}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    autoFocus
                    placeholder="Título de la sub-tarea..."
                  />
                  <button
                    onClick={() => handleUpdateTitle(subTask.id, editingTitle)}
                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                    title="Guardar"
                  >
                    <Save size={12} />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="p-1 text-gray-400 hover:bg-gray-50 rounded"
                    title="Cancelar"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex items-center gap-2">
                  <span
                    className={`flex-1 text-sm ${
                      subTask.completed
                        ? 'line-through text-gray-500'
                        : 'text-gray-900'
                    }`}
                  >
                    {subTask.title || 'Sub-tarea sin título'}
                  </span>
                  {!disabled && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(subTask)}
                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Editar"
                      >
                        <Edit3 size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteSubTask(subTask.id)}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Eliminar"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500 text-sm">
          <p>No hay sub-tareas</p>
          {!disabled && (
            <p className="text-xs mt-1">Haz clic en "Agregar" para crear la primera</p>
          )}
        </div>
      )}

      {/* Instructions */}
      {!disabled && sortedSubTasks.length > 0 && (
        <div className="text-xs text-gray-400 mt-2">
          💡 Arrastra para reordenar • Haz clic en el título para editar
        </div>
      )}
    </div>
  );
}
