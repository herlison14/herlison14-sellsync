import { createHmac, randomBytes } from 'node:crypto'

// RFC 4648 Base32 alphabet
const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

function base32Encode(buf: Buffer): string {
  let bits = 0, val = 0, out = ''
  for (const byte of buf) {
    val = (val << 8) | byte
    bits += 8
    while (bits >= 5) {
      out += BASE32[(val >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) out += BASE32[(val << (5 - bits)) & 31]
  return out
}

function base32Decode(s: string): Buffer {
  const bytes: number[] = []
  let bits = 0, val = 0
  for (const char of s.toUpperCase().replace(/=+$/, '')) {
    const idx = BASE32.indexOf(char)
    if (idx === -1) continue
    val = (val << 5) | idx
    bits += 5
    if (bits >= 8) { bytes.push((val >>> (bits - 8)) & 0xff); bits -= 8 }
  }
  return Buffer.from(bytes)
}

function hotp(secret: string, counter: bigint): string {
  const key = base32Decode(secret)
  const msg = Buffer.alloc(8)
  msg.writeBigUInt64BE(counter)
  const hmac = createHmac('sha1', key).update(msg).digest()
  const offset = hmac[19] & 0xf
  const code = ((hmac[offset] & 0x7f) << 24) | (hmac[offset + 1] << 16) | (hmac[offset + 2] << 8) | hmac[offset + 3]
  return String(code % 1_000_000).padStart(6, '0')
}

export function generateSecret(): string {
  return base32Encode(randomBytes(20))
}

export function verifyTotp(secret: string, token: string, window = 1): boolean {
  const counter = BigInt(Math.floor(Date.now() / 1000 / 30))
  for (let i = -window; i <= window; i++) {
    if (hotp(secret, counter + BigInt(i)) === token.replace(/\s/g, '')) return true
  }
  return false
}

export function getTotpUri(secret: string, email: string, issuer = 'SellSync'): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`
}

// QR code as Google Chart API URL (no extra dependency)
export function getQrCodeUrl(uri: string): string {
  return `https://chart.googleapis.com/chart?chs=200x200&chld=M|0&cht=qr&chl=${encodeURIComponent(uri)}`
}
