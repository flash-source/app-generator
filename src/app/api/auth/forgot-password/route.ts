import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/mailer'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body?.email)
    return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { email: body.email } })

  if (!user || !user.password) {
    return NextResponse.json({ success: true })
  }

  await (prisma as any).passwordResetToken.updateMany({
    where: { email: body.email, used: false },
    data: { used: true },
  })

  const token = crypto.randomBytes(32).toString('hex')
  await (prisma as any).passwordResetToken.create({
    data: {
      token,
      email: body.email,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour
    },
  })

  await sendPasswordResetEmail(body.email, token)
  return NextResponse.json({ success: true })
}