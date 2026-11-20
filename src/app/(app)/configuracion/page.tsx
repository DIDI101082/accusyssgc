export const dynamic = 'force-dynamic'

import { Shield, Database, Bell, Palette } from 'lucide-react'

export default function ConfiguracionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="mt-1 text-sm text-gray-500">
          Ajustes generales de Accusys Quality
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-lg bg-indigo-50 p-2.5">
              <Shield className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Autenticación</h3>
              <p className="text-sm text-gray-500">SSO con Microsoft Entra ID</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            La autenticación se configura desde el panel de Supabase en{' '}
            <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
              Auth → Providers → Azure
            </span>
          </p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-lg bg-emerald-50 p-2.5">
              <Database className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Base de Datos</h3>
              <p className="text-sm text-gray-500">Supabase PostgreSQL</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Las tablas, políticas RLS y storage se gestionan desde el panel de Supabase.
          </p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-lg bg-amber-50 p-2.5">
              <Bell className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Notificaciones</h3>
              <p className="text-sm text-gray-500">Alertas de documentos</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Las notificaciones por email se pueden configurar usando Supabase Edge Functions
            o integrando con un servicio como Resend.
          </p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-lg bg-purple-50 p-2.5">
              <Palette className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Personalización</h3>
              <p className="text-sm text-gray-500">Branding y apariencia</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Los colores y estilos se pueden personalizar desde el archivo{' '}
            <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
              tailwind.config.ts
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
