'use client'

import { Pet } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Phone, AlertTriangle } from 'lucide-react'
import Image from 'next/image'

interface ContactDialogProps {
  pet: Pet | null
  open: boolean
  onClose: () => void
}

export function ContactDialog({ pet, open, onClose }: ContactDialogProps) {
  if (!pet) return null

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      `Olá! Vi seu anúncio sobre ${pet.name || 'o pet'} no PetFinder.`
    )
    const phone = pet.contactPhone.replace(/\D/g, '')
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank')
    onClose()
  }

  const handleCall = () => {
    window.location.href = `tel:${pet.contactPhone}`
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Entrar em Contato</DialogTitle>
          <DialogDescription>
            Escolha como deseja entrar em contato com {pet.contactName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          {pet.reward && pet.reward > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex gap-3 items-start">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-tight text-left">
                <strong>Atenção:</strong> O oferecimento e pagamento de recompensas é de inteira responsabilidade do anunciante. O PetFinder não intermedia pagamentos.
              </p>
            </div>
          )}

          <Button
            onClick={handleWhatsApp}
            className="w-full h-12 bg-green-600 hover:bg-green-700"
          >
            <div className="relative w-5 h-5 mr-2">
              <Image
                src="/wpplogo.webp"
                alt="WhatsApp"
                fill
                className="object-contain brightness-0 invert"
              />
            </div>
            Falar por WhatsApp
          </Button>

          <Button
            onClick={handleCall}
            variant="outline"
            className="w-full h-12"
          >
            <Phone className="w-5 h-5 mr-2" />
            Ligar para {pet.contactPhone}
          </Button>
        </div>

        <div className="text-center pt-2">
          <p className="text-xs text-muted-foreground">
            Contato: {pet.contactName}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
