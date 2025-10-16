# Dashboard de Gestión de Proyectos - PM Dashboard

Una aplicación web completa de gestión de proyectos construida con React + Vite + TailwindCSS + Supabase para Project Managers.

## 🚀 Características

- **Dashboard Interactivo**: KPIs clickeables que filtran user stories por estado
- **Vista por Cliente**: Accordion expandible con todas las stories organizadas por cliente
- **Vista por Fecha**: Lista cronológica de stories ordenadas por fecha de fin
- **Gestión de Clientes**: Formulario para agregar nuevos clientes
- **Gestión de User Stories**: Formulario completo con todos los campos necesarios
- **Detalles Completos**: Modal con información detallada de cada story
- **Dependencias Navegables**: Click en dependencias para navegar entre stories
- **Filtros Avanzados**: Filtrado por estado de las stories
- **Base de Datos Real**: Conectado a Supabase con persistencia completa
- **Diseño Profesional**: UI moderna con TailwindCSS y animaciones suaves

## 📋 Configuración de Supabase

### 1. Crear Proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Espera a que se complete la configuración

### 2. Configurar Base de Datos

En el SQL Editor de Supabase, ejecuta el siguiente script completo:

```sql
-- Crear tabla de clientes
CREATE TABLE clients (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  project TEXT NOT NULL,
  status TEXT DEFAULT 'on-track',
  health INTEGER DEFAULT 100,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Crear tabla de user stories
CREATE TABLE user_stories (
  id TEXT PRIMARY KEY,
  client_id BIGINT REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  estimated_hours INTEGER,
  start_date DATE,
  end_date DATE,
  completed_date DATE,
  assignee TEXT,
  details TEXT,
  dependencies TEXT[] DEFAULT '{}',
  next_steps TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stories ENABLE ROW LEVEL SECURITY;

-- Crear políticas de seguridad (permitir todo para demo)
CREATE POLICY "Enable all for clients" ON clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for user_stories" ON user_stories FOR ALL USING (true) WITH CHECK (true);

-- Insertar datos de ejemplo
INSERT INTO clients (id, name, project, status, health) VALUES 
(1, 'TechCorp Solutions', 'Implementación ERP', 'on-track', 85),
(2, 'Global Retail Inc', 'App Mobile E-commerce', 'at-risk', 60),
(3, 'FinServe Bank', 'Portal de Clientes', 'on-track', 92),
(4, 'MediCare Plus', 'Sistema de Gestión', 'delayed', 45);

INSERT INTO user_stories VALUES 
('US-001', 1, 'Login con autenticación de dos factores', 'Como usuario del sistema, quiero poder iniciar sesión con autenticación de dos factores para aumentar la seguridad de mi cuenta.', 'completed', 'high', 16, '2025-10-01', '2025-10-05', '2025-10-05', 'María González', 'Implementar usando Google Authenticator. Debe funcionar en mobile y web.', '{}', '{"US-002","US-003"}', NOW()),
('US-002', 1, 'Recuperación de contraseña', 'Como usuario, quiero poder recuperar mi contraseña mediante email para poder acceder si la olvido.', 'in-progress', 'high', 8, '2025-10-06', '2025-10-12', NULL, 'Carlos Ruiz', 'Token válido por 24 horas. Incluir validación de seguridad.', '{"US-001"}', '{}', NOW()),
('US-003', 1, 'Dashboard de métricas del usuario', 'Como administrador, quiero ver un dashboard con métricas clave de uso del sistema.', 'pending', 'medium', 24, '2025-10-13', '2025-10-20', NULL, 'Ana López', 'Gráficos interactivos con filtros por fecha. Exportación a PDF.', '{"US-001"}', '{}', NOW()),
('US-005', 2, 'Catálogo de productos con búsqueda', 'Como cliente, quiero buscar productos por nombre, categoría y precio.', 'in-progress', 'urgent', 20, '2025-10-08', '2025-10-15', NULL, 'Pedro Martínez', 'Búsqueda con autocompletado. Filtros múltiples. Paginación de resultados.', '{}', '{"US-006"}', NOW()),
('US-006', 2, 'Carrito de compras', 'Como cliente, quiero agregar productos al carrito y modificar cantidades.', 'pending', 'urgent', 16, '2025-10-16', '2025-10-22', NULL, 'Laura Sánchez', 'Persistir carrito en memoria. Calcular totales automáticamente.', '{"US-005"}', '{}', NOW()),
('US-010', 3, 'Portal de autoservicio', 'Como cliente del banco, quiero acceder a mis cuentas y realizar transacciones.', 'in-progress', 'high', 40, '2025-10-01', '2025-10-18', NULL, 'Ana López', 'Consulta de saldos, transferencias, pago de servicios.', '{}', '{}', NOW()),
('US-012', 4, 'Gestión de pacientes', 'Como médico, quiero registrar y consultar información de pacientes.', 'completed', 'urgent', 28, '2025-09-20', '2025-10-02', '2025-10-02', 'Pedro Martínez', 'Cumplir con HIPAA. Historial clínico completo.', '{}', '{"US-013"}', NOW()),
('US-013', 4, 'Agendamiento de citas', 'Como paciente, quiero agendar citas médicas en línea.', 'in-progress', 'urgent', 22, '2025-10-05', '2025-10-16', NULL, 'Laura Sánchez', 'Calendario interactivo. Confirmación automática.', '{"US-012"}', '{}', NOW());
```

### 3. Obtener Credenciales

1. Ve a **Settings** > **API** en tu proyecto de Supabase
2. Copia la **Project URL** y la **anon public** key

### 4. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con tus credenciales:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

**Importante**: Reemplaza `tu-proyecto.supabase.co` y `tu_anon_key_aqui` con tus valores reales.

## 🛠️ Instalación y Ejecución

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Construir para producción
npm run build
```

## 📱 Funcionalidades

### Dashboard Principal
- **4 KPIs Interactivos**: Total Stories, Completados, En Progreso, Pendientes
- **Click en KPIs**: Filtra y muestra stories por estado específico
- **Botones de Acción**: Agregar Cliente y Agregar User Story

### Vistas de Datos
- **Por Cliente**: Accordion expandible con stories organizadas por cliente
- **Por Fecha**: Lista cronológica ordenada por fecha de fin
- **Filtros**: Dropdown para filtrar por estado (Todos, Completado, En Progreso, Pendiente, Bloqueado)

### Gestión de Clientes
- **Formulario Simple**: Nombre del cliente y proyecto
- **Estado Automático**: Se crea con estado "on-track" y salud 100%
- **Validación**: Campos requeridos

### Gestión de User Stories
- **Formulario Completo**: Todos los campos necesarios para una story completa
- **Campos Incluidos**:
  - Cliente (dropdown)
  - Título y descripción
  - Detalles adicionales
  - Prioridad (Baja, Media, Alta, Urgente)
  - Estado (Pendiente, En Progreso, Completado, Bloqueado)
  - Fechas de inicio y fin
  - Horas estimadas
  - Asignado a
- **ID Automático**: Genera IDs correlativos US-001, US-002, etc.

### Detalles de Story
- **Modal Completo**: Toda la información de la story
- **Información del Proyecto**: ID, cliente, proyecto, asignado, horas
- **Fechas**: Inicio, fin, completado, días restantes
- **Dependencias**: Click para navegar a stories dependientes
- **Próximos Pasos**: Click para navegar a stories siguientes

### Características Técnicas
- **Base de Datos Real**: Supabase con persistencia completa
- **Modo Híbrido**: Funciona con Supabase o con datos locales
- **Responsive**: Diseño adaptable a móviles y tablets
- **Animaciones**: Transiciones suaves y efectos hover
- **Estados Visuales**: Colores diferenciados por prioridad y estado
- **Cálculos Automáticos**: Días restantes, contadores de KPIs
- **Navegación**: Click en dependencias y próximos pasos

## 🎨 Diseño

- **TailwindCSS**: Estilos modernos y consistentes
- **Gradientes**: Fondo con gradiente slate
- **Cards**: Sombras y efectos hover
- **Modales**: Backdrop oscuro con contenido centrado
- **Iconos**: Lucide React para iconografía consistente
- **Colores**: Sistema de colores por estado y prioridad

## 🔧 Tecnologías

- **React 18**: Framework principal
- **Vite**: Build tool y dev server
- **TailwindCSS**: Framework de CSS
- **Supabase**: Backend como servicio
- **Lucide React**: Iconos
- **PostCSS**: Procesamiento de CSS

## 📊 Estructura de Datos

### Clientes
- `id`: ID único (BIGSERIAL)
- `name`: Nombre del cliente
- `project`: Nombre del proyecto
- `status`: Estado del proyecto (on-track, at-risk, delayed)
- `health`: Salud del proyecto (0-100)
- `created_at`: Fecha de creación

### User Stories
- `id`: ID único (US-XXX)
- `client_id`: Referencia al cliente
- `title`: Título de la story
- `description`: Descripción completa
- `status`: Estado (pending, in-progress, completed, blocked)
- `priority`: Prioridad (low, medium, high, urgent)
- `estimated_hours`: Horas estimadas
- `start_date`: Fecha de inicio
- `end_date`: Fecha de fin
- `completed_date`: Fecha de completado
- `assignee`: Persona asignada
- `details`: Detalles adicionales
- `dependencies`: Array de IDs de stories dependientes
- `next_steps`: Array de IDs de próximos pasos
- `created_at`: Fecha de creación

## 🚀 Modo de Funcionamiento

La aplicación funciona en dos modos:

### Modo Supabase (Recomendado)
- Conecta a una base de datos real
- Los datos persisten entre sesiones
- Múltiples usuarios pueden usar la aplicación
- Funcionalidad completa

### Modo Local (Fallback)
- Si no hay configuración de Supabase, usa datos locales
- Los datos se mantienen solo durante la sesión
- Perfecto para desarrollo y demo

## 🎯 Próximos Pasos

1. **Configurar Supabase**: Sigue las instrucciones arriba
2. **Crear archivo .env**: Con tus credenciales
3. **Ejecutar**: `npm run dev`
4. **Usar**: La aplicación estará disponible en `http://localhost:5173`

¡La aplicación está lista para usar! 🚀