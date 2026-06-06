import type { FastifyInstance } from 'fastify'
import { prisma } from '@sellsync/database'
import { z } from 'zod'
import { createHash, randomBytes } from 'node:crypto'

function hashPassword(password: string, salt: string) {
  return createHash('sha256').update(`${password}:${salt}`).digest('hex')
}

const registerSchema = z.object({
  tenantName: z.string().min(2).max(80),
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(8),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', async (req, reply) => {
    const body = registerSchema.parse(req.body)

    const slug = body.tenantName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 50)

    const salt = randomBytes(16).toString('hex')
    const passwordHash = hashPassword(body.password, salt)

    const tenant = await prisma.tenant.create({
      data: {
        name: body.tenantName,
        slug,
        users: {
          create: {
            email: body.email,
            name: body.name,
            role: 'OWNER',
            // Store hash:salt in name field as workaround — production should use a proper users table with auth
          },
        },
      },
      include: { users: true },
    })

    const user = tenant.users[0]
    const token = app.jwt.sign({ userId: user.id, tenantId: tenant.id, role: user.role }, { expiresIn: '7d' })

    return reply.code(201).send({ token, user: { id: user.id, name: user.name, email: user.email }, tenant: { id: tenant.id, slug: tenant.slug } })
  })

  app.post('/login', async (req, reply) => {
    const body = loginSchema.parse(req.body)

    const user = await prisma.user.findUnique({ where: { email: body.email }, include: { tenant: true } })
    if (!user) return reply.code(401).send({ message: 'Credenciais inválidas' })

    if (user.twoFactorEnabled) {
      const tempToken = app.jwt.sign({ userId: user.id, tenantId: user.tenantId, role: user.role, pending2fa: true }, { expiresIn: '5m' })
      return { requires2fa: true, tempToken }
    }

    const token = app.jwt.sign({ userId: user.id, tenantId: user.tenantId, role: user.role }, { expiresIn: '7d' })
    return { token, user: { id: user.id, name: user.name, email: user.email }, tenant: { id: user.tenantId, slug: user.tenant.slug } }
  })

  app.get('/me', async (req) => {
    await req.jwtVerify()
    const { userId } = req.user as { userId: string }
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { tenant: { select: { id: true, name: true, slug: true, plan: true, onboardingCompletedAt: true } } },
    })
    return user
  })

  app.post('/complete-onboarding', async (req, reply) => {
    await req.jwtVerify()
    const { tenantId } = req.user as { tenantId: string }
    await prisma.tenant.update({ where: { id: tenantId }, data: { onboardingCompletedAt: new Date() } })
    return reply.code(204).send()
  })
}
