import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Phone, Mail, Star, ExternalLink, CalendarPlus, Clock } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { VerifiedBadge } from '@/components/verified-badge'
import { ServiceDetailDialog } from "@/components/service-detail-dialog"
import { BookingDialog } from "@/components/booking-dialog"

interface ServiceCardProps {
  id: number
  nome: string
  tipo: string
  descricao: string
  endereco_texto: string
  cidade?: string
  bairro?: string
  fotos_urls: string[]
  avaliacoes?: number
  total_avaliacoes?: number
  telefone?: string
  oferece_agendamento?: boolean
  tipo_agendamento?: string
  valor_base?: number
  variacoes?: { nome: string; preco: number }[]
  hora_inicio?: string
  hora_fim?: string
  duracao_agendamento?: number
  dias_funcionamento?: string[]
  horarios_bloqueados?: string[]
  vagas_disponiveis?: number | null
  taxa_domicilio?: number
  usuario?: {
    email: string
    telefone_verificado?: boolean
    email_verificado?: boolean
    foto_perfil?: string
    verificacaoPrestador?: { status: string }
  }
  prestador_verificado?: boolean
  identidade_verificada?: boolean
  publicado?: boolean
  atende_domicilio?: boolean
  link_rede_social?: string
}

const tipoNome: Record<string, string> = {
  PET_SITTER: "Pet Sitter",
  DOG_WALKER: "Dog Walker",
  BANHO_TOSA: "Banho e Tosa",
  HOSPEDAGEM_CRECHE: "Hospedagem/Creche",
  ADESTRADOR: "Adestrador",
}

const tipoColor: Record<string, string> = {
  PET_SITTER: "bg-pink-100 text-pink-800",
  DOG_WALKER: "bg-orange-100 text-orange-800",
  BANHO_TOSA: "bg-purple-100 text-purple-800",
  HOSPEDAGEM_CRECHE: "bg-blue-100 text-blue-800",
  ADESTRADOR: "bg-green-100 text-green-800",
}

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

export function ServiceCard(props: ServiceCardProps) {
  const [detailOpen, setDetailOpen] = useState(false)
  const [bookingOpen, setBookingOpen] = useState(false)
  const { toast } = useToast()

  const precoMin = (() => {
    const base = props.valor_base
    const variacoes = props.variacoes ?? []
    if (base == null && variacoes.length === 0) return null
    const precos = [base, ...variacoes.map((v) => v.preco)].filter((p): p is number => p != null)
    return Math.min(...precos)
  })()

  const horarioLabel = (() => {
    const hi = props.hora_inicio
    const hf = props.hora_fim
    if (!hi || !hf) return null
    if (hi === "00:00" && hf === "23:59") return "24h"
    return `${hi}–${hf}`
  })()

  const isHospedagem = props.tipo === "HOSPEDAGEM_CRECHE"
  const lotado = isHospedagem && props.vagas_disponiveis === 0

  return (
    <>
    <Card 
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => setDetailOpen(true)}
    >
      <div className="aspect-video bg-gray-100 overflow-hidden relative">
        {props.fotos_urls && props.fotos_urls.length > 0 ? (
          <img
            src={props.fotos_urls[0]}
            alt={props.nome}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-100 to-orange-100">
            <span className="text-2xl">🏪</span>
          </div>
        )}
        <Badge className={`absolute top-2 right-2 ${tipoColor[props.tipo] || tipoColor.OUTROS}`}>
          {tipoNome[props.tipo] || props.tipo}
        </Badge>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-lg line-clamp-1">{props.nome}</h3>
          <VerifiedBadge
            contatoVerificado={props.prestador_verificado}
            identidadeVerificada={props.identidade_verificada}
            className="mt-1"
          />
          <p className="text-sm text-gray-600 line-clamp-2 mt-1">{props.descricao}</p>
        </div>

        {props.avaliacoes !== undefined && props.total_avaliacoes !== undefined && props.total_avaliacoes > 0 && (
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-semibold">
              {Number(props.avaliacoes).toFixed(1)}
            </span>
            <span className="text-xs text-gray-500">({props.total_avaliacoes})</span>
          </div>
        )}

        {/* Preço e horário */}
        <div className="flex flex-wrap gap-1.5">
          {precoMin != null && (
            <span className="text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-100 px-2 py-0.5 rounded-full">
              A partir de R$ {precoMin.toFixed(2)}
            </span>
          )}
          {horarioLabel && (
            <span className="text-xs bg-gray-50 text-gray-600 border border-gray-100 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {horarioLabel}
            </span>
          )}
          {lotado && (
            <span className="text-xs font-semibold bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-full">
              Lotado
            </span>
          )}
          {isHospedagem && !lotado && props.vagas_disponiveis != null && props.vagas_disponiveis > 0 && (
            <span className="text-xs bg-green-50 text-green-700 border border-green-100 px-2 py-0.5 rounded-full">
              {props.vagas_disponiveis} vagas
            </span>
          )}
        </div>

        <div className="space-y-1 text-sm text-gray-600">
          {props.cidade && props.bairro && (
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-teal-600" />
              <span>
                {props.bairro}, {props.cidade}
              </span>
            </div>
          )}
          {props.telefone && (
            <div className="flex items-start gap-2">
              <Phone className="w-4 h-4 mt-0.5 shrink-0 text-teal-600" />
              <span>{props.telefone}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {props.telefone || props.usuario?.email ? (
            <Button
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-xs h-8"
              onClick={(e) => {
                e.stopPropagation();
                if (props.telefone) {
                   window.open(`https://wa.me/55${props.telefone.replace(/\D/g, '')}`, '_blank');
                } else if (props.usuario?.email) {
                   window.open(`mailto:${props.usuario.email}?subject=Contato sobre serviço: ${props.nome}`, '_blank');
                }
              }}
            >
              {props.telefone ? <Phone className="w-3 h-3 mr-1" /> : <Mail className="w-3 h-3 mr-1" />}
              Contatar
            </Button>
          ) : null}

          {props.link_rede_social && (
            <Button
              variant="outline"
              className="flex-1 text-xs h-8 border-teal-600 text-teal-700 hover:bg-teal-50"
              onClick={(e) => {
                e.stopPropagation();
                const url = props.link_rede_social?.startsWith('http') ? props.link_rede_social : `https://${props.link_rede_social}`;
                window.open(url, '_blank');
              }}
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Portfólio / Social
            </Button>
          )}

          <Button
            variant="ghost"
            className="flex-none bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs h-8 px-3"
            onClick={(e) => {
              e.stopPropagation();
              setDetailOpen(true);
            }}
          >
            Detalhes
          </Button>
          
          {props.oferece_agendamento && (
            <Button
              className="flex-none bg-orange-600 hover:bg-orange-700 text-white text-xs h-8 px-3"
              onClick={(e) => {
                e.stopPropagation();
                setBookingOpen(true);
              }}
            >
              <CalendarPlus className="w-3 h-3 mr-1" />
              Agendar
            </Button>
          )}
        </div>
      </div>
    </Card>

    <ServiceDetailDialog 
      id={props.id}
      open={detailOpen}
      onClose={() => setDetailOpen(false)}
    />

    {props.oferece_agendamento && (
      <BookingDialog
        servicoId={props.id}
        servicoNome={props.nome}
        ofereceAgendamento={props.oferece_agendamento}
        tipoAgendamento={props.tipo_agendamento}
        valorBase={props.valor_base}
        horaInicio={props.hora_inicio}
        horaFim={props.hora_fim}
        duracao={props.duracao_agendamento}
        diasFuncionamento={props.dias_funcionamento}
        horariosBloqueados={props.horarios_bloqueados}
        vagasDisponiveis={props.vagas_disponiveis}
        atendeDomicilio={props.atende_domicilio}
        taxaDomicilio={props.taxa_domicilio}
        variacoes={props.variacoes}
        prestadorVerificado={props.prestador_verificado}
        identidadeVerificada={props.identidade_verificada}
        open={bookingOpen}
        onOpenChange={setBookingOpen}
      />
    )}
    </>
  )
}
