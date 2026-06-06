import '@fastify/jwt'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      userId: string
      tenantId: string
      role: 'OWNER' | 'ADMIN' | 'OPERATOR'
      pending2fa?: boolean
    }
    user: {
      userId: string
      tenantId: string
      role: 'OWNER' | 'ADMIN' | 'OPERATOR'
      pending2fa?: boolean
    }
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (req: import('fastify').FastifyRequest, reply: import('fastify').FastifyReply) => Promise<void>
  }
}
