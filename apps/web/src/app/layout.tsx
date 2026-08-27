import type { Metadata } from 'next'
import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

// IBM Plex — família técnica/precisa, combina com um console de operação
// (SKU, preço, % de tudo quanto é lado) melhor que Inter/Space Grotesk.
// Mono entra em número/código (font-mono já usado nas tabelas do app).
const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex-sans',
  display: 'swap',
})
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SellSync — Hub Multichannel',
  description: 'Gerencie todos os seus marketplaces em um só lugar',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${plexSans.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
