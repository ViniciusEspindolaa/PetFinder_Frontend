'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Map, Briefcase, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'

export function MobileNav() {
  const pathname = usePathname()
  // unreadCount removed as notifications are now in the header/notification center

  const links = [
    { href: '/', icon: Home, label: 'Início' },
    { href: '/map', icon: Map, label: 'Mapa' },
    { href: '/services', icon: Briefcase, label: 'Serviços' },
    { href: '/profile', icon: User, label: 'Perfil' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-border z-2000 pb-safe">
      <div className="flex justify-around items-center h-16 sm:h-14 px-2">
        {links.map((link) => {
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl transition-all flex-1 relative active:scale-95',
                isActive
                  ? 'text-primary bg-teal-50'
                  : 'text-muted-foreground hover:text-foreground active:bg-gray-50'
              )}
            >
              <div className="relative">
                <link.icon className="w-5 h-5 sm:w-5 sm:h-5" />
              </div>
              <span className="text-[10px] sm:text-[11px] font-medium leading-none">{link.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
