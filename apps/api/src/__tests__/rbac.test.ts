import { describe, it, expect, vi } from 'vitest'
import { requireRole } from '../lib/rbac'
import type { FastifyRequest, FastifyReply } from 'fastify'

function makeReq(role: string) {
  return { user: { userId: 'u1', tenantId: 't1', role } } as unknown as FastifyRequest
}

function makeReply() {
  const reply = {
    code: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  }
  return reply as unknown as FastifyReply
}

describe('requireRole middleware', () => {
  it('allows OWNER when OWNER is required', async () => {
    const guard = requireRole('OWNER')
    const reply = makeReply()
    await guard(makeReq('OWNER'), reply)
    expect(reply.code).not.toHaveBeenCalled()
  })

  it('allows ADMIN when ADMIN or OWNER is required', async () => {
    const guard = requireRole('OWNER', 'ADMIN')
    const reply = makeReply()
    await guard(makeReq('ADMIN'), reply)
    expect(reply.code).not.toHaveBeenCalled()
  })

  it('rejects OPERATOR when OWNER is required', async () => {
    const guard = requireRole('OWNER')
    const reply = makeReply()
    await guard(makeReq('OPERATOR'), reply)
    expect(reply.code).toHaveBeenCalledWith(403)
  })

  it('rejects when user is missing', async () => {
    const guard = requireRole('OWNER')
    const req = {} as FastifyRequest
    const reply = makeReply()
    await guard(req, reply)
    expect(reply.code).toHaveBeenCalledWith(403)
  })
})
