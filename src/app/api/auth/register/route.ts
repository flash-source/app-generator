import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body?.email || !body?.password)
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 })

  const existing = await prisma.user.findUnique({ where: { email: body.email } })
  if (existing)
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 })

  const hashed = await bcrypt.hash(body.password, 10)
  const user = await prisma.user.create({
    data: { email: body.email, name: body.name ?? null, password: hashed },
  })

  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 })
}