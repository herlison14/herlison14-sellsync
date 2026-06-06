import type { ReactNode } from 'react'
import { Sidebar } from '@/components/ui/sidebar'
import { QueryProvider } from '@/components/ui/query-provider'
import { NotificationBell } from '@/components/ui/notification-bell'
import { OnboardingBanner } from '@/components/ui/onboarding-banner'
import { ErrorBoundary } from '@/components/ui/error-boundary'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <div className="flex h-screen overflow-hidden bg-muted/30">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="flex h-12 shrink-0 items-center justify-end border-b bg-card px-4 gap-2">
            <NotificationBell />
          </header>
          <OnboardingBanner />
          <main className="flex-1 overflow-y-auto">
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>
        </div>
      </div>
    </QueryProvider>
  )
}
