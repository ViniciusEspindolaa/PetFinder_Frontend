'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Pet } from '@/lib/types'
import { mockPets } from '@/lib/mock-data'
import { apiFetch } from '@/lib/api'
import { mapPublicacaoToPet } from '@/lib/api-mappers'
import { MobileNav } from '@/components/mobile-nav'
import { PetCard } from '@/components/pet-card'
import { SightingCard } from '@/components/sighting-card'
import { CompletePetDialog } from '@/components/complete-pet-dialog'
import { ViewSightingsDialog } from '@/components/view-sightings-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Settings, LogOut, PawPrint, Eye, MapPin, Phone, Mail, Calendar, Edit } from 'lucide-react'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'

import { EditPetDialog } from '@/components/edit-pet-dialog'
import { EditSightingDialog } from '@/components/edit-sighting-dialog'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function ProfilePage() {
  const { user, logout, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [userPets, setUserPets] = useState<Pet[]>([])
  const [userSightings, setUserSightings] = useState<any[]>([])
  const [isLoadingSightings, setIsLoadingSightings] = useState(false)
  const [completePetDialogOpen, setCompletePetDialogOpen] = useState(false)
  const [editPetDialogOpen, setEditPetDialogOpen] = useState(false)
  const [editSightingDialogOpen, setEditSightingDialogOpen] = useState(false)
  const [deleteSightingDialogOpen, setDeleteSightingDialogOpen] = useState(false)
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null)
  const [editingPet, setEditingPet] = useState<Pet | null>(null)
  const [editingSighting, setEditingSighting] = useState<any | null>(null)
  const [sightingToDelete, setSightingToDelete] = useState<string | null>(null)
  const [viewingSightingsPet, setViewingSightingsPet] = useState<Pet | null>(null)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  async function loadUserData() {
    if (user) {
      try {
        // Get user's pets from API
        const pubs: any[] = await apiFetch(`/api/publicacoes/usuario/${user.id}`)
        const mappedPets = pubs.map(mapPublicacaoToPet)
        setUserPets(mappedPets)
      } catch (error) {
        console.error("Failed to load user pets", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar suas publicações.",
          variant: "destructive"
        })
      }

      try {
        // Get user's sightings from API
        setIsLoadingSightings(true)
        const res: any = await apiFetch(`/api/avistamentos/usuario/${user.id}`)
        
        const sightings = (res.avistamentos || []).map((s: any) => {
          try {
            return {
              id: String(s.id),
              petId: String(s.publicacaoId),
              location: {
                lat: Number(s.latitude),
                lng: Number(s.longitude),
                address: s.endereco_texto,
                city: '', 
              },
              date: new Date(s.data_avistamento),
              time: new Date(s.data_avistamento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              description: s.observacoes || '',
              reporterName: s.usuario?.nome || '',
              reporterPhone: s.usuario?.telefone || '',
              createdAt: new Date(s.data_criacao || s.data_avistamento),
              pet: {
                id: String(s.publicacao?.id || '0'),
                name: s.publicacao?.titulo || 'Pet',
                photoUrl: s.publicacao?.fotos_urls?.[0] || '/placeholder.svg'
              }
            }
          } catch (err) {
            console.error('Error mapping sighting:', s, err)
            return null
          }
        }).filter(Boolean) // Remove nulls
        
        setUserSightings(sightings)
      } catch (error) {
        console.error("Failed to load user sightings", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar seus avistamentos.",
          variant: "destructive"
        })
      } finally {
        setIsLoadingSightings(false)
      }
    }
  }

  useEffect(() => {
    loadUserData()
  }, [user])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleEditPet = (pet: Pet) => {
    setEditingPet(pet)
    setEditPetDialogOpen(true)
  }

  const handleCompletePet = (pet: Pet) => {
    setSelectedPet(pet)
    setCompletePetDialogOpen(true)
  }

  const handlePetCompletion = async (petId: string, reason: string) => {
    try {
      await apiFetch(`/api/publicacoes/${petId}/finalizar`, {
        method: 'PATCH',
        body: JSON.stringify({ motivo: reason })
      })

      // Update local state
      const updatedPets = userPets.map((pet) =>
        pet.id === petId
          ? { ...pet, completed: true, completionReason: reason, completedAt: new Date() }
          : pet
      )
      setUserPets(updatedPets)
      
      toast({
        title: 'Publicação finalizada!',
        description: 'Sua publicação foi marcada como finalizada com sucesso.',
      })
    } catch (error) {
      console.error('Erro ao finalizar publicação:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível finalizar a publicação.',
        variant: 'destructive'
      })
    }
  }

  const handleEditSighting = (sighting: any) => {
    setEditingSighting(sighting)
    setEditSightingDialogOpen(true)
  }

  const handleUpdateSighting = async (sighting: any) => {
    try {
      await apiFetch(`/api/avistamentos/${sighting.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ observacoes: sighting.description })
      })
      toast({ title: 'Sucesso', description: 'Avistamento atualizado.' })
      loadUserData()
    } catch (error) {
      console.error('Erro ao atualizar avistamento', error)
      toast({ title: 'Erro', description: 'Falha ao atualizar avistamento.', variant: 'destructive' })
    }
  }

  const handleDeleteSighting = (sightingId: string) => {
    setSightingToDelete(sightingId)
    setDeleteSightingDialogOpen(true)
  }

  const confirmDeleteSighting = async () => {
    if (!sightingToDelete) return
    try {
      await apiFetch(`/api/avistamentos/${sightingToDelete}`, {
        method: 'DELETE'
      })
      toast({ title: 'Sucesso', description: 'Avistamento removido.' })
      loadUserData()
    } catch (error) {
      console.error('Erro ao remover avistamento', error)
      toast({ title: 'Erro', description: 'Falha ao remover avistamento.', variant: 'destructive' })
    } finally {
      setDeleteSightingDialogOpen(false)
      setSightingToDelete(null)
    }
  }

  const handleViewSightings = (pet: Pet) => {
    setViewingSightingsPet(pet)
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

  const statusConfig = {
    lost: { label: 'Perdido', color: 'bg-red-500 text-white' },
    found: { label: 'Encontrado', color: 'bg-blue-500 text-white' },
    adoption: { label: 'Adoção', color: 'bg-green-500 text-white' },
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-teal-50 to-orange-50 pb-20">

      <main className="container mx-auto px-3 py-3 sm:px-4 sm:py-6 space-y-3 sm:space-y-6">
        <div className="mb-2.5 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/')}
            className="p-2 h-auto"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-base sm:text-xl font-bold">Meu Perfil</h1>
        </div>
        {/* User Info Card */}
        <Card>
          <CardContent className="p-3.5 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="flex items-center text-left gap-4 flex-1">
                <div className="flex-1 min-w-0 text-left">
                  <h2 className="text-xl sm:text-2xl font-bold mb-2 leading-tight">{user.name}</h2>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center gap-2 justify-start">
                      <Mail className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate text-muted-foreground text-xs sm:text-sm">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2 justify-start">
                      <Phone className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                      <span className="text-muted-foreground text-xs sm:text-sm">{user.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 justify-start">
                      <Calendar className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                      <span className="text-muted-foreground text-xs">
                        Membro desde {new Date(user.createdAt).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full sm:w-80 p-3 sm:p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-3 sm:grid-cols-3 gap-2.5 sm:gap-4 text-center">
                  <div className="flex flex-col items-center">
                    <div className="text-2xl sm:text-2xl font-bold text-teal-600">{userPets.length}</div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 leading-tight">Publicações</div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="text-2xl sm:text-2xl font-bold text-orange-600">{userSightings.length}</div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 leading-tight">Avistamentos</div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="text-2xl sm:text-2xl font-bold text-blue-600">
                      {userPets.reduce((sum, pet) => sum + pet.sightings.length, 0)}
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 leading-tight">Recebidos</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              <Button 
                variant="outline" 
                className="flex-1 h-9 text-xs sm:text-sm sm:h-10 px-2" 
                onClick={() => router.push('/profile/edit')}
                title="Editar Perfil"
              >
                <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
                Editar
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 h-9 text-xs sm:text-sm sm:h-10 px-2" 
                onClick={() => router.push('/profile/settings')}
                title="Configurações"
              >
                <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
                Config.
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 h-9 text-xs sm:text-sm sm:h-10 px-2 text-red-600 hover:text-red-700 hover:bg-red-50" 
                onClick={handleLogout}
                title="Sair"
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
                Sair
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Posts and Sightings */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="w-full h-9 sm:h-10">
            <TabsTrigger value="posts" className="flex-1 text-xs sm:text-base">
              <PawPrint className="w-4 h-4 mr-1.5" />
              <span className="hidden xs:inline sm:inline">Minhas </span>Publicações
            </TabsTrigger>
            <TabsTrigger value="sightings" className="flex-1 text-xs sm:text-base">
              <Eye className="w-4 h-4 mr-1.5" />
              Avistamentos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-2.5 mt-3">
            {userPets.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <PawPrint className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-muted-foreground mb-3 text-sm">Você ainda não criou nenhuma publicação</p>
                  <Button onClick={() => router.push('/new-pet')} className="h-9" size="sm">
                    Criar Publicação
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {userPets.map((pet) => (
                  <div key={pet.id} className="w-full">
                    <PetCard
                      pet={pet}
                      onViewSightings={handleViewSightings}
                      onReportSighting={() => {}}
                      onViewMap={() => {}}
                      isOwner={true}
                      onEdit={handleEditPet}
                      onComplete={handleCompletePet}
                      compactMode={true}
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sightings" className="space-y-2 mt-3">
            {isLoadingSightings ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">Carregando avistamentos...</p>
              </div>
            ) : userSightings.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Eye className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm mb-3">Você ainda não reportou nenhum avistamento</p>
                  <Button variant="outline" size="sm" onClick={loadUserData}>
                    Atualizar
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {userSightings.map((sighting) => (
                  <SightingCard
                    key={sighting.id}
                    sighting={sighting}
                    onEdit={handleEditSighting}
                    onDelete={handleDeleteSighting}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Settings and Logout removed from here */}
      </main>

      <CompletePetDialog
        pet={selectedPet}
        open={completePetDialogOpen}
        onOpenChange={setCompletePetDialogOpen}
        onComplete={handlePetCompletion}
      />

      <ViewSightingsDialog
        pet={viewingSightingsPet}
        open={!!viewingSightingsPet}
        onClose={() => setViewingSightingsPet(null)}
        isOwner={true}
      />

      <EditPetDialog
        pet={editingPet}
        open={editPetDialogOpen}
        onOpenChange={setEditPetDialogOpen}
        onSuccess={() => {
          loadUserData()
          setEditPetDialogOpen(false)
        }}
      />

      <EditSightingDialog
        sighting={editingSighting}
        open={editSightingDialogOpen}
        onClose={() => setEditSightingDialogOpen(false)}
        onSave={handleUpdateSighting}
      />

      <AlertDialog open={deleteSightingDialogOpen} onOpenChange={setDeleteSightingDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir avistamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O avistamento será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteSighting} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <MobileNav />
    </div>
  )
}
