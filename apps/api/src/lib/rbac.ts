import type { FastifyReply, FastifyRequest } from 'fastify'

type Role = 'OWNER' | 'ADMIN' | 'OPERATOR'

export function requireRole(...roles: Role[]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const user = req.user as { role: Role } | undefined
    if (!user || !roles.includes(user.role)) {
      return reply.code(403).send({ message: 'Permissão insuficiente' })
    }
  }
}
