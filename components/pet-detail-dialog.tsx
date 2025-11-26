"use client"

import { useState } from 'react'
import { Pet } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, Share2, Maximize2 } from 'lucide-react'
import Image from 'next/image'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { ContactDialog } from './contact-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { InteractiveMap as InteractiveMapClient } from './interactive-map.client'
import { DirectionsDialog } from '@/components/directions-dialog'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ImageDialog } from './image-dialog'

interface PetDetailDialogProps {
  pet: Pet | null
  open: boolean
  onClose: () => void
  onViewSightings?: (pet: Pet) => void
  onReportSighting?: (pet: Pet) => void
}

export function PetDetailDialog({ 
  pet, 
  open, 
  onClose,
  onViewSightings,
  onReportSighting
}: PetDetailDialogProps) {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [contactDialogOpen, setContactDialogOpen] = useState(false)
  const [directionsOpen, setDirectionsOpen] = useState(false)
  const [imageOpen, setImageOpen] = useState(false)
  
  if (!pet) return null

  const statusConfig = {
    lost: { label: 'Perdido', color: 'bg-red-500 text-white' },
    found: { label: 'Encontrado', color: 'bg-blue-500 text-white' },
    adoption: { label: 'Adoção', color: 'bg-green-500 text-white' },
  }

  const getDisplayName = () => {
    if (pet.status === 'found') {
      const species = pet.type === 'dog' ? 'Cachorro' : pet.type === 'cat' ? 'Gato' : 'Pet'
      return `${species} encontrado`
    }
    return pet.name
  }

  const displayName = getDisplayName()

  const handleAction = (action: () => void) => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para realizar esta ação.",
        variant: "destructive"
      })
      router.push('/login')
      return
    }
    action()
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="max-w-3xl w-full max-h-[80vh] overflow-y-auto p-4">
          <DialogHeader>
            <DialogTitle>{displayName || `${pet.type}`}</DialogTitle>
            <DialogDescription>
              {pet.breed} • {pet.size === 'small' ? 'Pequeno' : pet.size === 'medium' ? 'Médio' : 'Grande'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div 
              className="w-full h-48 sm:h-64 relative rounded-lg overflow-hidden bg-gray-100 cursor-zoom-in group"
              onClick={() => setImageOpen(true)}
            >
              <Image 
                src={pet.photoUrl || '/placeholder.svg'} 
                alt={displayName || 'Pet'} 
                fill 
                className="object-contain transition-transform group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Maximize2 className="w-8 h-8 text-white drop-shadow-lg" />
              </div>
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
                    <li><strong>Tipo:</strong> {pet.type === 'dog' ? 'Cachorro' : pet.type === 'cat' ? 'Gato' : 'Outro'}</li>
                    {pet.age && (
                      <li>
                        <strong>Idade:</strong> {pet.age} {(pet.unidadeIdade || pet.ageUnit) === 'MESES' ? 'meses' : 'anos'}
                      </li>
                    )}
                    <li><strong>Cidade:</strong> {pet.location.city}</li>
                    {pet.location.neighborhood && <li><strong>Bairro:</strong> {pet.location.neighborhood}</li>}
                    <li><strong>Endereço:</strong> {pet.location.address}</li>
                    
                    {pet.status === 'adoption' ? (
                      <li><strong>Criado em:</strong> {new Date(pet.createdAt).toLocaleString('pt-BR')}</li>
                    ) : (
                      <li><strong>{pet.status === 'lost' ? 'Perdido em' : 'Encontrado em'}:</strong> {new Date(pet.lastSeenDate).toLocaleDateString('pt-BR')}</li>
                    )}

                    {pet.sightings && pet.sightings.length > 0 && (
                      <li><strong>Última vista:</strong> {
                        new Date(Math.max(...pet.sightings.map(s => new Date(s.date).getTime()))).toLocaleDateString('pt-BR')
                      }</li>
                    )}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold">Contato</h4>
                  <p className="text-sm text-muted-foreground mt-1">{pet.contactName} — {pet.contactPhone}</p>

                  {pet.status === 'lost' && (
                    <>
                      <div className="flex items-center justify-between mt-3">
                        <h4 className="font-semibold">Avistamentos</h4>
                        {pet.sightings.length > 0 && onViewSightings && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs px-2 text-muted-foreground hover:text-primary"
                            onClick={() => {
                              onClose()
                              onViewSightings(pet)
                            }}
                          >
                            Ver detalhes
                          </Button>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1 space-y-2 max-h-40 overflow-auto">
                        {pet.sightings.length === 0 && <p>Nenhum avistamento registrado.</p>}
                        {pet.sightings.map((s) => (
                          <div 
                            key={s.id} 
                            className="border rounded px-2 py-1 cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => {
                              if (onViewSightings) {
                                onClose()
                                onViewSightings(pet)
                              }
                            }}
                          >
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

              <div className="pt-2 flex gap-2 flex-wrap">
                {pet.status === 'lost' && onReportSighting && (
                  <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => { 
                    handleAction(() => {
                      onReportSighting(pet); 
                      onClose(); 
                    })
                  }}>
                    Avistar
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => handleAction(() => setContactDialogOpen(true))}>
                  Contatar
                </Button>
                <Button size="sm" variant="outline" onClick={() => setDirectionsOpen(true)}>
                  Como chegar
                </Button>
                <Button size="sm" variant="outline" onClick={() => { 
                  navigator.clipboard?.writeText(window.location.href);
                  toast({ title: "Link copiado!" });
                }}>
                  <Share2 className="w-4 h-4 mr-1" />
                  Copiar link
                </Button>
              </div>
            </div>

            <div className="w-full h-60 sm:h-96">
              <InteractiveMapClient pets={[pet]} selectedPetId={pet.id} onPetSelect={() => {}} />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ContactDialog
        pet={pet}
        open={contactDialogOpen}
        onClose={() => setContactDialogOpen(false)}
      />

      <DirectionsDialog 
        open={directionsOpen} 
        onClose={() => setDirectionsOpen(false)} 
        lat={pet.location.lat} 
        lng={pet.location.lng} 
        address={pet.location.address}
      />

      <ImageDialog
        src={pet.photoUrl || '/placeholder.svg'}
        alt={displayName || 'Pet'}
        open={imageOpen}
        onClose={() => setImageOpen(false)}
      />
    </>
  )
}
