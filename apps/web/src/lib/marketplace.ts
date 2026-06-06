export const MP_EMOJI: Record<string, string> = {
  MERCADO_LIVRE: '🟡',
  SHOPEE:        '🟠',
  AMAZON:        '🔵',
  MAGALU:        '🟢',
  AMERICANAS:    '🔴',
  SHEIN:         '⚫',
  TIKTOK_SHOP:   '▶️',
}

export const MP_LABEL: Record<string, string> = {
  MERCADO_LIVRE: 'Mercado Livre',
  SHOPEE:        'Shopee',
  AMAZON:        'Amazon',
  MAGALU:        'Magalu',
  AMERICANAS:    'Americanas',
  SHEIN:         'Shein',
  TIKTOK_SHOP:   'TikTok Shop',
}

export const MARKETPLACES = Object.keys(MP_EMOJI) as string[]
