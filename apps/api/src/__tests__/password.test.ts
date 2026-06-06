import { describe, it, expect } from 'vitest'
import { scrypt, timingSafeEqual, randomBytes } from 'node:crypto'
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

describe('password hashing', () => {
  it('hashes and verifies a correct password', async () => {
    const stored = await hashPassword('mySecret123!')
    expect(await verifyPassword('mySecret123!', stored)).toBe(true)
  })

  it('rejects a wrong password', async () => {
    const stored = await hashPassword('mySecret123!')
    expect(await verifyPassword('wrongPassword', stored)).toBe(false)
  })

  it('produces different hashes for the same password (salt is random)', async () => {
    const h1 = await hashPassword('same')
    const h2 = await hashPassword('same')
    expect(h1).not.toBe(h2)
  })

  it('rejects a truncated stored hash', async () => {
    expect(await verifyPassword('any', 'deadbeef')).toBe(false)
  })

  it('rejects an empty stored string', async () => {
    expect(await verifyPassword('any', '')).toBe(false)
  })
})
