import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body?.token || !body?.password)
    return NextResponse.json({ error: 'Token and password required' }, { status: 400 })

  if (body.password.length < 8)
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })

  const resetToken = await (prisma as any).passwordResetToken.findUnique({
    where: { token: body.token },
  })

  if (!resetToken || resetToken.used || resetToken.expiresAt < new Date())
    return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 })

  const hashed = await bcrypt.hash(body.password, 10)

  await prisma.user.update({
    where: { email: resetToken.email },
    data: { password: hashed },
  })

  await (prisma as any).passwordResetToken.update({
    where: { token: body.token },
    data: { used: true },
  })

  return NextResponse.json({ success: true })
}