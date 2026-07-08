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
import { ArrowLeft, PawPrint, Briefcase, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'

const SERVICE_TYPE_FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'PET_SITTER', label: 'Pet Sitter' },
  { value: 'DOG_WALKER', label: 'Dog Walker' },
  { value: 'BANHO_TOSA', label: 'Banho e Tosa' },
  { value: 'HOSPEDAGEM_CRECHE', label: 'Hospedagem' },
  { value: 'ADESTRADOR', label: 'Adestrador' },
] as const

const EVENT_STATUS_FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'AGENDADO', label: 'Agendados' },
  { value: 'EM_ANDAMENTO', label: 'Em andamento' },
  { value: 'CONCLUIDO', label: 'Concluídos' },
] as const

type ServiceTypeFilter = (typeof SERVICE_TYPE_FILTERS)[number]['value']
type EventStatusFilter = (typeof EVENT_STATUS_FILTERS)[number]['value']

function MapFilterRow({
  label,
  activeValue,
  options,
  onChange,
  activeClassName,
}: {
  label: string
  activeValue: string
  options: readonly { value: string; label: string }[]
  onChange: (value: string) => void
  activeClassName: string
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 mb-2">
      <span className="text-xs font-medium text-gray-500 mr-1">{label}</span>
      {options.map((opt) => (
        <button
          key={opt.value}
          className={cn(
            "h-6 px-2.5 text-xs rounded-full border transition-all font-medium",
            activeValue === opt.value
              ? cn(activeClassName)
              : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
          )}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

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
  const [statusFilter, setStatusFilter] = useState<'all' | 'lost' | 'found' | 'adoption' | 'rescue'>('all')
  const [serviceTypeFilter, setServiceTypeFilter] = useState<ServiceTypeFilter>('all')
  const [eventStatusFilter, setEventStatusFilter] = useState<EventStatusFilter>('all')
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
        setServices(res?.servicos || res?.data || res || [])
      } catch (err) {
        console.error('Failed to load services for map', err)
      }
    }
    async function loadEvents() {
      try {
        const res = await apiFetch('/api/eventos')
        setEvents(res?.eventos || res?.data || res || [])
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

      <div className="container mx-auto px-3 py-2 sm:px-4">
        <div className="flex items-center gap-2 mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/')}
            className="p-1.5 h-auto shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-base font-bold">Mapa da Comunidade</h1>

          <div className="ml-auto flex gap-1.5">
            <button
              className={cn(
                "flex items-center gap-1 h-7 px-2.5 text-xs rounded-full border font-medium transition-all",
                showPets
                  ? "bg-blue-600 text-white border-blue-700"
                  : "bg-white text-gray-500 border-gray-300 hover:bg-gray-50"
              )}
              onClick={() => setShowPets(!showPets)}
            >
              <PawPrint className="w-3.5 h-3.5" />
              Pets
            </button>
            <button
              className={cn(
                "flex items-center gap-1 h-7 px-2.5 text-xs rounded-full border font-medium transition-all",
                showServices
                  ? "bg-teal-600 text-white border-teal-700"
                  : "bg-white text-gray-500 border-gray-300 hover:bg-gray-50"
              )}
              onClick={() => setShowServices(!showServices)}
            >
              <Briefcase className="w-3.5 h-3.5" />
              Serviços
            </button>
            <button
              className={cn(
                "flex items-center gap-1 h-7 px-2.5 text-xs rounded-full border font-medium transition-all",
                showEvents
                  ? "bg-orange-600 text-white border-orange-700"
                  : "bg-white text-gray-500 border-gray-300 hover:bg-gray-50"
              )}
              onClick={() => setShowEvents(!showEvents)}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Eventos
            </button>
          </div>
        </div>

        {showPets && (
          <MapFilterRow
            label="Filtro Pets:"
            activeValue={statusFilter}
            options={[
              { value: 'all', label: 'Todos' },
              { value: 'lost', label: 'Perdidos' },
              { value: 'found', label: 'Encontrados' },
              { value: 'adoption', label: 'Adoção' },
              { value: 'rescue', label: 'Resgate' },
            ]}
            onChange={(value) => setStatusFilter(value as typeof statusFilter)}
            activeClassName="bg-slate-800 text-white border-slate-800"
          />
        )}

        {showServices && (
          <MapFilterRow
            label="Filtro Serviços:"
            activeValue={serviceTypeFilter}
            options={SERVICE_TYPE_FILTERS}
            onChange={(value) => setServiceTypeFilter(value as ServiceTypeFilter)}
            activeClassName="bg-teal-600 text-white border-teal-600"
          />
        )}

        {showEvents && (
          <MapFilterRow
            label="Filtro Eventos:"
            activeValue={eventStatusFilter}
            options={EVENT_STATUS_FILTERS}
            onChange={(value) => setEventStatusFilter(value as EventStatusFilter)}
            activeClassName="bg-orange-600 text-white border-orange-600"
          />
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
              onReportSighting={setSelectedPetForSighting as any}
              onViewDetails={setSelectedPetForDetails as any}
              onDeselect={() => router.push('/map')}
              statusFilter={statusFilter}
              serviceTypeFilter={serviceTypeFilter}
              eventStatusFilter={eventStatusFilter}
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




