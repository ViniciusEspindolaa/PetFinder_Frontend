"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as UIDialogDescription } from "@/components/ui/dialog"
import { apiFetch } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { Phone, Mail, MapPin, Clock, Edit2, Calendar, Users, Heart, Flag } from "lucide-react"
import { ReportDialog } from "@/components/report-dialog"

interface Evento {
  id: number
  titulo: string
  descricao: string
  fotos_urls: string[]
  endereco_texto: string
  data_hora_inicio: string
  data_hora_fim?: string
  status: string
  capacidade_max?: number
  vagas_ocupadas: number
  inscricoes?: { usuarioId: string }[]
  usuario: { id: string; nome: string; email: string }
}

interface EventoDetailDialogProps {
  id: number
  open: boolean
  onClose: () => void
  onUpdate?: () => void
}

export function EventoDetailDialog({ id, open, onClose, onUpdate }: EventoDetailDialogProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [evento, setEvento] = useState<Evento | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [isAttending, setIsAttending] = useState(false)
  const [loadingAttend, setLoadingAttend] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)

  useEffect(() => {
    if (open && id) {
      loadEvento()
    }
  }, [open, id])

  const loadEvento = async () => {
    try {
      setIsLoading(true)
      const data = await apiFetch(`/api/eventos/${id}`)
      setEvento(data)
      const attending = user && data.inscricoes ? data.inscricoes.some((i: any) => i.usuarioId === user.id) : false;
      setIsAttending(attending)
    } catch (error) {
      console.error("Erro ao carregar evento:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar o evento",
        variant: "destructive",
      })
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  const toggleAttend = async () => {
    if (!user) {
      toast({
        title: "Login Necessário",
        description: "Faça login para manifestar interesse.",
      })
      return
    }
    setLoadingAttend(true)
    try {
      const res = await apiFetch(`/api/eventos/${id}/inscricao`, { method: "POST" })
      setIsAttending(res.attending)
      if (evento) {
        setEvento({
          ...evento,
          inscricoes: res.attending 
            ? [...(evento.inscricoes || []), {usuarioId: user.id}] 
            : (evento.inscricoes || []).filter((i: any) => i.usuarioId !== user.id)
        });
      }
      if (onUpdate) onUpdate();
    } catch (error: any) {
      console.error(error)
      if (error?.status === 401) {
        toast({
          title: "Sessão Expirada",
          description: "Siga para a página de login e faça login novamente para curtir o evento.",
          variant: "destructive"
        })
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível curtir o evento.",
          variant: "destructive"
        })
      }
    } finally {
      setLoadingAttend(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl w-full max-h-[85vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl">{isLoading ? "Carregando..." : evento?.titulo}</DialogTitle>
          <UIDialogDescription className="sr-only">Detalhes do evento</UIDialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>
        ) : !evento ? (
          <div className="text-center p-12">
            <p className="text-muted-foreground">Evento não encontrado</p>
          </div>
        ) : (
          <div className="px-6 pb-6 space-y-6">
            {evento.fotos_urls && evento.fotos_urls.length > 0 && (
              <div className="w-full h-64 rounded-lg overflow-hidden bg-gray-100 mb-6">
                <img
                  src={evento.fotos_urls[0]}
                  alt={evento.titulo}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex flex-col gap-6">
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                      evento.status === 'AGENDADO' ? 'bg-blue-100 text-blue-800' :
                      evento.status === 'EM_ANDAMENTO' ? 'bg-green-100 text-green-800' :
                      evento.status === 'CONCLUIDO' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {evento.status.replace("_", " ")}
                    </span>
                    {(evento.vagas_ocupadas > 0 || (evento.capacidade_max && evento.capacidade_max > 0) || (evento.inscricoes && evento.inscricoes.length > 0)) && (
                      <div className="flex items-center gap-2 text-gray-600">
                        {evento.capacidade_max ? (
                          <>
                            <Users className="w-4 h-4 text-teal-600" />
                            <span>Vagas: {evento.inscricoes?.length || 0} / {evento.capacidade_max}</span>
                          </>
                        ) : (
                          <>
                            <Heart className="w-4 h-4 text-red-500 fill-current" />
                            <span>Curtidas: {evento.inscricoes?.length || 0}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold mb-2">Sobre o Evento</h2>
                    <p className="text-gray-600 whitespace-pre-wrap">{evento.descricao}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardContent className="p-4 space-y-4">
                    <h3 className="font-semibold text-lg">Informações Práticas</h3>

                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-0.5 text-teal-600 shrink-0" />
                        <span>{evento.endereco_texto}</span>
                      </div>

                      <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 mt-0.5 shrink-0 text-teal-600" />
                        <span>
                          {new Date(evento.data_hora_inicio).toLocaleDateString("pt-BR")}
                        </span>
                      </div>

                      <div className="flex items-start gap-2">
                        <Clock className="w-4 h-4 mt-0.5 shrink-0 text-teal-600" />
                        <span>
                          {new Date(evento.data_hora_inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          {evento.data_hora_fim && ` às ${new Date(evento.data_hora_fim).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 space-y-4">
                    <h3 className="font-semibold text-lg">Organizador</h3>
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium text-gray-900">{evento.usuario.nome}</p>
                      </div>
                    </div>
                    {user?.id === evento.usuario.id ? (
                      <div className="space-y-2">
                        <Button
                          className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                          onClick={() => {
                            onClose()
                            router.push(`/eventos/${evento.id}?edit=1`)
                          }}
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          Editar Evento
                        </Button>
                        <Button
                          className="w-full"
                          variant="outline"
                          onClick={() => {
                            onClose()
                            router.push(`/eventos/${evento.id}`)
                          }}
                        >
                          Ver página completa
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Button 
                          disabled={loadingAttend}
                          variant={isAttending ? "secondary" : "outline"}
                          className={`w-full ${isAttending ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'text-gray-600 hover:text-red-600'}`}
                          onClick={toggleAttend}
                        >
                          {isAttending ? (
                            <>
                              <Heart className="w-4 h-4 mr-2 fill-current" />
                              Curtiu
                            </>
                          ) : (
                            <>
                              <Heart className="w-4 h-4 mr-2" />
                              Curtir Evento
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full text-amber-700 border-amber-200 hover:bg-amber-50"
                          onClick={() => setReportOpen(true)}
                        >
                          <Flag className="w-4 h-4 mr-2" />
                          Denunciar Evento
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </DialogContent>

      {evento && (
        <ReportDialog
          target={{ type: 'evento', id: evento.id, titulo: evento.titulo }}
          open={reportOpen}
          onClose={() => setReportOpen(false)}
        />
      )}
    </Dialog>
  )
}