"use client"

import { useState, useEffect } from "react"
import { Search, MapPin, Calendar, Clock, Users, Plus, Heart, Edit2, Flag } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiFetch } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { EventoDetailDialog } from "@/components/evento-detail-dialog"
import { ReportDialog } from "@/components/report-dialog"
import { useAuth } from "@/lib/auth-context"

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
  usuario?: { id: string }
}

function EventCardItem({ evento, setSelectedEventoId, user, toast, onReport }: {
  evento: Evento
  setSelectedEventoId: (id: number) => void
  user: any
  toast: any
  onReport: (evento: Evento) => void
}) {
  const router = useRouter()
  const isOwner = user && evento.usuario?.id === user.id
  const isUserAttending = user && evento.inscricoes ? evento.inscricoes.some((i: any) => i.usuarioId === user.id) : false
  const [isAttending, setIsAttending] = useState(isUserAttending)
  const [loadingAttend, setLoadingAttend] = useState(false)
  const totalInscritos = evento.inscricoes ? evento.inscricoes.length : 0

  const toggleAttend = async (e: any) => {
    e.stopPropagation();
    if (!user) {
      toast({
        title: "Login Necessário",
        description: "Faça login para confirmar presença.",
      });
      return;
    }
    setLoadingAttend(true);
    try {
      const res = await apiFetch(`/api/eventos/${evento.id}/inscricao`, {
        method: "POST"
      });
      setIsAttending(res.attending);
      evento.inscricoes = res.attending ? [...(evento.inscricoes || []), {usuarioId: user.id}] : (evento.inscricoes || []).filter((i: any) => i.usuarioId !== user.id);
    } catch (error: any) {
      console.error(error);
      if (error?.status === 401) {
        toast({
          title: "Sessão Expirada",
          description: "Faça login novamente para curtir os eventos.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível curtir o evento.",
          variant: "destructive"
        });
      }
    } finally {
      setLoadingAttend(false);
    }
  }

  return (
    <Card 
      className="flex flex-col h-full overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => setSelectedEventoId(evento.id)}
    >
      {evento.fotos_urls && evento.fotos_urls.length > 0 && (
        <div className="w-full h-40 overflow-hidden bg-gray-100 shrink-0 relative">
          <img
            src={evento.fotos_urls[0]}
            alt={evento.titulo}
            className="w-full h-full object-cover"
          />
          {isOwner && (
            <Badge className="absolute top-2 left-2 bg-teal-600 text-white text-xs">Meu evento</Badge>
          )}
        </div>
      )}
      <CardHeader className="pb-3 text-left">
        <div className="flex justify-between items-start gap-2 mb-1">
          <CardTitle className="text-lg text-teal-800 line-clamp-1">{evento.titulo}</CardTitle>
          <Badge variant={evento.status === "AGENDADO" ? "default" : "secondary"} className="shrink-0">
            {evento.status === "AGENDADO" ? "Agendado" : evento.status === "CONCLUIDO" ? "Concluído" : "Em andamento"}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">
          {evento.descricao}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-gray-600 pb-4 text-left flex-1">
        <div className="flex items-start gap-2">
          <Calendar className="w-4 h-4 mt-0.5 text-teal-600 shrink-0" />
          <span>
            {new Date(evento.data_hora_inicio).toLocaleDateString('pt-BR')} 
            {evento.data_hora_fim && ` até ${new Date(evento.data_hora_fim).toLocaleDateString('pt-BR')}`}
          </span>
        </div>
        <div className="flex items-start gap-2">
          <Clock className="w-4 h-4 mt-0.5 text-teal-600 shrink-0" />
          <span>
            {new Date(evento.data_hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 mt-0.5 text-teal-600 shrink-0" />
          <span className="line-clamp-1">{evento.endereco_texto}</span>
        </div>
        {evento.capacidade_max ? (
          <div className="flex items-start gap-2">
            <Users className="w-4 h-4 mt-0.5 text-teal-600 shrink-0" />
            <span>Lotação: {Math.min(totalInscritos, evento.capacidade_max)} / {evento.capacidade_max} vagas</span>
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <Heart className="w-4 h-4 mt-0.5 text-red-500 fill-current shrink-0" />
            <span>Curtidas: {totalInscritos}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0 mt-auto flex flex-col gap-2">
        {isOwner ? (
          <Button
            className="w-full bg-teal-600 hover:bg-teal-700 text-xs h-9"
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/eventos/${evento.id}?edit=1`)
            }}
          >
            <Edit2 className="w-3 h-3 mr-1" />
            Editar Evento
          </Button>
        ) : (
          <div className="flex gap-2 w-full">
            <Button 
              disabled={loadingAttend}
              variant={isAttending ? "secondary" : "outline"}
              className={`flex-1 text-xs py-1 h-9 ${isAttending ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'text-gray-600 hover:text-red-600'}`}
              onClick={toggleAttend}
            >
              {isAttending ? <><Heart className="w-3 h-3 mr-1 fill-current" /> Curtiu</> : <><Heart className="w-3 h-3 mr-1" /> Curtir</>}
            </Button>
            <Button
              variant="outline"
              className="text-xs h-9 px-2 text-amber-700 border-amber-200 hover:bg-amber-50"
              onClick={(e) => {
                e.stopPropagation()
                onReport(evento)
              }}
            >
              <Flag className="w-3 h-3" />
            </Button>
          </div>
        )}
        <Button 
          variant="outline" 
          className="w-full text-xs py-1 h-9" 
          onClick={(e) => {
            e.stopPropagation()
            setSelectedEventoId(evento.id)
          }}
        >
          Ver Detalhes
        </Button>
      </CardFooter>
    </Card>
  )
}

export default function EventosPage() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [cidadeFilter, setCidadeFilter] = useState("")
  const [filter, setFilter] = useState("proximos")
  const [selectedEventoId, setSelectedEventoId] = useState<number | null>(null)
  const [reportTarget, setReportTarget] = useState<{ id: number; titulo: string } | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    fetchEventos()
  }, [filter])

  const fetchEventos = async () => {
    setIsLoading(true)
    try {
      let endpoint = "/api/eventos"
      if (filter === "proximos") {
        endpoint = "/api/eventos/proximos"
      } else if (filter !== "todos") {
        endpoint = `/api/eventos/proximos?dias=${filter}`
      }

      const data = await apiFetch(endpoint)
      if (data.eventos) {
        setEventos(data.eventos)
      } else {
        setEventos(data)
      }
    } catch (error) {
      console.error("Erro ao buscar eventos:", error)
      toast({
        title: "Erro ao buscar eventos",
        description: "Não foi possível carregar a lista de eventos.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredEventos = eventos.filter((evento) => {
    const term = searchTerm.toLowerCase()
    const matchTerm = 
      evento.titulo.toLowerCase().includes(term) ||
      evento.descricao.toLowerCase().includes(term) ||
      evento.endereco_texto.toLowerCase().includes(term)
    
    if (cidadeFilter) {
      const isCidade = evento.endereco_texto.toLowerCase().includes(cidadeFilter.toLowerCase())
      return matchTerm && isCidade
    }
    return matchTerm
  })

  return (
    <div className="container max-w-4xl mx-auto p-4 pb-24 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2C3E50]">Eventos e Feiras</h1>
          <p className="text-muted-foreground text-sm">
            Encontre feiras de adoção, campanhas de vacinação e outros eventos.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, descrição..."
            className="pl-9 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Filtrar por cidade..."
            className="pl-9 bg-white"
            value={cidadeFilter}
            onChange={(e) => setCidadeFilter(e.target.value)}
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-[200px] bg-white">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="proximos">Próximos eventos</SelectItem>
            <SelectItem value="7">Próximos 7 dias</SelectItem>
            <SelectItem value="15">Próximos 15 dias</SelectItem>
            <SelectItem value="30">Próximos 30 dias</SelectItem>
            <SelectItem value="60">Próximos 60 dias</SelectItem>
            <SelectItem value="todos">Todos os eventos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        </div>
      ) : filteredEventos.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">Nenhum evento encontrado</h3>
          <p className="text-gray-500 text-sm mt-1">Tente buscar por outros termos ou crie um novo evento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEventos.map((evento) => (
            <EventCardItem
              key={evento.id}
              evento={evento}
              setSelectedEventoId={setSelectedEventoId}
              user={user}
              toast={toast}
              onReport={(e) => setReportTarget({ id: e.id, titulo: e.titulo })}
            />
          ))}
        </div>
      )}

      {selectedEventoId && (
        <EventoDetailDialog
          id={selectedEventoId}
          open={!!selectedEventoId}
          onClose={() => setSelectedEventoId(null)}
          onUpdate={fetchEventos}
        />
      )}

      <ReportDialog
        target={reportTarget ? { type: 'evento', id: reportTarget.id, titulo: reportTarget.titulo } : null}
        open={!!reportTarget}
        onClose={() => setReportTarget(null)}
      />
    </div>
  )
}
