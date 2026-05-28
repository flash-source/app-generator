import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseConfig } from '@/lib/config-schema'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apps = await prisma.app.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(apps)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const { config, errors } = parseConfig(body.config)
  if (!config) return NextResponse.json({ error: 'Invalid config', details: errors }, { status: 422 })

  const app = await prisma.app.create({
    data: {
      name: config.name,
      description: config.description ?? null,
      config: config as any,
      userId: session.user.id,
      collections: {
        create: config.collections.map((c) => ({ name: c.name })),
      },
    },
    include: { collections: true },
  })

  return NextResponse.json(app, { status: 201 })
}