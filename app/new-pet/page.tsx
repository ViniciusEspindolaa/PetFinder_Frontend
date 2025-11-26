'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Upload, X, MapPin, AlertTriangle } from 'lucide-react'
import { PetStatus, PetType, PetSize } from '@/lib/types'
import Image from 'next/image'
import dynamic from 'next/dynamic'

const SelectableMap = dynamic(() => import('@/components/selectable-map'), { ssr: false })

export default function NewPetPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
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
  const [contactName, setContactName] = useState('')
  const [sex, setSex] = useState<string>('INDEFINIDO')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    } else if (user) {
      if (user.telefone || user.phone) {
        setContactPhone(user.telefone || user.phone)
      }
      if (user.name) {
        setContactName(user.name)
      }
    }
  }, [user, isLoading, router])

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
      // pedir addressdetails para podermos extrair rua e cidade separadamente
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=8&addressdetails=1`)
      const data = await res.json()

      // filtrar resultados que contenham rua (road/pedestrian) e alguma cidade/town/village
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
    // tenta priorizar road + house_number, senão pedestrian, senão fallback para display_name
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

  function formatStreetOnly(r: any) {
    const a = r.address || {}
    let street = a.road || a.pedestrian || a.footway || a.cycleway || ''
    if (a.house_number) {
      street = street ? `${street}, ${a.house_number}` : `${a.house_number}`
    }
    return street || ''
  }

  // Quando mapLocation mudar (click ou drag), faz reverse-geocoding para preencher rua, bairro e cidade
  useEffect(() => {
    const doReverse = async () => {
      if (!mapLocation) return
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${mapLocation.lat}&lon=${mapLocation.lng}&format=json&addressdetails=1`)
        const data = await res.json()
        const a = data?.address || {}
        // rua (somente rua + número se dispoonível)
        const street = a.road || a.pedestrian || a.footway || a.cycleway || ''
        const house = a.house_number || ''
        const streetFull = house ? (street ? `${street}, ${house}` : house) : street
        setLocation(streetFull || '')
        const neigh = a.neighbourhood || a.suburb || a.village || a.hamlet || ''
        setNeighborhood(neigh)
        const cityVal = a.city || a.town || a.village || a.county || a.state || ''
        setCity(cityVal)
      } catch (err) {
        console.error('Erro no reverse geocoding', err)
      }
    }
    doReverse()
  }, [mapLocation])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Validations: backend requires latitude/longitude
    if (!mapLocation) {
      toast({
        variant: "destructive",
        title: "Localização necessária",
        description: 'Selecione a localização no mapa ou use "Usar Minha Localização Atual" antes de publicar.',
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
      if (sex) formData.append('sexo', sex)
      if (age) {
        formData.append('idade', age)
        formData.append('unidadeIdade', ageUnit)
      }
      if (reward) formData.append('recompensa', reward)
      if (contactPhone) formData.append('telefone_contato', contactPhone)
      formData.append('data_evento', eventDate || new Date().toISOString())

      if (selectedPhoto) {
        formData.append('fotos', selectedPhoto)
      }

      // Use apiFetch but we need to handle FormData correctly (skipJson: true to avoid auto-json header if we were using a wrapper that forced it, but apiFetch checks for FormData)
      // Actually apiFetch in lib/api.ts checks: if (!(options.body instanceof FormData)) set Content-Type json.
      // So passing FormData works automatically.
      
      await apiFetch('/api/publicacoes/com-fotos', {
        method: 'POST',
        body: formData
      })

      toast({
        title: "Sucesso!",
        description: "Pet cadastrado com sucesso!",
        duration: 3000,
        className: "bg-green-500 text-white border-none",
      })
      router.push('/')
    } catch (err: any) {
      console.error('Erro ao criar publicação', err)
      toast({
        variant: "destructive",
        title: "Erro ao publicar",
        description: err?.message || 'Ocorreu um erro ao tentar publicar. Verifique os dados e tente novamente.',
        duration: 4000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-teal-50 to-orange-50 pb-6">

      <main className="container mx-auto px-3 py-3 sm:px-4 sm:py-6 max-w-2xl">
        <div className="mb-3 flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.push('/')} className="p-2 h-auto">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-base sm:text-xl font-bold">Novo Anúncio</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Preencha as informações do pet</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-6">
          {/* Status Selection */}
          <Card>
            <CardContent className="p-3 sm:p-4">
              <Label htmlFor="status" className="mb-2 block text-sm">Tipo de anúncio *</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as PetStatus)}>
                <SelectTrigger id="status" className="h-9 text-sm sm:h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lost">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                      <span>Perdido - Meu pet desapareceu</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="found">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span>Encontrado - Encontrei um pet</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="adoption">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span>Adoção - Pet para adotar</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Photo Upload */}
          <Card>
            <CardContent className="p-3 sm:p-4">
              <Label className="mb-2 block text-sm">Foto do pet *</Label>
              {photoPreview ? (
                <div className="relative aspect-video rounded-lg overflow-hidden">
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
                <label className="border-2 border-dashed border-gray-300 rounded-lg p-8 sm:p-8 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors active:bg-gray-50">
                  <Upload className="w-10 h-10 text-gray-400 mb-2" />
                  <p className="text-sm font-medium mb-0.5">Clique para enviar uma foto</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG até 10MB</p>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                    required
                  />
                </label>
              )}
            </CardContent>
          </Card>

          {/* Pet Information */}
          <Card>
            <CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
              <h3 className="font-semibold text-sm">Informações do Pet</h3>

              {(status === 'lost' || status === 'adoption') && (
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs sm:text-sm">
                    Nome *
                  </Label>
                  <Input
                    id="name"
                    placeholder="Ex: Rex, Luna..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-9 text-sm"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
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

              <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="breed" className="text-xs sm:text-sm">Raça *</Label>
                  <Input
                    id="breed"
                    placeholder="Ex: Labrador, Siamês..."
                    value={breed}
                    onChange={(e) => setBreed(e.target.value)}
                    required
                    className="h-9 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sex" className="text-xs sm:text-sm">Sexo (opcional)</Label>
                  <Select value={sex} onValueChange={setSex}>
                    <SelectTrigger id="sex" className="h-9 text-sm">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MACHO">Macho</SelectItem>
                      <SelectItem value="FEMEA">Fêmea</SelectItem>
                      <SelectItem value="INDEFINIDO">Não sei</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="age" className="text-xs sm:text-sm">Idade (opcional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="age"
                    type="number"
                    placeholder="Ex: 3"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="h-9 text-sm flex-1"
                  />
                  <Select value={ageUnit} onValueChange={(val) => setAgeUnit(val as 'ANOS' | 'MESES')}>
                    <SelectTrigger className="w-[110px] h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ANOS">Anos</SelectItem>
                      <SelectItem value="MESES">Meses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="eventDate" className="text-xs sm:text-sm">
                  {status === 'lost' ? 'Data em que se perdeu *' : status === 'found' ? 'Data em que foi encontrado *' : 'Disponível desde (opcional)'}
                </Label>
                <Input
                  id="eventDate"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  required={status !== 'adoption'}
                  className="h-9 text-sm"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs sm:text-sm">Descrição *</Label>
                <Textarea
                  id="description"
                  placeholder={
                    status === 'lost'
                      ? 'Descreva características marcantes, comportamento, onde foi visto pela última vez...'
                      : status === 'found'
                      ? 'Descreva onde encontrou o pet, características marcantes...'
                      : 'Descreva o temperamento, se está vacinado, castrado...'
                  }
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={4}
                  className="text-sm resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardContent className="p-3 sm:p-4 space-y-3">
              <h3 className="font-semibold text-sm">Localização</h3>
              <p className="text-xs text-muted-foreground">
                {status === 'lost'
                  ? 'Onde o pet foi visto pela última vez?'
                  : status === 'found'
                  ? 'Onde o pet foi encontrado?'
                  : 'Onde o pet está localizado?'}
              </p>

              {/* Map and search are above address inputs */}
              <div className="space-y-2">
                <div>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Buscar endereço (ex: Rua, bairro, cidade)"
                      value={addressQuery}
                      onChange={(e) => setAddressQuery(e.target.value)}
                      className="flex-1 border rounded px-2 py-1 text-sm"
                    />
                    <button type="button" onClick={searchAddress} className="bg-slate-100 px-3 rounded text-sm">{searching ? 'Buscando...' : 'Buscar'}</button>
                  </div>
                  {searchResults.length > 0 && (
                    <div className="max-h-40 overflow-auto mb-2 border rounded p-2 bg-white">
                      {searchResults.map((r: any) => (
                        <button
                          key={r.place_id}
                          type="button"
                          onClick={() => {
                            const lat = parseFloat(r.lat)
                            const lon = parseFloat(r.lon)
                            setMapLocation({ lat, lng: lon })
                            // preencher rua, bairro e cidade
                            setLocation(formatShortAddress(r))
                            const a = r.address || {}
                            const neigh = a.neighbourhood || a.suburb || a.village || a.hamlet || ''
                            setNeighborhood(neigh)
                            const cityVal = a.city || a.town || a.village || a.county || a.state || ''
                            setCity(cityVal)
                            setSearchResults([])
                          }}
                          className="w-full text-left p-1 text-sm hover:bg-slate-50"
                        >
                          {formatShortAddress(r)}
                        </button>
                      ))}
                    </div>
                  )}

                  <SelectableMap
                    latitude={mapLocation?.lat ?? null}
                    longitude={mapLocation?.lng ?? null}
                    onChange={(lat, lng) => {
                      setMapLocation({ lat, lng })
                    }}
                  />
                  {/* Botão de usar localização abaixo do mapa */}
                  <div className="mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGetCurrentLocation}
                      disabled={isGettingLocation}
                      className="w-full h-9 text-sm"
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      {isGettingLocation ? 'Obtendo localização...' : 'Usar Minha Localização Atual'}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  <div className="space-y-1.5">
                    <Label htmlFor="location" className="text-xs sm:text-sm">Endereço (rua) *</Label>
                    <Input
                      id="location"
                      placeholder="Ex: Av. Paulista, 1000"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                      className="h-9 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1.5">
                      <Label htmlFor="neighborhood" className="text-xs sm:text-sm">Bairro</Label>
                      <Input
                        id="neighborhood"
                        placeholder="Ex: Bela Vista"
                        value={neighborhood}
                        onChange={(e) => setNeighborhood(e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="city" className="text-xs sm:text-sm">Cidade *</Label>
                      <Input
                        id="city"
                        placeholder="Ex: São Paulo"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

                {mapLocation && (
                  <div className="p-2 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-xs text-green-800">
                      ✓ Localização capturada: {mapLocation.lat.toFixed(6)}, {mapLocation.lng.toFixed(6)}
                    </p>
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground">
                  A localização no mapa ajuda outros usuários a visualizar exatamente onde o pet foi visto.
                </p>
              
            </CardContent>
          </Card>

          {/* Reward (only for lost pets) */}
          {status === 'lost' && (
            <Card>
              <CardContent className="p-3 sm:p-4 space-y-3">
                <h3 className="font-semibold text-sm">Recompensa (opcional)</h3>
                <div className="space-y-1.5">
                  <Label htmlFor="reward" className="text-xs sm:text-sm">Valor da recompensa</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                    <Input
                      id="reward"
                      type="number"
                      placeholder="0,00"
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

          {/* Contact Info */}
          <Card>
            <CardContent className="p-3 sm:p-4 space-y-3">
              <h3 className="font-semibold text-sm">Contato</h3>
              <div className="space-y-1.5">
                <Label htmlFor="contactName" className="text-xs sm:text-sm">Nome</Label>
                <Input 
                  id="contactName"
                  value={contactName} 
                  onChange={(e) => setContactName(e.target.value)}
                  className="h-9 text-sm" 
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contactPhone" className="text-xs sm:text-sm">Telefone (WhatsApp)</Label>
                <Input 
                  id="contactPhone"
                  value={contactPhone} 
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="h-9 text-sm" 
                />
              </div>
              <p className="text-[10px] sm:text-sm text-muted-foreground">
                Estas informações serão exibidas no anúncio.
              </p>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button type="submit" className="w-full h-10 text-sm font-semibold sm:h-12" disabled={isSubmitting}>
            {isSubmitting ? 'Publicando...' : 'Publicar Anúncio'}
          </Button>
        </form>
      </main>
    </div>
  )
}
