import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import { Header } from '@/components/header'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/components/theme-provider'
import { HighContrastManager } from '@/components/high-contrast-manager'
import { LocationUpdater } from '@/components/location-updater'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PetFinder - Encontre Pets Perdidos',
  description: 'Plataforma para ajudar pets perdidos, encontrados e adoção',
    generator: 'v0.app',
    icons: {
      icon: '/favicon.svg',
      apple: '/favicon.svg'
    }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
          forcedTheme="light"
        >
          <HighContrastManager />
          <AuthProvider>
            <LocationUpdater />
            <Header />
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
