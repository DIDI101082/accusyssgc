import { createClient } from '@/lib/supabase/server'
import { CategoriesManager } from './categories-manager'

export default async function CategoriasPage() {
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from('document_categories')
    .select('*')
    .order('sort_order')

  // Contar documentos por categoría
  const { data: documents } = await supabase
    .from('documents')
    .select('category_id')

  const countByCategory: Record<string, number> = {}
  documents?.forEach((d) => {
    countByCategory[d.category_id] = (countByCategory[d.category_id] || 0) + 1
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single()

  return (
    <CategoriesManager
      categories={categories ?? []}
      documentCounts={countByCategory}
      userRole={profile?.role ?? 'lector'}
    />
  )
}
