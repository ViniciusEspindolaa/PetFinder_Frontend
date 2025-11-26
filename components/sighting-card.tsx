'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Calendar, Clock, Edit, Trash2, ExternalLink, Eye } from 'lucide-react'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

interface SightingCardProps {
  sighting: {
    id: string
    petId: string
    location: {
      lat: number
      lng: number
      address: string
      city: string
    }
    date: Date
    time: string
    description: string
    reporterName: string
    reporterPhone: string
    createdAt: Date
    pet: {
      id: string
      name: string
      photoUrl: string
    }
  }
  onEdit: (sighting: any) => void
  onDelete: (sightingId: string) => void
}

export function SightingCard({ sighting, onEdit, onDelete }: SightingCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow group">
      <CardContent className="p-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Image Section */}
          <div className="relative w-full h-40 sm:w-32 sm:h-32 shrink-0 bg-gray-100 rounded-lg overflow-hidden">
            <Image
              src={sighting.pet.photoUrl || "/placeholder.svg"}
              alt={sighting.pet.name || 'Pet'}
              fill
              className="object-cover transition-transform group-hover:scale-105 duration-500"
            />
            <div className="absolute top-2 left-2">
               <Badge variant="secondary" className="bg-white/90 text-black hover:bg-white shadow-sm backdrop-blur-sm text-[10px] px-1.5 h-5">
                 <Eye className="w-3 h-3 mr-1" />
                 Visto
               </Badge>
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 flex flex-col justify-between min-w-0">
            <div>
              <div className="flex justify-between items-start mb-1">
                <div>
                  <h3 className="font-bold text-base leading-tight mb-1 text-gray-900 truncate">
                    {sighting.pet.name || 'Pet Desconhecido'}
                  </h3>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(sighting.createdAt), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
                <div className="flex gap-0.5">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-primary hover:bg-primary/10" onClick={() => onEdit(sighting)}>
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-red-600 hover:bg-red-50" onClick={() => onDelete(sighting.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5 mb-2">
                <div className="flex items-start gap-1.5 text-xs">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                  <span className="text-gray-700 font-medium line-clamp-1">{sighting.location.address}</span>
                </div>
                
                <div className="flex items-center gap-1.5 text-xs">
                  <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-gray-600">
                    <span className="font-medium text-gray-900">{new Date(sighting.date).toLocaleDateString('pt-BR')}</span> às <span className="font-medium text-gray-900">{sighting.time}</span>
                  </span>
                </div>

                {sighting.description && (
                  <div className="bg-gray-50 p-2 rounded-md text-xs text-gray-600 italic border border-gray-100 relative mt-2">
                    <p className="line-clamp-2">{sighting.description}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100 mt-auto">
               <Button variant="ghost" size="sm" className="text-xs h-7 px-2 hover:bg-transparent hover:text-primary p-0" asChild>
                  <Link href={`/pet/${sighting.petId}`} className="flex items-center">
                    <ExternalLink className="w-3 h-3 mr-1.5" />
                    Ver Publicação
                  </Link>
               </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
