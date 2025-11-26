'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { apiFetch } from '@/lib/api'
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
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Upload, X, MapPin, AlertTriangle } from 'lucide-react'
import { PetStatus, PetType, PetSize } from '@/lib/types'
import Image from 'next/image'
import dynamic from 'next/dynamic'

const LocationPicker = dynamic(() => import('@/components/location-picker'), {
  ssr: false,
  loading: () => <div className="w-full h-[300px] bg-gray-100 animate-pulse rounded-lg" />
})

export default function EditPetPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const petId = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [status, setStatus] = useState<PetStatus>('lost')
  const [name, setName] = useState('')
  const [type, setType] = useState<PetType>('dog')
  const [breed, setBreed] = useState('')
  const [size, setSize] = useState<PetSize>('medium')
  const [age, setAge] = useState('')
  const [location, setLocation] = useState('')
  const [city, setCity] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [mapLocation, setMapLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [description, setDescription] = useState('')
  const [reward, setReward] = useState('')
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    // Load pet data from API
    const fetchPet = async () => {
      try {
        const data = await apiFetch(`/publicacoes/${petId}`)
        
        if (data.usuarioId !== user?.id) {
          alert('Você não tem permissão para editar esta publicação.')
          router.push('/')
          return
        }

        setStatus(data.tipo === 'PERDIDO' ? 'lost' : data.tipo === 'ENCONTRADO' ? 'found' : 'adoption')
        setName(data.nome_pet || '')
        setType(data.especie === 'CACHORRO' ? 'dog' : data.especie === 'GATO' ? 'cat' : 'other')
        setBreed(data.raca || '')
        setSize(data.porte === 'PEQUENO' ? 'small' : data.porte === 'MEDIO' ? 'medium' : 'large')
        setAge(data.idade?.toString() || '')
        setLocation(data.endereco_texto || '')
        setCity(data.cidade || '')
        if (data.data_evento) {
            setEventDate(new Date(data.data_evento).toISOString().split('T')[0])
        }
        setMapLocation({ lat: Number(data.latitude), lng: Number(data.longitude) })
        setDescription(data.descricao || '')
        setReward(data.recompensa?.toString() || '')
        
        // Handle photos - assuming the first one is the main one for preview
        if (data.fotos_urls && data.fotos_urls.length > 0) {
            setPhotoPreview(data.fotos_urls[0])
        }
      } catch (error) {
        console.error('Erro ao carregar pet:', error)
        alert('Erro ao carregar dados da publicação.')
        router.push('/profile')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPet()
  }, [user, authLoading, router, petId])

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
          alert(`Localização capturada: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
        },
        (error) => {
          setIsGettingLocation(false)
          alert('Não foi possível obter sua localização.')
        }
      )
    } else {
      setIsGettingLocation(false)
      alert('Geolocalização não é suportada.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const tipoMap: Record<string, string> = { lost: 'PERDIDO', found: 'ENCONTRADO', adoption: 'ADOCAO' }
      const especieMap: Record<string, string> = { dog: 'CACHORRO', cat: 'GATO', other: 'OUTRO' }
      const porteMap: Record<string, string> = { small: 'PEQUENO', medium: 'MEDIO', large: 'GRANDE' }

      const formData = new FormData()
      formData.append('usuarioId', user?.id || '')
      
      formData.append('titulo', `${status === 'lost' ? 'Pet perdido' : status === 'found' ? 'Pet encontrado' : 'Pet para adoção'} - ${name || breed || 'Sem nome'}`)
      formData.append('descricao', description)
      
      if (mapLocation) {
        formData.append('latitude', String(mapLocation.lat))
        formData.append('longitude', String(mapLocation.lng))
      }
      
      formData.append('endereco_texto', location)
      if (city) formData.append('cidade', city)
      
      formData.append('tipo', tipoMap[status] || 'PERDIDO')
      formData.append('especie', especieMap[type] || 'OUTRO')
      
      if (name) formData.append('nome_pet', name)
      if (breed) formData.append('raca', breed)
      if (size) formData.append('porte', porteMap[size] || '')
      if (age) formData.append('idade', age)
      
      // Ensure recompensa is sent
      const rewardValue = status === 'lost' ? (reward || '') : ''
      formData.append('recompensa', rewardValue)
      
      formData.append('data_evento', eventDate ? new Date(eventDate).toISOString() : new Date().toISOString())

      if (selectedPhoto) {
        formData.append('fotos', selectedPhoto)
      }

      await apiFetch(`/publicacoes/${petId}`, {
        method: 'PUT',
        body: formData
      })

      alert('Publicação atualizada com sucesso!')
      router.push('/profile')
    } catch (err) {
      console.error(err)
      alert('Erro ao atualizar publicação.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-teal-50 to-orange-50 pb-6">
      <main className="container mx-auto px-3 py-3 sm:px-4 sm:py-6 max-w-2xl">
        <div className="mb-3 flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.push('/profile')} className="p-2 h-auto">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-base sm:text-xl font-bold">Editar Anúncio</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Atualize as informações do pet</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-6">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <Label htmlFor="status" className="mb-2 block text-sm">Tipo de anúncio *</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as PetStatus)}>
                <SelectTrigger id="status" className="h-9 text-sm sm:h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lost">Perdido</SelectItem>
                  <SelectItem value="found">Encontrado</SelectItem>
                  <SelectItem value="adoption">Adoção</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <Label className="mb-2 block text-sm">Foto do pet *</Label>
              {photoPreview ? (
                <div className="relative aspect-video rounded-lg overflow-hidden">
                  <Image src={photoPreview || "/placeholder.svg"} alt="Preview" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotoPreview(null)}
                    className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center cursor-pointer">
                  <Upload className="w-10 h-10 text-gray-400 mb-2" />
                  <p className="text-sm font-medium">Clique para enviar uma foto</p>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
              <h3 className="font-semibold text-sm">Informações do Pet</h3>

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

              <div className="grid grid-cols-2 gap-2.5">
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

              <div className="grid grid-cols-2 gap-2.5">
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
                  <Input
                    id="age"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="eventDate" className="text-xs sm:text-sm">
                  {status === 'lost' ? 'Data em que se perdeu *' : 'Data em que foi encontrado *'}
                </Label>
                <Input
                  id="eventDate"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  required
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
                  rows={4}
                  className="text-sm"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4 space-y-3">
              <h3 className="font-semibold text-sm">Localização</h3>

              <div className="space-y-1.5">
                <Label htmlFor="location" className="text-xs sm:text-sm">Endereço *</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="city" className="text-xs sm:text-sm">Cidade *</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm">Localização no mapa</Label>
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  <LocationPicker 
                    initialLat={mapLocation?.lat} 
                    initialLng={mapLocation?.lng} 
                    onLocationSelect={(lat, lng) => setMapLocation({ lat, lng })} 
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Toque no mapa para ajustar a localização exata.
                </p>
              </div>
            </CardContent>
          </Card>

          {status === 'lost' && (
            <Card>
              <CardContent className="p-3 sm:p-4 space-y-3">
                <h3 className="font-semibold text-sm">Recompensa</h3>
                <div className="space-y-1.5">
                  <Label htmlFor="reward" className="text-xs sm:text-sm">Valor</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">R$</span>
                    <Input
                      id="reward"
                      type="number"
                      className="pl-10 h-9 text-sm"
                      value={reward}
                      onChange={(e) => setReward(e.target.value)}
                    />
                  </div>
                  {reward && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2 relative animate-in fade-in slide-in-from-top-2">
                        <div className="absolute -top-2 left-4 w-4 h-4 bg-amber-50 border-t border-l border-amber-200 transform rotate-45"></div>
                        <div className="flex gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                            <p className="text-xs text-amber-800 leading-tight">
                                <strong>Atenção:</strong> Ofereça uma recompensa apenas se realmente puder pagá-la. O pagamento é de total responsabilidade do anunciante.
                            </p>
                        </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Button type="submit" className="w-full h-10 text-sm font-semibold" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </form>
      </main>
    </div>
  )
}
