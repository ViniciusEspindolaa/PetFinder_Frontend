"use client"

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Pet } from '@/lib/types'
import { apiFetch } from '@/lib/api'
import { mapPublicacaoToPet } from '@/lib/api-mappers'
import dynamic from 'next/dynamic'

// Dynamically import the Leaflet client component only on the browser to avoid SSR issues
const InteractiveMapClient = dynamic(() => import('@/components/leaflet-map.client'), {
  ssr: false,
})
import { SightingDialog } from '@/components/sighting-dialog'
import { PetDetailDialog } from '@/components/pet-detail-dialog'
import { ViewSightingsDialog } from '@/components/view-sightings-dialog'
import { MobileNav } from '@/components/mobile-nav'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

function MapContent() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const petId = searchParams.get('petId')

  const [pets, setPets] = useState<Pet[]>([])
  const [services, setServices] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [selectedPetForSighting, setSelectedPetForSighting] = useState<Pet | null>(null)
  const [selectedPetForDetails, setSelectedPetForDetails] = useState<Pet | null>(null)
  const [selectedPetForViewing, setSelectedPetForViewing] = useState<Pet | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | PetStatus>('all')
  const [showPets, setShowPets] = useState(true)
  const [showServices, setShowServices] = useState(true)
  const [showEvents, setShowEvents] = useState(true)

  useEffect(() => {
    // Removed redirect to login
  }, [user, isLoading, router])

  useEffect(() => {
    async function loadPets() {
      try {
        const data: any[] = await apiFetch('/api/publicacoes')
        const mapped = data.map(mapPublicacaoToPet)
        setPets(mapped)
      } catch (err) {
        console.error('Failed to load pets for map', err)
      }
    }
    async function loadServices() {
      try {
        const res = await apiFetch('/api/servicos')
        setServices(res.data || res || [])
      } catch (err) {
        console.error('Failed to load services for map', err)
      }
    }
    async function loadEvents() {
      try {
        const res = await apiFetch('/api/eventos')
        setEvents(res.data || res || [])
      } catch (err) {
        console.error('Failed to load events for map', err)
      }
    }
    loadPets()
    loadServices()
    loadEvents()
  }, [])

  // removed bottom panel that showed selected pet; navigation to detail page is handled by popup

  const handleSubmitSighting = async (sightingData: any) => {
    if (selectedPetForSighting && user) {
      try {
        // Combine date and time
        const sightingDate = new Date(sightingData.date)
        const [hours, minutes] = sightingData.time.split(':')
        sightingDate.setHours(parseInt(hours), parseInt(minutes))

        await apiFetch('/api/avistamentos', {
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

        alert('Avistamento reportado com sucesso!')
        setSelectedPetForSighting(null)
      } catch (error) {
        console.error('Erro ao reportar avistamento:', error)
        alert('Erro ao reportar avistamento.')
      }
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

  return (
    <div className="h-screen flex flex-col">

      <div className="container mx-auto px-3 py-3 sm:px-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="default"
              onClick={() => router.push('/')}
              className="p-2.5 h-auto"
            >
              <ArrowLeft className="w-6 h-6 sm:w-5 sm:h-5" />
            </Button>
            <h1 className="text-lg sm:text-xl font-bold">Mapa da Comunidade</h1>
          </div>

          <div className="mt-2 sm:mt-0 sm:ml-auto flex flex-wrap gap-2">
              <Button size="sm" variant={showPets ? 'default' : 'outline'} className={showPets ? "bg-white text-zinc-800 border-zinc-200 shadow-sm" : ""} onClick={() => setShowPets(!showPets)}>Pets</Button>
              <Button size="sm" variant={showServices ? 'default' : 'outline'} className={showServices ? "bg-purple-500 hover:bg-purple-600 text-white border-purple-500 shadow-sm" : ""} onClick={() => setShowServices(!showServices)}>Serviços</Button>
              <Button size="sm" variant={showEvents ? 'default' : 'outline'} className={showEvents ? "bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500 shadow-sm" : ""} onClick={() => setShowEvents(!showEvents)}>Eventos</Button>
          </div>
        </div>

        {showPets && (
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-sm font-medium flex items-center mr-2">Filtro Pets:</span>
            <Button size="sm" variant={statusFilter === 'all' ? 'default' : 'outline'} onClick={() => setStatusFilter('all')}>Todos</Button>
            <Button size="sm" variant={statusFilter === 'lost' ? 'default' : 'outline'} onClick={() => setStatusFilter('lost')}>Perdidos</Button>
            <Button size="sm" variant={statusFilter === 'found' ? 'default' : 'outline'} onClick={() => setStatusFilter('found')}>Encontrados</Button>
            <Button size="sm" variant={statusFilter === 'adoption' ? 'default' : 'outline'} onClick={() => setStatusFilter('adoption')}>Adoção</Button>
            <Button size="sm" variant={statusFilter === 'rescue' ? 'default' : 'outline'} onClick={() => setStatusFilter('rescue')}>Resgate</Button>
          </div>
        )}
      </div>
      <div className="flex-1 flex flex-col overflow-hidden pb-20 sm:pb-16">
        <div className="flex-1 transition-all h-full">
          <div className="h-full w-full bg-white z-0">
            <InteractiveMapClient
              pets={pets}
              services={services}
              events={events}
              showPets={showPets}
              showServices={showServices}
              showEvents={showEvents}
              selectedPetId={petId}
              onPetSelect={(pet) => router.push(`/map?petId=${pet.id}`)}
              onReportSighting={setSelectedPetForSighting}
              onViewDetails={setSelectedPetForDetails}
              onDeselect={() => router.push('/map')}
              statusFilter={statusFilter}
              userLocation={user?.location ? { lat: user.location.lat, lng: user.location.lng } : undefined}
            />
          </div>
        </div>
      </div>

      <SightingDialog
        pet={selectedPetForSighting}
        open={!!selectedPetForSighting}
        onClose={() => setSelectedPetForSighting(null)}
        onSubmit={handleSubmitSighting}
      />

      <PetDetailDialog
        pet={selectedPetForDetails}
        open={!!selectedPetForDetails}
        onClose={() => setSelectedPetForDetails(null)}
        onReportSighting={setSelectedPetForSighting}
        onViewSightings={setSelectedPetForViewing}
      />

      <ViewSightingsDialog
        pet={selectedPetForViewing}
        open={!!selectedPetForViewing}
        onClose={() => setSelectedPetForViewing(null)}
      />

      <MobileNav />
    </div>
  )
}

export default function MapPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    }>
      <MapContent />
    </Suspense>
  )
}




