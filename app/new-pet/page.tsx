'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { ToastAction } from '@/components/ui/toast'
import { SimilarPetsDialog, type SimilarPet } from '@/components/similar-pets-dialog'
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
import { ArrowLeft, Upload, X, MapPin, AlertTriangle, Wand2 } from 'lucide-react'
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
  const [urgencia, setUrgencia] = useState<'BAIXA' | 'MEDIA' | 'ALTA'>('MEDIA')
  const [condicaoMedica, setCondicaoMedica] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [similarPets, setSimilarPets] = useState<SimilarPet[]>([])
  const [loadingSimilar, setLoadingSimilar] = useState(false)
  const [showSimilarDialog, setShowSimilarDialog] = useState(false)
  const lastSimilarIdsRef = useRef('')
  const [iaColors, setIaColors] = useState<string[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [iaDetected, setIaDetected] = useState<{ breed: string; type: string; size: string; colors: string[] } | null>(null)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    } else if (user) {
      if ((user as any).telefone || user.phone) {
        setContactPhone((user as any).telefone || user.phone)
      }
      if (user.name) {
        setContactName(user.name)
      }
    }
  }, [user, isLoading, router])

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedPhoto(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPhotoPreview(base64String)
        
        // Chamada à IA
        analyzeImageWithAI(file);
      }
      reader.readAsDataURL(file)
    }
  }

  const tipoMap: Record<string, string> = { lost: 'PERDIDO', found: 'ENCONTRADO', adoption: 'ADOCAO', rescue: 'RESGATE' }
  const especieMap: Record<string, string> = { dog: 'CACHORRO', cat: 'GATO', other: 'OUTRO' }
  const porteMap: Record<string, string> = { small: 'PEQUENO', medium: 'MEDIO', large: 'GRANDE' }

  const fetchSimilarPets = async (coords?: { lat: number; lng: number }, iaOverride?: { breed?: string; size?: string; type?: string; colors?: string[] }) => {
    const loc = coords || mapLocation
    if (!loc || (status !== 'lost' && status !== 'found')) {
      setSimilarPets([])
      return
    }

    // iaOverride permite passar os valores recém-detectados pela IA, evitando stale closure do React
    const effectiveType = iaOverride?.type ?? type
    const effectiveBreed = iaOverride?.breed ?? breed
    const effectiveSize = iaOverride?.size ?? size
    const effectiveColors = iaOverride?.colors ?? iaColors

    setLoadingSimilar(true)
    try {
      const params = new URLSearchParams({
        latitude: String(loc.lat),
        longitude: String(loc.lng),
        raio_km: '15',
        especie: especieMap[effectiveType] || 'OUTRO',
        tipo: tipoMap[status] || 'PERDIDO',
      })
      if (effectiveBreed) params.set('raca', effectiveBreed)
      if (effectiveColors[0]) params.set('cor', effectiveColors[0])
      if (effectiveSize) params.set('porte', porteMap[effectiveSize] || effectiveSize.toUpperCase())

      const res = await apiFetch(`/api/publicacoes/buscar/similares-proximos?${params}`)
      const pets: SimilarPet[] = res?.publicacoes || []
      setSimilarPets(pets)

      if (pets.length > 0) {
        const idsKey = pets.map((p) => p.id).join(',')
        if (idsKey !== lastSimilarIdsRef.current) {
          lastSimilarIdsRef.current = idsKey
          const countLabel =
            pets.length === 1
              ? '1 pet parecido'
              : `${pets.length} pets parecidos`
          const contextLabel =
            status === 'lost'
              ? `${countLabel} encontrado${pets.length > 1 ? 's' : ''} por perto`
              : `${countLabel} perdido${pets.length > 1 ? 's' : ''} por perto`

          toast({
            title: 'Correspondências encontradas!',
            description: `Encontramos ${contextLabel}. Confira se pode ser o mesmo pet.`,
            duration: 8000,
            action: (
              <ToastAction altText="Ver pets similares" onClick={() => setShowSimilarDialog(true)}>
                Ver
              </ToastAction>
            ),
          })
          setShowSimilarDialog(true)
        }
      } else {
        lastSimilarIdsRef.current = ''
      }
    } catch (err) {
      console.error('Erro ao buscar pets similares', err)
      setSimilarPets([])
      lastSimilarIdsRef.current = ''
    } finally {
      setLoadingSimilar(false)
    }
  }

  const resolveCoordsForSimilarSearch = (): Promise<{ lat: number; lng: number } | null> => {
    if (mapLocation) return Promise.resolve(mapLocation)
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null)
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { timeout: 8000 }
      )
    })
  }

  useEffect(() => {
    if (!breed || (status !== 'lost' && status !== 'found')) return
    const timer = setTimeout(() => {
      if (mapLocation) fetchSimilarPets()
    }, 600)
    return () => clearTimeout(timer)
  }, [mapLocation, type, breed, size, status, iaColors])

  const analyzeImageWithAI = async (file: File) => {
    setIsAnalyzing(true)
    try {
      toast({
        title: "Analisando imagem...",
        description: "Nossa IA está identificando o pet para você.",
        duration: 3000,
      });

      const formData = new FormData();
      formData.append('foto', file);

      const res = await apiFetch('/api/ia/analyze-pet', {
        method: 'POST',
        body: formData,
      });

      if (res && res.type) {
        const detectedBreed = res.breed || ''
        const detectedSize = res.size as PetSize
        const detectedType = res.type
        const detectedColors = Array.isArray(res.colors) ? res.colors : []

        setType(detectedType);
        setBreed(detectedBreed);
        setSize(detectedSize);
        setIaColors(detectedColors);
        setIaDetected({ breed: detectedBreed, type: detectedType, size: detectedSize, colors: detectedColors });
        setDescription(prev => prev ? prev + ' ' + (res.description || '') : (res.description || ''));

        toast({
          title: "Análise concluída",
          description: "Os campos foram preenchidos automaticamente com base na foto.",
          duration: 4000,
        });

        const coords = await resolveCoordsForSimilarSearch()
        if (coords && (status === 'lost' || status === 'found')) {
          // Passa os valores detectados diretamente — setBreed/setSize são assíncronos
          // e o closure de fetchSimilarPets capturaria valores antigos sem este override
          fetchSimilarPets(coords, { breed: detectedBreed, size: detectedSize, type: detectedType, colors: detectedColors })
        }
      }
    } catch (error: any) {
      setIaDetected(null);
      console.error('Erro na análise da IA', error);
      const errMsg = error?.message || (error instanceof Error ? error.message : '');
      if (errMsg.toLowerCase().includes('animal')) {
        toast({
          variant: 'destructive',
          title: 'Imagem Recusada',
          description: errMsg || 'A imagem parece não conter um animal.',
          duration: 5000,
        });
        setPhotoPreview(null);
        setSelectedPhoto(null);
        return;
      }
      toast({
         variant: 'destructive',
         title: 'Erro na IA',
         description: 'Não foi possível analisar a imagem. Você pode preencher manualmente.',
      });
    } finally {
      setIsAnalyzing(false);
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
      const tipoMap: Record<string, string> = { lost: 'PERDIDO', found: 'ENCONTRADO', adoption: 'ADOCAO', rescue: 'RESGATE' }
      const especieMap: Record<string, string> = { dog: 'CACHORRO', cat: 'GATO', other: 'OUTRO' }
      const porteMap: Record<string, string> = { small: 'PEQUENO', medium: 'MEDIO', large: 'GRANDE' }

      const formData = new FormData()
      formData.append('usuarioId', user?.id || '')
      formData.append('titulo', `${status === 'rescue' ? 'Pet para resgate' : status === 'lost' ? 'Pet perdido' : status === 'found' ? 'Pet encontrado' : 'Pet para adoção'} - ${name || breed || 'Sem nome'}`)
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
      
      if (status === 'rescue') {
        formData.append('urgencia', urgencia)
        if (condicaoMedica) formData.append('condicao_medica', condicaoMedica)
      }

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
                  </SelectItem>                  <SelectItem value="rescue">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full" />
                      <span>Resgate - SOS Emergência</span>
                    </div>
                  </SelectItem>                </SelectContent>
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
                      setIaDetected(null)
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
              {photoPreview && isAnalyzing && (
                <div className="mt-2 flex items-center gap-2 text-xs text-teal-700 bg-teal-50 border border-teal-200 rounded-lg px-3 py-2">
                  <div className="w-3 h-3 border-2 border-teal-600 border-t-transparent rounded-full animate-spin shrink-0" />
                  <span>Analisando imagem com IA...</span>
                </div>
              )}
              {photoPreview && iaDetected && !isAnalyzing && (
                <div className="mt-2 flex items-start gap-2 text-xs text-teal-800 bg-teal-50 border border-teal-200 rounded-lg px-3 py-2">
                  <Wand2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-teal-600" />
                  <div>
                    <span className="font-semibold">Detectado pela IA: </span>
                    {[
                      iaDetected.breed,
                      iaDetected.size === 'small' ? 'Pequeno' : iaDetected.size === 'medium' ? 'Médio' : 'Grande',
                      ...(iaDetected.colors.length > 0 ? [iaDetected.colors.slice(0, 2).join(', ')] : [])
                    ].filter(Boolean).join(' · ')}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {(status === 'lost' || status === 'found') && (loadingSimilar || similarPets.length > 0) && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="p-3 sm:p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <h3 className="font-semibold text-sm">
                      {status === 'lost' ? 'Pets encontrados parecidos por perto' : 'Pets perdidos parecidos por perto'}
                    </h3>
                  </div>
                  {!loadingSimilar && similarPets.length > 0 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs shrink-0"
                      onClick={() => setShowSimilarDialog(true)}
                    >
                      Ver todos
                    </Button>
                  )}
                </div>
                {loadingSimilar ? (
                  <p className="text-xs text-muted-foreground">Buscando correspondências com base na foto e localização...</p>
                ) : (
                  <div className="space-y-2">
                    {similarPets.map((pet) => (
                      <div key={pet.id} className="flex gap-3 items-center bg-white rounded-lg p-2 border">
                        {pet.fotos_urls?.[0] && (
                          <img src={pet.fotos_urls[0]} alt={pet.titulo} className="w-14 h-14 rounded object-cover shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{pet.titulo || pet.nome_pet}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-muted-foreground flex-1 truncate">
                              {pet.raca || pet.especie} · {pet.distancia_km} km
                            </p>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                              (pet.score_compatibilidade ?? 0) >= 12 ? 'bg-green-100 text-green-700' :
                              (pet.score_compatibilidade ?? 0) >= 6 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {Math.round(((pet.score_compatibilidade ?? 0) / 20) * 100)}%
                            </span>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" className="shrink-0 h-8 text-xs" onClick={() => router.push(`/pet/${pet.id}`)}>
                          Ver
                        </Button>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground">
                      Sugestões automáticas com base na espécie, raça, cor e distância. Confira se pode ser o mesmo pet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

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

          {status === 'rescue' && (
            <Card>
              <CardContent className="p-3 sm:p-4 space-y-4">
                <h3 className="font-semibold text-sm">Informações de Urgência Médica</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="urgencia" className="text-xs sm:text-sm">Nível de Urgência *</Label>
                    <Select value={urgencia} onValueChange={(val) => setUrgencia(val as 'BAIXA' | 'MEDIA' | 'ALTA')}>
                      <SelectTrigger id="urgencia" className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BAIXA">Baixa (Pode aguardar)</SelectItem>
                        <SelectItem value="MEDIA">Média (Precisa de ajuda em breve)</SelectItem>
                        <SelectItem value="ALTA">Alta (Emergência/Risco de vida)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="condicaoMedica" className="text-xs sm:text-sm">Condição Médica</Label>
                    <Textarea
                      id="condicaoMedica"
                      value={condicaoMedica}
                      onChange={(e) => setCondicaoMedica(e.target.value)}
                      placeholder="Ex: Atropelado, desnutrido, precisa de cirurgia..."
                      className="text-sm min-h-[80px]"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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

      {(status === 'lost' || status === 'found') && (
        <SimilarPetsDialog
          pets={similarPets}
          open={showSimilarDialog}
          onOpenChange={setShowSimilarDialog}
          status={status}
        />
      )}
    </div>
  )
}
