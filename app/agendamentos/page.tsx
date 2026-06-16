"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { apiFetch } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Calendar, Briefcase, User, CheckCircle, XCircle, RotateCcw } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Agendamento {
  id: number
  data_hora: string
  horario_agendado?: string | null
  turno_agendado?: string | null
  observacao?: string | null
  status: string
  forma_pagamento: string
  valor_simulado: number
  atendimento_domicilio?: boolean
  servico: {
    id: number
    nome: string
    tipo: string
    endereco_texto?: string
    telefone?: string
  }
  usuario: {
    id: string
    nome: string
    email: string
    telefone?: string
  }
}

const STATUS_INFO: Record<string, { label: string; cls: string }> = {
  PENDENTE:   { label: "Pendente",   cls: "bg-yellow-100 text-yellow-800" },
  CONFIRMADO: { label: "Confirmado", cls: "bg-green-100 text-green-800" },
  CANCELADO:  { label: "Cancelado",  cls: "bg-red-100 text-red-800" },
}

const PAGAMENTO_LABEL: Record<string, string> = {
  CARTAO:   "Cartão de Crédito",
  PIX:      "PIX",
  DINHEIRO: "Dinheiro",
}

const TURNO_LABEL: Record<string, string> = {
  MANHA: "Manhã (08:00–12:00)",
  TARDE: "Tarde (13:00–18:00)",
  NOITE: "Noite (18:00–22:00)",
}

export default function AgendamentosPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [recebidos, setRecebidos] = useState<Agendamento[]>([])
  const [loadingCliente, setLoadingCliente] = useState(true)
  const [loadingPrestador, setLoadingPrestador] = useState(true)

  // Estado do formulário inline de reagendamento
  const [reagendarId, setReagendarId] = useState<number | null>(null)
  const [reagendarData, setReagendarData] = useState("")
  const [reagendarHora, setReagendarHora] = useState("")
  const [reagendarTurno, setReagendarTurno] = useState("")

  useEffect(() => {
    if (!user) { router.push("/login"); return }
    loadAgendamentos()
    loadRecebidos()
  }, [user])

  const loadAgendamentos = async () => {
    try {
      setLoadingCliente(true)
      const data = await apiFetch(`/api/agendamentos/usuario/${user?.id}`)
      setAgendamentos(Array.isArray(data) ? data : [])
    } catch {
      toast({ title: "Erro", description: "Não foi possível carregar agendamentos", variant: "destructive" })
    } finally {
      setLoadingCliente(false)
    }
  }

  const loadRecebidos = async () => {
    try {
      setLoadingPrestador(true)
      const data = await apiFetch("/api/agendamentos/prestador")
      setRecebidos(Array.isArray(data) ? data : [])
    } catch {
      setRecebidos([])
    } finally {
      setLoadingPrestador(false)
    }
  }

  const handleCancelar = async (id: number, isPrestador = false) => {
    if (!confirm("Cancelar este agendamento?")) return
    try {
      await apiFetch(`/api/agendamentos/${id}/cancelar`, { method: "PATCH" })
      toast({ title: "Agendamento cancelado" })
      if (isPrestador) loadRecebidos(); else loadAgendamentos()
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" })
    }
  }

  const handleConfirmar = async (id: number) => {
    try {
      await apiFetch(`/api/agendamentos/${id}/confirmar`, { method: "PATCH" })
      toast({ title: "Agendamento confirmado!" })
      loadRecebidos()
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" })
    }
  }

  const abrirReagendar = (a: Agendamento) => {
    setReagendarId(a.id)
    setReagendarData("")
    setReagendarHora(a.horario_agendado || "")
    setReagendarTurno(a.turno_agendado || "")
  }

  const handleReagendar = async (a: Agendamento) => {
    if (!reagendarData) {
      toast({ title: "Selecione a nova data", variant: "destructive" })
      return
    }
    if (a.horario_agendado !== null && a.horario_agendado !== undefined && !reagendarHora) {
      toast({ title: "Selecione o novo horário", variant: "destructive" })
      return
    }
    if (a.turno_agendado !== null && a.turno_agendado !== undefined && !reagendarTurno) {
      toast({ title: "Selecione o novo turno", variant: "destructive" })
      return
    }
    try {
      const dataHora = `${reagendarData}T${reagendarHora || "00:00"}:00Z`
      await apiFetch(`/api/agendamentos/${a.id}/reagendar`, {
        method: "PATCH",
        body: JSON.stringify({
          data_hora: dataHora,
          horario_agendado: a.horario_agendado !== null && a.horario_agendado !== undefined ? reagendarHora : null,
          turno_agendado: a.turno_agendado !== null && a.turno_agendado !== undefined ? reagendarTurno : null,
        }),
      })
      toast({ title: "Reagendado com sucesso!" })
      setReagendarId(null)
      loadAgendamentos()
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" })
    }
  }

  const hoje = new Date().toISOString().split("T")[0]

  const formatData = (iso: string) =>
    new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })

  const renderCard = (a: Agendamento, isPrestador = false) => {
    const status = STATUS_INFO[a.status] || { label: a.status, cls: "bg-gray-100 text-gray-800" }
    const isReagendando = reagendarId === a.id

    return (
      <Card key={a.id}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base truncate">{a.servico.nome}</CardTitle>
              {isPrestador && (
                <CardDescription className="mt-0.5 flex items-center gap-1 text-xs">
                  <User className="w-3 h-3 shrink-0" />
                  {a.usuario.nome}
                  {a.usuario.telefone ? ` · ${a.usuario.telefone}` : ""}
                </CardDescription>
              )}
            </div>
            <Badge className={`shrink-0 ${status.cls}`}>{status.label}</Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <p className="text-gray-500 text-xs">Data</p>
              <p className="font-medium">{formatData(a.data_hora)}</p>
            </div>

            {a.horario_agendado && (
              <div>
                <p className="text-gray-500 text-xs">Horário</p>
                <p className="font-medium">{a.horario_agendado}</p>
              </div>
            )}

            {a.turno_agendado && (
              <div>
                <p className="text-gray-500 text-xs">Turno</p>
                <p className="font-medium">{TURNO_LABEL[a.turno_agendado] || a.turno_agendado}</p>
              </div>
            )}

            <div>
              <p className="text-gray-500 text-xs">Pagamento</p>
              <p className="font-medium">{PAGAMENTO_LABEL[a.forma_pagamento] || a.forma_pagamento}</p>
            </div>

            <div>
              <p className="text-gray-500 text-xs">Valor</p>
              <p className="font-medium text-teal-600">R$ {Number(a.valor_simulado).toFixed(2)}</p>
            </div>

            {a.atendimento_domicilio && (
              <div className="col-span-2">
                <Badge variant="outline" className="text-xs">Atendimento em domicílio</Badge>
              </div>
            )}

            {a.observacao && (
              <div className="col-span-2">
                <p className="text-gray-500 text-xs">Observação</p>
                <p className="text-sm">{a.observacao}</p>
              </div>
            )}
          </div>

          {/* Ações do prestador */}
          {isPrestador && a.status === "PENDENTE" && (
            <div className="flex gap-2 pt-2 border-t">
              <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleConfirmar(a.id)}>
                <CheckCircle className="w-3 h-3 mr-1" />
                Confirmar
              </Button>
              <Button size="sm" variant="destructive" className="flex-1" onClick={() => handleCancelar(a.id, true)}>
                <XCircle className="w-3 h-3 mr-1" />
                Cancelar
              </Button>
            </div>
          )}
          {isPrestador && a.status === "CONFIRMADO" && (
            <div className="flex gap-2 pt-2 border-t">
              <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => handleCancelar(a.id, true)}>
                <XCircle className="w-3 h-3 mr-1" />
                Cancelar
              </Button>
            </div>
          )}

          {/* Ações do cliente */}
          {!isPrestador && a.status === "PENDENTE" && (
            <div className="flex gap-2 pt-2 border-t">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => isReagendando ? setReagendarId(null) : abrirReagendar(a)}
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                {isReagendando ? "Fechar" : "Reagendar"}
              </Button>
              <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => handleCancelar(a.id)}>
                <XCircle className="w-3 h-3 mr-1" />
                Cancelar
              </Button>
            </div>
          )}

          {/* Formulário inline de reagendamento */}
          {isReagendando && (
            <div className="border rounded-lg p-3 space-y-2 bg-gray-50">
              <p className="text-sm font-medium text-gray-700">Nova data e horário</p>
              <Input type="date" value={reagendarData} onChange={(e) => setReagendarData(e.target.value)} min={hoje} className="h-8 text-sm" />
              {a.horario_agendado !== null && a.horario_agendado !== undefined && (
                <Input type="time" value={reagendarHora} onChange={(e) => setReagendarHora(e.target.value)} className="h-8 text-sm" />
              )}
              {a.turno_agendado !== null && a.turno_agendado !== undefined && (
                <Select value={reagendarTurno} onValueChange={setReagendarTurno}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Turno" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MANHA">Manhã</SelectItem>
                    <SelectItem value="TARDE">Tarde</SelectItem>
                    <SelectItem value="NOITE">Noite</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <Button size="sm" className="w-full bg-teal-600 hover:bg-teal-700" onClick={() => handleReagendar(a)}>
                Confirmar Reagendamento
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const pendentesRecebidos = recebidos.filter((a) => a.status === "PENDENTE").length
  const ativosCliente = agendamentos.filter((a) => a.status !== "CANCELADO").length

  if (!user) return null

  return (
    <div className="container max-w-4xl mx-auto p-4 pb-24">
      <Link href="/" className="flex items-center gap-2 text-teal-600 hover:text-teal-700 mb-6 w-fit">
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-teal-800">Agendamentos</h1>
        <p className="text-gray-500 text-sm mt-1">Gerencie seus agendamentos</p>
      </div>

      <Tabs defaultValue="cliente">
        <TabsList className="w-full mb-6">
          <TabsTrigger value="cliente" className="flex-1 relative">
            <User className="w-4 h-4 mr-1.5" />
            Como Cliente
            {ativosCliente > 0 && (
              <span className="ml-1.5 bg-teal-600 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                {ativosCliente}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="prestador" className="flex-1 relative">
            <Briefcase className="w-4 h-4 mr-1.5" />
            Como Prestador
            {pendentesRecebidos > 0 && (
              <span className="ml-1.5 bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                {pendentesRecebidos}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Tab: cliente */}
        <TabsContent value="cliente">
          {loadingCliente ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
            </div>
          ) : agendamentos.length > 0 ? (
            <div className="space-y-4">{agendamentos.map((a) => renderCard(a))}</div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Você ainda não tem nenhum agendamento</p>
              <Link href="/servicos">
                <Button className="bg-teal-600 hover:bg-teal-700">Explorar Serviços</Button>
              </Link>
            </div>
          )}
        </TabsContent>

        {/* Tab: prestador */}
        <TabsContent value="prestador">
          {loadingPrestador ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
            </div>
          ) : recebidos.length > 0 ? (
            <div className="space-y-4">{recebidos.map((a) => renderCard(a, true))}</div>
          ) : (
            <div className="text-center py-12">
              <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum agendamento recebido</p>
              <p className="text-sm text-gray-400 mt-1">Os agendamentos dos seus serviços aparecerão aqui</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
