import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AppConfig, validateRecord } from '@/lib/config-schema'
import { runWorkflows } from '@/lib/workflow-engine'

async function getAppAndCollection(
  appId: string,
  collectionName: string,
  userId: string
) {
  const app = await prisma.app.findFirst({
    where: { id: appId, userId },
    include: { collections: true },
  })
  if (!app) return { error: 'App not found', status: 404 }

  const config = app.config as AppConfig
  const collectionConfig = config.collections.find(
    (c) => c.name.toLowerCase() === collectionName.toLowerCase()
  )
  if (!collectionConfig) return { error: 'Collection not found', status: 404 }

  const collection = app.collections.find(
    (c) => c.name.toLowerCase() === collectionName.toLowerCase()
  )
  if (!collection) return { error: 'Collection not found', status: 404 }

  return { app, config, collectionConfig, collection }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string; collection: string }> }
) {
  const { appId, collection } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const result = await getAppAndCollection(appId, collection, session.user.id)
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '20')

  const [records, total] = await Promise.all([
    prisma.record.findMany({
      where: { collectionId: result.collection.id },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.record.count({ where: { collectionId: result.collection.id } }),
  ])

  return NextResponse.json({ records, total, page, limit })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string; collection: string }> }
) {
  const { appId, collection } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const result = await getAppAndCollection(appId, collection, session.user.id)
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const { valid, errors } = validateRecord(body, result.collectionConfig)
  if (!valid) return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 422 })

  const { data: processedData, notifications } = runWorkflows(
    body,
    result.collectionConfig,
    'on_create'
  )

  const record = await prisma.record.create({
    data: { collectionId: result.collection.id, data: processedData as any },
  })

  return NextResponse.json({ ...record, notifications }, { status: 201 })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string; collection: string }> }
) {
  const { appId, collection } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const result = await getAppAndCollection(appId, collection, session.user.id)
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Record ID required' }, { status: 400 })

  await prisma.record.deleteMany({
    where: { id, collectionId: result.collection.id },
  })
  return NextResponse.json({ success: true })
}