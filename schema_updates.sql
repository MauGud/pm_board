-- =====================================================
-- SCHEMA UPDATES FOR SUB-TASKS AND IMAGE ATTACHMENTS
-- =====================================================
-- Execute this SQL in Supabase SQL Editor to add support for:
-- 1. Sub-tasks (single level, no dates, reorderable)
-- 2. Image attachments (base64, max 5MB, max 10 per story)

-- Add sub_tasks column to user_stories table
ALTER TABLE user_stories ADD COLUMN IF NOT EXISTS sub_tasks JSONB DEFAULT '[]';

-- Add images column to user_stories table  
ALTER TABLE user_stories ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_stories_sub_tasks ON user_stories USING GIN (sub_tasks);
CREATE INDEX IF NOT EXISTS idx_user_stories_images ON user_stories USING GIN (images);

-- =====================================================
-- EXAMPLE DATA STRUCTURES
-- =====================================================

-- Example sub_tasks structure:
-- [
--   {
--     "id": "subtask_1",
--     "title": "Create database schema",
--     "completed": false,
--     "order": 0
--   },
--   {
--     "id": "subtask_2", 
--     "title": "Implement API endpoints",
--     "completed": true,
--     "order": 1
--   }
-- ]

-- Example images structure:
-- [
--   {
--     "id": "img_1",
--     "filename": "wireframe.png",
--     "data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
--     "size": 245760,
--     "type": "image/png",
--     "uploaded_at": "2025-01-15T10:30:00Z"
--   }
-- ]

-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================

-- Update existing user stories with sample sub-tasks and images
UPDATE user_stories 
SET sub_tasks = '[
  {
    "id": "subtask_001_1",
    "title": "Configurar Google Authenticator SDK",
    "completed": true,
    "order": 0
  },
  {
    "id": "subtask_001_2", 
    "title": "Crear interfaz de configuración 2FA",
    "completed": true,
    "order": 1
  },
  {
    "id": "subtask_001_3",
    "title": "Implementar validación de códigos",
    "completed": true,
    "order": 2
  },
  {
    "id": "subtask_001_4",
    "title": "Agregar opción de backup codes",
    "completed": false,
    "order": 3
  }
]'::jsonb,
images = '[]'::jsonb
WHERE id = 'US-001';

UPDATE user_stories 
SET sub_tasks = '[
  {
    "id": "subtask_002_1",
    "title": "Crear endpoint de recuperación",
    "completed": true,
    "order": 0
  },
  {
    "id": "subtask_002_2",
    "title": "Diseñar email template", 
    "completed": false,
    "order": 1
  },
  {
    "id": "subtask_002_3",
    "title": "Implementar validación de token",
    "completed": false,
    "order": 2
  }
]'::jsonb,
images = '[]'::jsonb
WHERE id = 'US-002';

UPDATE user_stories 
SET sub_tasks = '[
  {
    "id": "subtask_005_1",
    "title": "Crear índice de búsqueda",
    "completed": true,
    "order": 0
  },
  {
    "id": "subtask_005_2",
    "title": "Implementar autocompletado",
    "completed": false,
    "order": 1
  },
  {
    "id": "subtask_005_3", 
    "title": "Agregar filtros avanzados",
    "completed": false,
    "order": 2
  }
]'::jsonb,
images = '[]'::jsonb
WHERE id = 'US-005';

-- Set default empty arrays for stories without sub-tasks or images
UPDATE user_stories 
SET sub_tasks = '[]'::jsonb, images = '[]'::jsonb
WHERE sub_tasks IS NULL OR images IS NULL;

-- =====================================================
-- VALIDATION CONSTRAINTS
-- =====================================================

-- Add check constraints to ensure data integrity
ALTER TABLE user_stories 
ADD CONSTRAINT check_sub_tasks_array 
CHECK (jsonb_typeof(sub_tasks) = 'array');

ALTER TABLE user_stories 
ADD CONSTRAINT check_images_array 
CHECK (jsonb_typeof(images) = 'array');

-- =====================================================
-- HELPFUL QUERIES FOR TESTING
-- =====================================================

-- Query to get all stories with their sub-task counts:
-- SELECT id, title, 
--        jsonb_array_length(sub_tasks) as total_subtasks,
--        (SELECT count(*) FROM jsonb_array_elements(sub_tasks) WHERE value->>'completed' = 'true') as completed_subtasks,
--        jsonb_array_length(images) as total_images
-- FROM user_stories;

-- Query to get stories with incomplete sub-tasks:
-- SELECT id, title, sub_tasks
-- FROM user_stories 
-- WHERE EXISTS (
--   SELECT 1 FROM jsonb_array_elements(sub_tasks) 
--   WHERE value->>'completed' = 'false'
-- );

-- Query to get stories with images:
-- SELECT id, title, images
-- FROM user_stories 
-- WHERE jsonb_array_length(images) > 0;

-- =====================================================
-- NOTES
-- =====================================================
-- 1. Sub-tasks are stored as JSONB arrays for flexibility
-- 2. Each sub-task has: id, title, completed (boolean), order (number)
-- 3. Images are stored as base64 data URLs (max 5MB per image)
-- 4. Each image has: id, filename, data, size, type, uploaded_at
-- 5. Maximum 10 images per user story (enforced in frontend)
-- 6. Drag-and-drop reordering updates the 'order' field
-- 7. All operations work with both Supabase and local fallback
