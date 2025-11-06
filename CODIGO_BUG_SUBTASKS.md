# Código Completo: Bug de Subtasks

## 📄 Archivo 1: `src/App.jsx` - Fragmentos Relevantes

### 1. Estados y Variables (líneas 47-62)

```javascript
const [editingStory, setEditingStory] = useState(null)
const [editingSubTasks, setEditingSubTasks] = useState([])

// Wrapper para setEditingSubTasks con logging
const updateEditingSubTasks = useCallback((subTasks) => {
  console.log('[DIAGNOSTIC] updateEditingSubTasks called', {
    subTasksCount: subTasks.length,
    subTasks: subTasks.map(st => ({
      id: st.id,
      title: st.title,
      titleType: typeof st.title,
      hasTitle: !!(st.title && String(st.title).trim())
    }))
  })
  setEditingSubTasks(subTasks)
}, [])
```

### 2. Inicialización de Subtasks (líneas 91-102)

```javascript
// Inicializar estados cuando se abre formulario de edición
useEffect(() => {
  if (editingStory) {
    setEditingDescription(editingStory.description || '')
    setEditingDetails(editingStory.details || '')
    setEditingDescriptionImages(editingStory.description_images || [])
    setEditingDetailsImages(editingStory.details_images || [])
    
    // Initialize subtasks from either sub_tasks or subtasks (from DB)
    const initialSubTasks = editingStory.subtasks || editingStory.sub_tasks || []
    setEditingSubTasks(initialSubTasks)
  }
}, [editingStory])
```

### 3. Carga de Datos desde Supabase (líneas 167-180)

```javascript
// Cargar user stories desde Supabase
const { data: storiesData, error: storiesError } = await supabase
  .from('user_stories')
  .select(`
    *,
    subtasks (
      id,
      title,
      description,
      completed,
      created_at
    )
  `)
  .eq('archived', false)
  .order('id')

if (storiesError) throw storiesError

setClients(clientsData || [])
setUserStories(storiesData || [])
setParkingItems(parkingData || [])
```

### 4. Función handleEditStory Completa (líneas 695-870)

```javascript
const handleEditStory = async (formData) => {
  // CRITICAL: Capture all values from editingStory at the start to prevent stale closures
  if (!editingStory) {
    console.error('No editingStory found')
    return
  }
  
  console.log('[DIAGNOSTIC] handleEditStory called', {
    storyId: editingStory.id,
    editingSubTasksCount: editingSubTasks?.length || 0,
    editingSubTasks: editingSubTasks,
    editingStorySubTasksCount: editingStory?.sub_tasks?.length || 0,
    editingStorySubtasks: editingStory?.subtasks?.length || 0,
    editingStorySubtasks: editingStory?.subtasks
  })
  
  const storyId = editingStory.id
  const currentSubTasks = editingSubTasks || []  // ← USA editingSubTasks, NO editingStory.sub_tasks
  const currentAssignedTo = editingStory?.assigned_to || []
  const currentImages = editingStory?.images || []
  
  console.log('[DIAGNOSTIC] Captured values', {
    storyId,
    currentSubTasksCount: currentSubTasks.length,
    currentSubTasks: currentSubTasks.map(st => ({
      id: st.id,
      title: st.title,
      hasTitle: !!(st.title && String(st.title).trim())
    }))
  })
  
  try {
    // Clear any previous errors
    setError(null)
    
    // Verificar si tenemos configuración de Supabase
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      // Si no hay configuración, usar estado local
      setUserStories(prev => prev.map(story => 
        story.id === storyId 
          ? {
              ...story,
              client_id: parseInt(formData.get('client_id')),
              title: formData.get('title'),
              description: formData.get('description'),
              status: formData.get('status'),
              priority: formData.get('priority'),
              estimated_hours: parseInt(formData.get('estimated_hours')) || null,
              start_date: formData.get('start_date') || null,
              end_date: formData.get('end_date') || null,
              assignee: formData.get('assignee') || null,
              details: formData.get('details') || null,
              story_points: formData.get('storyPoints') ? parseInt(formData.get('storyPoints')) : null,
              assigned_to: currentAssignedTo,
              sub_tasks: currentSubTasks,
              images: currentImages
            }
          : story
      ))
      // Clear editing subtasks state
      setEditingSubTasks([])
      setEditingStory(null)
      return
    }
    
    // Actualizar user story en Supabase
    const updatePayload = {
      client_id: parseInt(formData.get('client_id')),
      title: formData.get('title'),
      description: formData.get('description'),
      status: formData.get('status'),
      priority: formData.get('priority'),
      estimated_hours: parseInt(formData.get('estimated_hours')) || null,
      start_date: formData.get('start_date') || null,
      end_date: formData.get('end_date') || null,
      assignee: formData.get('assignee') || null,
      details: formData.get('details') || null,
      story_points: formData.get('storyPoints') ? parseInt(formData.get('storyPoints')) : null,
      assigned_to: currentAssignedTo
    }
    // Solo agregar images si existen
    if (Array.isArray(currentImages) && currentImages.length > 0) {
      updatePayload.images = currentImages
    }
    const { error: updateError } = await supabase
      .from('user_stories')
      .update(updatePayload)
      .eq('id', storyId)
    
    if (updateError) throw updateError
    
    // Manejar subtasks por separado: borrar e insertar los nuevos válidos si existen
    console.log('[DIAGNOSTIC] Starting subtasks handling', {
      currentSubTasksCount: currentSubTasks.length,
      currentSubTasks
    })
    
    try {
      // First, delete all existing subtasks for this story
      console.log('[DIAGNOSTIC] Deleting existing subtasks for storyId:', storyId)
      const { error: deleteError } = await supabase
        .from('subtasks')
        .delete()
        .eq('user_story_id', storyId)
      
      if (deleteError) {
        console.error('[DIAGNOSTIC] Error deleting subtasks:', deleteError)
      } else {
        console.log('[DIAGNOSTIC] Successfully deleted existing subtasks')
      }
      
      // Then insert the new/updated subtasks if they exist
      if (Array.isArray(currentSubTasks) && currentSubTasks.length > 0) {
        console.log('[DIAGNOSTIC] Processing subtasks before filter:', {
          count: currentSubTasks.length,
          subtasks: currentSubTasks.map(st => ({
            id: st.id,
            title: st.title,
            titleType: typeof st.title,
            titleLength: st.title?.length || 0,
            titleTrimmed: String(st.title || '').trim(),
            titleTrimmedLength: String(st.title || '').trim().length
          }))
        })
        
        const validUpdateSubTasks = currentSubTasks
          .filter(st => {
            const hasTitle = st && st.title && String(st.title).trim() !== '';
            if (!hasTitle) {
              console.log('[DIAGNOSTIC] Filtered out subtask (no title):', st);
            }
            return hasTitle;
          })
          .map(st => ({
            user_story_id: storyId,
            title: String(st.title).trim(),
            description: st.description || null,
            completed: !!st.completed
          }))
        
        console.log('[DIAGNOSTIC] Valid subtasks to insert:', {
          count: validUpdateSubTasks.length,
          subtasks: validUpdateSubTasks
        })
        
        if (validUpdateSubTasks.length > 0) {
          console.log('[DIAGNOSTIC] Inserting subtasks...')
          const { error: insertError } = await supabase
            .from('subtasks')
            .insert(validUpdateSubTasks)
          
          if (insertError) {
            console.error('[DIAGNOSTIC] Error inserting subtasks:', insertError)
          } else {
            console.log('[DIAGNOSTIC] Successfully inserted subtasks')
          }
        }
      } else {
        console.log('[DIAGNOSTIC] No subtasks to insert')
      }
    } catch (subtaskError) {
      console.error('[DIAGNOSTIC] Error handling subtasks:', subtaskError)
      // Don't throw - allow story to save even if subtasks fail
    }
    
    console.log('[DIAGNOSTIC] About to call loadData()')
    // Recargar datos ANTES de cerrar el modal para asegurar que todo se guardó
    await loadData()
    console.log('[DIAGNOSTIC] loadData() completed')
    
    // Close modal AFTER all operations complete successfully
    console.log('[DIAGNOSTIC] About to close modal (setEditingStory(null))')
    // Clear editing subtasks state
    setEditingSubTasks([])
    setEditingStory(null)
    console.log('[DIAGNOSTIC] Modal closed')
  } catch (err) {
    console.error('[DIAGNOSTIC] Error updating user story:', err)
    setError(err.message)
    // DON'T close modal on error - let user try again
    // setEditingStory(null) is NOT called here
  }
}
```

### 5. Uso del Componente SubTasks en el Modal (líneas 1899-1902)

```javascript
<SubTasks
  subTasks={editingSubTasks}  // ← Usa editingSubTasks, NO editingStory.sub_tasks
  onUpdateSubTasks={updateEditingSubTasks}  // ← Usa el wrapper con logging
/>
```

### 6. Limpieza al Cerrar Modal (múltiples lugares)

**Botón X del modal** (líneas 1697-1699):
```javascript
<button
  onClick={() => {
    setEditingSubTasks([])
    setEditingStory(null)
  }}
  className="text-gray-400 hover:text-gray-600"
>
  <X className="w-6 h-6" />
</button>
```

**Botón Cancelar** (líneas 1920-1922):
```javascript
<button
  type="button"
  onClick={() => {
    setEditingSubTasks([])
    setEditingStory(null)
    setError(null)
  }}
  className="flex-1 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200"
>
  Cancelar
</button>
```

## 📄 Archivo 2: `src/components/SubTasks.jsx` - Código Completo

```javascript
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
      title: 'Nueva subtarea',  // ← Default title instead of empty (FIXED)
      completed: false,
      order: subTasks.length
    };
    
    const updatedSubTasks = [...subTasks, newSubTask];
    onUpdateSubTasks(updatedSubTasks);
    
    // Start editing the new sub-task
    setEditingId(newSubTask.id);
    setEditingTitle('Nueva subtarea');  // ← Set default title in edit state too (FIXED)
  };

  // Update sub-task title
  const handleUpdateTitle = (id, newTitle) => {
    const trimmedTitle = newTitle.trim();
    
    // If empty, ask user to confirm deletion (FIXED)
    if (!trimmedTitle) {
      if (confirm('¿Eliminar esta subtarea?')) {
        handleDeleteSubTask(id);
      } else {
        // Cancel edit and restore previous title
        const previousTitle = subTasks.find(st => st.id === id)?.title || '';
        setEditingTitle(previousTitle);
      }
      return;
    }
    
    const updatedSubTasks = subTasks.map(subTask =>
      subTask.id === id ? { ...subTask, title: trimmedTitle } : subTask
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
```

## 📄 Archivo 3: `src/main.jsx` - Error Handler

```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Suprimir errores de extensiones del navegador que no afectan la funcionalidad
// Este debe ejecutarse ANTES de que React se monte para capturar todos los errores
const suppressBrowserExtensionErrors = (event) => {
  try {
    const errorMessage = event.reason?.message || 
                        event.reason?.toString() || 
                        event.message || 
                        String(event.reason || event.error || event || '');
    
    const errorString = errorMessage.toLowerCase();
    
    if (
      errorString.includes('message channel closed') ||
      errorString.includes('listener indicated an asynchronous response') ||
      errorString.includes('asynchronous response by returning true') ||
      errorString.includes('channel closed before a response')
    ) {
      // Este error viene de extensiones del navegador, no de nuestro código
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      console.log('[Suprimido] Error de extensión del navegador:', errorMessage);
      return true;
    }
  } catch (e) {
    // Si algo falla al procesar el error, ignorarlo
  }
  return false;
};

// Capturar promesas rechazadas sin manejar
window.addEventListener('unhandledrejection', suppressBrowserExtensionErrors, true);

// Capturar errores síncronos
window.addEventListener('error', suppressBrowserExtensionErrors, true);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

## 🔑 Puntos Clave del Fix

### 1. Estado Independiente
- ✅ `editingSubTasks` es un estado independiente de `editingStory`
- ✅ Evita problemas de sincronización

### 2. Título por Defecto
- ✅ Las subtasks se crean con `title: 'Nueva subtarea'` en lugar de vacío
- ✅ Evita que se filtren antes de guardar

### 3. Confirmación antes de Eliminar
- ✅ Si el usuario borra todo el título, se pide confirmación
- ✅ Si cancela, se restaura el título anterior

### 4. Logging Detallado
- ✅ Todos los pasos tienen logs `[DIAGNOSTIC]` para debugging
- ✅ Facilita identificar dónde se pierde la información

## 📊 Estructura de Datos

### Subtask Object
```javascript
{
  id: 'subtask_1234567890_abc123',  // Generado por generateSubTaskId()
  title: 'Título de la subtarea',   // String, requerido
  completed: false,                  // Boolean
  order: 0,                          // Number, para ordenar
  description: 'Descripción opcional' // String opcional (de DB)
}
```

### Subtask en Base de Datos
```javascript
{
  id: 1,                             // ID numérico de Supabase
  user_story_id: 'US-039',           // FK a user_stories
  title: 'Título de la subtarea',    // String, requerido
  description: 'Descripción opcional', // String nullable
  completed: false,                  // Boolean
  created_at: '2025-01-15T10:00:00Z' // Timestamp
}
```

## 🎯 Flujo de Datos

1. **Carga inicial**: `loadData()` → `userStories` con `subtasks` anidados
2. **Abrir modal**: `editingStory` → `useEffect` → `editingSubTasks`
3. **Agregar subtask**: `handleAddSubTask()` → `updateEditingSubTasks()` → `editingSubTasks`
4. **Guardar**: `handleEditStory()` → captura `editingSubTasks` → borra en DB → inserta nuevas
5. **Cerrar modal**: `setEditingSubTasks([])` → `setEditingStory(null)`

