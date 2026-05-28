import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AppRuntime } from './runtime'
import { AppConfig } from '@/lib/config-schema'

export default async function AppPage({
  params,
}: {
  params: { appId: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const app = await prisma.app.findFirst({
    where: { id: params.appId, userId: session.user.id },
    include: { collections: true },
  })

  if (!app) notFound()

  return (
    <AppRuntime
      appId={app.id}
      config={app.config as AppConfig}
      collections={app.collections}
    />
  )
}