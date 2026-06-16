"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { apiFetch } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { Phone, Mail, MapPin, Clock, Star, Edit2, Calendar, CalendarPlus, Flag } from "lucide-react"
import { BookingDialog } from "@/components/booking-dialog"
import { VerifiedBadge } from "@/components/verified-badge"
import { ReportDialog } from "@/components/report-dialog"

interface Servico {
  id: number
  nome: string
  tipo: string
  descricao: string
  endereco_texto: string
  bairro?: string
  cidade?: string
  fotos_urls: string[]
  avaliacoes?: number
  total_avaliacoes?: number
  telefone?: string
  email?: string
  horario?: string
  oferece_agendamento?: boolean
  tipo_agendamento?: string
  valor_base?: number
  especies_atendidas?: string[]
  dias_funcionamento?: string[]
  hora_inicio?: string
  hora_fim?: string
  duracao_agendamento?: number
  atende_domicilio?: boolean
  taxa_domicilio?: number
  variacoes?: { nome: string; preco: number }[]
  prestador_verificado?: boolean
  identidade_verificada?: boolean
  publicado?: boolean
  usuario: {
    id: string
    nome: string
    email: string
    telefone: string
    foto_perfil?: string
    telefone_verificado?: boolean
    email_verificado?: boolean
  }
}

const tipoNome: Record<string, string> = {
  PET_SITTER: "Pet Sitter",
  DOG_WALKER: "Dog Walker",
  BANHO_TOSA: "Banho e Tosa",
  HOSPEDAGEM_CRECHE: "Hospedagem/Creche",
  ADESTRADOR: "Adestrador",
}

interface ServiceDetailDialogProps {
  id: number
  open: boolean
  onClose: () => void
}

export function ServiceDetailDialog({ id, open, onClose }: ServiceDetailDialogProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [servico, setServico] = useState<Servico | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [openBookingDialog, setOpenBookingDialog] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)

  useEffect(() => {
    if (open && id) {
      loadServico()
    }
  }, [open, id])

  const loadServico = async () => {
    try {
      setIsLoading(true)
      const data = await apiFetch(`/api/servicos/${id}`)
      setServico(data)
    } catch (error) {
      console.error("Erro ao carregar serviço:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar o serviço",
        variant: "destructive",
      })
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl w-full max-h-[85vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl">{isLoading ? "Carregando..." : servico?.nome}</DialogTitle>
          <DialogDescription className="sr-only">Detalhes do serviço</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>
        ) : !servico ? (
          <div className="text-center p-12">
            <p className="text-muted-foreground">Serviço não encontrado</p>
          </div>
        ) : (
          <div className="px-6 pb-6 space-y-6">
            {servico.fotos_urls && servico.fotos_urls.length > 0 && (
              <div className="w-full h-64 rounded-lg overflow-hidden bg-gray-100 mb-6">
                <img
                  src={servico.fotos_urls[0]}
                  alt={servico.nome}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex flex-col gap-6">
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-teal-100 text-teal-800 text-sm font-medium rounded-full">
                      {tipoNome[servico.tipo] || servico.tipo}
                    </span>
                    {servico.avaliacoes !== undefined && servico.total_avaliacoes !== undefined && servico.total_avaliacoes > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{Number(servico.avaliacoes).toFixed(1)}</span>
                        <span className="text-sm text-gray-500">({servico.total_avaliacoes} avaliações)</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold mb-2">Sobre o Serviço</h2>
                    <p className="text-gray-600 whitespace-pre-wrap">{servico.descricao}</p>
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
                        <span>
                          {servico.endereco_texto}
                          {(servico.bairro || servico.cidade) && (
                            <span className="block text-gray-500">
                              {[servico.bairro, servico.cidade].filter(Boolean).join(" - ")}
                            </span>
                          )}
                        </span>
                      </div>

                      {servico.horario && (
                        <div className="flex items-start gap-2">
                          <Clock className="w-4 h-4 mt-0.5 text-teal-600 shrink-0" />
                          <span>{servico.horario}</span>
                        </div>
                      )}

                      {(servico.telefone || servico.usuario.telefone) && (
                        <div className="flex items-start gap-2">
                          <Phone className="w-4 h-4 mt-0.5 text-teal-600 shrink-0" />
                          <span>{servico.telefone || servico.usuario.telefone}</span>
                        </div>
                      )}

                      {(servico.email || servico.usuario.email) && (
                        <div className="flex items-start gap-2">
                          <Mail className="w-4 h-4 mt-0.5 text-teal-600 shrink-0" />
                          <span className="break-all">{servico.email || servico.usuario.email}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 space-y-4">
                    <h3 className="font-semibold text-lg">Prestador do Serviço</h3>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-teal-100 overflow-hidden flex items-center justify-center text-teal-700 font-bold text-lg shrink-0">
                        {servico.usuario.foto_perfil ? (
                          <img src={servico.usuario.foto_perfil} alt="" className="w-full h-full object-cover" />
                        ) : (
                          servico.usuario.nome.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{servico.usuario.nome}</p>
                        <VerifiedBadge
                          contatoVerificado={servico.prestador_verificado}
                          identidadeVerificada={servico.identidade_verificada}
                        />
                      </div>
                    </div>
                    {user?.id === servico.usuario.id ? (
                      <div className="space-y-2">
                        <Button
                          className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                          onClick={() => {
                            onClose()
                            router.push(`/servicos/${servico.id}?edit=1`)
                          }}
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          Editar Serviço
                        </Button>
                        <Button
                          className="w-full"
                          variant="outline"
                          onClick={() => {
                            onClose()
                            router.push(`/servicos/${servico.id}`)
                          }}
                        >
                          Ver página completa
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Button
                          className="w-full bg-teal-600 hover:bg-teal-700"
                          onClick={() => {
                            if (!user) {
                              toast({
                                title: "Login Necessário",
                                description: "Faça login para contatar o prestador do serviço.",
                              })
                              router.push('/login')
                              return
                            }
                            const phone = servico.telefone || servico.usuario.telefone
                            if (phone) {
                              const phoneNumber = phone.replace(/\D/g, '')
                              window.open(`https://wa.me/55${phoneNumber}?text=Olá,%20tenho%20interesse%20no%20serviço%20${servico.nome}%20visto%20no%20PetFinder.`, '_blank')
                            }
                          }}
                        >
                          Vou Contatar o Fornecedor!
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full text-amber-700 border-amber-200 hover:bg-amber-50"
                          onClick={() => setReportOpen(true)}
                        >
                          <Flag className="w-4 h-4 mr-2" />
                          Denunciar Serviço
                        </Button>
                      </div>
                    )}

                    {servico.oferece_agendamento && user && user.id !== servico.usuario.id && (
                      <Button 
                        onClick={() => setOpenBookingDialog(true)}
                        className="w-full mt-2 bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        <CalendarPlus className="w-5 h-5 mr-2" />
                        Agendar Serviço ({servico.tipo_agendamento === "TURNO" ? "Por Turno" : "Por Horário"})
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
      {servico && servico.oferece_agendamento && (
        <BookingDialog
          servicoId={servico.id}
          servicoNome={servico.nome}
          ofereceAgendamento={servico.oferece_agendamento}
          tipoAgendamento={servico.tipo_agendamento}
          valorBase={servico.valor_base}
          horaInicio={servico.hora_inicio}
          horaFim={servico.hora_fim}
          duracao={servico.duracao_agendamento}
          diasFuncionamento={servico.dias_funcionamento}
          atendeDomicilio={servico.atende_domicilio}
          taxaDomicilio={servico.taxa_domicilio}
          variacoes={servico.variacoes}
          prestadorVerificado={servico.prestador_verificado}
          identidadeVerificada={servico.identidade_verificada}
          open={openBookingDialog}
          onOpenChange={setOpenBookingDialog}
        />
      )}
      {servico && (
        <ReportDialog
          target={{ type: 'servico', id: servico.id, titulo: servico.nome }}
          open={reportOpen}
          onClose={() => setReportOpen(false)}
        />
      )}
    </Dialog>
  )
}
