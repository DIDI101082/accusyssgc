import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { question } = await request.json()

    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'Pregunta requerida' }, { status: 400 })
    }

    // Fetch approved documents for context
    const { data: documents } = await supabase
      .from('documents')
      .select('title, code, content, category:categories(name)')
      .eq('status', 'aprobado')
      .limit(50)

    const docsContext = (documents || []).map((doc: Record<string, unknown>) => {
      const cat = doc.category as Record<string, string> | null
      return `--- Documento: ${doc.title} (${doc.code}) | Categoría: ${cat?.name || 'Sin categoría'} ---\n${(doc.content as string || '').substring(0, 2000)}`
    }).join('\n\n')

    const systemPrompt = `Eres el Asistente de Calidad de Accusys Technology. Tu rol es ayudar a los empleados respondiendo preguntas sobre el Sistema de Gestión de Calidad (SGC).

REGLAS:
- Responde SOLO basándote en los documentos del SGC que se te proporcionan como contexto.
- Si la información no está en los documentos, di claramente que no encontraste esa información en los documentos vigentes.
- Siempre menciona el código y nombre del documento de donde sacas la información.
- Responde en español, de forma clara y concisa.
- Si te preguntan sobre un procedimiento, lista los pasos relevantes.
- No inventes información que no esté en los documentos.

DOCUMENTOS VIGENTES DEL SGC:
${docsContext || 'No hay documentos aprobados en el sistema aún.'}
`

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API key de Gemini no configurada' }, { status: 500 })
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\nPREGUNTA DEL EMPLEADO: ${question}` }]
            }
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048,
          }
        })
      }
    )

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Gemini API error:', errorData)
      return NextResponse.json({ error: 'Error al consultar la IA' }, { status: 500 })
    }

    const data = await response.json()
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No pude generar una respuesta.'

    return NextResponse.json({ answer })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
