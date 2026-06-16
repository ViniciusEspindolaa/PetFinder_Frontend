'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, MapPin } from 'lucide-react'
import { useRouter } from 'next/navigation'

export interface SimilarPet {
  id: string
  titulo?: string
  nome_pet?: string
  raca?: string
  especie?: string
  distancia_km?: number
  score_compatibilidade?: number
  fotos_urls?: string[]
  tipo?: string
  usuario?: { nome?: string; telefone?: string }
}

interface SimilarPetsDialogProps {
  pets: SimilarPet[]
  open: boolean
  onOpenChange: (open: boolean) => void
  status: 'lost' | 'found'
}

export function SimilarPetsDialog({ pets, open, onOpenChange, status }: SimilarPetsDialogProps) {
  const router = useRouter()

  const title =
    status === 'lost'
      ? 'Pets encontrados parecidos por perto'
      : 'Pets perdidos parecidos por perto'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {pets.length === 1
              ? 'Encontramos 1 correspondência com base na espécie, raça, cor e distância.'
              : `Encontramos ${pets.length} correspondências com base na espécie, raça, cor e distância.`}{' '}
            Confira se pode ser o mesmo pet antes de publicar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {pets.map((pet) => (
            <div
              key={pet.id}
              className="flex gap-3 items-start bg-muted/40 rounded-lg p-3 border"
            >
              {pet.fotos_urls?.[0] ? (
                <img
                  src={pet.fotos_urls[0]}
                  alt={pet.titulo || pet.nome_pet || 'Pet'}
                  className="w-16 h-16 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-muted shrink-0 flex items-center justify-center text-xs text-muted-foreground">
                  Sem foto
                </div>
              )}
              <div className="flex-1 min-w-0 space-y-1">
                <p className="font-medium text-sm truncate">
                  {pet.titulo || pet.nome_pet || 'Sem nome'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {[pet.raca, pet.especie].filter(Boolean).join(' · ')}
                </p>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                  {pet.distancia_km != null && (
                    <span className="inline-flex items-center gap-0.5">
                      <MapPin className="w-3 h-3" />
                      {pet.distancia_km} km
                    </span>
                  )}
                  {pet.score_compatibilidade != null && (
                    <span>Compatibilidade {pet.score_compatibilidade}</span>
                  )}
                </div>
                {pet.usuario?.nome && (
                  <p className="text-xs text-muted-foreground">Por {pet.usuario.nome}</p>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 h-8 text-xs"
                onClick={() => {
                  onOpenChange(false)
                  router.push(`/pet/${pet.id}`)
                }}
              >
                Ver
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
