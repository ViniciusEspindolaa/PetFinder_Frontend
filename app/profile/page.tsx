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
import { ArrowLeft, Settings, LogOut, PawPrint, Eye, MapPin, Phone, Mail, Calendar, Edit, Briefcase, Edit2, ShieldCheck, ShieldAlert, EyeOff, Trash2 } from 'lucide-react'
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

interface VerificacaoStatus {
  telefone_verificado: boolean
  email_verificado: boolean
  foto_perfil: string | null
  contato_verificado: boolean
  identidade_verificada: boolean
  verificacao: { status: string } | null
}

export default function ProfilePage() {
  const { user, logout, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [userPets, setUserPets] = useState<Pet[]>([])
  const [userSightings, setUserSightings] = useState<any[]>([])
  const [userEventos, setUserEventos] = useState<any[]>([])
  const [userServicos, setUserServicos] = useState<any[]>([])
  const [verificacaoStatus, setVerificacaoStatus] = useState<VerificacaoStatus | null>(null)
  const [isLoadingEventos, setIsLoadingEventos] = useState(false)
  const [isLoadingServicos, setIsLoadingServicos] = useState(false)
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
  const [deleteServicoId, setDeleteServicoId] = useState<number | null>(null)
  const [togglingServicoId, setTogglingServicoId] = useState<number | null>(null)

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

      try {
        setIsLoadingEventos(true)
        const eventosRes: any = await apiFetch(`/api/eventos/usuario/${user.id}`)
        setUserEventos(eventosRes.eventos || eventosRes || [])
      } catch (error) {
        console.error("Failed to load user events", error)
      } finally {
        setIsLoadingEventos(false)
      }

      try {
        setIsLoadingServicos(true)
        const servicosRes: any = await apiFetch(`/api/servicos/usuario/${user.id}`)
        setUserServicos(Array.isArray(servicosRes) ? servicosRes : servicosRes.servicos || [])
      } catch (error) {
        console.error("Failed to load user services", error)
      } finally {
        setIsLoadingServicos(false)
      }

      try {
        const verRes = await apiFetch('/api/verificacao/status')
        setVerificacaoStatus(verRes)
      } catch (error) {
        console.error("Failed to load verification status", error)
      }
    }
  }

  useEffect(() => {
    loadUserData()
  }, [user?.id])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const handleToggleServico = async (servico: any) => {
    setTogglingServicoId(servico.id)
    try {
      const atualizado = await apiFetch(`/api/servicos/${servico.id}/toggle-publicado`, { method: "PATCH" })
      setUserServicos((prev) => prev.map((s) => (s.id === servico.id ? { ...s, ...atualizado } : s)))
      toast({ title: atualizado.publicado ? "Serviço ativado" : "Serviço desativado" })
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" })
    } finally {
      setTogglingServicoId(null)
    }
  }

  const handleDeleteServico = async () => {
    if (!deleteServicoId) return
    try {
      await apiFetch(`/api/servicos/${deleteServicoId}`, { method: "DELETE" })
      setUserServicos((prev) => prev.filter((s) => s.id !== deleteServicoId))
      toast({ title: "Serviço excluído" })
    } catch (err: any) {
      toast({ title: "Erro ao excluir", description: err.message, variant: "destructive" })
    } finally {
      setDeleteServicoId(null)
    }
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
    rescue: { label: 'SOS Resgate', color: 'bg-purple-600 animate-pulse text-white font-bold' }
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
                <div className="w-14 h-14 rounded-full bg-teal-600 flex items-center justify-center text-white text-xl font-bold shrink-0 select-none">
                  {getInitials(user.name)}
                </div>
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
                <div className="grid grid-cols-2 gap-2.5 mt-3 pt-3 border-t text-center">
                  <div className="flex flex-col items-center">
                    <div className="text-xl font-bold text-purple-600">{userEventos.length}</div>
                    <div className="text-[10px] text-muted-foreground">Eventos</div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="text-xl font-bold text-indigo-600">{userServicos.length}</div>
                    <div className="text-[10px] text-muted-foreground">Serviços</div>
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
          <TabsList className="w-full h-auto flex overflow-x-auto flex-nowrap gap-1 p-1 scrollbar-none">
            <TabsTrigger value="posts" className="shrink-0 text-xs sm:text-sm px-3">
              <PawPrint className="w-4 h-4 mr-1" />
              Publicações
            </TabsTrigger>
            <TabsTrigger value="sightings" className="shrink-0 text-xs sm:text-sm px-3">
              <Eye className="w-4 h-4 mr-1" />
              Avistamentos
            </TabsTrigger>
            <TabsTrigger value="eventos" className="shrink-0 text-xs sm:text-sm px-3">
              <Calendar className="w-4 h-4 mr-1" />
              Eventos
            </TabsTrigger>
            <TabsTrigger value="servicos" className="shrink-0 text-xs sm:text-sm px-3 relative">
              <Briefcase className="w-4 h-4 mr-1" />
              Serviços
              {verificacaoStatus && !verificacaoStatus.contato_verificado && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full" />
              )}
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

          <TabsContent value="eventos" className="space-y-2.5 mt-3">
            {isLoadingEventos ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">Carregando eventos...</p>
              </div>
            ) : userEventos.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-muted-foreground mb-3 text-sm">Você ainda não criou nenhum evento</p>
                  <Button onClick={() => router.push('/novo-evento')} className="h-9" size="sm">
                    Criar Evento
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {userEventos.map((evento: any) => (
                  <Card key={evento.id} className="overflow-hidden flex flex-col">
                    <div
                      className="w-full aspect-[4/3] bg-teal-50 flex items-center justify-center cursor-pointer overflow-hidden shrink-0"
                      onClick={() => router.push(`/eventos/${evento.id}`)}
                    >
                      {evento.fotos_urls?.[0] ? (
                        <img src={evento.fotos_urls[0]} alt={evento.titulo} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-4xl">📅</span>
                      )}
                    </div>
                    <CardContent className="p-2.5 flex flex-col gap-1.5 flex-1">
                      <h3 className="font-semibold text-xs leading-tight line-clamp-2">{evento.titulo}</h3>
                      <div className="flex items-center gap-1 text-[10px] text-gray-500">
                        <Calendar className="w-2.5 h-2.5 shrink-0" />
                        <span>{new Date(evento.data_hora_inicio).toLocaleDateString('pt-BR')}</span>
                      </div>
                      {evento.endereco_texto && (
                        <div className="flex items-center gap-1 text-[10px] text-gray-500">
                          <MapPin className="w-2.5 h-2.5 shrink-0" />
                          <span className="line-clamp-1">{evento.endereco_texto}</span>
                        </div>
                      )}
                      <div className="flex gap-1.5 mt-auto pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-7 text-[11px] px-2"
                          onClick={() => router.push(`/eventos/${evento.id}`)}
                        >
                          Ver
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 h-7 text-[11px] px-2 bg-teal-600 hover:bg-teal-700"
                          onClick={() => router.push(`/eventos/${evento.id}?edit=1`)}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="servicos" className="space-y-2.5 mt-3">
            {verificacaoStatus ? (
              verificacaoStatus.identidade_verificada ? (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-3 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-green-600 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-green-800">Prestador verificado</p>
                      <p className="text-xs text-green-700">Você pode oferecer serviços com atendimento em domicílio.</p>
                    </div>
                    <Button size="sm" variant="ghost" className="text-xs h-7 px-2 text-green-700" onClick={() => router.push('/prestador/verificacao')}>
                      Ver
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-amber-200 bg-amber-50">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-800">Complete sua verificação</p>
                        <p className="text-xs text-amber-700">
                          {!verificacaoStatus.contato_verificado
                            ? 'Necessária para publicar qualquer serviço na plataforma.'
                            : 'Necessária para serviços com atendimento em domicílio.'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3 text-xs">
                      {[
                        { label: 'Foto', done: !!verificacaoStatus.foto_perfil },
                        { label: 'Telefone', done: verificacaoStatus.telefone_verificado },
                        { label: 'E-mail', done: verificacaoStatus.email_verificado },
                        { label: 'Identidade', done: verificacaoStatus.identidade_verificada, inProgress: verificacaoStatus.verificacao?.status === 'EM_ANALISE' },
                      ].map(({ label, done, inProgress }) => (
                        <span key={label} className={done ? 'text-green-600 font-medium' : inProgress ? 'text-blue-600' : 'text-muted-foreground'}>
                          {done ? '✓' : inProgress ? '…' : '○'} {label}
                        </span>
                      ))}
                    </div>
                    <Button size="sm" className="w-full h-8 text-xs bg-amber-600 hover:bg-amber-700" onClick={() => router.push('/prestador/verificacao')}>
                      Ir para verificação
                    </Button>
                  </CardContent>
                </Card>
              )
            ) : (
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => router.push('/prestador/verificacao')}>
                Verificação de prestador
              </Button>
            )}
            <div className="flex justify-end">
              <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={() => router.push('/admin/verificacoes')}>
                Painel admin
              </Button>
            </div>
            {isLoadingServicos ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">Carregando serviços...</p>
              </div>
            ) : userServicos.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-muted-foreground mb-3 text-sm">Você ainda não cadastrou nenhum serviço</p>
                  <Button onClick={() => router.push('/novo-servico')} className="h-9" size="sm">
                    Cadastrar Serviço
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {userServicos.map((servico: any) => (
                  <Card key={servico.id} className="overflow-hidden flex flex-col">
                    <div
                      className="w-full aspect-[4/3] bg-teal-50 flex items-center justify-center cursor-pointer overflow-hidden shrink-0 relative"
                      onClick={() => router.push(`/servicos/${servico.id}`)}
                    >
                      {servico.fotos_urls?.[0] ? (
                        <img src={servico.fotos_urls[0]} alt={servico.nome} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-4xl">🏪</span>
                      )}
                      <span className={`absolute top-1.5 right-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${servico.publicado ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}`}>
                        {servico.publicado ? 'Ativo' : 'Oculto'}
                      </span>
                    </div>
                    <CardContent className="p-2.5 flex flex-col gap-1 flex-1">
                      <h3 className="font-semibold text-xs leading-tight line-clamp-2">{servico.nome}</h3>
                      {!servico.publicado && servico.motivo_nao_publicado && (
                        <p className="text-[9px] text-amber-700 line-clamp-1">{servico.motivo_nao_publicado}</p>
                      )}
                      {servico.cidade && (
                        <div className="flex items-center gap-1 text-[10px] text-gray-500">
                          <MapPin className="w-2.5 h-2.5 shrink-0" />
                          <span className="line-clamp-1">{servico.bairro ? `${servico.bairro}, ` : ''}{servico.cidade}</span>
                        </div>
                      )}
                      <div className="flex gap-1 mt-auto pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-7 text-[11px] px-1"
                          title="Ver serviço"
                          onClick={() => router.push(`/servicos/${servico.id}`)}
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 h-7 px-1 bg-teal-600 hover:bg-teal-700"
                          title="Editar"
                          onClick={() => router.push(`/servicos/${servico.id}?edit=1`)}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-7 px-1"
                          title={servico.publicado ? "Ocultar" : "Ativar"}
                          disabled={togglingServicoId === servico.id}
                          onClick={() => handleToggleServico(servico)}
                        >
                          <EyeOff className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-7 px-1 text-red-500 hover:text-red-600 hover:border-red-300"
                          title="Excluir"
                          onClick={() => setDeleteServicoId(servico.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
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

      <AlertDialog open={deleteServicoId !== null} onOpenChange={(open) => { if (!open) setDeleteServicoId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir serviço?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é permanente. O serviço será removido e não poderá ser recuperado.
              Agendamentos ativos precisam ser cancelados antes da exclusão.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteServico} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <MobileNav />
    </div>
  )
}
