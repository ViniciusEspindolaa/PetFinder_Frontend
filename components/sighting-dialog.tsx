'use client'

import { useState, useEffect } from 'react'
import { Pet, Sighting } from '@/lib/types'
import { useAuth } from '@/lib/auth-context'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MapPin, Calendar, Clock } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useToast } from '@/hooks/use-toast'

const SelectableMap = dynamic(() => import('@/components/selectable-map'), { ssr: false })

interface SightingDialogProps {
  pet: Pet | null
  open: boolean
  onClose: () => void
  onSubmit: (sighting: Omit<Sighting, 'id' | 'petId' | 'createdAt'>) => void
}

export function SightingDialog({ pet, open, onClose, onSubmit }: SightingDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [location, setLocation] = useState('')
  const [city, setCity] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [description, setDescription] = useState('')
  const [reporterName, setReporterName] = useState('')
  const [reporterPhone, setReporterPhone] = useState('')
  
  const [mapLocation, setMapLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isGettingLocation, setIsGettingLocation] = useState(false)

  useEffect(() => {
    if (open && user) {
      setReporterName(user.name || '')
      setReporterPhone(user.phone || '')
    }
    // Reset map when opening
    if (open) {
      setMapLocation(null)
      setLocation('')
      setCity('')
    }
  }, [open, user])

  const handleGetCurrentLocation = () => {
    setIsGettingLocation(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setMapLocation({ lat: latitude, lng: longitude })
          setIsGettingLocation(false)
          toast({
            title: "Localização capturada",
            description: `Coordenadas: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            duration: 3000,
          })
        },
        (error) => {
          setIsGettingLocation(false)
          toast({
            variant: "destructive",
            title: "Erro de localização",
            description: "Não foi possível obter sua localização. Verifique as permissões.",
            duration: 3000,
          })
        }
      )
    } else {
      setIsGettingLocation(false)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Geolocalização não é suportada pelo seu navegador.",
        duration: 3000,
      })
    }
  }

  // Quando mapLocation mudar (click ou drag), faz reverse-geocoding
  useEffect(() => {
    const doReverse = async () => {
      if (!mapLocation) return
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${mapLocation.lat}&lon=${mapLocation.lng}&format=json&addressdetails=1`)
        const data = await res.json()
        const a = data?.address || {}
        
        // Formatar endereço
        const street = a.road || a.pedestrian || a.footway || a.cycleway || ''
        const house = a.house_number || ''
        const streetFull = house ? (street ? `${street}, ${house}` : house) : street
        const neigh = a.neighbourhood || a.suburb || a.village || a.hamlet || ''
        
        let fullAddress = streetFull
        if (neigh) fullAddress = fullAddress ? `${fullAddress} - ${neigh}` : neigh
        
        setLocation(fullAddress || data.display_name || '')
        
        const cityVal = a.city || a.town || a.village || a.county || a.state || ''
        setCity(cityVal)
      } catch (err) {
        console.error('Erro no reverse geocoding', err)
      }
    }
    doReverse()
  }, [mapLocation])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!mapLocation) {
      toast({
        variant: "destructive",
        title: "Localização necessária",
        description: "Por favor, selecione a localização no mapa.",
        duration: 3000,
      })
      return
    }

    onSubmit({
      location: {
        lat: mapLocation.lat,
        lng: mapLocation.lng,
        address: location,
        city: city || 'Desconhecida',
      },
      date: new Date(date),
      time,
      description,
      reporterName,
      reporterPhone,
    })
    
    // Reset form
    setLocation('')
    setCity('')
    setMapLocation(null)
    setDate('')
    setTime('')
    setDescription('')
    setReporterName('')
    setReporterPhone('')
    onClose()
  }

  if (!pet) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reportar Avistamento</DialogTitle>
          <DialogDescription>
            Ajude a encontrar {pet.name || 'este pet'} reportando onde você o viu
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="space-y-2">
            <Label>Localização no Mapa *</Label>
            <div className="border rounded-md overflow-hidden">
              <SelectableMap
                latitude={mapLocation?.lat ?? null}
                longitude={mapLocation?.lng ?? null}
                onChange={(lat, lng) => setMapLocation({ lat, lng })}
                className="w-full h-48"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGetCurrentLocation}
              disabled={isGettingLocation}
              className="w-full text-xs"
            >
              <MapPin className="w-3 h-3 mr-2" />
              {isGettingLocation ? 'Obtendo localização...' : 'Usar Minha Localização Atual'}
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">
              Endereço (preenchido automaticamente)
            </Label>
            <Input
              id="location"
              placeholder="Selecione no mapa acima"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">
                <Calendar className="w-4 h-4 inline mr-1" />
                Data
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">
                <Clock className="w-4 h-4 inline mr-1" />
                Hora
              </Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="O que você viu? Como o pet estava?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reporterName">Seu nome</Label>
            <Input
              id="reporterName"
              placeholder="Nome completo"
              value={reporterName}
              onChange={(e) => setReporterName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reporterPhone">Seu telefone</Label>
            <Input
              id="reporterPhone"
              type="tel"
              placeholder="+55 11 98765-4321"
              value={reporterPhone}
              onChange={(e) => setReporterPhone(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              Enviar Avistamento
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
