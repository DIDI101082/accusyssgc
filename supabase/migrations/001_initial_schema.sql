-- ============================================
-- Accusys Quality - Schema de Base de Datos
-- Sistema de Gestión Documental para SGC
-- ============================================

-- Tipos enumerados
CREATE TYPE document_status AS ENUM ('borrador', 'en_revision', 'aprobado', 'obsoleto');
CREATE TYPE document_category AS ENUM ('procedimiento', 'politica', 'instructivo', 'registro', 'formulario', 'manual', 'plan', 'otro');
CREATE TYPE approval_action AS ENUM ('enviar_revision', 'aprobar', 'rechazar', 'obsoleto');
CREATE TYPE user_role AS ENUM ('admin', 'gestor', 'editor', 'lector');

-- ============================================
-- Tabla: profiles (usuarios)
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'lector',
  area TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Tabla: document_categories (categorías personalizables)
-- ============================================
CREATE TABLE document_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT DEFAULT 'file-text',
  color TEXT DEFAULT '#6366f1',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Categorías iniciales del SGC
INSERT INTO document_categories (name, description, icon, color, sort_order) VALUES
  ('Procedimientos', 'Procedimientos operativos y de gestión', 'clipboard-list', '#6366f1', 1),
  ('Políticas', 'Políticas organizacionales y de calidad', 'shield', '#0ea5e9', 2),
  ('Instructivos', 'Instrucciones de trabajo paso a paso', 'list-ordered', '#10b981', 3),
  ('Registros', 'Registros y evidencias del SGC', 'database', '#f59e0b', 4),
  ('Formularios', 'Formularios y plantillas completables', 'file-input', '#ec4899', 5),
  ('Manuales', 'Manuales de calidad y operación', 'book-open', '#8b5cf6', 6),
  ('Planes', 'Planes de auditoría, mejora continua, etc.', 'target', '#14b8a6', 7),
  ('Otros', 'Documentos que no encajan en otra categoría', 'file', '#64748b', 8);

-- ============================================
-- Tabla: documents (documentos del SGC)
-- ============================================
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Identificación
  code TEXT NOT NULL UNIQUE,           -- Ej: PRO-CAL-001
  title TEXT NOT NULL,
  description TEXT,
  category_id UUID NOT NULL REFERENCES document_categories(id),
  -- Versionado
  version INT NOT NULL DEFAULT 1,
  version_label TEXT DEFAULT '1.0',    -- Ej: "1.0", "2.1"
  -- Estado y workflow
  status document_status NOT NULL DEFAULT 'borrador',
  -- Archivo
  file_path TEXT,                       -- Path en Supabase Storage
  file_name TEXT,
  file_size BIGINT,
  file_type TEXT,                       -- MIME type
  -- Responsables
  created_by UUID NOT NULL REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  reviewed_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  -- Fechas
  reviewed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  effective_date DATE,                  -- Fecha de vigencia
  expiry_date DATE,                     -- Fecha de vencimiento (opcional)
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  area TEXT,                            -- Área responsable
  notes TEXT,                           -- Notas internas
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Tabla: document_versions (historial de versiones)
-- ============================================
CREATE TABLE document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version INT NOT NULL,
  version_label TEXT NOT NULL,
  file_path TEXT,
  file_name TEXT,
  file_size BIGINT,
  file_type TEXT,
  change_summary TEXT,                  -- Qué cambió en esta versión
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Tabla: approval_history (historial de aprobaciones)
-- ============================================
CREATE TABLE approval_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  action approval_action NOT NULL,
  from_status document_status NOT NULL,
  to_status document_status NOT NULL,
  performed_by UUID NOT NULL REFERENCES profiles(id),
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Tabla: document_access_log (registro de accesos/descargas)
-- ============================================
CREATE TABLE document_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  action TEXT NOT NULL DEFAULT 'view',  -- 'view', 'download'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Índices
-- ============================================
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_category ON documents(category_id);
CREATE INDEX idx_documents_created_by ON documents(created_by);
CREATE INDEX idx_documents_code ON documents(code);
CREATE INDEX idx_documents_tags ON documents USING gin(tags);
CREATE INDEX idx_document_versions_doc ON document_versions(document_id);
CREATE INDEX idx_approval_history_doc ON approval_history(document_id);
CREATE INDEX idx_access_log_doc ON document_access_log(document_id);

-- ============================================
-- Funciones auxiliares
-- ============================================

-- Auto-update de updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_documents
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-crear perfil al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Generar código de documento automático
CREATE OR REPLACE FUNCTION generate_document_code(cat_name TEXT)
RETURNS TEXT AS $$
DECLARE
  prefix TEXT;
  next_num INT;
BEGIN
  prefix := CASE cat_name
    WHEN 'Procedimientos' THEN 'PRO'
    WHEN 'Políticas' THEN 'POL'
    WHEN 'Instructivos' THEN 'INS'
    WHEN 'Registros' THEN 'REG'
    WHEN 'Formularios' THEN 'FOR'
    WHEN 'Manuales' THEN 'MAN'
    WHEN 'Planes' THEN 'PLA'
    ELSE 'DOC'
  END;

  SELECT COALESCE(MAX(
    CAST(SUBSTRING(d.code FROM length(prefix) + 2) AS INT)
  ), 0) + 1
  INTO next_num
  FROM documents d
  JOIN document_categories dc ON d.category_id = dc.id
  WHERE dc.name = cat_name
    AND d.code LIKE prefix || '-%';

  RETURN prefix || '-' || LPAD(next_num::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RLS (Row Level Security)
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_access_log ENABLE ROW LEVEL SECURITY;

-- Profiles: todos ven perfiles, solo admin modifica roles
CREATE POLICY "Profiles visibles para autenticados"
  ON profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios editan su propio perfil"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Document categories: todos ven, solo admin/gestor modifica
CREATE POLICY "Categorías visibles para autenticados"
  ON document_categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin y gestor gestionan categorías"
  ON document_categories FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'gestor')
    )
  );

-- Documents: todos ven aprobados, creador/gestor/admin ven todo
CREATE POLICY "Documentos aprobados visibles para todos"
  ON documents FOR SELECT TO authenticated
  USING (
    status = 'aprobado'
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'gestor')
    )
  );

CREATE POLICY "Editor+ crea documentos"
  ON documents FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'gestor', 'editor')
    )
  );

CREATE POLICY "Autor, gestor y admin editan documentos"
  ON documents FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'gestor')
    )
  );

CREATE POLICY "Solo admin elimina documentos"
  ON documents FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Document versions: misma lógica que documents
CREATE POLICY "Versiones visibles según documento"
  ON document_versions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Editor+ crea versiones"
  ON document_versions FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'gestor', 'editor')
    )
  );

-- Approval history: visible para todos
CREATE POLICY "Historial de aprobación visible"
  ON approval_history FOR SELECT TO authenticated USING (true);

CREATE POLICY "Gestor+ registra acciones de aprobación"
  ON approval_history FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'gestor')
    )
  );

-- Access log
CREATE POLICY "Log de acceso - insertar"
  ON document_access_log FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin ve log de acceso"
  ON document_access_log FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'gestor')
    )
  );

-- ============================================
-- Storage bucket para documentos
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false);

CREATE POLICY "Autenticados suben documentos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Autenticados ven documentos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documents');

CREATE POLICY "Admin elimina archivos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'documents'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'gestor')
    )
  );
