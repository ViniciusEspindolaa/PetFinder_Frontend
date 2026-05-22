"use client"

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from './ui/button'
import { Plus, Calendar, Megaphone, Briefcase } from 'lucide-react'
import NotificationCenter from './notification-center'
import { useAuth } from '@/lib/auth-context'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function Header() {
  const router = useRouter()
  const { user } = useAuth()
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)

  return (
    <header className="bg-white border-b sticky top-0 z-[2000] shadow-sm">
      <div className="container mx-auto px-3 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="PetFinder" width={48} height={48} className="w-10 h-10 object-contain" priority />
          <span className="font-bold text-lg font-[family-name:var(--font-nunito)]">
            <span className="text-[#8EDCB9]">Pet</span>
            <span className="text-[#F39C12]">Finder</span>
          </span>
        </Link>
        <div className="flex-1"></div>

        {user ? (
          <div className="flex items-center gap-2">
            <NotificationCenter />
            <Button size="sm" variant="ghost" onClick={() => router.push('/agendamentos')} className="text-gray-600 hover:text-teal-700 hover:bg-teal-50 h-8 px-2 text-xs sm:h-10 sm:px-3 hidden sm:inline-flex">
              <Calendar className="w-4 h-4 mr-1" />
              Agendamentos
            </Button>
            
            <Dialog open={isNewModalOpen} onOpenChange={setIsNewModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-teal-600 hover:bg-teal-700 h-8 px-3 text-sm sm:h-10 sm:px-4">
                  <Plus className="w-4 h-4 mr-1" />
                  Novo
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md w-[95vw] rounded-xl">
                <DialogHeader>
                  <DialogTitle className="text-xl">O que você deseja criar?</DialogTitle>
                  <DialogDescription>
                    Escolha uma das opções abaixo para publicar na plataforma.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 auto-rows-fr auto-rows-fr">
                  <div 
                    className="flex flex-col items-center justify-start p-4 border rounded-xl h-full hover:bg-orange-50 hover:border-orange-200 cursor-pointer transition-colors"
                    onClick={() => { setIsNewModalOpen(false); router.push('/new-pet'); }}
                  >
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-3">
                      <Megaphone className="w-6 h-6 text-orange-600" />
                    </div>
                    <span className="font-bold text-center">Pet</span>
                    <span className="text-xs text-center text-muted-foreground mt-1 break-words pb-2">Achados/ Perdidos/ Adoção</span>
                  </div>
                  
                  <div 
                    className="flex flex-col items-center justify-start p-4 border rounded-xl h-full hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-colors"
                    onClick={() => { setIsNewModalOpen(false); router.push('/novo-evento'); }}
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                      <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="font-bold text-center">Evento</span>
                    <span className="text-xs text-center text-muted-foreground mt-1">Feiras, encontros</span>
                  </div>

                  <div 
                    className="flex flex-col items-center justify-start p-4 border rounded-xl h-full hover:bg-teal-50 hover:border-teal-200 cursor-pointer transition-colors"
                    onClick={() => { setIsNewModalOpen(false); router.push('/novo-servico'); }}
                  >
                    <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mb-3">
                      <Briefcase className="w-6 h-6 text-teal-600" />
                    </div>
                    <span className="font-bold text-center">Serviço</span>
                    <span className="text-xs text-center text-muted-foreground mt-1">Banhos, veterinários</span>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

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
