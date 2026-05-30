import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { prompt } = await req.json()
  if (!prompt?.trim()) return NextResponse.json({ error: 'Prompt required' }, { status: 400 })

  const systemPrompt = `You are an app config generator. Given a description, generate a valid JSON config.

Rules:
- Return ONLY valid JSON, no markdown, no explanation, no backticks
- Field types must be one of: text, email, number, boolean, date, select, textarea
- Select fields must include an "options" array
- Every field needs: name (camelCase), label, type, required (boolean)
- Collections need: name (lowercase, no spaces), label, fields array
- Config needs: name, description, collections array
- Generate 1-3 collections based on the description
- Generate 4-7 fields per collection`

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: `${systemPrompt}\n\nUser request: "${prompt}"\n\nRespond with only the JSON config:` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 2000,
        }
      })
    }
  )

  if (!response.ok) {
    const err = await response.json()
    console.error('Gemini error:', err)
    return NextResponse.json({ error: 'AI generation failed' }, { status: 500 })
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  try {
    const clean = text.replace(/```json|```/g, '').trim()
    const config = JSON.parse(clean)
    return NextResponse.json({ config })
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response', raw: text }, { status: 422 })
  }
}