"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'
import { ArrowLeft, Maximize2 } from 'lucide-react'
import { InteractiveMap as InteractiveMapClient } from '@/components/interactive-map.client'
import { ContactDialog } from '@/components/contact-dialog'
import { SightingDialog } from '@/components/sighting-dialog'
import { ImageDialog } from '@/components/image-dialog'
import { Pet, Sighting } from '@/lib/types'
import { apiFetch } from '@/lib/api'
import { mapPublicacaoToPet } from '@/lib/api-mappers'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/hooks/use-toast'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function PetShowPage() {
  const router = useRouter()
  const params = useParams()
  const petId = params.id as string
  const { user } = useAuth()
  const { toast } = useToast()

  const [pet, setPet] = useState<Pet | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [contactOpen, setContactOpen] = useState(false)
  const [sightingOpen, setSightingOpen] = useState(false)
  const [imageOpen, setImageOpen] = useState(false)

  useEffect(() => {
    async function loadPet() {
      setIsLoading(true)
      try {
        const data = await apiFetch(`/api/publicacoes/${petId}`)
        const mapped = mapPublicacaoToPet(data)
        setPet(mapped)
      } catch (error) {
        console.error('Erro ao carregar pet:', error)
        setPet(null)
      } finally {
        setIsLoading(false)
      }
    }

    if (petId) {
      loadPet()
    }
  }, [petId])

  const statusConfig: Record<string, { label: string; color: string }> = {
    lost: { label: 'Perdido', color: 'bg-red-500 text-white' },
    found: { label: 'Encontrado', color: 'bg-blue-500 text-white' },
    adoption: { label: 'Adoção', color: 'bg-green-500 text-white' },
  }

  const typeConfig: Record<string, string> = {
    dog: 'Cachorro',
    cat: 'Gato',
    other: 'Outro',
  }

  const handleSightingSubmit = async (sightingData: Omit<Sighting, 'id' | 'petId' | 'createdAt'>) => {
    if (!user) {
      toast({ title: 'Login necessário', description: 'Você precisa estar logado para reportar um avistamento.', variant: 'destructive' })
      router.push('/login')
      return
    }

    try {
      // Combine date and time
      const sightingDate = new Date(sightingData.date)
      const [hours, minutes] = sightingData.time.split(':')
      sightingDate.setHours(parseInt(hours), parseInt(minutes))

      await apiFetch('/api/avistamentos', {
        method: 'POST',
        body: JSON.stringify({
          publicacaoId: Number(petId),
          usuarioId: user.id,
          observacoes: sightingData.description,
          fotos_urls: [], // TODO: Adicionar suporte a fotos no dialog
          latitude: sightingData.location.lat,
          longitude: sightingData.location.lng,
          endereco_texto: sightingData.location.address,
          data_avistamento: sightingDate.toISOString()
        })
      })

      toast({ title: 'Avistamento registrado', description: 'O dono do pet será notificado.' })
      setSightingOpen(false)
      // Recarregar dados do pet para mostrar novo avistamento
      const data = await apiFetch(`/api/publicacoes/${petId}`)
      setPet(mapPublicacaoToPet(data))
    } catch (error) {
      console.error('Erro ao registrar avistamento:', error)
      toast({ title: 'Erro', description: 'Não foi possível registrar o avistamento.', variant: 'destructive' })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando detalhes...</p>
        </div>
      </div>
    )
  }

  if (!pet) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Publicação não encontrada</h2>
          <p className="text-sm text-muted-foreground mt-2">Este anúncio não existe ou foi removido.</p>
          <div className="mt-4 flex justify-center">
            <Button variant="outline" onClick={() => router.push('/')}>
              Voltar
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-orange-50 pb-6">

      <main className="container mx-auto px-3 py-4 sm:px-4 sm:py-6 max-w-3xl">
        <div className="mb-3 flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="p-2 h-auto">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-base sm:text-xl font-bold">{pet.name || typeConfig[pet.type] || pet.type}</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Detalhes da publicação</p>
          </div>
        </div>
        <div className="space-y-4">
          <div 
            className="w-full h-48 sm:h-64 relative rounded-lg overflow-hidden bg-gray-100 cursor-zoom-in group"
            onClick={() => setImageOpen(true)}
          >
            <Image 
              src={pet.photoUrl || '/placeholder.svg'} 
              alt={pet.name || 'Pet'} 
              fill 
              className="object-contain transition-transform group-hover:scale-105" 
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <Maximize2 className="w-8 h-8 text-white drop-shadow-lg" />
            </div>
          </div>

          <Card>
            <CardContent>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`${statusConfig[pet.status].color} inline-flex items-center rounded-full text-[12px] px-2 py-0.5`}>
                  {statusConfig[pet.status].label}
                </span>
                {pet.reward && <span className="inline-flex items-center rounded-full bg-amber-500 text-white text-[12px] px-2 py-0.5">R$ {pet.reward}</span>}
                {pet.completed && <span className="inline-flex items-center rounded-full bg-gray-700 text-white text-[12px] px-2 py-0.5">Finalizado</span>}
              </div>

              {pet.description && (
                <div className="mb-4">
                  <h4 className="font-semibold mb-1">Descrição</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{pet.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold">Informações</h4>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                    {pet.name && <li><strong>Nome:</strong> {pet.name}</li>}
                    <li><strong>Tipo:</strong> {typeConfig[pet.type] || pet.type}</li>
                    {pet.age && <li><strong>Idade:</strong> {pet.age}</li>}
                    <li><strong>Cidade:</strong> {pet.location.city}</li>
                    {pet.location.neighborhood && <li><strong>Bairro:</strong> {pet.location.neighborhood}</li>}
                    <li><strong>Endereço:</strong> {pet.location.address}</li>
                    <li><strong>Última vista:</strong> {new Date(pet.lastSeenDate).toLocaleString('pt-BR')}</li>
                    <li><strong>Criado em:</strong> {new Date(pet.createdAt).toLocaleString('pt-BR')}</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold">Contato</h4>
                  <p className="text-sm text-muted-foreground mt-2">{pet.contactName} — {pet.contactPhone}</p>

                  {pet.status === 'lost' && (
                    <>
                      <h4 className="font-semibold mt-4">Avistamentos</h4>
                      <div className="text-sm text-muted-foreground mt-2 space-y-2 max-h-40 overflow-auto">
                        {pet.sightings.length === 0 && <p>Nenhum avistamento registrado.</p>}
                        {pet.sightings.map((s) => (
                          <div key={s.id} className="border rounded px-2 py-1">
                            <div className="text-xs text-muted-foreground"><strong>{new Date(s.date).toLocaleDateString('pt-BR')}</strong> {s.time}</div>
                            <div className="text-xs text-muted-foreground">Reportado {formatDistanceToNow(new Date(s.createdAt), { addSuffix: true, locale: ptBR })}</div>
                            <div className="text-sm">{s.description}</div>
                            <div className="text-xs text-muted-foreground">{s.reporterName} — {s.reporterPhone}</div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="pt-4 flex gap-2">
                {pet.status === 'lost' && (
                  <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => setSightingOpen(true)}>
                    Avistar
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => setContactOpen(true)}>
                  Contatar
                </Button>
                <Button size="sm" variant="outline" onClick={() => navigator.clipboard?.writeText(window.location.href)}>
                  Copiar link
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="w-full h-60 sm:h-96">
            <InteractiveMapClient pets={[pet]} selectedPetId={pet.id} onPetSelect={() => {}} />
          </div>
        </div>
      </main>

      <ContactDialog pet={pet} open={contactOpen} onClose={() => setContactOpen(false)} />
      <SightingDialog pet={pet} open={sightingOpen} onClose={() => setSightingOpen(false)} onSubmit={handleSightingSubmit} />
      
      <ImageDialog
        src={pet.photoUrl || '/placeholder.svg'}
        alt={pet.name || 'Pet'}
        open={imageOpen}
        onClose={() => setImageOpen(false)}
      />
    </div>
  )
}
