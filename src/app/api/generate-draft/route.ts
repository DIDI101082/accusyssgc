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

    const { type, title, description } = await request.json()

    if (!type || !title || !description) {
      return NextResponse.json({ error: 'Tipo, título y descripción son requeridos' }, { status: 400 })
    }

    const typeLabels: Record<string, string> = {
      procedimiento: 'Procedimiento',
      politica: 'Política',
      instructivo: 'Instrucción de Trabajo',
      manual: 'Manual',
      registro: 'Registro/Formulario',
      formato: 'Formato',
    }

    const typeLabel = typeLabels[type] || type

    const systemPrompt = `Eres un experto en Sistemas de Gestión de Calidad (SGC) bajo la norma ISO 9001:2015.
Tu tarea es generar un borrador completo de un documento de tipo "${typeLabel}" para Accusys Technology.

REGLAS:
- Genera el documento en español.
- Usa formato profesional con secciones numeradas.
- Incluye las secciones estándar según el tipo de documento.
- Sé específico y detallado, no genérico.
- Adapta el contenido a la descripción proporcionada.

ESTRUCTURA REQUERIDA SEGÚN TIPO:

${type === 'procedimiento' ? `
Para un Procedimiento incluye:
1. OBJETIVO
2. ALCANCE
3. DEFINICIONES Y ABREVIATURAS
4. RESPONSABILIDADES
5. DESARROLLO (pasos detallados del procedimiento)
6. REGISTROS ASOCIADOS
7. DOCUMENTOS DE REFERENCIA
8. CONTROL DE CAMBIOS
` : ''}

${type === 'politica' ? `
Para una Política incluye:
1. PROPÓSITO
2. ALCANCE
3. DECLARACIÓN DE LA POLÍTICA
4. PRINCIPIOS
5. RESPONSABILIDADES
6. CUMPLIMIENTO
7. DOCUMENTOS RELACIONADOS
8. CONTROL DE CAMBIOS
` : ''}

${type === 'instructivo' ? `
Para una Instrucción de Trabajo incluye:
1. OBJETIVO
2. ALCANCE
3. HERRAMIENTAS Y MATERIALES
4. PRECAUCIONES DE SEGURIDAD (si aplica)
5. INSTRUCCIONES PASO A PASO (detalladas y secuenciales)
6. PUNTOS DE CONTROL / VERIFICACIÓN
7. REGISTROS
8. CONTROL DE CAMBIOS
` : ''}

${type === 'manual' ? `
Para un Manual incluye:
1. INTRODUCCIÓN
2. OBJETIVO Y ALCANCE
3. REFERENCIAS NORMATIVAS
4. CONTEXTO DE LA ORGANIZACIÓN
5. CONTENIDO PRINCIPAL (desarrollado según la descripción)
6. RESPONSABILIDADES
7. DOCUMENTOS ASOCIADOS
8. CONTROL DE CAMBIOS
` : ''}

${type === 'registro' || type === 'formato' ? `
Para un Registro/Formato incluye:
- Encabezado con campos: Código, Versión, Fecha, Responsable
- Campos del formulario organizados lógicamente
- Sección de firmas/aprobaciones
- Instrucciones de llenado
` : ''}

TÍTULO DEL DOCUMENTO: ${title}
DESCRIPCIÓN / CONTEXTO: ${description}

Genera el borrador completo ahora:`

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
              parts: [{ text: systemPrompt }]
            }
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 4096,
          }
        })
      }
    )

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Gemini API error:', errorData)
      return NextResponse.json({ error: 'Error al generar el borrador' }, { status: 500 })
    }

    const data = await response.json()
    const draft = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No se pudo generar el borrador.'

    return NextResponse.json({ draft })
  } catch (error) {
    console.error('Generate draft API error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
