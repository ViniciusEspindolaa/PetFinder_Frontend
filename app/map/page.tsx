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
  const [selectedPetForSighting, setSelectedPetForSighting] = useState<Pet | null>(null)
  const [selectedPetForDetails, setSelectedPetForDetails] = useState<Pet | null>(null)
  const [selectedPetForViewing, setSelectedPetForViewing] = useState<Pet | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'lost' | 'found' | 'adoption'>('all')

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
    if (user) {
      loadPets()
    }
  }, [user])

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

  if (!user) {
    return null
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
            <h1 className="text-lg sm:text-xl font-bold">Mapa de Pets</h1>
          </div>

          <div className="mt-2 sm:mt-0 sm:ml-auto flex flex-wrap gap-2">
            <Button size="sm" variant={statusFilter === 'all' ? 'default' : 'outline'} onClick={() => setStatusFilter('all')}>Todos</Button>
            <Button size="sm" variant={statusFilter === 'lost' ? 'default' : 'outline'} onClick={() => setStatusFilter('lost')}>Perdidos</Button>
            <Button size="sm" variant={statusFilter === 'found' ? 'default' : 'outline'} onClick={() => setStatusFilter('found')}>Encontrados</Button>
            <Button size="sm" variant={statusFilter === 'adoption' ? 'default' : 'outline'} onClick={() => setStatusFilter('adoption')}>Adoção</Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden pb-20 sm:pb-16">
        <div className="flex-1 transition-all h-full">
          <div className="h-full w-full bg-white z-0">
            <InteractiveMapClient
              pets={pets}
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
