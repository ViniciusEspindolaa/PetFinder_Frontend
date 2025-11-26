'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Upload, X, MapPin } from 'lucide-react'
import { Pet, PetStatus, PetType, PetSize } from '@/lib/types'
import Image from 'next/image'
import dynamic from 'next/dynamic'

const SelectableMap = dynamic(() => import('@/components/selectable-map'), { ssr: false })

interface EditPetDialogProps {
  pet: Pet | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditPetDialog({ pet, open, onOpenChange, onSuccess }: EditPetDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()

  const [status, setStatus] = useState<PetStatus>('lost')
  const [name, setName] = useState('')
  const [type, setType] = useState<PetType>('dog')
  const [breed, setBreed] = useState('')
  const [size, setSize] = useState<PetSize>('medium')
  const [age, setAge] = useState('')
  const [ageUnit, setAgeUnit] = useState<'ANOS' | 'MESES'>('ANOS')
  const [location, setLocation] = useState('')
  const [city, setCity] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [mapLocation, setMapLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [addressQuery, setAddressQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<Array<any>>([])
  const [description, setDescription] = useState('')
  const [reward, setReward] = useState('')
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null)
  const [contactPhone, setContactPhone] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)

  useEffect(() => {
    if (pet && open) {
      setStatus(pet.status)
      setName(pet.name || '')
      setType(pet.type)
      setBreed(pet.breed || '')
      setSize(pet.size || 'medium')
      setAge(pet.age ? String(pet.age) : '')
      setAgeUnit(pet.ageUnit || 'ANOS')
      setLocation(pet.location.address || '')
      setCity(pet.location.city || '')
      setNeighborhood(pet.location.neighborhood || '')
      setEventDate(pet.lastSeenDate ? new Date(pet.lastSeenDate).toISOString().split('T')[0] : '')
      setMapLocation({ lat: pet.location.lat, lng: pet.location.lng })
      setDescription(pet.description || '')
      setReward(pet.reward || '')
      setPhotoPreview(pet.photoUrl || null)
      setContactPhone(pet.contactPhone || user?.phone || '')
    }
  }, [pet, open, user])

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedPhoto(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

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

  const searchAddress = async () => {
    if (!addressQuery || addressQuery.trim().length < 3) return
    setSearching(true)
    try {
      const q = encodeURIComponent(addressQuery)
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=8&addressdetails=1`)
      const data = await res.json()

      const filtered = (data || []).filter((r: any) => {
        const a = r.address || {}
        const hasStreet = !!(a.road || a.pedestrian || a.footway || a.cycleway || a.house_number)
        const hasCity = !!(a.city || a.town || a.village || a.county || a.state)
        return hasStreet && hasCity
      })

      setSearchResults(filtered)
    } catch (err) {
      console.error('Erro ao buscar endereço', err)
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  function formatShortAddress(r: any) {
    const a = r.address || {}
    let street = a.road || a.pedestrian || a.footway || a.cycleway || ''
    if (a.house_number) {
      street = street ? `${street}, ${a.house_number}` : `${a.house_number}`
    }
    const city = a.city || a.town || a.village || a.county || a.state || ''
    const parts = [] as string[]
    if (street) parts.push(street)
    if (city) parts.push(city)
    return parts.length ? parts.join(', ') : (r.display_name || '')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pet) return
    setIsSubmitting(true)

    if (!mapLocation) {
      toast({
        variant: "destructive",
        title: "Localização necessária",
        description: 'Selecione a localização no mapa ou use "Usar Minha Localização Atual" antes de salvar.',
        duration: 4000,
      })
      setIsSubmitting(false)
      return
    }

    try {
      const tipoMap: Record<string, string> = { lost: 'PERDIDO', found: 'ENCONTRADO', adoption: 'ADOCAO' }
      const especieMap: Record<string, string> = { dog: 'CACHORRO', cat: 'GATO', other: 'OUTRO' }
      const porteMap: Record<string, string> = { small: 'PEQUENO', medium: 'MEDIO', large: 'GRANDE' }

      const formData = new FormData()
      formData.append('usuarioId', user?.id || '')
      formData.append('titulo', `${status === 'lost' ? 'Pet perdido' : status === 'found' ? 'Pet encontrado' : 'Pet para adoção'} - ${name || breed || 'Sem nome'}`)
      formData.append('descricao', description)
      formData.append('latitude', String(mapLocation.lat))
      formData.append('longitude', String(mapLocation.lng))
      formData.append('endereco_texto', location || (searchResults[0]?.display_name || ''))
      if (neighborhood) formData.append('bairro', neighborhood)
      if (city) formData.append('cidade', city)
      formData.append('tipo', tipoMap[status] || 'PERDIDO')
      formData.append('especie', especieMap[type] || 'OUTRO')
      
      if (name) formData.append('nome_pet', name)
      if (breed) formData.append('raca', breed)
      if (size) formData.append('porte', porteMap[size] || '')
      if (age) {
        formData.append('idade', age)
        formData.append('unidadeIdade', ageUnit)
      }
      if (contactPhone) formData.append('telefone_contato', contactPhone)
      formData.append('data_evento', eventDate || new Date().toISOString())

      // Ensure recompensa is sent
      const rewardValue = status === 'lost' ? (reward || '') : ''
      formData.append('recompensa', rewardValue)

      if (selectedPhoto) {
        formData.append('fotos', selectedPhoto)
      }

      // Use PUT endpoint (assuming it will be created)
      await apiFetch(`/api/publicacoes/${pet.id}`, {
        method: 'PUT',
        body: formData
      })

      toast({
        title: "Sucesso!",
        description: "Publicação atualizada com sucesso!",
        duration: 3000,
        className: "bg-green-500 text-white border-none",
      })
      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      console.error('Erro ao atualizar publicação', err)
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: err?.message || 'Ocorreu um erro ao tentar atualizar. Verifique os dados e tente novamente.',
        duration: 4000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!pet) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Editar Publicação</DialogTitle>
          <DialogDescription>Atualize as informações do seu pet</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Status Selection */}
          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm">Tipo de anúncio *</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as PetStatus)}>
              <SelectTrigger id="status" className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lost">Perdido</SelectItem>
                <SelectItem value="found">Encontrado</SelectItem>
                <SelectItem value="adoption">Adoção</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Photo Upload */}
          <div className="space-y-2">
            <Label className="text-sm">Foto do pet</Label>
            {photoPreview ? (
              <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-200">
                <Image src={photoPreview || "/placeholder.svg"} alt="Preview" fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setPhotoPreview(null)
                    setSelectedPhoto(null)
                  }}
                  className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 active:scale-95"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors active:bg-gray-50">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm font-medium mb-0.5">Clique para alterar a foto</p>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </label>
            )}
          </div>

          {/* Pet Information */}
          <div className="space-y-3 border rounded-lg p-3">
            <h3 className="font-semibold text-sm">Informações</h3>

            {(status === 'lost' || status === 'adoption') && (
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs sm:text-sm">Nome *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-9 text-sm"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="type" className="text-xs sm:text-sm">Tipo *</Label>
                <Select value={type} onValueChange={(value) => setType(value as PetType)}>
                  <SelectTrigger id="type" className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dog">Cachorro</SelectItem>
                    <SelectItem value="cat">Gato</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="size" className="text-xs sm:text-sm">Porte *</Label>
                <Select value={size} onValueChange={(value) => setSize(value as PetSize)}>
                  <SelectTrigger id="size" className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Pequeno</SelectItem>
                    <SelectItem value="medium">Médio</SelectItem>
                    <SelectItem value="large">Grande</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="breed" className="text-xs sm:text-sm">Raça *</Label>
                <Input
                  id="breed"
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                  required
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="age" className="text-xs sm:text-sm">Idade</Label>
                <div className="flex gap-2">
                  <Input
                    id="age"
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="h-9 text-sm flex-1"
                  />
                  <Select value={ageUnit} onValueChange={(val) => setAgeUnit(val as 'ANOS' | 'MESES')}>
                    <SelectTrigger className="w-[100px] h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ANOS">Anos</SelectItem>
                      <SelectItem value="MESES">Meses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="eventDate" className="text-xs sm:text-sm">Data do evento</Label>
              <Input
                id="eventDate"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required={status !== 'adoption'}
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contactPhone" className="text-xs sm:text-sm">Telefone de Contato</Label>
              <Input
                id="contactPhone"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs sm:text-sm">Descrição *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={3}
                className="text-sm resize-none"
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-3 border rounded-lg p-3">
            <h3 className="font-semibold text-sm">Localização</h3>
            
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Buscar endereço..."
                  value={addressQuery}
                  onChange={(e) => setAddressQuery(e.target.value)}
                  className="flex-1 border rounded px-2 py-1 text-sm"
                />
                <button type="button" onClick={searchAddress} className="bg-slate-100 px-3 rounded text-sm">{searching ? '...' : 'Buscar'}</button>
              </div>
              
              {searchResults.length > 0 && (
                <div className="max-h-32 overflow-auto border rounded p-1 bg-white">
                  {searchResults.map((r: any) => (
                    <button
                      key={r.place_id}
                      type="button"
                      onClick={() => {
                        const lat = parseFloat(r.lat)
                        const lon = parseFloat(r.lon)
                        setMapLocation({ lat, lng: lon })
                        setLocation(formatShortAddress(r))
                        const a = r.address || {}
                        setNeighborhood(a.neighbourhood || a.suburb || '')
                        setCity(a.city || a.town || '')
                        setSearchResults([])
                      }}
                      className="w-full text-left p-1 text-xs hover:bg-slate-50 truncate"
                    >
                      {formatShortAddress(r)}
                    </button>
                  ))}
                </div>
              )}

              <div className="h-48 w-full rounded-md overflow-hidden border">
                <SelectableMap
                  latitude={mapLocation?.lat ?? null}
                  longitude={mapLocation?.lng ?? null}
                  onChange={(lat, lng) => setMapLocation({ lat, lng })}
                />
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleGetCurrentLocation}
                disabled={isGettingLocation}
                className="w-full h-8 text-xs"
              >
                <MapPin className="w-3 h-3 mr-2" />
                Usar Minha Localização
              </Button>

              <div className="grid grid-cols-1 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="location" className="text-xs">Endereço</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                    className="h-8 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="neighborhood" className="text-xs">Bairro</Label>
                    <Input
                      id="neighborhood"
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="city" className="text-xs">Cidade</Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {status === 'lost' && (
            <div className="space-y-1.5">
              <Label htmlFor="reward" className="text-xs sm:text-sm">Recompensa (R$)</Label>
              <Input
                id="reward"
                type="number"
                value={reward}
                onChange={(e) => setReward(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
