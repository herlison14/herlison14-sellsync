import type { FastifyInstance } from 'fastify'
import { prisma } from '@sellsync/database'
import { z } from 'zod'

const tokenSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(['ios', 'android', 'web']).default('android'),
})

export async function notificationsRoutes(app: FastifyInstance) {
  // Register / update push token for the authenticated user
  app.post('/push-token', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { userId, tenantId } = (req as any).user
    const { token, platform } = tokenSchema.parse(req.body)

    await prisma.$executeRaw`
      INSERT INTO "push_tokens" ("id", "tenantId", "userId", "token", "platform", "createdAt", "updatedAt")
      VALUES (gen_random_uuid()::text, ${tenantId}, ${userId}, ${token}, ${platform}, now(), now())
      ON CONFLICT ("tenantId", "token") DO UPDATE SET "updatedAt" = now(), "platform" = ${platform}
    `

    return reply.status(204).send()
  })

  // Unregister push token (logout)
  app.delete('/push-token', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { tenantId } = (req as any).user
    const { token } = z.object({ token: z.string() }).parse(req.body)

    await prisma.$executeRaw`
      DELETE FROM "push_tokens" WHERE "tenantId" = ${tenantId} AND "token" = ${token}
    `

    return reply.status(204).send()
  })
}
