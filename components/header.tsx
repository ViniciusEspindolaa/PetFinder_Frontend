"use client"

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from './ui/button'
import { Plus } from 'lucide-react'
import NotificationCenter from './notification-center'
import { useAuth } from '@/lib/auth-context'

export function Header() {
  const router = useRouter()
  const { user } = useAuth()

  return (
    <header className="bg-white border-b sticky top-0 z-[2000] shadow-sm">
      <div className="container mx-auto px-3 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" alt="PetFinder" width={36} height={36} className="rounded-md" />
          <span className="font-bold text-lg font-[family-name:var(--font-nunito)]">
            <span className="text-[#8EDCB9]">Pet</span>
            <span className="text-[#F39C12]">Finder</span>
          </span>
        </Link>

        {user ? (
          <div className="flex items-center gap-2">
            <NotificationCenter />
            <Button size="sm" className="bg-teal-600 hover:bg-teal-700 h-8 px-3 text-sm sm:h-10 sm:px-4" onClick={() => router.push('/new-pet')}>
              <Plus className="w-4 h-4 mr-1" />
              Novo
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm text-muted-foreground hidden md:inline-block mr-2 font-medium">
              Perdeu ou encontrou um pet?
            </span>
            <Button variant="ghost" size="sm" onClick={() => router.push('/login')} className="text-teal-700 hover:text-teal-800 hover:bg-teal-50">
              Entrar
            </Button>
            <Button size="sm" onClick={() => router.push('/signup')} className="bg-teal-600 hover:bg-teal-700">
              Cadastrar
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
