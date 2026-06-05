import type { ReactNode } from 'react'
import { Sidebar } from '@/components/ui/sidebar'
import { QueryProvider } from '@/components/ui/query-provider'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <div className="flex h-screen overflow-hidden bg-muted/30">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </QueryProvider>
  )
}
