import React, { useState, useEffect, useCallback } from 'react'
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Users, 
  Calendar, 
  Filter, 
  ChevronDown, 
  ChevronRight, 
  Link2,
  Plus,
  X,
  Edit,
  Trash2
} from 'lucide-react'
import { supabase } from './lib/supabase'
import KanbanBoard from './components/KanbanBoard'
import UserStoryGuide from './components/UserStoryGuide'
import ParkingLot from './components/ParkingLot'
import { TeamTagsSelector, TeamTag, TEAM_MEMBERS } from './components/TeamTagsSelector'
import SubTasks from './components/SubTasks'
import ImageAttachments from './components/ImageAttachments'
import ImagePasteTextarea from './components/ImagePasteTextarea'

const formatStoryId = (id) => {
  const number = id.replace('US-', '').replace(/^0+/, '');
  return `#${number}`;
};

function App() {
  // Estados principales
  const [selectedView, setSelectedView] = useState('by-client')
  const [showArchived, setShowArchived] = useState(false)
  const [selectedStory, setSelectedStory] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterMember, setFilterMember] = useState('all')
  const [selectedClientFilter, setSelectedClientFilter] = useState('all')
  const [expandedClients, setExpandedClients] = useState({ 1: true, 2: true, 3: true, 4: true })
  const [selectedKPI, setSelectedKPI] = useState(null)
  const [showClientForm, setShowClientForm] = useState(false)
  const [showStoryForm, setShowStoryForm] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [parkingItems, setParkingItems] = useState([])
  const [showParkingForm, setShowParkingForm] = useState(false)
  const [selectedParkingItem, setSelectedParkingItem] = useState(null)
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
  const [editingDescriptionImages, setEditingDescriptionImages] = useState([])
  const [editingDetailsImages, setEditingDetailsImages] = useState([])
  const [editingDescription, setEditingDescription] = useState('')
  const [editingDetails, setEditingDetails] = useState('')
  const [storyToDelete, setStoryToDelete] = useState(null)
  const [formAssignedTo, setFormAssignedTo] = useState([])
  const [formSubTasks, setFormSubTasks] = useState([])
  const [formImages, setFormImages] = useState([])
  const [formDescriptionImages, setFormDescriptionImages] = useState([])
  const [formDetailsImages, setFormDetailsImages] = useState([])
  const [formDescription, setFormDescription] = useState('')
  const [formDetails, setFormDetails] = useState('')
  
  // Estados de datos
  const [clients, setClients] = useState([])
  const [userStories, setUserStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Cargar datos al montar el componente
  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    archiveOldCompletedStories()
  }, [])

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

  // Función para cargar datos desde Supabase
  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Verificar si tenemos configuración de Supabase
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        // Si no hay configuración, usar datos de ejemplo
        const clientsData = [
          { id: 1, name: 'TechCorp Solutions', project: 'Implementación ERP', status: 'on-track', health: 85 },
          { id: 2, name: 'Global Retail Inc', project: 'App Mobile E-commerce', status: 'at-risk', health: 60 },
          { id: 3, name: 'FinServe Bank', project: 'Portal de Clientes', status: 'on-track', health: 92 },
          { id: 4, name: 'MediCare Plus', project: 'Sistema de Gestión', status: 'delayed', health: 45 }
        ]
        
        const storiesData = [
          { id: 'US-001', client_id: 1, title: 'Login con autenticación de dos factores', description: 'Como usuario del sistema, quiero poder iniciar sesión con autenticación de dos factores para aumentar la seguridad de mi cuenta.', status: 'completed', priority: 'high', estimated_hours: 16, start_date: '2025-10-01', end_date: '2025-10-05', completed_date: '2025-10-05', assignee: 'María González', details: 'Implementar usando Google Authenticator. Debe funcionar en mobile y web.', dependencies: [], next_steps: ['US-002', 'US-003'], sub_tasks: [
            { id: 'subtask_1', title: 'Configurar Google Authenticator SDK', completed: true, order: 0 },
            { id: 'subtask_2', title: 'Crear interfaz de configuración 2FA', completed: true, order: 1 },
            { id: 'subtask_3', title: 'Implementar validación de códigos', completed: true, order: 2 },
            { id: 'subtask_4', title: 'Agregar opción de backup codes', completed: false, order: 3 }
          ], images: [] },
          { id: 'US-002', client_id: 1, title: 'Recuperación de contraseña', description: 'Como usuario, quiero poder recuperar mi contraseña mediante email para poder acceder si la olvido.', status: 'in-progress', priority: 'high', estimated_hours: 8, start_date: '2025-10-06', end_date: '2025-10-12', completed_date: null, assignee: 'Carlos Ruiz', details: 'Token válido por 24 horas. Incluir validación de seguridad.', dependencies: ['US-001'], next_steps: [], sub_tasks: [
            { id: 'subtask_5', title: 'Crear endpoint de recuperación', completed: true, order: 0 },
            { id: 'subtask_6', title: 'Diseñar email template', completed: false, order: 1 },
            { id: 'subtask_7', title: 'Implementar validación de token', completed: false, order: 2 }
          ], images: [] },
          { id: 'US-003', client_id: 1, title: 'Dashboard de métricas del usuario', description: 'Como administrador, quiero ver un dashboard con métricas clave de uso del sistema.', status: 'pending', priority: 'medium', estimated_hours: 24, start_date: '2025-10-13', end_date: '2025-10-20', completed_date: null, assignee: 'Ana López', details: 'Gráficos interactivos con filtros por fecha. Exportación a PDF.', dependencies: ['US-001'], next_steps: [], sub_tasks: [], images: [] },
          { id: 'US-005', client_id: 2, title: 'Catálogo de productos con búsqueda', description: 'Como cliente, quiero buscar productos por nombre, categoría y precio.', status: 'in-progress', priority: 'urgent', estimated_hours: 20, start_date: '2025-10-08', end_date: '2025-10-15', completed_date: null, assignee: 'Pedro Martínez', details: 'Búsqueda con autocompletado. Filtros múltiples. Paginación de resultados.', dependencies: [], next_steps: ['US-006'], sub_tasks: [
            { id: 'subtask_8', title: 'Crear índice de búsqueda', completed: true, order: 0 },
            { id: 'subtask_9', title: 'Implementar autocompletado', completed: false, order: 1 },
            { id: 'subtask_10', title: 'Agregar filtros avanzados', completed: false, order: 2 }
          ], images: [] },
          { id: 'US-006', client_id: 2, title: 'Carrito de compras', description: 'Como cliente, quiero agregar productos al carrito y modificar cantidades.', status: 'pending', priority: 'urgent', estimated_hours: 16, start_date: '2025-10-16', end_date: '2025-10-22', completed_date: null, assignee: 'Laura Sánchez', details: 'Persistir carrito en memoria. Calcular totales automáticamente.', dependencies: ['US-005'], next_steps: [], sub_tasks: [], images: [] },
          { id: 'US-010', client_id: 3, title: 'Portal de autoservicio', description: 'Como cliente del banco, quiero acceder a mis cuentas y realizar transacciones.', status: 'in-progress', priority: 'high', estimated_hours: 40, start_date: '2025-10-01', end_date: '2025-10-18', completed_date: null, assignee: 'Ana López', details: 'Consulta de saldos, transferencias, pago de servicios.', dependencies: [], next_steps: [], sub_tasks: [], images: [] },
          { id: 'US-012', client_id: 4, title: 'Gestión de pacientes', description: 'Como médico, quiero registrar y consultar información de pacientes.', status: 'completed', priority: 'urgent', estimated_hours: 28, start_date: '2025-09-20', end_date: '2025-10-02', completed_date: '2025-10-02', assignee: 'Pedro Martínez', details: 'Cumplir con HIPAA. Historial clínico completo.', dependencies: [], next_steps: ['US-013'], sub_tasks: [], images: [] },
          { id: 'US-013', client_id: 4, title: 'Agendamiento de citas', description: 'Como paciente, quiero agendar citas médicas en línea.', status: 'in-progress', priority: 'urgent', estimated_hours: 22, start_date: '2025-10-05', end_date: '2025-10-16', completed_date: null, assignee: 'Laura Sánchez', details: 'Calendario interactivo. Confirmación automática.', dependencies: ['US-012'], next_steps: [], sub_tasks: [], images: [] }
        ]
        
        const parkingData = [
          { id: 1, client_id: 1, title: 'Integración con WhatsApp Business', description: 'Los usuarios quieren recibir notificaciones por WhatsApp en lugar de email', category: 'feature', priority: 'high', created_by: 'Product Owner', created_at: '2025-01-15T10:00:00Z', notes: 'Investigar API de WhatsApp y costos', status: 'parked' },
          { id: 2, client_id: 2, title: 'Sistema de cupones y descuentos', description: 'Permitir crear códigos de descuento para promociones', category: 'feature', priority: 'medium', created_by: 'Cliente', created_at: '2025-01-14T14:30:00Z', notes: 'Definir tipos de descuento: porcentaje vs monto fijo', status: 'parked' },
          { id: 3, client_id: 1, title: 'Exportar reportes en Excel', description: 'Además de PDF, agregar opción de Excel', category: 'improvement', priority: 'low', created_by: 'Usuario Final', created_at: '2025-01-13T09:15:00Z', notes: null, status: 'parked' },
          { id: 4, client_id: 3, title: '¿Debemos soportar pagos con criptomonedas?', description: 'Algunos clientes han preguntado por Bitcoin', category: 'question', priority: 'low', created_by: 'Ventas', created_at: '2025-01-12T16:45:00Z', notes: 'Evaluar demanda real y complejidad técnica', status: 'parked' },
          { id: 5, client_id: 4, title: 'App móvil nativa', description: 'Tener apps iOS y Android dedicadas', category: 'idea', priority: 'high', created_by: 'CEO', created_at: '2025-01-11T11:20:00Z', notes: 'Muy costoso - evaluar si PWA es suficiente primero', status: 'parked' }
        ]
        
        setClients(clientsData)
        setUserStories(storiesData)
        setParkingItems(parkingData)
        return
      }
      
      // Cargar clientes desde Supabase
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('id')
      
      if (clientsError) throw clientsError
      
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
      
      // Map subtasks to sub_tasks for consistency
      // Supabase returns subtasks in 'subtasks' array, but app uses 'sub_tasks' in some places
      const mappedStories = (storiesData || []).map(story => ({
        ...story,
        sub_tasks: story.subtasks || [],
        subtasks: story.subtasks || []
      }))
      
      // Cargar parking lot desde Supabase
      const { data: parkingData, error: parkingError } = await supabase
        .from('parking_lot')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (parkingError) throw parkingError
      
      setClients(clientsData || [])
      setUserStories(mappedStories)
      setParkingItems(parkingData || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadArchivedStories = async () => {
    try {
      setLoading(true)
      
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        const archived = userStories.filter(s => s.status === 'completed' && s.archived)
        return archived
      }
      
      const { data: archivedData, error } = await supabase
        .from('user_stories')
        .select('*')
        .eq('archived', true)
        .order('completed_date', { ascending: false })
      
      if (error) throw error
      
      return archivedData || []
    } catch (err) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }

  // Funciones auxiliares
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in-progress': return 'bg-purple-50 text-primary border-primary'
      case 'pending': return 'bg-gray-100 text-gray-800'
      case 'blocked': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Completado'
      case 'in-progress': return 'En Progreso'
      case 'pending': return 'Pendiente'
      case 'blocked': return 'Bloqueado'
      default: return status
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-primary bg-purple-50 border-primary'
      case 'medium': return 'text-gray-600 bg-gray-50 border-gray-200'
      case 'low': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDaysRemaining = (endDate) => {
    if (!endDate) return null
    const today = new Date()
    const end = new Date(endDate)
    const diffTime = end - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getClientById = (clientId) => {
    return clients.find(client => client.id === clientId)
  }

  // Función para resetear el formulario de creación de story
  const resetForm = () => {
    setFormDescription('')
    setFormDetails('')
    setFormAssignedTo([])
    setFormSubTasks([])
    setFormImages([])
    setFormDescriptionImages([])
    setFormDetailsImages([])
  }

  // Variables computadas
  const filteredStories = userStories.filter(story => {
    if (selectedView === 'by-client' && story.status === 'completed' && !showArchived) {
      return false;
    }
    
    // Filtro por cliente
    if (selectedClientFilter !== 'all' && story.client_id !== parseInt(selectedClientFilter)) {
      return false;
    }
    
    // Filtro por status
    if (filterStatus !== 'all' && story.status !== filterStatus) {
      return false;
    }
    
    // Filtro por miembro del equipo
    if (filterMember !== 'all') {
      if (!story.assigned_to || !story.assigned_to.includes(filterMember)) {
        return false;
      }
    }
    
    return true;
  })

  // Filtrar clientes según el filtro seleccionado
  const filteredClients = selectedClientFilter === 'all' 
    ? clients 
    : clients.filter(c => c.id === parseInt(selectedClientFilter))

  const storiesByClient = selectedView === 'by-client' 
    ? filteredClients.map(client => ({
        ...client,
        stories: filteredStories.filter(story => story.client_id === client.id)
      }))
    : []

  const storiesByDate = selectedView === 'by-date' 
    ? [...filteredStories].sort((a, b) => new Date(a.end_date) - new Date(b.end_date))
    : []

  const totalStories = userStories.length
  const completedStories = userStories.filter(story => story.status === 'completed').length
  const inProgressStories = userStories.filter(story => story.status === 'in-progress').length
  const pendingStories = userStories.filter(story => story.status === 'pending').length

  // Funciones de manejo
  const toggleClient = (clientId) => {
    setExpandedClients(prev => ({
      ...prev,
      [clientId]: !prev[clientId]
    }))
  }

  const handleCreateClient = async (formData) => {
    try {
      // Verificar si tenemos configuración de Supabase
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        // Si no hay configuración, usar estado local
        const newClient = {
          id: Math.max(...clients.map(c => c.id), 0) + 1,
          name: formData.get('name'),
          project: formData.get('project'),
          status: 'on-track',
          health: 100
        }
        
        setClients(prev => [...prev, newClient])
        setShowClientForm(false)
        return
      }
      
      // Crear cliente en Supabase
      const { error } = await supabase
        .from('clients')
        .insert({
          name: formData.get('name'),
          project: formData.get('project'),
          status: 'on-track',
          health: 100
        })
      
      if (error) throw error
      
      // Recargar datos desde Supabase
      await loadData()
      setShowClientForm(false)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleCreateStory = async (formData) => {
    try {
      // Clear any previous errors
      setError(null)
      
      // Verificar si tenemos configuración de Supabase
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        // Si no hay configuración, usar estado local
        const maxId = Math.max(...userStories.map(story => 
          parseInt(story.id.split('-')[1]) || 0
        ))
        const newId = `US-${String(maxId + 1).padStart(3, '0')}`
        
        const newStory = {
          id: newId,
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
          assigned_to: formAssignedTo,
          dependencies: [],
          next_steps: [],
          sub_tasks: formSubTasks,
          images: formImages
        }
        
        setUserStories(prev => [...prev, newStory])
        resetForm()
        setShowStoryForm(false)
        
        // Si se creó desde un parking item, actualizar su estado
        if (selectedParkingItem) {
          await handleStoryCreatedFromParking(newId);
        }
        return
      }
      
      // Generar ID correlativo para Supabase
      const maxId = Math.max(...userStories.map(story => 
        parseInt(story.id.split('-')[1]) || 0
      ))
      const newId = `US-${String(maxId + 1).padStart(3, '0')}`
      
      // Crear user story en Supabase
      const basePayload = {
        id: newId,
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
        assigned_to: formAssignedTo
      }
      // Solo agregar images si existen
      if (Array.isArray(formImages) && formImages.length > 0) {
        basePayload.images = formImages
      }
      const { data: insertedStories, error } = await supabase
        .from('user_stories')
        .insert(basePayload)
        .select()
      
      if (error) throw error
      
      // Insertar subtasks por separado solo si existen válidos
      if (insertedStories && insertedStories[0]) {
        const storyId = insertedStories[0].id
        const validCreateSubTasks = Array.isArray(formSubTasks)
          ? formSubTasks
              .filter(st => st && st.title && String(st.title).trim() !== '')
              .map(st => ({
                user_story_id: storyId,
                title: String(st.title).trim(),
                description: st.description || null,
                completed: !!st.completed
              }))
          : []
        
        if (validCreateSubTasks.length > 0) {
          const { error: subtasksError } = await supabase
            .from('subtasks')
            .insert(validCreateSubTasks)
          
          if (subtasksError) {
            console.error('Error inserting subtasks:', subtasksError)
            throw subtasksError
          }
        }
      }
      
      // Recargar datos desde Supabase
      await loadData()
      
      // Only close the modal after ALL operations complete successfully
      resetForm()
      setShowStoryForm(false)
      
      // Si se creó desde un parking item, actualizar su estado
      if (selectedParkingItem) {
        await handleStoryCreatedFromParking(newId);
      }
    } catch (err) {
      console.error('Error creating user story:', err)
      setError(err.message)
      // DON'T close modal on error - let user try again
      // resetForm() and setShowStoryForm(false) are NOT called here
    }
  }

  const handleUpdateStoryStatus = async (storyId, newStatus) => {
    try {
      // Verificar si tenemos configuración de Supabase
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        // Si no hay configuración, usar estado local
        setUserStories(prev => prev.map(story => 
          story.id === storyId ? { 
            ...story, 
            status: newStatus,
            completed_date: newStatus === 'completed' ? new Date().toISOString() : story.completed_date
          } : story
        ))
        return
      }
      
      const updateData = { status: newStatus }
      if (newStatus === 'completed') {
        updateData.completed_date = new Date().toISOString()
      }
      
      // Actualizar estado en Supabase
      const { error } = await supabase
        .from('user_stories')
        .update(updateData)
        .eq('id', storyId)
      
      if (error) throw error
      
      // Recargar datos desde Supabase
      await loadData()
    } catch (err) {
      console.error('Error al actualizar story:', err)
      setError(err.message)
    }
  }

  const archiveOldCompletedStories = async () => {
    try {
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        return
      }
      
      const fifteenDaysAgo = new Date()
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15)
      
      const { error } = await supabase
        .from('user_stories')
        .update({ archived: true })
        .eq('status', 'completed')
        .lt('completed_date', fifteenDaysAgo.toISOString())
        .eq('archived', false)
      
      if (error) {
        console.error('Error archivando stories:', error)
        return
      }
      
      await loadData()
    } catch (err) {
      console.error('Error en archiveOldCompletedStories:', err)
    }
  }

  // Funciones para Parking Lot
  const handleCreateParkingItem = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      // Verificar si tenemos configuración de Supabase
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        // Si no hay configuración, usar estado local
        const newItem = {
          id: Date.now(),
          client_id: parseInt(formData.get('clientId')),
          title: formData.get('title'),
          description: formData.get('description'),
          category: formData.get('category'),
          priority: formData.get('priority'),
          created_by: formData.get('createdBy'),
          notes: formData.get('notes') || null,
          status: 'parked',
          created_at: new Date().toISOString()
        };
        setParkingItems(prev => [newItem, ...prev]);
        setShowParkingForm(false);
        return;
      }

      const { error } = await supabase
        .from('parking_lot')
        .insert([{
          client_id: parseInt(formData.get('clientId')),
          title: formData.get('title'),
          description: formData.get('description'),
          category: formData.get('category'),
          priority: formData.get('priority'),
          created_by: formData.get('createdBy'),
          notes: formData.get('notes') || null,
          status: 'parked'
        }]);

      if (error) throw error;
      await loadData();
      setShowParkingForm(false);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handlePromoteToStory = (parkingItem) => {
    resetForm();
    setSelectedParkingItem(parkingItem);
    setShowStoryForm(true);
  };

  // Función para manejar cuando se crea una story desde parking item
  const handleStoryCreatedFromParking = async (storyId) => {
    if (selectedParkingItem) {
      try {
        // Verificar si tenemos configuración de Supabase
        if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
          // Si no hay configuración, usar estado local
          setParkingItems(prev => prev.map(item => 
            item.id === selectedParkingItem.id 
              ? { ...item, status: 'promoted', promoted_to_story_id: storyId }
              : item
          ));
          setSelectedParkingItem(null);
          return;
        }

        // Actualizar en Supabase
        const { error } = await supabase
          .from('parking_lot')
          .update({ 
            status: 'promoted', 
            promoted_to_story_id: storyId 
          })
          .eq('id', selectedParkingItem.id);

        if (error) throw error;
        await loadData();
        setSelectedParkingItem(null);
      } catch (err) {
        alert('Error: ' + err.message);
      }
    }
  };

  const handleArchiveParkingItem = async (id) => {
    try {
      // Verificar si tenemos configuración de Supabase
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        // Si no hay configuración, usar estado local
        setParkingItems(prev => prev.map(item => 
          item.id === id ? { ...item, status: 'archived' } : item
        ));
        return;
      }

      const { error } = await supabase
        .from('parking_lot')
        .update({ status: 'archived' })
        .eq('id', id);

      if (error) throw error;
      await loadData();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleDeleteParkingItem = async (id) => {
    if (!confirm('¿Eliminar esta idea permanentemente?')) return;
    
    try {
      // Verificar si tenemos configuración de Supabase
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        // Si no hay configuración, usar estado local
        setParkingItems(prev => prev.filter(item => item.id !== id));
        return;
      }

      const { error } = await supabase
        .from('parking_lot')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadData();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

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
    const currentSubTasks = editingSubTasks || []
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

  const handleDeleteStory = async () => {
    try {
      // Verificar si tenemos configuración de Supabase
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        // Si no hay configuración, usar estado local
        setUserStories(prev => prev.filter(story => story.id !== storyToDelete.id))
        setStoryToDelete(null)
        return
      }
      
      // Eliminar user story en Supabase
      const { error } = await supabase
        .from('user_stories')
        .delete()
        .eq('id', storyToDelete.id)
      
      if (error) throw error
      
      // Recargar datos desde Supabase
      await loadData()
      setStoryToDelete(null)
    } catch (err) {
      setError(err.message)
    }
  }

  // Componente StoryCard
  const StoryCard = ({ story, showClient = false }) => {
    const daysRemaining = getDaysRemaining(story.end_date)
    const client = getClientById(story.client_id)

  return (
      <div 
        className="border border-gray-100 rounded-xl p-4 hover:border-primary hover:shadow-lg transition-all duration-200 cursor-pointer bg-white"
        onClick={() => setSelectedStory(story)}
      >
        {/* Header con ID y controles */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-gray-600">{formatStoryId(story.id)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(story.priority)}`}>
                {story.priority}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(story.status)}`}>
                {getStatusText(story.status)}
              </span>
            </div>
            <div className="flex gap-1 ml-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setEditingStory(story)
                }}
                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                title="Editar story"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setStoryToDelete(story)
                }}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                title="Eliminar story"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Cliente */}
        {showClient && client && (
          <div className="mb-2">
            <span className="text-sm font-medium text-gray-700">Cliente:</span>
            <span className="text-sm text-gray-600 ml-1">{client.name}</span>
          </div>
        )}
        
        {/* Título */}
        <h3 className="font-semibold text-gray-900 mb-2">{story.title}</h3>
        
        {/* Descripción */}
        <div className="mb-3">
          <p className="text-gray-600 text-sm line-clamp-2">{story.description}</p>
        </div>
        
        {/* Detalles adicionales */}
        {story.details && (
          <div className="mb-3">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Detalles adicionales:</span>
            <p className="text-gray-600 text-sm mt-1 line-clamp-2">{story.details}</p>
          </div>
        )}
        
        {/* Carga de documentos */}
        <div className="mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Documentos:</span>
            <div className="flex items-center gap-2">
              {story.story_points && (
                <span className="bg-purple-50 text-primary border border-primary text-xs font-bold px-2 py-1 rounded">
                  {story.story_points} pts
                </span>
              )}
              {story.sub_tasks && story.sub_tasks.length > 0 && (
                <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium px-2 py-1 rounded">
                  📋 {story.sub_tasks.filter(st => st.completed).length}/{story.sub_tasks.length}
                </span>
              )}
              {story.images && story.images.length > 0 && (
                <span className="bg-green-50 text-green-700 border border-green-200 text-xs font-medium px-2 py-1 rounded">
                  🖼️ {story.images.length}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center text-sm text-gray-500">
          <div className="flex items-center gap-4">
            {story.start_date && (
              <span>Inicio: {new Date(story.start_date).toLocaleDateString()}</span>
            )}
            {story.end_date && (
              <span>Fin: {new Date(story.end_date).toLocaleDateString()}</span>
            )}
            {daysRemaining !== null && (
              <span className={daysRemaining < 0 ? 'text-red-600' : daysRemaining < 3 ? 'text-orange-600' : 'text-gray-600'}>
                {daysRemaining < 0 ? `${Math.abs(daysRemaining)} días atrasado` : 
                 daysRemaining === 0 ? 'Hoy' : `${daysRemaining} días restantes`}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {story.assignee && <span>👤 {story.assignee}</span>}
            {story.estimated_hours && <span>⏱️ {story.estimated_hours}h</span>}
          </div>
        </div>
        
        {story.dependencies && story.dependencies.length > 0 && (
          <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
            <Link2 className="w-3 h-3" />
            <span>Dependencias: {story.dependencies.join(', ')}</span>
          </div>
        )}
        
        {/* Tags de equipo - NUEVO */}
        {story.assigned_to && story.assigned_to.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-100">
            {story.assigned_to.map(tagName => {
              const member = TEAM_MEMBERS.find(m => m.name === tagName);
              return member ? (
                <TeamTag
                  key={tagName}
                  name={member.name}
                  color={member.color}
                  size="sm"
                />
              ) : null;
            })}
          </div>
        )}
      </div>
    )
  }

  // Pantalla de carga
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos...</p>
        </div>
      </div>
    )
  }

  // Pantalla de error
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={loadData}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <img 
              src="/images/logo_nexcar.png" 
              alt="Nexar Logo" 
              className="w-12 h-12 object-contain"
            />
            <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">Dashboard de User Stories</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowGuide(true)}
              className="px-5 py-2.5 bg-white text-primary border-2 border-primary rounded-lg font-medium hover:bg-primary hover:text-white transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              📖 Guía de User Stories
            </button>
            <button
              onClick={() => setShowClientForm(true)}
              className="px-5 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-opacity-90 transition-all duration-200 flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Agregar Cliente
            </button>
            <button
              onClick={() => {
                resetForm()
                setShowStoryForm(true)
              }}
              className="px-5 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-opacity-90 transition-all duration-200 flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Agregar User Story
            </button>
            <button
              onClick={() => setShowParkingForm(true)}
              className="px-5 py-2.5 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition-all duration-200 flex items-center gap-2 shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              💡 Agregar Idea
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div 
            className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-primary hover:shadow-lg transition-all duration-200 cursor-pointer"
            onClick={() => setSelectedKPI('all')}
          >
            <div className="flex items-center justify-between">
      <div>
                <p className="text-sm font-medium text-gray-600">Total Stories</p>
                <p className="text-2xl font-bold text-gray-900">{totalStories}</p>
      </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </div>
          
          <div 
            className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-primary hover:shadow-lg transition-all duration-200 cursor-pointer"
            onClick={() => setSelectedKPI('completed')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completados</p>
                <p className="text-2xl font-bold text-green-600">{completedStories}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div 
            className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-primary hover:shadow-lg transition-all duration-200 cursor-pointer"
            onClick={() => setSelectedKPI('in-progress')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En Progreso</p>
                <p className="text-2xl font-bold text-blue-600">{inProgressStories}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div 
            className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-primary hover:shadow-lg transition-all duration-200 cursor-pointer"
            onClick={() => setSelectedKPI('pending')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-gray-600">{pendingStories}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-gray-600" />
            </div>
          </div>
        </div>

        {/* Filtro de Cliente */}
        <div className="mb-4 flex items-center gap-3">
          <label className="font-semibold text-gray-700">Filtrar por cliente:</label>
          <select 
            value={selectedClientFilter} 
            onChange={(e) => setSelectedClientFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="all">Todos los clientes</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
        </div>

        {/* Controles */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedView('by-client')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedView === 'by-client' 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                Por Cliente
        </button>
              
              {selectedView === 'by-client' && (
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                    showArchived
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {showArchived ? '✓ Mostrando Completadas' : 'Ver Completadas'}
                </button>
              )}
              
              <button
                onClick={() => setSelectedView('by-date')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedView === 'by-date' 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                Por Fecha
              </button>
              <button
                onClick={() => setSelectedView('kanban')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedView === 'kanban' ? 'bg-primary text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                Kanban
              </button>
              <button
                onClick={() => setSelectedView('parking')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedView === 'parking' 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                🅿️ Estacionamiento
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="all">Todos los estados</option>
                <option value="completed">Completado</option>
                <option value="in-progress">En Progreso</option>
                <option value="pending">Pendiente</option>
                <option value="blocked">Bloqueado</option>
              </select>
              
              <select
                value={filterMember}
                onChange={(e) => setFilterMember(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="all">Todos los miembros</option>
                {TEAM_MEMBERS.map(member => (
                  <option key={member.name} value={member.name}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
            
            {(filterStatus !== 'all' || filterMember !== 'all') && (
              <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 text-primary rounded-lg text-sm">
                <span className="font-semibold">{filteredStories.length}</span>
                <span>stories filtradas</span>
                <button
                  onClick={() => {
                    setFilterStatus('all');
                    setFilterMember('all');
                  }}
                  className="ml-2 text-xs underline hover:no-underline"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Vista por Cliente */}
        {selectedView === 'by-client' && (
          <div className="space-y-4">
            {selectedView === 'by-client' && showArchived && (
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-green-500 text-white rounded-full p-2">
                    <CheckCircle size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-green-900">Tareas Completadas</h2>
                    <p className="text-sm text-green-700">
                      Mostrando todas las user stories completadas • Las tareas se archivan automáticamente después de 15 días en "Done"
        </p>
      </div>
                </div>
              </div>
            )}
            {storiesByClient.map(client => (
              <div key={client.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-200">
                <div 
                  className="px-6 py-4 bg-white border-b border-gray-100"
                  onClick={() => toggleClient(client.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {expandedClients[client.id] ? 
                        <ChevronDown className="w-5 h-5 text-gray-500" /> : 
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      }
                      <div>
                        <h3 className="font-semibold text-gray-900">{client.name}</h3>
                        <p className="text-sm text-gray-600">{client.project}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500">{client.stories.length} stories</span>
                    </div>
                  </div>
                </div>
                
                {expandedClients[client.id] && (
                  <div className="px-4 pb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {client.stories.map(story => (
                        <StoryCard key={story.id} story={story} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Vista por Fecha */}
        {selectedView === 'by-date' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {storiesByDate.map(story => (
              <StoryCard key={story.id} story={story} showClient={true} />
            ))}
          </div>
        )}

        {/* Vista Kanban */}
        {selectedView === 'kanban' && (
          <KanbanBoard 
            userStories={filteredStories} 
            clients={clients} 
            onUpdateStory={handleUpdateStoryStatus} 
            onStoryClick={setSelectedStory} 
          />
        )}

        {/* Vista Estacionamiento */}
        {selectedView === 'parking' && (
          <ParkingLot
            parkingItems={parkingItems}
            clients={clients}
            onPromoteToStory={handlePromoteToStory}
            onArchive={handleArchiveParkingItem}
            onDelete={handleDeleteParkingItem}
            onItemClick={setSelectedParkingItem}
          />
        )}

        {/* Modal Agregar Cliente */}
        {showClientForm && (
          <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
              <div className="flex justify-between items-center p-6 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900">Agregar Cliente</h2>
                <button
                  onClick={() => setShowClientForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form 
                onSubmit={(e) => {
                  e.preventDefault()
                  handleCreateClient(new FormData(e.target))
                }}
                className="p-6 space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Cliente
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proyecto
                  </label>
                  <input
                    type="text"
                    name="project"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowClientForm(false)}
                    className="flex-1 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-opacity-90 transition-all duration-200 shadow-sm"
                  >
                    Crear Cliente
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Agregar User Story */}
        {showStoryForm && (
          <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedParkingItem ? 'Convertir Idea en User Story' : 'Agregar User Story'}
                </h2>
                <button
                  onClick={() => {
                    resetForm();
                    setShowStoryForm(false);
                    setSelectedParkingItem(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form 
                onSubmit={(e) => {
                  e.preventDefault()
                  handleCreateStory(new FormData(e.target))
                }}
                className="p-6 space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cliente
                  </label>
                  <select
                    name="client_id"
                    required
                    defaultValue={selectedParkingItem?.client_id || ''}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar cliente</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name} - {client.project}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    defaultValue={selectedParkingItem?.title || ''}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <ImagePasteTextarea
                    name="description"
                    required
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Como [usuario], quiero [funcionalidad] para [beneficio]..."
                    images={formDescriptionImages}
                    onImagesChange={setFormDescriptionImages}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Detalles Adicionales
                  </label>
                  <ImagePasteTextarea
                    name="details"
                    rows={2}
                    value={formDetails}
                    onChange={(e) => setFormDetails(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Criterios de aceptación, consideraciones técnicas, dependencias..."
                    images={formDetailsImages}
                    onImagesChange={setFormDetailsImages}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prioridad
                    </label>
                    <select
                      name="priority"
                      required
                      defaultValue={selectedParkingItem?.priority || ''}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                    >
                      <option value="low">Baja</option>
                      <option value="medium">Media</option>
                      <option value="high">Alta</option>
                      <option value="urgent">Urgente</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado
                    </label>
                    <select
                      name="status"
                      required
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                    >
                      <option value="pending">Backlog</option>
                      <option value="ready">To Do</option>
                      <option value="in-progress">En Progreso</option>
                      <option value="review">En Revisión</option>
                      <option value="completed">Completado</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Story Points
                  </label>
                  <select
                    name="storyPoints"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Sin estimar</option>
                    <option value="1">1 - Muy pequeño</option>
                    <option value="2">2 - Pequeño</option>
                    <option value="3">3 - Mediano</option>
                    <option value="5">5 - Grande</option>
                    <option value="8">8 - Muy grande</option>
                    <option value="13">13 - Enorme</option>
                    <option value="21">21 - Épico</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Inicio
                    </label>
                    <input
                      type="date"
                      name="start_date"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Fin
                    </label>
                    <input
                      type="date"
                      name="end_date"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Horas Estimadas
                    </label>
                    <input
                      type="number"
                      name="estimated_hours"
                      min="1"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                    />
                  </div>
                </div>
                
                <TeamTagsSelector
                  selectedTags={formAssignedTo}
                  onChange={setFormAssignedTo}
                />
                
                <SubTasks
                  subTasks={formSubTasks}
                  onUpdateSubTasks={setFormSubTasks}
                />
                
                <ImageAttachments
                  images={formImages}
                  onUpdateImages={setFormImages}
                />
                
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    <p className="text-sm font-medium">Error al crear: {error}</p>
                    <p className="text-xs mt-1">Por favor, verifica los datos e intenta de nuevo.</p>
                  </div>
                )}
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setShowStoryForm(false);
                      setSelectedParkingItem(null);
                      setError(null);
                    }}
                    className="flex-1 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-opacity-90 transition-all duration-200 shadow-sm"
                  >
                    Crear User Story
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Editar User Story */}
        {editingStory && (
          <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900">Editar User Story</h2>
                <button
                  onClick={() => {
                    setEditingSubTasks([])
                    setEditingStory(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form 
                onSubmit={async (e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  
                  // Prevent double submission
                  const submitButton = e.target.querySelector('button[type="submit"]')
                  if (submitButton) {
                    submitButton.disabled = true
                    submitButton.textContent = 'Guardando...'
                  }
                  
                  try {
                    await handleEditStory(new FormData(e.target))
                  } catch (err) {
                    console.error('Form submit error:', err)
                    // Re-enable button on error
                    if (submitButton) {
                      submitButton.disabled = false
                      submitButton.textContent = 'Guardar Cambios'
                    }
                  }
                }}
                className="p-6 space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cliente
                  </label>
                  <select
                    name="client_id"
                    required
                    defaultValue={editingStory.client_id}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name} - {client.project}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    defaultValue={editingStory.title}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <ImagePasteTextarea
                    name="description"
                    required
                    rows={3}
                    value={editingDescription}
                    onChange={(e) => setEditingDescription(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Como [usuario], quiero [funcionalidad] para [beneficio]..."
                    images={editingDescriptionImages}
                    onImagesChange={setEditingDescriptionImages}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Detalles Adicionales
                  </label>
                  <ImagePasteTextarea
                    name="details"
                    rows={2}
                    value={editingDetails}
                    onChange={(e) => setEditingDetails(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Criterios de aceptación, consideraciones técnicas, dependencias..."
                    images={editingDetailsImages}
                    onImagesChange={setEditingDetailsImages}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prioridad
                    </label>
                    <select
                      name="priority"
                      required
                      defaultValue={editingStory.priority}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                    >
                      <option value="low">Baja</option>
                      <option value="medium">Media</option>
                      <option value="high">Alta</option>
                      <option value="urgent">Urgente</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado
                    </label>
                    <select
                      name="status"
                      required
                      defaultValue={editingStory.status}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                    >
                      <option value="pending">Backlog</option>
                      <option value="ready">To Do</option>
                      <option value="in-progress">En Progreso</option>
                      <option value="review">En Revisión</option>
                      <option value="completed">Completado</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Story Points
                  </label>
                  <select
                    name="storyPoints"
                    defaultValue={editingStory.story_points || ''}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Sin estimar</option>
                    <option value="1">1 - Muy pequeño</option>
                    <option value="2">2 - Pequeño</option>
                    <option value="3">3 - Mediano</option>
                    <option value="5">5 - Grande</option>
                    <option value="8">8 - Muy grande</option>
                    <option value="13">13 - Enorme</option>
                    <option value="21">21 - Épico</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Inicio
                    </label>
                    <input
                      type="date"
                      name="start_date"
                      defaultValue={editingStory.start_date || ''}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Fin
                    </label>
                    <input
                      type="date"
                      name="end_date"
                      defaultValue={editingStory.end_date || ''}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Horas Estimadas
                    </label>
                    <input
                      type="number"
                      name="estimated_hours"
                      min="1"
                      defaultValue={editingStory.estimated_hours || ''}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                    />
                  </div>
                </div>
                
                <TeamTagsSelector
                  selectedTags={editingStory.assigned_to || []}
                  onChange={(tags) => setEditingStory({...editingStory, assigned_to: tags})}
                />
                
                <SubTasks
                  subTasks={editingSubTasks}
                  onUpdateSubTasks={updateEditingSubTasks}
                />
                
                <ImageAttachments
                  images={editingStory.images || []}
                  onUpdateImages={(images) => setEditingStory({...editingStory, images: images})}
                />
                
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    <p className="text-sm font-medium">Error al guardar: {error}</p>
                    <p className="text-xs mt-1">Por favor, verifica los datos e intenta de nuevo.</p>
                  </div>
                )}
                
                <div className="flex gap-3 pt-4">
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
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Confirmación Eliminar */}
        {storyToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
              <div className="flex justify-between items-center p-6 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900">Confirmar Eliminación</h2>
                <button
                  onClick={() => setStoryToDelete(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-100 rounded-full">
                    <Trash2 className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">¿Estás seguro de que quieres eliminar esta user story?</p>
                    <p className="text-sm text-gray-600 mt-1">{storyToDelete.title}</p>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-6">
                  Esta acción no se puede deshacer. La user story será eliminada permanentemente.
                </p>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setStoryToDelete(null)}
                    className="flex-1 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDeleteStory}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Eliminar
                  </button>
      </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal KPI */}
        {selectedKPI && (
          <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedKPI === 'all' ? 'Todas las Stories' :
                   selectedKPI === 'completed' ? 'Stories Completadas' :
                   selectedKPI === 'in-progress' ? 'Stories en Progreso' :
                   'Stories Pendientes'}
                </h2>
                <button
                  onClick={() => setSelectedKPI(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userStories
                    .filter(story => selectedKPI === 'all' || story.status === selectedKPI)
                    .map(story => (
                      <StoryCard key={story.id} story={story} showClient={true} />
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Detalle de Story */}
        {selectedStory && (
          <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900">{selectedStory.title}</h2>
                <button
                  onClick={() => setSelectedStory(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
        </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(selectedStory.priority)}`}>
                    {selectedStory.priority}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedStory.status)}`}>
                    {getStatusText(selectedStory.status)}
                  </span>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Descripción</h3>
                  <p className="text-gray-600">{selectedStory.description}</p>
                </div>
                
                {selectedStory.details && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Detalles</h3>
                    <p className="text-gray-600">{selectedStory.details}</p>
                  </div>
                )}
                
                {selectedStory.sub_tasks && selectedStory.sub_tasks.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Sub-tareas</h3>
                    <SubTasks
                      subTasks={selectedStory.sub_tasks}
                      onUpdateSubTasks={(subTasks) => {
                        // Update the story in the state
                        setUserStories(prev => prev.map(story => 
                          story.id === selectedStory.id 
                            ? { ...story, sub_tasks: subTasks }
                            : story
                        ))
                        setSelectedStory({...selectedStory, sub_tasks: subTasks})
                      }}
                    />
                  </div>
                )}
                
                {selectedStory.images && selectedStory.images.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Imágenes</h3>
                    <ImageAttachments
                      images={selectedStory.images}
                      onUpdateImages={(images) => {
                        // Update the story in the state
                        setUserStories(prev => prev.map(story => 
                          story.id === selectedStory.id 
                            ? { ...story, images: images }
                            : story
                        ))
                        setSelectedStory({...selectedStory, images: images})
                      }}
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Información del Proyecto</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">ID:</span> {formatStoryId(selectedStory.id)}</p>
                      <p><span className="font-medium">Cliente:</span> {getClientById(selectedStory.client_id)?.name}</p>
                      <p><span className="font-medium">Proyecto:</span> {getClientById(selectedStory.client_id)?.project}</p>
                      {selectedStory.assignee && (
                        <p><span className="font-medium">Asignado a:</span> {selectedStory.assignee}</p>
                      )}
                      {selectedStory.estimated_hours && (
                        <p><span className="font-medium">Horas estimadas:</span> {selectedStory.estimated_hours}h</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Fechas</h3>
                    <div className="space-y-2 text-sm">
                      {selectedStory.start_date && (
                        <p><span className="font-medium">Inicio:</span> {new Date(selectedStory.start_date).toLocaleDateString()}</p>
                      )}
                      {selectedStory.end_date && (
                        <p><span className="font-medium">Fin:</span> {new Date(selectedStory.end_date).toLocaleDateString()}</p>
                      )}
                      {selectedStory.completed_date && (
                        <p><span className="font-medium">Completado:</span> {new Date(selectedStory.completed_date).toLocaleDateString()}</p>
                      )}
                      {getDaysRemaining(selectedStory.end_date) !== null && (
                        <p className={getDaysRemaining(selectedStory.end_date) < 0 ? 'text-red-600' : getDaysRemaining(selectedStory.end_date) < 3 ? 'text-orange-600' : 'text-gray-600'}>
                          <span className="font-medium">Días restantes:</span> {
                            getDaysRemaining(selectedStory.end_date) < 0 ? `${Math.abs(getDaysRemaining(selectedStory.end_date))} días atrasado` : 
                            getDaysRemaining(selectedStory.end_date) === 0 ? 'Hoy' : `${getDaysRemaining(selectedStory.end_date)} días restantes`
                          }
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                {selectedStory.dependencies && selectedStory.dependencies.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Dependencias</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedStory.dependencies.map(dep => (
                        <span 
                          key={dep}
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm cursor-pointer hover:bg-blue-200 transition-colors"
                          onClick={() => {
                            const depStory = userStories.find(s => s.id === dep)
                            if (depStory) setSelectedStory(depStory)
                          }}
                        >
                          {formatStoryId(dep)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedStory.next_steps && selectedStory.next_steps.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Próximos Pasos</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedStory.next_steps.map(step => (
                        <span 
                          key={step}
                          className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm cursor-pointer hover:bg-green-200 transition-colors"
                          onClick={() => {
                            const stepStory = userStories.find(s => s.id === step)
                            if (stepStory) setSelectedStory(stepStory)
                          }}
                        >
                          {formatStoryId(step)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Agregar Idea al Estacionamiento */}
        {showParkingForm && (
          <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowParkingForm(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900">Agregar Idea al Estacionamiento</h2>
                <p className="text-sm text-gray-500 mt-1">Guarda ideas que aún no están listas para ser user stories</p>
              </div>
              <form onSubmit={handleCreateParkingItem} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Cliente *</label>
                  <select name="clientId" required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200">
                    <option value="">Selecciona un cliente</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.name} - {client.project}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Título *</label>
                  <input type="text" name="title" required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200" placeholder="Ej: Integración con WhatsApp" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
                  <textarea name="description" rows="3" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200" placeholder="Describe brevemente la idea..."></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Categoría *</label>
                    <select name="category" required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200">
                      <option value="idea">💡 Idea</option>
                      <option value="feature">📈 Feature</option>
                      <option value="improvement">✨ Mejora</option>
                      <option value="question">❓ Pregunta</option>
                      <option value="bug">🐛 Bug</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Prioridad *</label>
                    <select name="priority" required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200">
                      <option value="low">🟢 Baja</option>
                      <option value="medium">🟡 Media</option>
                      <option value="high">🔴 Alta</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Creado por</label>
                  <input type="text" name="createdBy" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200" placeholder="Ej: Product Owner, Cliente, CEO..." />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Notas adicionales</label>
                  <textarea name="notes" rows="2" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200" placeholder="Consideraciones, next steps, investigación pendiente..."></textarea>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowParkingForm(false)} className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">Cancelar</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-opacity-90 transition-all duration-200 shadow-sm">Guardar Idea</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Guía de User Stories */}
        {showGuide && (
          <UserStoryGuide onClose={() => setShowGuide(false)} />
        )}
      </div>
    </div>
  )
}

export default App