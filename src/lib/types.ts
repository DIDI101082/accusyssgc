export type DocumentStatus = 'borrador' | 'en_revision' | 'aprobado' | 'obsoleto'
export type ApprovalAction = 'enviar_revision' | 'aprobar' | 'rechazar' | 'obsoleto'
export type UserRole = 'admin' | 'gestor' | 'editor' | 'lector'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  area: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface DocumentCategory {
  id: string
  name: string
  description: string | null
  icon: string
  color: string
  sort_order: number
  created_at: string
}

export interface Document {
  id: string
  code: string
  title: string
  description: string | null
  category_id: string
  version: number
  version_label: string
  status: DocumentStatus
  file_path: string | null
  file_name: string | null
  file_size: number | null
  file_type: string | null
  created_by: string
  updated_by: string | null
  reviewed_by: string | null
  approved_by: string | null
  reviewed_at: string | null
  approved_at: string | null
  effective_date: string | null
  expiry_date: string | null
  tags: string[]
  area: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // Relaciones
  category?: DocumentCategory
  creator?: Profile
  reviewer?: Profile
  approver?: Profile
}

export interface DocumentVersion {
  id: string
  document_id: string
  version: number
  version_label: string
  file_path: string | null
  file_name: string | null
  file_size: number | null
  file_type: string | null
  change_summary: string | null
  created_by: string
  created_at: string
  creator?: Profile
}

export interface ApprovalHistory {
  id: string
  document_id: string
  action: ApprovalAction
  from_status: DocumentStatus
  to_status: DocumentStatus
  performed_by: string
  comments: string | null
  created_at: string
  performer?: Profile
}

export interface DocumentAccessLog {
  id: string
  document_id: string
  user_id: string
  action: string
  created_at: string
}

// Stats para dashboard
export interface DashboardStats {
  total_documents: number
  by_status: Record<DocumentStatus, number>
  by_category: { name: string; count: number; color: string }[]
  pending_approval: number
  recent_documents: Document[]
  expiring_soon: Document[]
}

// Status config para UI
export const STATUS_CONFIG: Record<DocumentStatus, { label: string; color: string; bgColor: string }> = {
  borrador: { label: 'Borrador', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  en_revision: { label: 'En Revisión', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  aprobado: { label: 'Aprobado', color: 'text-green-600', bgColor: 'bg-green-100' },
  obsoleto: { label: 'Obsoleto', color: 'text-red-600', bgColor: 'bg-red-100' },
}
