import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { DashboardClient } from './client'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const apps = await prisma.app.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: { collections: true },
  })

  return <DashboardClient apps={apps} user={session.user} />
}