import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AppConfig, validateRecord } from '@/lib/config-schema'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string; collection: string }> }
) {
  const { appId, collection: collectionName } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const app = await prisma.app.findFirst({
    where: { id: appId, userId: session.user.id },
    include: { collections: true },
  })
  if (!app) return NextResponse.json({ error: 'App not found' }, { status: 404 })

  const config = app.config as AppConfig
  const collectionConfig = config.collections.find(
    c => c.name.toLowerCase() === collectionName.toLowerCase()
  )
  const collection = app.collections.find(
    c => c.name.toLowerCase() === collectionName.toLowerCase()
  )
  if (!collectionConfig || !collection)
    return NextResponse.json({ error: 'Collection not found' }, { status: 404 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

  const text = await file.text()
  const lines = text.trim().split('\n').filter(Boolean)
  if (lines.length < 2) return NextResponse.json({ error: 'CSV must have a header and at least one row' }, { status: 400 })

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))

  const results = { imported: 0, skipped: 0, errors: [] as string[] }

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''))
    const row: Record<string, unknown> = {}

    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? ''
    })

    for (const field of collectionConfig.fields) {
      if (field.type === 'number' && row[field.name] !== undefined) {
        const n = Number(row[field.name])
        row[field.name] = isNaN(n) ? row[field.name] : n
      }
      if (field.type === 'boolean' && row[field.name] !== undefined) {
        row[field.name] = row[field.name] === 'true' || row[field.name] === '1'
      }
    }

    const { valid, errors } = validateRecord(row, collectionConfig)
    if (!valid) {
      results.skipped++
      results.errors.push(`Row ${i}: ${errors.join(', ')}`)
      continue
    }

    await prisma.record.create({
      data: { collectionId: collection.id, data: row as any },
    })
    results.imported++
  }

  return NextResponse.json(results)
}