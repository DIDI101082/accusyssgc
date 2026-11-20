export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UsersManager } from './users-manager'

export default async function UsuariosPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single()

  // Solo admin y gestor pueden ver esta página
  if (!profile || !['admin', 'gestor'].includes(profile.role)) {
    redirect('/dashboard')
  }

  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name')

  return <UsersManager users={users ?? []} currentUserRole={profile.role} />
}
