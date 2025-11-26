'use client'

import { useState } from 'react'
import { Pet } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Phone, Navigation, Eye } from 'lucide-react'
import Image from 'next/image'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { InteractiveMap as InteractiveMapClient } from './interactive-map'
import { ContactDialog } from '@/components/contact-dialog'
import { DirectionsDialog } from '@/components/directions-dialog'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface MapPetCardProps {
  pet: Pet
  onReportSighting: (pet: Pet) => void
}

export function MapPetCard({ pet, onReportSighting }: MapPetCardProps) {
  const statusConfig = {
    lost: { label: 'Perdido', color: 'bg-red-500 text-white' },
    found: { label: 'Encontrado', color: 'bg-blue-500 text-white' },
    adoption: { label: 'Adoção', color: 'bg-green-500 text-white' },
  }

  const handleWhatsAppContact = () => {
    const message = encodeURIComponent(
      `Olá! Vi seu anúncio sobre ${pet.name || 'o pet'} no PetFinder.`
    )
    const phone = pet.contactPhone.replace(/\D/g, '')
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank')
  }

  const [detailOpen, setDetailOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const [directionsOpen, setDirectionsOpen] = useState(false)

  const handleViewMore = () => {
    setDetailOpen(true)
  }

  return (
    <>
      <Card className="overflow-hidden">
      <div className="flex gap-3 p-3">
        <div className="relative w-24 h-24 shrink-0 rounded-lg overflow-hidden">
          <Image
            src={pet.photoUrl || "/placeholder.svg"}
            alt={pet.name || 'Pet'}
            fill
            className="object-cover"
          />
          <div className="absolute top-1 left-1">
            <Badge className={`${statusConfig[pet.status].color} text-xs px-1.5 py-0.5`}>
              {statusConfig[pet.status].label}
            </Badge>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="mb-2">
            {pet.name && <h3 className="font-bold text-base leading-tight">{pet.name}</h3>}
            <p className="text-xs text-muted-foreground">
              {pet.breed} • {pet.size === 'small' ? 'Pequeno' : pet.size === 'medium' ? 'Médio' : 'Grande'}
            </p>
          </div>

          <div className="flex items-start gap-1 text-xs mb-2">
            <MapPin className="w-3 h-3 mt-0.5 text-muted-foreground shrink-0" />
            <p className="line-clamp-1">{pet.location.address}</p>
          </div>

          {pet.reward && (
            <Badge variant="secondary" className="bg-amber-500 text-white text-xs mb-2">
              R$ {pet.reward}
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-3 pt-0">
        <div className={`grid gap-2 ${pet.status === 'lost' ? 'grid-cols-4' : 'grid-cols-3'}`}>
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-8"
            onClick={() => setDirectionsOpen(true)}
          >
            <Navigation className="w-3 h-3 mr-1" />
            Rota
          </Button>
          <Button
            size="sm"
            className="text-xs h-8 bg-green-600 hover:bg-green-700"
            onClick={handleWhatsAppContact}
          >
            <Phone className="w-3 h-3 mr-1" />
            Contato
          </Button>

          {pet.status === 'lost' && (
            <Button
              size="sm"
              variant="secondary"
              className="text-xs h-8"
              onClick={() => onReportSighting(pet)}
            >
              <Eye className="w-3 h-3 mr-1" />
              Avistar
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            className="text-xs h-8"
            onClick={handleViewMore}
          >
            Ver mais
          </Button>
        </div>
      </CardContent>
    </Card>

    <DirectionsDialog 
      open={directionsOpen} 
      onClose={() => setDirectionsOpen(false)} 
      lat={pet.location.lat} 
      lng={pet.location.lng} 
      address={pet.location.address}
    />

    <Dialog open={detailOpen} onOpenChange={(open) => setDetailOpen(open)}>
      <DialogContent className="max-w-3xl w-full max-h-[80vh] overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle>{pet.name || `${pet.type}`}</DialogTitle>
          <DialogDescription>
            {pet.breed} • {pet.size === 'small' ? 'Pequeno' : pet.size === 'medium' ? 'Médio' : 'Grande'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="w-full h-48 sm:h-64 relative rounded-lg overflow-hidden bg-gray-100">
            <Image src={pet.photoUrl || '/placeholder.svg'} alt={pet.name || 'Pet'} fill className="object-cover" />
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`${statusConfig[pet.status].color} inline-flex items-center rounded-full text-[12px] px-2 py-0.5`}>
                {statusConfig[pet.status].label}
              </span>
              {pet.reward && <span className="inline-flex items-center rounded-full bg-amber-500 text-white text-[12px] px-2 py-0.5">R$ {pet.reward}</span>}
              {pet.completed && <span className="inline-flex items-center rounded-full bg-gray-700 text-white text-[12px] px-2 py-0.5">Finalizado</span>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <h4 className="font-semibold">Informações</h4>
                <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                  <li><strong>Tipo:</strong> {pet.type}</li>
                  {pet.age && <li><strong>Idade:</strong> {pet.age}</li>}
                  <li><strong>Cidade:</strong> {pet.location.city}</li>
                  {pet.location.neighborhood && <li><strong>Bairro:</strong> {pet.location.neighborhood}</li>}
                  <li><strong>Endereço:</strong> {pet.location.address}</li>
                  <li><strong>Última vista:</strong> {new Date(pet.lastSeenDate).toLocaleDateString('pt-BR')}</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold">Contato</h4>
                <p className="text-sm text-muted-foreground mt-1">{pet.contactName} — {pet.contactPhone}</p>

                {pet.status === 'lost' && (
                  <>
                    <h4 className="font-semibold mt-3">Avistamentos</h4>
                    <div className="text-sm text-muted-foreground mt-1 space-y-2 max-h-40 overflow-auto">
                      {pet.sightings.length === 0 && <p>Nenhum avistamento registrado.</p>}
                      {pet.sightings.map((s) => (
                        <div key={s.id} className="border rounded px-2 py-1">
                          <div className="text-xs text-muted-foreground"><strong>{new Date(s.date).toLocaleDateString('pt-BR')}</strong> {s.time}</div>
                          <div className="text-xs text-muted-foreground">Reportado {formatDistanceToNow(new Date(s.createdAt), { addSuffix: true, locale: ptBR })}</div>
                          <div className="text-sm">{s.description}</div>
                          <div className="text-xs text-muted-foreground">{s.reporterName} — {s.reporterPhone}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              {pet.status === 'lost' && (
                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => { onReportSighting(pet); setDetailOpen(false); }}>
                  Avistar
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => setContactOpen(true)}>
                Contatar
              </Button>
              <Button size="sm" variant="outline" onClick={() => { navigator.clipboard?.writeText(window.location.href); }}>
                Copiar link
              </Button>
            </div>

            <div className="w-full h-60 sm:h-96">
              <InteractiveMapClient pets={[pet]} selectedPetId={pet.id} onPetSelect={() => {}} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

      <ContactDialog pet={pet} open={contactOpen} onClose={() => setContactOpen(false)} />
    </>
  )
}
