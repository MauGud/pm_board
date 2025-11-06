# Prueba: Carga y Visualización de Subtasks

## 🧪 Checklist de Prueba

### 1. Verificar que las Subtasks se Cargan desde la Base de Datos

**Pasos:**
1. Abre la aplicación en el navegador
2. Abre la consola del navegador (F12 → Console)
3. Verifica que no hay errores al cargar las user stories
4. Busca una user story que tenga subtasks guardadas

**Resultado esperado:**
- ✅ Las user stories se cargan sin errores
- ✅ Las user stories con subtasks muestran las subtasks en la vista
- ✅ En la consola, verifica que `loadData()` completa correctamente

**Verificación en código:**
```javascript
// En loadData(), después del mapeo:
const mappedStories = (storiesData || []).map(story => ({
  ...story,
  sub_tasks: story.subtasks || [],  // ✅ Mapeado
  subtasks: story.subtasks || []     // ✅ Original preservado
}))
```

### 2. Verificar que las Subtasks Aparecen al Abrir el Modal de Edición

**Pasos:**
1. Haz clic en una user story existente que tenga subtasks
2. Haz clic en el botón de editar (o doble clic)
3. El modal de edición debe abrirse

**Resultado esperado:**
- ✅ El modal se abre correctamente
- ✅ Las subtasks existentes aparecen en la sección "Sub-tareas"
- ✅ Puedes ver los títulos de las subtasks
- ✅ Puedes ver el estado de completado (checkboxes)

**Verificación en código:**
```javascript
// En useEffect de inicialización (línea 99-101):
const initialSubTasks = editingStory.subtasks || editingStory.sub_tasks || []
// ✅ Busca en ambas propiedades (subtasks Y sub_tasks)
setEditingSubTasks(initialSubTasks)
```

### 3. Verificar que se Pueden Agregar Nuevas Subtasks

**Pasos:**
1. Con el modal de edición abierto
2. Haz clic en el botón "Agregar" en la sección Sub-tareas
3. Debe aparecer una nueva subtask con título "Nueva subtarea"

**Resultado esperado:**
- ✅ Se crea una nueva subtask inmediatamente
- ✅ El título por defecto es "Nueva subtarea" (no vacío)
- ✅ La subtask está en modo edición
- ✅ Puedes escribir para cambiar el título

**Verificación en código:**
```javascript
// En SubTasks.jsx, handleAddSubTask (línea 32):
title: 'Nueva subtarea',  // ✅ Título por defecto
```

### 4. Verificar que las Subtasks se Guardan Correctamente

**Pasos:**
1. Agrega o edita una subtask
2. Escribe un título válido (ej: "Subtask de prueba")
3. Haz clic en "Guardar Cambios"
4. Observa los logs en la consola

**Resultado esperado en consola:**
```
[DIAGNOSTIC] handleEditStory called
[DIAGNOSTIC] Captured values { currentSubTasksCount: 1, ... }
[DIAGNOSTIC] Starting subtasks handling
[DIAGNOSTIC] Deleting existing subtasks...
[DIAGNOSTIC] Successfully deleted existing subtasks
[DIAGNOSTIC] Processing subtasks before filter: { count: 1, ... }
[DIAGNOSTIC] Valid subtasks to insert: { count: 1, ... }
[DIAGNOSTIC] Inserting subtasks...
[DIAGNOSTIC] Successfully inserted subtasks
[DIAGNOSTIC] loadData() completed
[DIAGNOSTIC] Modal closed
```

**Resultado esperado:**
- ✅ No hay errores en la consola
- ✅ El modal se cierra correctamente
- ✅ Los logs muestran que se insertaron las subtasks

### 5. Verificar que las Subtasks se Cargan Después de Recargar

**Pasos:**
1. Después de guardar, espera a que se recarguen los datos
2. Busca la misma user story que acabas de editar
3. Haz clic en editar nuevamente

**Resultado esperado:**
- ✅ Las subtasks que guardaste aparecen en el modal
- ✅ Tienen los títulos correctos
- ✅ Mantienen su estado de completado
- ✅ Puedes verlas, editaras, eliminarlas

**Verificación en código:**
```javascript
// En loadData(), el mapeo asegura que ambas propiedades estén disponibles:
const mappedStories = (storiesData || []).map(story => ({
  ...story,
  sub_tasks: story.subtasks || [],  // ✅ Disponible como sub_tasks
  subtasks: story.subtasks || []     // ✅ Disponible como subtasks
}))
```

### 6. Verificar el Mapeo de Propiedades

**Prueba en consola del navegador:**

Abre la consola y ejecuta:
```javascript
// Verificar que las user stories tienen ambas propiedades
const stories = window.userStories || []; // Si tienes acceso global
// O inspecciona en React DevTools

// Deberías ver algo como:
{
  id: 'US-039',
  title: 'Mi User Story',
  subtasks: [
    { id: 1, title: 'Subtask 1', completed: false, ... },
    { id: 2, title: 'Subtask 2', completed: true, ... }
  ],
  sub_tasks: [
    { id: 1, title: 'Subtask 1', completed: false, ... },
    { id: 2, title: 'Subtask 2', completed: true, ... }
  ]
}
```

**Resultado esperado:**
- ✅ Cada story tiene `subtasks` (array original)
- ✅ Cada story tiene `sub_tasks` (array mapeado)
- ✅ Ambos arrays contienen las mismas subtasks

## 🐛 Problemas Conocidos y Soluciones

### Problema: Subtasks no aparecen al reabrir
**Causa**: El mapeo no se estaba haciendo
**Solución**: ✅ Agregado mapeo en `loadData()` (líneas 185-191)

### Problema: Subtasks se filtran antes de guardar
**Causa**: Títulos vacíos
**Solución**: ✅ Título por defecto "Nueva subtarea" en `SubTasks.jsx`

### Problema: Formulario se cierra inesperadamente
**Causa**: Errores de extensiones del navegador
**Solución**: ✅ Error handler global en `main.jsx`

## 📊 Logs de Diagnóstico

Todos los logs tienen el prefijo `[DIAGNOSTIC]`. Busca estos en la consola:

1. **Al cargar datos:**
   - No debería haber errores
   - Las stories deberían tener `subtasks` y `sub_tasks`

2. **Al abrir modal de edición:**
   - `updateEditingSubTasks called` (si hay cambios)
   - Las subtasks deberían inicializarse correctamente

3. **Al guardar:**
   - Secuencia completa de logs desde `handleEditStory called` hasta `Modal closed`
   - `Successfully inserted subtasks` debe aparecer

## ✅ Criterios de Éxito

La prueba es exitosa si:
1. ✅ Las subtasks se cargan desde la base de datos
2. ✅ Las subtasks aparecen al abrir el modal de edición
3. ✅ Se pueden agregar nuevas subtasks
4. ✅ Las subtasks se guardan correctamente
5. ✅ Las subtasks persisten después de recargar
6. ✅ No hay errores en la consola
7. ✅ Los logs muestran el flujo completo

## 🔍 Verificación Manual Rápida

**Script rápido para verificar en consola:**

```javascript
// 1. Verificar que las stories tienen subtasks mapeadas
console.log('Stories con subtasks:', 
  userStories.filter(s => s.subtasks?.length > 0 || s.sub_tasks?.length > 0)
);

// 2. Verificar que ambas propiedades existen
userStories.forEach(story => {
  if (story.subtasks || story.sub_tasks) {
    console.log(`Story ${story.id}:`, {
      subtasks: story.subtasks?.length || 0,
      sub_tasks: story.sub_tasks?.length || 0,
      match: JSON.stringify(story.subtasks) === JSON.stringify(story.sub_tasks)
    });
  }
});
```

## 📝 Notas

- El mapeo se hace en `loadData()` después de cargar desde Supabase
- Tanto `subtasks` como `sub_tasks` apuntan al mismo array
- El `useEffect` de inicialización busca en ambas propiedades
- Las subtasks se guardan con `user_story_id` en la tabla `subtasks`

