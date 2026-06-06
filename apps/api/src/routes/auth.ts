import type { FastifyInstance } from 'fastify'
import { prisma } from '@sellsync/database'
import { z } from 'zod'
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(scrypt)

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const hash = (await scryptAsync(password, salt, 64)) as Buffer
  return `${hash.toString('hex')}:${salt}`
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [hashHex, salt] = stored.split(':')
  if (!hashHex || !salt) return false
  const hash = (await scryptAsync(password, salt, 64)) as Buffer
  const storedHash = Buffer.from(hashHex, 'hex')
  if (hash.length !== storedHash.length) return false
  return timingSafeEqual(hash, storedHash)
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
  app.post('/register', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (req, reply) => {
    const body = registerSchema.parse(req.body)

    const slug = body.tenantName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 50)

    const existingUser = await prisma.user.findUnique({ where: { email: body.email } })
    if (existingUser) return reply.code(409).send({ message: 'E-mail já cadastrado' })

    const passwordHash = await hashPassword(body.password)

    const tenant = await prisma.tenant.create({
      data: {
        name: body.tenantName,
        slug,
        users: {
          create: {
            email: body.email,
            name: body.name,
            role: 'OWNER',
            passwordHash,
          },
        },
      },
      include: { users: true },
    })

    const user = tenant.users[0]
    const token = app.jwt.sign({ userId: user.id, tenantId: tenant.id, role: user.role }, { expiresIn: '7d' })

    return reply.code(201).send({ token, user: { id: user.id, name: user.name, email: user.email }, tenant: { id: tenant.id, slug: tenant.slug } })
  })

  app.post('/login', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (req, reply) => {
    const body = loginSchema.parse(req.body)

    const user = await prisma.user.findUnique({ where: { email: body.email }, include: { tenant: true } })
    // Same message for not-found and wrong-password — prevents email enumeration
    if (!user || !user.passwordHash) return reply.code(401).send({ message: 'Credenciais inválidas' })

    const valid = await verifyPassword(body.password, user.passwordHash)
    if (!valid) return reply.code(401).send({ message: 'Credenciais inválidas' })

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

  // Logout — frontend deletes the token; no server-side blacklist yet.
  // Future: store token JTI in Redis with TTL = remaining expiry.
  app.post('/logout', async (req, reply) => {
    await req.jwtVerify()
    return reply.code(204).send()
  })

  app.post('/complete-onboarding', async (req, reply) => {
    await req.jwtVerify()
    const { tenantId } = req.user as { tenantId: string }
    await prisma.tenant.update({ where: { id: tenantId }, data: { onboardingCompletedAt: new Date() } })
    return reply.code(204).send()
  })
}
