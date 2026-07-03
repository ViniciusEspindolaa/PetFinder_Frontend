"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { apiFetch } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import {
  Phone, Mail, MapPin, Clock, Star, Edit2, CalendarPlus, Flag,
  ExternalLink, Home, PawPrint, Users, CheckCircle, AlertCircle,
} from "lucide-react"
import { BookingDialog } from "@/components/booking-dialog"
import { VerifiedBadge } from "@/components/verified-badge"
import { ReportDialog } from "@/components/report-dialog"

interface Variacao { nome: string; preco: number }

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
  link_rede_social?: string
  horario?: string
  oferece_agendamento?: boolean
  tipo_agendamento?: string
  valor_base?: number
  variacoes?: Variacao[]
  especies_atendidas?: string[]
  dias_funcionamento?: string[]
  hora_inicio?: string
  hora_fim?: string
  duracao_agendamento?: number
  horarios_bloqueados?: string[]
  capacidade_por_slot?: number
  vagas_disponiveis?: number | null
  atende_domicilio?: boolean
  taxa_domicilio?: number
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
  HOSPEDAGEM_CRECHE: "Hospedagem / Creche",
  ADESTRADOR: "Adestrador",
  VETERINARIO: "Veterinário",
  PET_SHOP: "Pet Shop",
  TREINADOR: "Treinador",
  PASSEADOR: "Passeador",
  HOSPEDAGEM: "Hospedagem",
  GROOMING: "Grooming",
  OUTROS: "Outros",
}

const tipoColor: Record<string, string> = {
  PET_SITTER: "bg-pink-100 text-pink-800",
  DOG_WALKER: "bg-orange-100 text-orange-800",
  BANHO_TOSA: "bg-purple-100 text-purple-800",
  HOSPEDAGEM_CRECHE: "bg-blue-100 text-blue-800",
  ADESTRADOR: "bg-green-100 text-green-800",
  VETERINARIO: "bg-red-100 text-red-800",
  PET_SHOP: "bg-yellow-100 text-yellow-800",
}

const especieNome: Record<string, string> = {
  CACHORRO: "Cachorro",
  GATO: "Gato",
  OUTRO: "Outros",
}

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

interface ServiceDetailDialogProps {
  id: number
  open: boolean
  onClose: () => void
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  )
}

export function ServiceDetailDialog({ id, open, onClose }: ServiceDetailDialogProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [servico, setServico] = useState<Servico | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [openBookingDialog, setOpenBookingDialog] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [fotoIdx, setFotoIdx] = useState(0)

  useEffect(() => {
    if (open && id) {
      setFotoIdx(0)
      loadServico()
    }
  }, [open, id])

  const loadServico = async () => {
    try {
      setIsLoading(true)
      const data = await apiFetch(`/api/servicos/${id}`)
      setServico(data)
    } catch {
      toast({ title: "Erro", description: "Não foi possível carregar o serviço", variant: "destructive" })
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  const isHospedagem = servico?.tipo === "HOSPEDAGEM_CRECHE"
  const isVagas = servico?.tipo_agendamento === "VAGAS"
  const lotado = isVagas && servico?.vagas_disponiveis === 0

  const diasLabel = (servico?.dias_funcionamento ?? [])
    .map((d) => DIAS[parseInt(d)])
    .filter(Boolean)
    .join(", ")

  const horarioLabel = (() => {
    const hi = servico?.hora_inicio
    const hf = servico?.hora_fim
    if (!hi || !hf) return null
    if (hi === "00:00" && hf === "23:59") return "24 horas"
    return `${hi} – ${hf}`
  })()

  const precoMin = (() => {
    const base = servico?.valor_base
    const variacoes = servico?.variacoes ?? []
    if (!base && variacoes.length === 0) return null
    const precos = [base, ...variacoes.map((v) => v.preco)].filter((p): p is number => p != null)
    return Math.min(...precos)
  })()

  const isOwner = user?.id === servico?.usuario?.id

  const handleWhatsApp = () => {
    if (!user) {
      toast({ title: "Login necessário", description: "Faça login para contatar o prestador." })
      router.push("/login")
      return
    }
    const phone = (servico?.telefone || servico?.usuario?.telefone || "").replace(/\D/g, "")
    if (phone) window.open(`https://wa.me/55${phone}?text=Olá,%20tenho%20interesse%20no%20serviço%20${servico?.nome}%20visto%20no%20PetFinder.`, "_blank")
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="max-w-lg w-full max-h-[90vh] overflow-y-auto p-0 gap-0">
          <DialogHeader className="sr-only">
            <DialogTitle>{isLoading ? "Carregando..." : servico?.nome}</DialogTitle>
            <DialogDescription>Detalhes do serviço</DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex justify-center p-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
            </div>
          ) : !servico ? (
            <div className="text-center p-12 text-muted-foreground">Serviço não encontrado</div>
          ) : (
            <>
              {/* Foto */}
              {servico.fotos_urls && servico.fotos_urls.length > 0 ? (
                <div className="relative w-full h-52 bg-gray-100 overflow-hidden">
                  <img
                    src={servico.fotos_urls[fotoIdx]}
                    alt={servico.nome}
                    className="w-full h-full object-cover"
                  />
                  {servico.fotos_urls.length > 1 && (
                    <div className="absolute bottom-2 right-2 flex gap-1">
                      {servico.fotos_urls.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setFotoIdx(i)}
                          className={`w-2 h-2 rounded-full transition-colors ${i === fotoIdx ? "bg-white" : "bg-white/50"}`}
                        />
                      ))}
                    </div>
                  )}
                  <Badge className={`absolute top-3 left-3 ${tipoColor[servico.tipo] || "bg-gray-100 text-gray-800"}`}>
                    {tipoNome[servico.tipo] || servico.tipo}
                  </Badge>
                  {precoMin != null && (
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-teal-700 font-bold text-sm px-2.5 py-1 rounded-full shadow">
                      A partir de R$ {precoMin.toFixed(2)}
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-32 flex items-center justify-center bg-gradient-to-br from-teal-50 to-orange-50">
                  <span className="text-5xl">🏪</span>
                </div>
              )}

              <div className="p-5 space-y-5">
                {/* Cabeçalho */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-xl font-bold leading-tight">{servico.nome}</h2>
                    {servico.avaliacoes != null && (servico.total_avaliacoes ?? 0) > 0 && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold text-sm">{Number(servico.avaliacoes).toFixed(1)}</span>
                        <span className="text-xs text-gray-400">({servico.total_avaliacoes})</span>
                      </div>
                    )}
                  </div>
                  <VerifiedBadge
                    contatoVerificado={servico.prestador_verificado}
                    identidadeVerificada={servico.identidade_verificada}
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{servico.descricao}</p>
                </div>

                <hr />

                {/* Preços e Pacotes */}
                {(servico.valor_base != null || (servico.variacoes && servico.variacoes.length > 0)) && (
                  <Section title="Preços e Pacotes">
                    <div className="space-y-1.5">
                      {servico.valor_base != null && (
                        <div className="flex items-center justify-between bg-teal-50 border border-teal-100 rounded-lg px-3 py-2">
                          <span className="text-sm font-medium text-teal-800">Serviço base</span>
                          <span className="text-sm font-bold text-teal-700">R$ {Number(servico.valor_base).toFixed(2)}</span>
                        </div>
                      )}
                      {servico.variacoes && servico.variacoes.length > 0 && (
                        <div className="divide-y divide-gray-100 border rounded-lg overflow-hidden">
                          {servico.variacoes.map((v, i) => (
                            <div key={i} className="flex items-center justify-between px-3 py-2 bg-white hover:bg-gray-50">
                              <span className="text-sm text-gray-700">{v.nome}</span>
                              <span className="text-sm font-semibold text-gray-900">R$ {Number(v.preco).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Section>
                )}

                {/* Horário de Funcionamento */}
                {(diasLabel || horarioLabel || servico.horario) && (
                  <Section title="Horário de Funcionamento">
                    <div className="bg-gray-50 border rounded-lg p-3 space-y-1.5 text-sm">
                      {diasLabel && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-teal-600 shrink-0" />
                          <span className="text-gray-700">{diasLabel}</span>
                        </div>
                      )}
                      {horarioLabel && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-teal-600 shrink-0 opacity-0" />
                          <span className="font-medium text-gray-900">{horarioLabel}</span>
                        </div>
                      )}
                      {!horarioLabel && servico.horario && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-teal-600 shrink-0 opacity-0" />
                          <span className="text-gray-700">{servico.horario}</span>
                        </div>
                      )}
                    </div>

                    {/* Vagas para HOSPEDAGEM_CRECHE */}
                    {isHospedagem && (
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                        lotado
                          ? "bg-red-50 border border-red-200 text-red-700"
                          : "bg-green-50 border border-green-200 text-green-700"
                      }`}>
                        {lotado ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
                        {lotado
                          ? "Lotado — sem vagas no momento"
                          : servico.vagas_disponiveis != null
                            ? `${servico.vagas_disponiveis} ${servico.vagas_disponiveis === 1 ? "vaga disponível" : "vagas disponíveis"}`
                            : "Vagas disponíveis"}
                      </div>
                    )}
                  </Section>
                )}

                {/* Agendamento */}
                {servico.oferece_agendamento && !isVagas && (
                  <Section title="Agendamento">
                    <div className="bg-gray-50 border rounded-lg p-3 space-y-1 text-sm text-gray-700">
                      <p>
                        <span className="font-medium">Tipo:</span>{" "}
                        {servico.tipo_agendamento === "TURNO" ? "Por turno (manhã / tarde / noite)" : "Por horário"}
                      </p>
                      {servico.duracao_agendamento && servico.tipo_agendamento !== "TURNO" && (
                        <p>
                          <span className="font-medium">Duração por sessão:</span> {servico.duracao_agendamento} min
                        </p>
                      )}
                      {servico.capacidade_por_slot && servico.capacidade_por_slot > 1 && (
                        <p>
                          <span className="font-medium">Atendimentos simultâneos:</span> até {servico.capacidade_por_slot}
                        </p>
                      )}
                    </div>
                  </Section>
                )}

                {/* Espécies atendidas */}
                {servico.especies_atendidas && servico.especies_atendidas.length > 0 && (
                  <Section title="Espécies Atendidas">
                    <div className="flex gap-2 flex-wrap">
                      {servico.especies_atendidas.map((e) => (
                        <div key={e} className="flex items-center gap-1.5 bg-orange-50 border border-orange-100 text-orange-700 text-sm px-3 py-1 rounded-full">
                          <PawPrint className="w-3.5 h-3.5" />
                          {especieNome[e] || e}
                        </div>
                      ))}
                    </div>
                  </Section>
                )}

                {/* Atendimento em domicílio */}
                {servico.atende_domicilio && (
                  <Section title="Atendimento em Domicílio">
                    <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-sm">
                      <Home className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="text-blue-800">
                        Disponível
                        {servico.taxa_domicilio
                          ? ` · Taxa: R$ ${Number(servico.taxa_domicilio).toFixed(2)}`
                          : " · Sem taxa adicional"}
                      </span>
                    </div>
                  </Section>
                )}

                {/* Localização e Contato */}
                <Section title="Localização e Contato">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2 text-gray-700">
                      <MapPin className="w-4 h-4 mt-0.5 text-teal-600 shrink-0" />
                      <span>
                        {servico.endereco_texto}
                        {(servico.bairro || servico.cidade) && (
                          <span className="block text-gray-500 text-xs mt-0.5">
                            {[servico.bairro, servico.cidade].filter(Boolean).join(" — ")}
                          </span>
                        )}
                      </span>
                    </div>
                    {(servico.telefone || servico.usuario.telefone) && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Phone className="w-4 h-4 text-teal-600 shrink-0" />
                        <span>{servico.telefone || servico.usuario.telefone}</span>
                      </div>
                    )}
                    {(servico.email || servico.usuario.email) && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Mail className="w-4 h-4 text-teal-600 shrink-0" />
                        <span className="break-all">{servico.email || servico.usuario.email}</span>
                      </div>
                    )}
                  </div>
                </Section>

                {/* Prestador */}
                <Section title="Prestador">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-teal-100 overflow-hidden flex items-center justify-center text-teal-700 font-bold text-lg shrink-0">
                      {servico.usuario.foto_perfil ? (
                        <img src={servico.usuario.foto_perfil} alt="" className="w-full h-full object-cover" />
                      ) : (
                        servico.usuario.nome.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{servico.usuario.nome}</p>
                      <VerifiedBadge
                        contatoVerificado={servico.prestador_verificado}
                        identidadeVerificada={servico.identidade_verificada}
                      />
                    </div>
                  </div>

                  {isOwner ? (
                    <div className="space-y-2">
                      <Button
                        className="w-full bg-teal-600 hover:bg-teal-700"
                        onClick={() => { onClose(); router.push(`/servicos/${servico.id}?edit=1`) }}
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Editar Serviço
                      </Button>
                      <Button variant="outline" className="w-full" onClick={() => { onClose(); router.push(`/servicos/${servico.id}`) }}>
                        Ver página completa
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(servico.telefone || servico.usuario.telefone) && (
                        <Button className="w-full bg-teal-600 hover:bg-teal-700" onClick={handleWhatsApp}>
                          <Phone className="w-4 h-4 mr-2" />
                          Contatar via WhatsApp
                        </Button>
                      )}

                      {servico.link_rede_social && (
                        <Button
                          variant="outline"
                          className="w-full border-teal-200 text-teal-700 hover:bg-teal-50"
                          onClick={() => {
                            const url = servico.link_rede_social?.startsWith("http") ? servico.link_rede_social : `https://${servico.link_rede_social}`
                            window.open(url, "_blank")
                          }}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Ver Portfólio / Redes Sociais
                        </Button>
                      )}

                      {servico.oferece_agendamento && user && (
                        <Button
                          className="w-full bg-orange-600 hover:bg-orange-700"
                          disabled={lotado}
                          onClick={() => setOpenBookingDialog(true)}
                        >
                          <CalendarPlus className="w-4 h-4 mr-2" />
                          {lotado ? "Sem vagas disponíveis" : isVagas ? "Fazer Reserva" : `Agendar${servico.tipo_agendamento === "TURNO" ? " por Turno" : " por Horário"}`}
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        className="w-full text-xs text-gray-400 hover:text-red-600 hover:bg-red-50 h-8"
                        onClick={() => setReportOpen(true)}
                      >
                        <Flag className="w-3.5 h-3.5 mr-1.5" />
                        Denunciar Serviço
                      </Button>
                    </div>
                  )}
                </Section>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

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
          horariosBloqueados={servico.horarios_bloqueados}
          vagasDisponiveis={servico.vagas_disponiveis}
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
          target={{ type: "servico", id: servico.id, titulo: servico.nome }}
          open={reportOpen}
          onClose={() => setReportOpen(false)}
        />
      )}
    </>
  )
}
