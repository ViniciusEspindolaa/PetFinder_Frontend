'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

interface DirectionsDialogProps {
  open: boolean
  onClose: () => void
  lat: number
  lng: number
  address?: string
}

export function DirectionsDialog({ open, onClose, lat, lng, address }: DirectionsDialogProps) {
  const handleGoogleMaps = () => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank')
    onClose()
  }

  const handleWaze = () => {
    window.open(`https://waze.com/ul?ll=${lat},${lng}&navigate=yes`, '_blank')
    onClose()
  }

  const handleUber = () => {
    const url = `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${lat}&dropoff[longitude]=${lng}&dropoff[nickname]=${encodeURIComponent(address || 'Destino')}`
    window.open(url, '_blank')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Como chegar</DialogTitle>
          <DialogDescription>
            Escolha o aplicativo para navegar até o local.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <Button onClick={handleGoogleMaps} variant="outline" className="flex items-center justify-start gap-3 h-16 px-4 hover:bg-slate-50">
            <div className="relative w-10 h-10 shrink-0">
              <Image src="/googlemapslogo.png" alt="Google Maps" fill className="object-contain" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-slate-900">Google Maps</div>
              <div className="text-xs text-slate-500">Navegação padrão</div>
            </div>
          </Button>

          <Button onClick={handleWaze} variant="outline" className="flex items-center justify-start gap-3 h-16 px-4 hover:bg-slate-50">
            <div className="relative w-10 h-10 shrink-0">
              <Image src="/wazelogo.png" alt="Waze" fill className="object-contain" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-slate-900">Waze</div>
              <div className="text-xs text-slate-500">Melhor para trânsito</div>
            </div>
          </Button>

          <Button onClick={handleUber} variant="outline" className="flex items-center justify-start gap-3 h-16 px-4 hover:bg-slate-50">
            <div className="relative w-10 h-10 shrink-0">
              <Image src="/uberlogo.svg" alt="Uber" fill className="object-contain" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-slate-900">Uber</div>
              <div className="text-xs text-slate-500">Solicitar corrida</div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
