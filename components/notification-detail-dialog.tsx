'use client'

import { Notification } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { MapPin, Calendar, Clock, User, Phone, Navigation } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface NotificationDetailDialogProps {
  notification: Notification | null
  open: boolean
  onClose: () => void
}

export function NotificationDetailDialog({ notification, open, onClose }: NotificationDetailDialogProps) {
  const router = useRouter()

  if (!notification) return null

  const handleViewOnMap = () => {
    router.push(`/map?petId=${notification.petId}`)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{notification.title}</DialogTitle>
          <DialogDescription>{notification.message}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {notification.type === 'sighting' && notification.sighting && (
            <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
              <h4 className="font-semibold text-sm">Detalhes do Avistamento</h4>

              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="font-medium">{notification.sighting.location.address}</p>
                  <p className="text-muted-foreground text-xs">{notification.sighting.location.city}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(notification.sighting.date).toLocaleDateString('pt-BR')}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {notification.sighting.time}
                </div>
              </div>

              <div className="pt-2 border-t">
                <p className="text-sm mb-3">{notification.sighting.description}</p>

                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>Reportado por {notification.sighting.reporterName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {notification.sighting.reporterPhone}
                  </div>
                </div>
              </div>
            </div>
          )}

          {notification.type === 'nearby' && (
            <div className="border rounded-lg p-4 bg-blue-50">
              <p className="text-sm text-muted-foreground">
                Um pet foi {notification.message.includes('encontrado') ? 'encontrado' : 'reportado'} próximo à sua localização. Clique no botão abaixo para ver no mapa.
              </p>
            </div>
          )}

          <Button className="w-full" onClick={handleViewOnMap}>
            <Navigation className="w-4 h-4 mr-2" />
            Ver no Mapa
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
