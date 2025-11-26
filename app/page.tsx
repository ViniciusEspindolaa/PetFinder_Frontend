'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Pet, PetStatus, PetType } from '@/lib/types'
import { apiFetch } from '@/lib/api'
import { mapPublicacaoToPet } from '@/lib/api-mappers'
import { PetCard } from '@/components/pet-card'
import { SightingDialog } from '@/components/sighting-dialog'
import { ViewSightingsDialog } from '@/components/view-sightings-dialog'
import { SharePosterDialog } from '@/components/share-poster-dialog'
import { ReportDialog } from '@/components/report-dialog'
import { MobileNav } from '@/components/mobile-nav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Search, Check, ChevronsUpDown, Activity, CheckCircle, Eye, ArrowUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [pets, setPets] = useState<Pet[]>([])
  const [filteredPets, setFilteredPets] = useState<Pet[]>([])
  const [isLoadingPets, setIsLoadingPets] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('recent')
  const [stats, setStats] = useState<{ publicacoes: number, avistamentos: number, resolvidos: number } | null>(null)
  
  // Changed to arrays for multi-select
  const [statusFilters, setStatusFilters] = useState<PetStatus[]>([])
  const [typeFilters, setTypeFilters] = useState<PetType[]>([])
  
  const [cityFilters, setCityFilters] = useState<string[]>([])
  const [citySearch, setCitySearch] = useState('')
  const [neighborhoodFilters, setNeighborhoodFilters] = useState<string[]>([])
  const [neighborhoodSearch, setNeighborhoodSearch] = useState('')
  const [selectedPetForSighting, setSelectedPetForSighting] = useState<Pet | null>(null)
  const [selectedPetForViewing, setSelectedPetForViewing] = useState<Pet | null>(null)
  const [selectedPetForShare, setSelectedPetForShare] = useState<Pet | null>(null)
  const [selectedPetForReport, setSelectedPetForReport] = useState<Pet | null>(null)

  useEffect(() => {
    // Removed redirect to login
  }, [user, isLoading, router])

  // Load publicacoes from API
  useEffect(() => {
    let mounted = true
    async function load() {
      setIsLoadingPets(true)
      try {
        const data: any[] = await apiFetch('/api/publicacoes')
        const mapped = data.map(mapPublicacaoToPet)
        if (mounted) {
          setPets(mapped)
          // Initial filter will be applied by the next useEffect
        }
      } catch (err) {
        console.error('Failed to load publicacoes', err)
      } finally {
        setIsLoadingPets(false)
      }

      // Load stats
      try {
        const statsData: any = await apiFetch('/api/dashboard/gerais')
        if (mounted) {
          // Calculate resolved from publicacoes_por_status if available, or use a separate endpoint if needed
          // The dashboard/gerais returns publicacoes_por_status array
          const resolvidos = statsData.publicacoes_por_status?.find((s: any) => s.status === 'RESOLVIDO')?._count.status || 0
          
          setStats({
            publicacoes: statsData.publicacoes || 0,
            avistamentos: statsData.avistamentos || 0,
            resolvidos: resolvidos
          })
        }
      } catch (err) {
        console.error('Failed to load stats', err)
      }
    }

    load()
    return () => { mounted = false }
  }, [])

  // Set initial city filter based on user location
  useEffect(() => {
    if (user?.location?.city && cityFilters.length === 0) {
      setCityFilters([user.location.city])
    }
  }, [user, cityFilters])

  useEffect(() => {
    let filtered = pets

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (pet) =>
          (pet.name && pet.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          pet.breed.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pet.location.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pet.location.city.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by status (multi-select)
    if (statusFilters.length > 0) {
      filtered = filtered.filter((pet) => statusFilters.includes(pet.status))
    }

    // Filter by type (multi-select)
    if (typeFilters.length > 0) {
      filtered = filtered.filter((pet) => typeFilters.includes(pet.type))
    }

    // Filter by city
    if (cityFilters.length > 0) {
      filtered = filtered.filter((pet) => cityFilters.includes(pet.location.city))
    }

    // Filter by neighborhood
    if (neighborhoodFilters.length > 0) {
      filtered = filtered.filter((pet) => 
        pet.location.neighborhood && neighborhoodFilters.includes(pet.location.neighborhood)
      )
    }

    // Sort
    // Create a copy before sorting to ensure immutability and state update detection
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'sightings':
          return (b.sightings?.length || 0) - (a.sightings?.length || 0)
        case 'interactions':
          const lastInteractionA = Math.max(
            new Date(a.createdAt).getTime(),
            ...(a.sightings || []).map(s => new Date(s.createdAt).getTime())
          )
          const lastInteractionB = Math.max(
            new Date(b.createdAt).getTime(),
            ...(b.sightings || []).map(s => new Date(s.createdAt).getTime())
          )
          return lastInteractionB - lastInteractionA
        case 'reward':
          return (b.reward || 0) - (a.reward || 0)
        default:
          return 0
      }
    })

    setFilteredPets(sorted)
  }, [searchQuery, statusFilters, typeFilters, cityFilters, neighborhoodFilters, pets, sortBy])

  const handleViewMap = (pet: Pet) => {
    router.push(`/map?petId=${pet.id}`)
  }

  const handleSubmitSighting = async (sightingData: any) => {
    if (selectedPetForSighting && user) {
      try {
        // Combine date and time
        const sightingDate = new Date(sightingData.date)
        const [hours, minutes] = sightingData.time.split(':')
        sightingDate.setHours(parseInt(hours), parseInt(minutes))

        const res = await apiFetch('/api/avistamentos', {
          method: 'POST',
          body: JSON.stringify({
            publicacaoId: Number(selectedPetForSighting.id),
            usuarioId: user.id,
            observacoes: sightingData.description,
            fotos_urls: [],
            latitude: sightingData.location.lat,
            longitude: sightingData.location.lng,
            endereco_texto: sightingData.location.address,
            data_avistamento: sightingDate.toISOString()
          })
        })

        const newSighting = {
          id: String(res.id),
          petId: selectedPetForSighting.id,
          ...sightingData,
          createdAt: new Date(res.data_criacao || res.data_avistamento),
        }

        setPets((prevPets) =>
          prevPets.map((pet) =>
            pet.id === selectedPetForSighting.id
              ? { ...pet, sightings: [...pet.sightings, newSighting] }
              : pet
          )
        )

        toast({ title: 'Avistamento reportado', description: 'O dono do pet será notificado.' })
      } catch (error) {
        console.error('Erro ao reportar avistamento:', error)
        toast({ title: 'Erro', description: 'Não foi possível registrar o avistamento.', variant: 'destructive' })
      }
    } else if (!user) {
      toast({ title: 'Login necessário', description: 'Você precisa estar logado para reportar.', variant: 'destructive' })
      router.push('/login')
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

  const cities = Array.from(new Set(pets.map(p => p.location.city).filter(Boolean))).sort()

  const neighborhoods = Array.from(new Set(
    pets
      .filter(p => cityFilters.length === 0 || cityFilters.includes(p.location.city))
      .map(p => p.location.neighborhood)
      .filter(Boolean)
  )).sort() as string[]

  return (
    <div className="min-h-screen bg-linear-to-br from-teal-50 to-orange-50 pb-20">

      <main className="container mx-auto px-3 py-3 sm:px-4 sm:py-6">
        <div className="mb-4">

          <div className="relative mb-2.5">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar por nome, raça, localidade..."
              className="pl-9 h-9 text-sm sm:h-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 items-center">
            {/* Sort Dropdown */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-9 w-[160px] text-xs sm:text-sm border-dashed">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Mais recentes</SelectItem>
                <SelectItem value="oldest">Mais antigos</SelectItem>
                <SelectItem value="sightings">Mais avistamentos</SelectItem>
                <SelectItem value="interactions">Últimas interações</SelectItem>
                <SelectItem value="reward">Maior recompensa</SelectItem>
              </SelectContent>
            </Select>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Status Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9 border-dashed text-sm px-3">
                  <Plus className="mr-2 h-4 w-4" />
                  Status
                  {statusFilters.length > 0 && (
                    <>
                      <Separator orientation="vertical" className="mx-2 h-4" />
                      <div className="flex space-x-1">
                        {statusFilters.map((option) => (
                          <Badge variant="secondary" key={option} className="rounded-sm px-1 font-normal">
                            {option === 'lost' ? 'Perdido' : option === 'found' ? 'Encontrado' : 'Adoção'}
                          </Badge>
                        ))}
                      </div>
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[200px]" align="start">
                <DropdownMenuLabel>Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {['lost', 'found', 'adoption'].map((status) => (
                  <DropdownMenuCheckboxItem
                    key={status}
                    checked={statusFilters.includes(status as PetStatus)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setStatusFilters([...statusFilters, status as PetStatus])
                      } else {
                        setStatusFilters(statusFilters.filter((s) => s !== status))
                      }
                    }}
                  >
                    {status === 'lost' ? 'Perdido' : status === 'found' ? 'Encontrado' : 'Adoção'}
                  </DropdownMenuCheckboxItem>
                ))}
                {statusFilters.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem
                      checked={false}
                      onCheckedChange={() => setStatusFilters([])}
                      className="justify-center text-center font-medium"
                    >
                      Limpar filtros
                    </DropdownMenuCheckboxItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Type Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9 border-dashed text-sm px-3">
                  <Plus className="mr-2 h-4 w-4" />
                  Espécie
                  {typeFilters.length > 0 && (
                    <>
                      <Separator orientation="vertical" className="mx-2 h-4" />
                      <div className="flex space-x-1">
                        {typeFilters.map((option) => (
                          <Badge variant="secondary" key={option} className="rounded-sm px-1 font-normal">
                            {option === 'dog' ? 'Cachorro' : option === 'cat' ? 'Gato' : 'Outro'}
                          </Badge>
                        ))}
                      </div>
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[200px]" align="start">
                <DropdownMenuLabel>Espécie</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {['dog', 'cat', 'other'].map((type) => (
                  <DropdownMenuCheckboxItem
                    key={type}
                    checked={typeFilters.includes(type as PetType)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setTypeFilters([...typeFilters, type as PetType])
                      } else {
                        setTypeFilters(typeFilters.filter((t) => t !== type))
                      }
                    }}
                  >
                    {type === 'dog' ? 'Cachorro' : type === 'cat' ? 'Gato' : 'Outro'}
                  </DropdownMenuCheckboxItem>
                ))}
                {typeFilters.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem
                      checked={false}
                      onCheckedChange={() => setTypeFilters([])}
                      className="justify-center text-center font-medium"
                    >
                      Limpar filtros
                    </DropdownMenuCheckboxItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* City Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9 border-dashed text-sm px-3">
                  <Plus className="mr-2 h-4 w-4" />
                  Cidade
                  {cityFilters.length > 0 && (
                    <>
                      <Separator orientation="vertical" className="mx-2 h-4" />
                      <div className="flex space-x-1">
                        {cityFilters.map((option) => (
                          <Badge variant="secondary" key={option} className="rounded-sm px-1 font-normal">
                            {option}
                          </Badge>
                        ))}
                      </div>
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[200px]" align="start">
                <DropdownMenuLabel>Cidade</DropdownMenuLabel>
                <div className="px-2 py-2">
                  <Input
                    placeholder="Buscar cidade..."
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
                    className="h-8 text-xs"
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                </div>
                <DropdownMenuSeparator />
                <div className="max-h-[300px] overflow-y-auto">
                  {cities
                    .filter((city) => city.toLowerCase().includes(citySearch.toLowerCase()))
                    .map((city) => (
                      <DropdownMenuCheckboxItem
                        key={city}
                        checked={cityFilters.includes(city)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setCityFilters([...cityFilters, city])
                          } else {
                            setCityFilters(cityFilters.filter((c) => c !== city))
                          }
                        }}
                      >
                        {city}
                      </DropdownMenuCheckboxItem>
                    ))}
                  {cities.filter((city) => city.toLowerCase().includes(citySearch.toLowerCase())).length === 0 && (
                     <div className="py-6 text-center text-sm text-muted-foreground">Nenhuma cidade encontrada.</div>
                  )}
                </div>
                {cityFilters.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem
                      checked={false}
                      onCheckedChange={() => setCityFilters([])}
                      className="justify-center text-center font-medium"
                    >
                      Limpar filtros
                    </DropdownMenuCheckboxItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Neighborhood Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="h-9 border-dashed text-sm px-3"
                  disabled={cityFilters.length === 0}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Bairro
                  {neighborhoodFilters.length > 0 && (
                    <>
                      <Separator orientation="vertical" className="mx-2 h-4" />
                      <div className="flex space-x-1">
                        {neighborhoodFilters.map((option) => (
                          <Badge variant="secondary" key={option} className="rounded-sm px-1 font-normal">
                            {option}
                          </Badge>
                        ))}
                      </div>
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[200px]" align="start">
                <DropdownMenuLabel>Bairro</DropdownMenuLabel>
                <div className="px-2 py-2">
                  <Input
                    placeholder="Buscar bairro..."
                    value={neighborhoodSearch}
                    onChange={(e) => setNeighborhoodSearch(e.target.value)}
                    className="h-8 text-xs"
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                </div>
                <DropdownMenuSeparator />
                <div className="max-h-[300px] overflow-y-auto">
                  {neighborhoods
                    .filter((neighborhood) => neighborhood.toLowerCase().includes(neighborhoodSearch.toLowerCase()))
                    .map((neighborhood) => (
                      <DropdownMenuCheckboxItem
                        key={neighborhood}
                        checked={neighborhoodFilters.includes(neighborhood)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNeighborhoodFilters([...neighborhoodFilters, neighborhood])
                          } else {
                            setNeighborhoodFilters(neighborhoodFilters.filter((n) => n !== neighborhood))
                          }
                        }}
                      >
                        {neighborhood}
                      </DropdownMenuCheckboxItem>
                    ))}
                  {neighborhoods.filter((n) => n.toLowerCase().includes(neighborhoodSearch.toLowerCase())).length === 0 && (
                     <div className="py-6 text-center text-sm text-muted-foreground">Nenhum bairro encontrado.</div>
                  )}
                </div>
                {neighborhoodFilters.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem
                      checked={false}
                      onCheckedChange={() => setNeighborhoodFilters([])}
                      className="justify-center text-center font-medium"
                    >
                      Limpar filtros
                    </DropdownMenuCheckboxItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {isLoadingPets ? (
          <div className="text-center py-12">Carregando publicações...</div>
        ) : filteredPets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">Nenhum pet encontrado com os filtros selecionados</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {filteredPets.map((pet) => (
              <PetCard
                key={pet.id}
                pet={pet}
                onViewSightings={setSelectedPetForViewing}
                onReportSighting={setSelectedPetForSighting}
                onViewMap={handleViewMap}
                onShare={setSelectedPetForShare}
                onReport={setSelectedPetForReport}
              />
            ))}
          </div>
        )}

        {/* Stats Footer */}
        {stats && (
          <div className="mt-8 grid grid-cols-3 gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="bg-blue-100 p-2 rounded-full mb-2">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-gray-800">{stats.publicacoes}</span>
              <span className="text-xs text-muted-foreground">Publicações</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center border-l border-r border-gray-100">
              <div className="bg-orange-100 p-2 rounded-full mb-2">
                <Eye className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-2xl font-bold text-gray-800">{stats.avistamentos}</span>
              <span className="text-xs text-muted-foreground">Avistamentos</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center">
              <div className="bg-green-100 p-2 rounded-full mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-gray-800">{stats.resolvidos}</span>
              <span className="text-xs text-muted-foreground">Resolvidos</span>
            </div>
          </div>
        )}
      </main>

      <SightingDialog
        pet={selectedPetForSighting}
        open={!!selectedPetForSighting}
        onClose={() => setSelectedPetForSighting(null)}
        onSubmit={handleSubmitSighting}
      />

      <ViewSightingsDialog
        pet={selectedPetForViewing}
        open={!!selectedPetForViewing}
        onClose={() => setSelectedPetForViewing(null)}
      />

      <SharePosterDialog
        pet={selectedPetForShare}
        open={!!selectedPetForShare}
        onClose={() => setSelectedPetForShare(null)}
      />

      <ReportDialog
        pet={selectedPetForReport}
        open={!!selectedPetForReport}
        onClose={() => setSelectedPetForReport(null)}
      />

      <MobileNav />
    </div>
  )
}