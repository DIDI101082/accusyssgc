'use client'

import { createClient } from '@/lib/supabase/client'
import { Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  async function handleLogin() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        scopes: 'email profile',
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-50">
      <div className="w-full max-w-sm space-y-8 rounded-2xl bg-white p-8 shadow-lg border border-gray-100">
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-200">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Accusys <span className="text-indigo-600">Quality</span>
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Sistema de Gestión Documental
            </p>
          </div>
        </div>

        <Button
          onClick={handleLogin}
          className="w-full"
          size="lg"
        >
          <svg className="h-5 w-5" viewBox="0 0 21 21" fill="none">
            <rect x="1" y="1" width="9" height="9" fill="#F25022" />
            <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
            <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
            <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
          </svg>
          Iniciar sesión con Microsoft
        </Button>

        <p className="text-center text-xs text-gray-400">
          Acceso exclusivo con cuenta corporativa Accusys
        </p>
      </div>
    </div>
  )
}
