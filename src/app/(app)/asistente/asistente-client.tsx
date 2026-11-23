'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, Send, FileText, Sparkles, Loader2, Copy, Check, X } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function AsistenteClient() {
  const [activeTab, setActiveTab] = useState<'chat' | 'generator'>('chat')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Asistente IA</h1>
        <p className="mt-1 text-sm text-gray-500">
          Consulta documentos del SGC o genera borradores con inteligencia artificial
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'chat'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Bot className="h-4 w-4" />
          Chatbot de Calidad
        </button>
        <button
          onClick={() => setActiveTab('generator')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'generator'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          Generar Borrador
        </button>
      </div>

      {activeTab === 'chat' ? <ChatPanel /> : <GeneratorPanel />}
    </div>
  )
}

function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const question = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: question }])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.answer }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${data.error}` }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error de conexion. Intenta de nuevo.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm flex flex-col" style={{ height: 'calc(100vh - 280px)' }}>
      {/* Header */}
      <div className="border-b border-gray-100 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-indigo-50 p-2">
            <Bot className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Chatbot de Calidad</h3>
            <p className="text-xs text-gray-500">Pregunta sobre procedimientos, politicas y documentos del SGC</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">Hola! Soy el asistente de calidad</p>
            <p className="text-sm text-gray-400 mt-1">Preguntame sobre cualquier documento del SGC</p>
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {[
                'Cual es el procedimiento de control de documentos?',
                'Que politicas de calidad tenemos vigentes?',
                'Como se gestiona una no conformidad?',
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => { setInput(q) }}
                  className="text-xs bg-gray-50 text-gray-600 px-3 py-1.5 rounded-full hover:bg-indigo-50 hover:text-indigo-600 transition-colors border border-gray-200"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-50 text-gray-800 border border-gray-100'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100">
              <Loader2 className="h-5 w-5 text-indigo-600 animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 px-6 py-4">
        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage() }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu pregunta sobre el SGC..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  )
}

function GeneratorPanel() {
  const [type, setType] = useState('procedimiento')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const generateDraft = async () => {
    if (!title.trim() || !description.trim() || loading) return

    setLoading(true)
    setDraft('')

    try {
      const res = await fetch('/api/generate-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, title: title.trim(), description: description.trim() }),
      })

      const data = await res.json()

      if (res.ok) {
        setDraft(data.draft)
      } else {
        setDraft(`Error: ${data.error}`)
      }
    } catch {
      setDraft('Error de conexion. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(draft)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-lg bg-purple-50 p-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Generar Borrador</h3>
            <p className="text-xs text-gray-500">Describe que documento necesitas</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de documento</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            >
              <option value="procedimiento">Procedimiento</option>
              <option value="politica">Politica</option>
              <option value="instructivo">Instructivo de Trabajo</option>
              <option value="manual">Manual</option>
              <option value="registro">Registro / Formulario</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titulo del documento</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Procedimiento de Control de Cambios"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion / Contexto</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Describe de que trata el documento, que procesos cubre, a que area aplica, etc."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
            />
          </div>

          <button
            onClick={generateDraft}
            disabled={loading || !title.trim() || !description.trim()}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generando borrador...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generar Borrador
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-50 p-2">
              <FileText className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Vista Previa</h3>
              <p className="text-xs text-gray-500">Borrador generado por IA</p>
            </div>
          </div>
          {draft && (
            <div className="flex gap-2">
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 bg-gray-50 px-2 py-1 rounded"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
              <button
                onClick={() => setDraft('')}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 bg-gray-50 px-2 py-1 rounded"
              >
                <X className="h-3 w-3" />
                Limpiar
              </button>
            </div>
          )}
        </div>

        <div className="rounded-lg bg-gray-50 border border-gray-100 p-4 overflow-y-auto" style={{ height: 'calc(100vh - 400px)' }}>
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="h-8 w-8 text-purple-600 animate-spin mb-3" />
              <p className="text-sm text-gray-500">Generando borrador con IA...</p>
              <p className="text-xs text-gray-400 mt-1">Esto puede tomar unos segundos</p>
            </div>
          ) : draft ? (
            <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans">{draft}</pre>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <FileText className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">Sin borrador aun</p>
              <p className="text-sm text-gray-400 mt-1">Completa el formulario y genera un borrador</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
