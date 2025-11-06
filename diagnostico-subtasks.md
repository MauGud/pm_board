# Diagnóstico: Problema con Subtasks en Edición

## 🔍 Logs de Diagnóstico Activos

Se han agregado logs de diagnóstico con el prefijo `[DIAGNOSTIC]` en la consola del navegador. Abre las DevTools (F12) y revisa la pestaña "Console" para ver el flujo completo.

## 📋 Pasos de Prueba

### 1. Crear Tarea de Prueba (SIN subtasks)
1. Abre el formulario de creación
2. Completa los campos básicos:
   - Cliente: Selecciona uno
   - Título: "Tarea de Prueba - Diagnóstico"
   - Descripción: "Esta es una tarea de prueba para diagnosticar el problema con subtasks"
   - Estado: "Backlog"
   - Prioridad: "Medium"
3. **NO agregues subtasks**
4. Haz clic en "Crear User Story"
5. **Resultado esperado**: La tarea se crea correctamente y el formulario se cierra

### 2. Consultar la Tarea Creada
1. Busca la tarea "Tarea de Prueba - Diagnóstico" en la lista
2. Haz clic para ver los detalles
3. **Resultado esperado**: La tarea se muestra correctamente con todos sus datos

### 3. Editar la Tarea y Agregar Subtask
1. Abre las DevTools (F12) → Pestaña Console
2. Haz clic en el botón de editar (o doble clic en la tarea)
3. El formulario de edición debe abrirse
4. **Observa la consola** - Deberías ver logs cuando se abre el modal
5. Agrega una subtask:
   - Haz clic en el botón "+" para agregar subtask
   - **Observa la consola** - Deberías ver: `[DIAGNOSTIC] handleUpdateEditingSubTasks called`
   - Escribe el título: "Subtask de prueba"
   - Presiona Enter o haz clic fuera
6. **Resultado esperado**: 
   - La subtask se agrega a la lista visible
   - En consola deberías ver logs de actualización
7. Haz clic en "Guardar Cambios"
8. **Observa la consola cuidadosamente** - Deberías ver esta secuencia:
   ```
   [DIAGNOSTIC] handleEditStory called
   [DIAGNOSTIC] Captured values
   [DIAGNOSTIC] Starting subtasks handling
   [DIAGNOSTIC] Deleting existing subtasks...
   [DIAGNOSTIC] Successfully deleted existing subtasks
   [DIAGNOSTIC] Valid subtasks to insert
   [DIAGNOSTIC] Inserting subtasks...
   [DIAGNOSTIC] Successfully inserted subtasks
   [DIAGNOSTIC] About to call loadData()
   [DIAGNOSTIC] loadData() completed
   [DIAGNOSTIC] About to close modal (setEditingStory(null))
   [DIAGNOSTIC] Modal closed
   ```
9. **Resultado esperado**: El formulario NO debe cerrarse inesperadamente antes de completar todos los pasos

### 4. Verificar que la Subtask se Guardó
1. Después de guardar, verifica que:
   - El formulario permanezca abierto (si hay error)
   - O se cierre correctamente después de guardar exitosamente
2. Abre la tarea nuevamente
3. **Resultado esperado**: La subtask debe aparecer en la lista

## 📊 Qué Buscar en los Logs

### Si el formulario se cierra ANTES de tiempo:
- ✅ Busca si todos los logs `[DIAGNOSTIC]` aparecen
- ❌ Si faltan logs, el problema está en ese punto específico
- ❌ Si ves el log "About to close modal" pero el modal se cierra antes, puede ser un problema de React

### Si hay errores:
- Busca mensajes que NO tengan el prefijo `[DIAGNOSTIC]`
- Busca errores rojos en la consola
- Verifica si hay errores de Supabase (network, permissions, etc.)

### Si las subtasks no se guardan:
- Verifica que aparezca `[DIAGNOSTIC] Successfully inserted subtasks`
- Si no aparece, revisa el log anterior para ver qué falló
- Verifica que `currentSubTasksCount` sea mayor que 0

## 🐛 Problemas Detectados

### Síntoma Principal
El formulario se cierra inmediatamente al intentar guardar cambios cuando hay subtasks.

### Error en Consola
```
Uncaught (in promise) Error: A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received
```

### Posibles Causas

1. **Operaciones asíncronas no esperadas**
   - El callback `onUpdateSubTasks` puede estar causando actualizaciones de estado que interrumpen el flujo
   - El `loadData()` puede estar causando un re-render que desmonta el componente
   - **SOLUCIÓN**: Los logs mostrarán exactamente dónde se interrumpe

2. **Problema de sincronización de estado**
   - `editingStory` puede estar cambiando durante las operaciones asíncronas
   - El spread operator `{...editingStory, sub_tasks: subTasks}` puede estar usando valores obsoletos
   - **SOLUCIÓN**: Los valores se capturan al inicio, los logs mostrarán si hay inconsistencia

3. **Extensiones del navegador**
   - React DevTools u otras extensiones pueden estar causando el error "message channel closed"
   - **SOLUCIÓN**: Probar en modo incógnito

4. **loadData() causa re-render prematuro**
   - `loadData()` actualiza `userStories`, lo que puede causar que React desmonte el modal
   - **SOLUCIÓN**: Verificar si los logs se detienen en "About to call loadData()"

## ✅ Cambios Realizados

1. ✅ Captura de valores al inicio de `handleEditStory` (previene stale closures)
2. ✅ Callback estable con `useCallback` para `handleUpdateEditingSubTasks`
3. ✅ Manejo de errores mejorado en operaciones de subtasks (no interrumpe el flujo)
4. ✅ Protección contra doble submit (deshabilita botón durante guardado)
5. ✅ Orden de operaciones corregido (loadData antes de cerrar modal)
6. ✅ Logs de diagnóstico detallados para rastrear el problema

## Próximos Pasos

1. Ejecutar las pruebas manuales arriba
2. Verificar la consola del navegador para errores
3. Probar en modo incógnito (sin extensiones)
4. Verificar si el problema ocurre solo con subtasks o también en otros casos

