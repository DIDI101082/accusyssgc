export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { DocumentList } from './document-list'

export default async function DocumentosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string; search?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Obtener perfil del usuario actual
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single()

  // Categorías para filtros
  const { data: categories } = await supabase
    .from('document_categories')
    .select('*')
    .order('sort_order')

  // Documentos con filtros
  let query = supabase
    .from('documents')
    .select(
      `
      *,
      category:document_categories(id, name, color, icon),
      creator:profiles!documents_created_by_fkey(full_name)
    `
    )
    .order('updated_at', { ascending: false })

  if (params.status) {
    query = query.eq('status', params.status)
  }
  if (params.category) {
    query = query.eq('category_id', params.category)
  }
  if (params.search) {
    query = query.or(
      `title.ilike.%${params.search}%,code.ilike.%${params.search}%,description.ilike.%${params.search}%`
    )
  }

  const { data: documents } = await query

  return (
    <DocumentList
      documents={documents ?? []}
      categories={categories ?? []}
      userRole={profile?.role ?? 'lector'}
      filters={params}
    />
  )
}
