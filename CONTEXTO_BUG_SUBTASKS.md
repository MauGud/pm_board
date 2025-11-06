# Contexto Completo: Bug de Subtasks en Edición de User Stories

## 📋 Resumen del Problema

**Bug Principal**: Cuando se edita una user story existente, no se pueden agregar subtasks correctamente. Las subtasks se crean pero se filtran antes de guardarse porque tienen títulos vacíos.

**Síntomas**:
- Usuario hace clic en "Agregar subtarea" en el modal de edición
- Se crea una subtarea con título vacío
- Si el usuario guarda sin escribir un título, la subtarea se filtra y no se guarda
- Las subtasks existentes de la base de datos funcionan correctamente

## 🔍 Arquitectura y Flujo

### 1. Estructura de Datos

Las subtasks vienen de dos fuentes:
- **Desde la base de datos**: Vienen como `editingStory.subtasks` (array anidado de Supabase)
- **Desde el estado local**: Vienen como `editingStory.sub_tasks` (para modo sin Supabase)

### 2. Estados en App.jsx

```javascript
// Estado independiente para subtasks durante edición
const [editingSubTasks, setEditingSubTasks] = useState([])

// Wrapper con logging para debugging
const updateEditingSubTasks = useCallback((subTasks) => {
  console.log('[DIAGNOSTIC] updateEditingSubTasks called', {...})
  setEditingSubTasks(subTasks)
}, [])
```

### 3. Inicialización cuando se abre el modal de edición

```javascript
useEffect(() => {
  if (editingStory) {
    // ... otros estados ...
    
    // Initialize subtasks from either sub_tasks or subtasks (from DB)
    const initialSubTasks = editingStory.subtasks || editingStory.sub_tasks || []
    setEditingSubTasks(initialSubTasks)
  }
}, [editingStory])
```

### 4. Carga de datos desde Supabase

```javascript
const { data: storiesData } = await supabase
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
```

Las subtasks vienen como array anidado en `story.subtasks`.

## 📁 Archivos Involucrados

### 1. `src/App.jsx` - Lógica Principal

**Estados relacionados con subtasks** (líneas 47-62):
```javascript
const [editingSubTasks, setEditingSubTasks] = useState([])

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

**Inicialización de subtasks** (líneas 91-102):
```javascript
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

**Función handleEditStory** (líneas 695-870):
- Captura `editingSubTasks` al inicio
- Actualiza la user story en Supabase
- Borra todas las subtasks existentes
- Inserta las nuevas subtasks (filtrando las que tienen título válido)

**Filtro de subtasks** (líneas 820-827):
```javascript
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
```

**Uso del componente SubTasks en el modal** (líneas 1899-1902):
```javascript
<SubTasks
  subTasks={editingSubTasks}
  onUpdateSubTasks={updateEditingSubTasks}
/>
```

**Limpieza al cerrar modal** (múltiples lugares):
- Botón X del modal (línea 1678-1679)
- Botón Cancelar (línea 1900)
- Después de guardar exitosamente (línea 848)
- En modo local sin Supabase (línea 755)

### 2. `src/components/SubTasks.jsx` - Componente de Subtasks

**Función handleAddSubTask** (líneas 26-43):
- ✅ FIJADO: Ahora crea subtasks con título por defecto "Nueva subtarea"
- Antes creaba con `title: ''` (vacío)

**Función handleUpdateTitle** (líneas 45-67):
- ✅ FIJADO: Ahora pregunta confirmación antes de eliminar si el título está vacío
- Antes eliminaba automáticamente

**Estructura de subtask**:
```javascript
{
  id: 'subtask_1234567890_abc123',
  title: 'Título de la subtarea',
  completed: false,
  order: 0
}
```

### 3. `src/main.jsx` - Error Handler Global

Maneja errores de extensiones del navegador que causan el error "message channel closed".

## 🔧 Cambios Realizados

### Fix 1: Estado Independiente para Subtasks
- **Problema**: Usar `editingStory.sub_tasks` directamente causaba problemas de sincronización
- **Solución**: Crear estado independiente `editingSubTasks`
- **Ubicación**: App.jsx línea 48

### Fix 2: Título por Defecto
- **Problema**: Subtasks se creaban con título vacío y se filtraban
- **Solución**: Crear con título "Nueva subtarea"
- **Ubicación**: SubTasks.jsx líneas 32 y 42

### Fix 3: Confirmación antes de Eliminar
- **Problema**: Si el usuario borraba todo el título, se eliminaba automáticamente
- **Solución**: Pedir confirmación y restaurar título si cancela
- **Ubicación**: SubTasks.jsx líneas 46-67

### Fix 4: Filtro Mejorado con Logging
- **Problema**: Difícil diagnosticar por qué se filtraban subtasks
- **Solución**: Logs detallados antes y después del filtro
- **Ubicación**: App.jsx líneas 808-827

## 📊 Flujo Completo

### Al abrir modal de edición:
1. Usuario hace clic en editar user story
2. `setEditingStory(story)` se ejecuta
3. `useEffect` detecta cambio en `editingStory`
4. Se inicializa `editingSubTasks` desde `editingStory.subtasks` o `editingStory.sub_tasks`
5. Modal se muestra con subtasks existentes

### Al agregar nueva subtask:
1. Usuario hace clic en "Agregar" en componente SubTasks
2. `handleAddSubTask()` se ejecuta
3. Crea nueva subtask con `title: 'Nueva subtarea'`
4. Llama a `onUpdateSubTasks(updatedSubTasks)` → `updateEditingSubTasks()`
5. `setEditingSubTasks()` actualiza el estado
6. SubTasks se re-renderiza con la nueva subtask en modo edición

### Al guardar:
1. Usuario hace clic en "Guardar Cambios"
2. `handleEditStory(formData)` se ejecuta
3. Captura `currentSubTasks = editingSubTasks || []`
4. Actualiza user story en Supabase
5. Borra todas las subtasks existentes de la DB
6. Filtra subtasks válidas (con título)
7. Inserta subtasks válidas en la DB
8. Recarga datos con `loadData()`
9. Cierra modal y limpia `editingSubTasks`

## 🐛 Problemas Resueltos

1. ✅ **Subtasks con título vacío se filtran**
   - Solución: Crear con título por defecto "Nueva subtarea"

2. ✅ **Problemas de sincronización de estado**
   - Solución: Estado independiente `editingSubTasks`

3. ✅ **Subtasks no se guardan al editar**
   - Solución: Usar `editingSubTasks` en lugar de `editingStory.sub_tasks`

4. ✅ **Formulario se cierra inesperadamente**
   - Solución: Manejo de errores mejorado, try-catch en operaciones de subtasks

## 📝 Logs de Diagnóstico

Todos los logs tienen el prefijo `[DIAGNOSTIC]`:

- `updateEditingSubTasks called`: Cuando se actualiza el estado de subtasks
- `handleEditStory called`: Inicio de guardado
- `Captured values`: Valores capturados al inicio
- `Starting subtasks handling`: Inicio de manejo de subtasks
- `Processing subtasks before filter`: Antes de filtrar
- `Filtered out subtask (no title)`: Subtask filtrada (no debería pasar ahora)
- `Valid subtasks to insert`: Subtasks válidas para insertar
- `Successfully inserted subtasks`: Inserción exitosa

## 🎯 Próximos Pasos (si el bug persiste)

1. Verificar que `updateEditingSubTasks` se llama cuando se agrega/edita subtask
2. Verificar que `editingSubTasks` tiene el valor correcto cuando se guarda
3. Revisar logs de diagnóstico para identificar dónde se pierde la información
4. Verificar que el filtro no está siendo demasiado estricto

## 📚 Referencias

- **Base de datos**: Tabla `subtasks` en Supabase
- **Relación**: `subtasks.user_story_id` → `user_stories.id`
- **Campos**: `id`, `title`, `description`, `completed`, `created_at`, `user_story_id`

