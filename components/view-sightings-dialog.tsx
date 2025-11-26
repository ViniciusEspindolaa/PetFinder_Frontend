'use client'

import { useState } from 'react'
import { Pet, Sighting } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { MapPin, Calendar, Clock, User, Phone, Pencil, Trash2, Navigation } from 'lucide-react'
import { EditSightingDialog } from './edit-sighting-dialog'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ViewSightingsDialogProps {
  pet: Pet | null
  open: boolean
  onClose: () => void
  isOwner?: boolean
}

export function ViewSightingsDialog({ pet, open, onClose, isOwner = false }: ViewSightingsDialogProps) {
  const [editingSighting, setEditingSighting] = useState<Sighting | null>(null)
  const [deletingSighting, setDeletingSighting] = useState<Sighting | null>(null)
  const router = useRouter()

  const handleSaveSighting = (updatedSighting: Sighting) => {
    console.log('[v0] Saving sighting:', updatedSighting)
    alert('Avistamento atualizado com sucesso!')
  }

  const handleDeleteSighting = () => {
    if (deletingSighting) {
      console.log('[v0] Deleting sighting:', deletingSighting.id)
      alert('Avistamento excluído com sucesso!')
      setDeletingSighting(null)
    }
  }

  if (!pet) return null

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Avistamentos de {pet.name || 'Pet'}</DialogTitle>
            <DialogDescription>
              {pet.sightings.length} {pet.sightings.length === 1 ? 'avistamento' : 'avistamentos'} reportado{pet.sightings.length === 1 ? '' : 's'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {pet.sightings.map((sighting) => (
              <div key={sighting.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">{sighting.location.address}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(sighting.date).toLocaleDateString('pt-BR')}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {sighting.time}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Reportado {formatDistanceToNow(new Date(sighting.createdAt), { addSuffix: true, locale: ptBR })}
                </p>

                <p className="text-sm">{sighting.description}</p>

                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {sighting.reporterName}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {sighting.reporterPhone}
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-xs"
                    onClick={() => {
                      router.push(`/map?petId=${pet.id}`)
                      onClose()
                    }}
                  >
                    <Navigation className="w-3 h-3 mr-2" />
                    Ver no Mapa
                  </Button>
                </div>

                {isOwner && (
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingSighting(sighting)}
                      className="flex-1 text-xs"
                    >
                      <Pencil className="w-3 h-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeletingSighting(sighting)}
                      className="flex-1 text-xs"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Excluir
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <EditSightingDialog
        sighting={editingSighting}
        open={!!editingSighting}
        onClose={() => setEditingSighting(null)}
        onSave={handleSaveSighting}
      />

      <AlertDialog open={!!deletingSighting} onOpenChange={() => setDeletingSighting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este avistamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSighting} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
