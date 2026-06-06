import type { FastifyInstance } from 'fastify'
import { getNotifications, markRead, markAllRead, getUnreadCount } from '../services/notifications.inapp.service'

export async function inAppNotificationsRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] }

  app.get('/', auth, async (req) => {
    const { unreadOnly, page, limit } = req.query as Record<string, string>
    return getNotifications(req.user.tenantId, {
      unreadOnly: unreadOnly === 'true',
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 30,
    })
  })

  app.get('/unread-count', auth, async (req) => getUnreadCount(req.user.tenantId))

  app.patch('/read', auth, async (req) => {
    const { ids } = req.body as { ids?: string[] }
    if (ids?.length) return markRead(req.user.tenantId, ids)
    return markAllRead(req.user.tenantId)
  })
}
