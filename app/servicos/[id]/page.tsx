"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiFetch } from "@/lib/api"
import { reverseGeocode } from "@/lib/geocoding"
import { useAuth } from "@/lib/auth-context"
import { ArrowLeft, Phone, Mail, MapPin, Clock, Star, Edit2, X, Calendar, Flag, Plus } from "lucide-react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { Switch } from "@/components/ui/switch"
import { BookingDialog } from "@/components/booking-dialog"
import { ReportDialog } from "@/components/report-dialog"
import { VerifiedBadge } from "@/components/verified-badge"

const SelectableMap = dynamic(() => import('@/components/selectable-map'), { ssr: false })

interface Servico {
  id: number
  nome: string
  tipo: string
  descricao: string
  endereco_texto: string
  bairro?: string
  cidade?: string
  latitude?: number
  longitude?: number
  fotos_urls: string[]
  avaliacoes?: number
  total_avaliacoes?: number
  telefone?: string
  email?: string
  horario?: string
  oferece_agendamento?: boolean
  tipo_agendamento?: string
  valor_base?: number
  hora_inicio?: string
  hora_fim?: string
  duracao_agendamento?: number
  dias_funcionamento?: string[]
  horarios_bloqueados?: string[]
  capacidade_por_slot?: number
  vagas_disponiveis?: number | null
  atende_domicilio?: boolean
  taxa_domicilio?: number
  variacoes?: { nome: string; preco: number }[]
  prestador_verificado?: boolean
  identidade_verificada?: boolean
  usuario: { id: string; nome: string; email: string; telefone: string; foto_perfil?: string }
}

const diasSemana = [
  { value: "1", label: "Seg" },
  { value: "2", label: "Ter" },
  { value: "3", label: "Qua" },
  { value: "4", label: "Qui" },
  { value: "5", label: "Sex" },
  { value: "6", label: "Sáb" },
  { value: "0", label: "Dom" },
]

function gerarSlots(horaInicio: string, horaFim: string, duracao: number): string[] {
  const slots: string[] = []
  const toMins = (s: string) => { const [h, m] = s.split(":").map(Number); return h * 60 + m }
  const toStr = (m: number) => `${Math.floor(m / 60).toString().padStart(2, "0")}:${(m % 60).toString().padStart(2, "0")}`
  let cur = toMins(horaInicio)
  const end = toMins(horaFim)
  while (cur + duracao <= end) { slots.push(toStr(cur)); cur += duracao }
  return slots
}

const tipoNome: Record<string, string> = {
  PET_SITTER: "Pet Sitter",
  DOG_WALKER: "Dog Walker",
  BANHO_TOSA: "Banho e Tosa",
  HOSPEDAGEM_CRECHE: "Hospedagem/Creche",
  ADESTRADOR: "Adestrador",
}

export default function ServicoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { toast } = useToast()
  const [servico, setServico] = useState<Servico | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [openBookingDialog, setOpenBookingDialog] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [mapLocation, setMapLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [formData, setFormData] = useState({
    nome: "",
    tipo: "",
    descricao: "",
    endereco_texto: "",
    bairro: "",
    cidade: "",
    telefone: "",
    email: "",
    dias_funcionamento: [] as string[],
    hora_inicio: "08:00",
    hora_fim: "18:00",
    duracao_agendamento: 60,
    horarios_bloqueados: [] as string[],
    capacidade_por_slot: 1,
    vagas_disponiveis: null as number | null,
    variacoes: [] as { nome: string; preco: number }[],
    atende_domicilio: false,
    taxa_domicilio: 0,
  })

  const tipoOptions = [
    { value: "PET_SITTER", label: "Pet Sitter" },
    { value: "DOG_WALKER", label: "Dog Walker" },
    { value: "BANHO_TOSA", label: "Banho e Tosa" },
    { value: "HOSPEDAGEM_CRECHE", label: "Hospedagem/Creche" },
    { value: "ADESTRADOR", label: "Adestrador" },
  ]

  useEffect(() => {
    loadServico()
  }, [params.id])

  const loadServico = async () => {
    try {
      setIsLoading(true)
      const data = await apiFetch(`/api/servicos/${params.id}`)
      setServico(data)
      const lat = data.latitude ? Number(data.latitude) : null
      const lng = data.longitude ? Number(data.longitude) : null
      if (lat && lng) setMapLocation({ lat, lng })
      setFormData({
        nome: data.nome,
        tipo: data.tipo,
        descricao: data.descricao,
        endereco_texto: data.endereco_texto,
        bairro: data.bairro || "",
        cidade: data.cidade || "",
        telefone: data.telefone || "",
        email: data.email || "",
        dias_funcionamento: data.dias_funcionamento || [],
        hora_inicio: data.hora_inicio || "08:00",
        hora_fim: data.hora_fim || "18:00",
        duracao_agendamento: data.duracao_agendamento || 60,
        horarios_bloqueados: data.horarios_bloqueados || [],
        capacidade_por_slot: data.capacidade_por_slot || 1,
        vagas_disponiveis: data.vagas_disponiveis ?? null,
        variacoes: data.variacoes || [],
        atende_domicilio: data.atende_domicilio || false,
        taxa_domicilio: data.taxa_domicilio ? Number(data.taxa_domicilio) : 0,
      })
    } catch (error) {
      console.error("Erro ao carregar serviço:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar o serviço",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (searchParams.get('edit') === '1' && servico && user?.id === servico.usuario.id) {
      setIsEditing(true)
    }
  }, [searchParams, servico, user])

  useEffect(() => {
    const doReverse = async () => {
      if (!mapLocation || !isEditing) return
      try {
        const { endereco_texto, bairro, cidade } = await reverseGeocode(mapLocation.lat, mapLocation.lng)
        setFormData((prev) => ({
          ...prev,
          endereco_texto,
          bairro: bairro || prev.bairro,
          cidade: cidade || prev.cidade,
        }))
      } catch (err) {
        console.error("Erro no reverse geocoding", err)
      }
    }
    doReverse()
  }, [mapLocation, isEditing])

  const handleGetCurrentLocation = () => {
    setIsGettingLocation(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setMapLocation({ lat: latitude, lng: longitude })
          setIsGettingLocation(false)
        },
        () => {
          setIsGettingLocation(false)
          toast({ variant: "destructive", title: "Erro", description: "Não foi possível obter sua localização." })
        }
      )
    } else {
      setIsGettingLocation(false)
    }
  }

  const isHospedagem = formData.tipo === "HOSPEDAGEM_CRECHE"

  const handleSave = async () => {
    if (formData.dias_funcionamento.length === 0) {
      toast({ title: "Erro", description: "Selecione pelo menos um dia de funcionamento.", variant: "destructive" })
      return
    }
    if (formData.variacoes.length === 0 || formData.variacoes.some(v => !v.nome || v.preco <= 0)) {
      toast({ title: "Erro", description: "Preencha corretamente as opções e valores do serviço.", variant: "destructive" })
      return
    }
    try {
      setIsSaving(true)
      const payload = {
        nome: formData.nome,
        tipo: formData.tipo,
        descricao: formData.descricao,
        endereco_texto: formData.endereco_texto,
        bairro: formData.bairro || undefined,
        cidade: formData.cidade || undefined,
        telefone: formData.telefone || undefined,
        email: formData.email || undefined,
        fotos_urls: servico?.fotos_urls || [],
        latitude: mapLocation?.lat ?? (servico?.latitude ? Number(servico.latitude) : -23.5505),
        longitude: mapLocation?.lng ?? (servico?.longitude ? Number(servico.longitude) : -46.6333),
        oferece_agendamento: true,
        tipo_agendamento: isHospedagem ? "VAGAS" : "HORARIO",
        dias_funcionamento: formData.dias_funcionamento,
        hora_inicio: formData.hora_inicio || "08:00",
        hora_fim: formData.hora_fim || "18:00",
        duracao_agendamento: isHospedagem ? null : (formData.duracao_agendamento ? Number(formData.duracao_agendamento) : 60),
        horarios_bloqueados: isHospedagem ? [] : formData.horarios_bloqueados,
        capacidade_por_slot: isHospedagem ? null : (formData.capacidade_por_slot > 1 ? formData.capacidade_por_slot : null),
        vagas_disponiveis: isHospedagem ? formData.vagas_disponiveis : null,
        variacoes: formData.variacoes,
        atende_domicilio: formData.atende_domicilio,
        taxa_domicilio: formData.atende_domicilio && formData.taxa_domicilio ? Number(formData.taxa_domicilio) : undefined,
      }

      await apiFetch(`/api/servicos/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      toast({
        title: "Sucesso!",
        description: "Serviço atualizado com sucesso",
      })
      setIsEditing(false)
      loadServico()
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar serviço",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto p-4 pb-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
      </div>
    )
  }

  if (!servico) {
    return (
      <div className="container max-w-4xl mx-auto p-4 pb-24">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Serviço não encontrado</p>
          <Button onClick={() => router.push("/servicos")}>Voltar aos Serviços</Button>
        </div>
      </div>
    )
  }

  const canEdit = user?.id === servico.usuario.id

  return (
    <div className="container max-w-4xl mx-auto p-4 pb-24 space-y-6">
      <Link href="/servicos" className="flex items-center gap-2 text-teal-600 hover:text-teal-700 w-fit">
        <ArrowLeft className="w-4 h-4" />
        Voltar aos Serviços
      </Link>

      {servico.fotos_urls && servico.fotos_urls.length > 0 && (
        <div className="w-full h-64 rounded-lg overflow-hidden bg-gray-100">
          <img
            src={servico.fotos_urls[0]}
            alt={servico.nome}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {isEditing ? (
        <Card className="border-teal-200">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-orange-50 flex flex-row items-center justify-between">
            <CardTitle>Editar Serviço</CardTitle>
            <button
              onClick={() => {
                setIsEditing(false)
                loadServico()
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Nome</label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Tipo</label>
              <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tipoOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Descrição</label>
              <Textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Localização</label>
              <div className="h-48 w-full rounded-md overflow-hidden border">
                <SelectableMap
                  latitude={mapLocation?.lat ?? null}
                  longitude={mapLocation?.lng ?? null}
                  onChange={(lat, lng) => setMapLocation({ lat, lng })}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleGetCurrentLocation}
                disabled={isGettingLocation}
                className="w-full h-8 text-xs"
              >
                <MapPin className="w-3 h-3 mr-2" />
                {isGettingLocation ? "Obtendo..." : "Usar Minha Localização"}
              </Button>
              <Input
                value={formData.endereco_texto}
                onChange={(e) => setFormData({ ...formData, endereco_texto: e.target.value })}
                placeholder="Endereço"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Bairro</label>
                <Input
                  value={formData.bairro}
                  onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Cidade</label>
                <Input
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Telefone</label>
                <Input
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Email</label>
                <Input
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            {/* Opções e Valores */}
            <div className="space-y-4 border p-4 rounded-lg bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Opções e Valores do Serviço</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, variacoes: [...prev.variacoes, { nome: "", preco: 0 }] }))}
                >
                  <Plus className="w-4 h-4 mr-1" /> Adicionar
                </Button>
              </div>
              {formData.variacoes.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-2">Nenhuma opção adicionada</p>
              )}
              {formData.variacoes.map((v, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <Input
                    placeholder="Nome (ex: Banho e Tosa)"
                    value={v.nome}
                    onChange={(e) => {
                      const next = [...formData.variacoes]
                      next[i] = { ...next[i], nome: e.target.value }
                      setFormData({ ...formData, variacoes: next })
                    }}
                  />
                  <Input
                    type="number"
                    placeholder="R$"
                    className="w-28 shrink-0"
                    value={v.preco || ""}
                    onChange={(e) => {
                      const next = [...formData.variacoes]
                      next[i] = { ...next[i], preco: Number(e.target.value) }
                      setFormData({ ...formData, variacoes: next })
                    }}
                  />
                  {formData.variacoes.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => {
                        const next = [...formData.variacoes]
                        next.splice(i, 1)
                        setFormData({ ...formData, variacoes: next })
                      }}
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
                </div>
              ))}
              <div className="space-y-2 pt-3 border-t">
                <div className="flex items-center gap-2">
                  <Switch
                    id="atende_domicilio"
                    checked={formData.atende_domicilio}
                    onCheckedChange={(v) => setFormData({ ...formData, atende_domicilio: v })}
                  />
                  <label htmlFor="atende_domicilio" className="text-sm font-medium">Atende em Domicílio?</label>
                </div>
                {formData.atende_domicilio && (
                  <Input
                    type="number"
                    placeholder="Taxa de deslocamento R$ (Opcional)"
                    className="mt-1"
                    value={formData.taxa_domicilio || ""}
                    onChange={(e) => setFormData({ ...formData, taxa_domicilio: Number(e.target.value) })}
                  />
                )}
              </div>
            </div>

            {/* Disponibilidade e Agendamento */}
            {isHospedagem ? (
              <div className="space-y-4 border p-4 rounded-lg bg-gray-50">
                <h3 className="font-semibold">Disponibilidade e Funcionamento</h3>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Dias de Funcionamento</label>
                  <div className="flex flex-wrap gap-2">
                    {diasSemana.map((dia) => (
                      <button
                        key={dia.value}
                        type="button"
                        onClick={() => {
                          const dias = formData.dias_funcionamento.includes(dia.value)
                            ? formData.dias_funcionamento.filter(d => d !== dia.value)
                            : [...formData.dias_funcionamento, dia.value]
                          setFormData({ ...formData, dias_funcionamento: dias })
                        }}
                        className={`px-3 py-1 border rounded-full text-sm transition-colors ${
                          formData.dias_funcionamento.includes(dia.value)
                            ? "bg-teal-600 border-teal-600 text-white"
                            : "bg-white text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {dia.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="funciona_24h_edit"
                      checked={formData.hora_inicio === "00:00" && formData.hora_fim === "23:59"}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        hora_inicio: checked ? "00:00" : "08:00",
                        hora_fim: checked ? "23:59" : "18:00",
                      })}
                    />
                    <label htmlFor="funciona_24h_edit" className="text-sm font-medium">Funciona 24 horas</label>
                  </div>
                  {!(formData.hora_inicio === "00:00" && formData.hora_fim === "23:59") && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold">Abre às</label>
                        <Input
                          type="time"
                          value={formData.hora_inicio}
                          onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold">Fecha às</label>
                        <Input
                          type="time"
                          value={formData.hora_fim}
                          onChange={(e) => setFormData({ ...formData, hora_fim: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-3 border-t">
                  <label className="text-sm font-semibold">Vagas Disponíveis</label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Deixe vazio para não limitar vagas"
                    value={formData.vagas_disponiveis ?? ""}
                    onChange={(e) => setFormData({ ...formData, vagas_disponiveis: e.target.value !== "" ? Number(e.target.value) : null })}
                  />
                  <p className="text-xs text-gray-400">Coloque 0 para marcar como lotado. Deixe vazio para vagas ilimitadas.</p>
                  {formData.vagas_disponiveis === 0 && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                      Serviço marcado como lotado — clientes não poderão reservar.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4 border p-4 rounded-lg bg-gray-50">
                <h3 className="font-semibold">Disponibilidade e Agendamento</h3>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Dias de Funcionamento</label>
                  <div className="flex flex-wrap gap-2">
                    {diasSemana.map((dia) => (
                      <button
                        key={dia.value}
                        type="button"
                        onClick={() => {
                          const dias = formData.dias_funcionamento.includes(dia.value)
                            ? formData.dias_funcionamento.filter(d => d !== dia.value)
                            : [...formData.dias_funcionamento, dia.value]
                          setFormData({ ...formData, dias_funcionamento: dias })
                        }}
                        className={`px-3 py-1 border rounded-full text-sm transition-colors ${
                          formData.dias_funcionamento.includes(dia.value)
                            ? "bg-teal-600 border-teal-600 text-white"
                            : "bg-white text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {dia.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Abre às</label>
                    <Input
                      type="time"
                      value={formData.hora_inicio}
                      onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Fecha às</label>
                    <Input
                      type="time"
                      value={formData.hora_fim}
                      onChange={(e) => setFormData({ ...formData, hora_fim: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Duração por sessão (min)</label>
                    <Input
                      type="number"
                      min="15"
                      step="15"
                      value={formData.duracao_agendamento}
                      onChange={(e) => setFormData({ ...formData, duracao_agendamento: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Capacidade simultânea por horário</label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.capacidade_por_slot}
                    onChange={(e) => setFormData({ ...formData, capacidade_por_slot: Math.max(1, Number(e.target.value)) })}
                  />
                  <p className="text-xs text-gray-400">
                    Quantos clientes podem agendar o mesmo horário (ex: 2 para dois banhos simultâneos)
                  </p>
                </div>
                {formData.hora_inicio && formData.hora_fim && formData.duracao_agendamento > 0 && (() => {
                  const slots = gerarSlots(formData.hora_inicio, formData.hora_fim, formData.duracao_agendamento)
                  return slots.length > 0 ? (
                    <div className="pt-3 border-t">
                      <p className="text-xs text-gray-500 mb-1">
                        Prévia dos horários ({slots.length} no total) — clique para bloquear/desbloquear:
                      </p>
                      <p className="text-xs text-gray-400 mb-2">
                        Horários riscados ficam indisponíveis para clientes (ex: horário de almoço)
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {slots.map((slot) => {
                          const bloqueado = formData.horarios_bloqueados.includes(slot)
                          return (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => {
                                const next = bloqueado
                                  ? formData.horarios_bloqueados.filter(s => s !== slot)
                                  : [...formData.horarios_bloqueados, slot]
                                setFormData({ ...formData, horarios_bloqueados: next })
                              }}
                              className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                                bloqueado
                                  ? "bg-red-50 border-red-300 text-red-400 line-through"
                                  : "border-gray-200 bg-white text-gray-600 hover:border-red-300 hover:bg-red-50"
                              }`}
                            >
                              {slot}
                            </button>
                          )
                        })}
                      </div>
                      {formData.horarios_bloqueados.length > 0 && (
                        <p className="text-xs text-red-500 mt-2">
                          {formData.horarios_bloqueados.length} horário(s) bloqueado(s)
                        </p>
                      )}
                    </div>
                  ) : null
                })()}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancelar
              </Button>
              <Button
                className="bg-teal-600 hover:bg-teal-700"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="bg-gradient-to-r from-teal-50 to-orange-50 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-teal-800">{servico.nome}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">{tipoNome[servico.tipo]}</p>
              <VerifiedBadge
                contatoVerificado={servico.prestador_verificado}
                identidadeVerificada={servico.identidade_verificada}
                className="mt-2"
              />
            </div>
            {canEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
              >
                <Edit2 className="w-4 h-4" />
                Editar Serviço
              </button>
            )}
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <p className="text-gray-700 leading-relaxed">{servico.descricao}</p>

            {servico.avaliacoes !== undefined && servico.total_avaliacoes !== undefined && servico.total_avaliacoes > 0 && (
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="text-lg font-semibold">
                  {Number(servico.avaliacoes).toFixed(1)}
                </span>
                <span className="text-sm text-gray-500">({servico.total_avaliacoes} avaliações)</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {servico.endereco_texto && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-teal-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">Endereço</p>
                    <p className="text-sm font-medium">{servico.endereco_texto}</p>
                    {servico.bairro && servico.cidade && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {servico.bairro}, {servico.cidade}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {servico.horario && servico.tipo !== "HOSPEDAGEM_CRECHE" && (
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-teal-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">Horário</p>
                    <p className="text-sm font-medium">{servico.horario}</p>
                  </div>
                </div>
              )}

              {servico.tipo === "HOSPEDAGEM_CRECHE" && (
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-teal-600 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-semibold">Horário de Funcionamento</p>
                    {servico.hora_inicio === "00:00" && servico.hora_fim === "23:59" ? (
                      <p className="text-sm font-medium">24 horas</p>
                    ) : servico.hora_inicio && servico.hora_fim ? (
                      <p className="text-sm font-medium">{servico.hora_inicio} – {servico.hora_fim}</p>
                    ) : null}
                    {servico.dias_funcionamento && servico.dias_funcionamento.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {servico.dias_funcionamento
                          .map((d) => ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][parseInt(d)])
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                    {servico.vagas_disponiveis === 0 ? (
                      <p className="text-xs font-medium text-red-600 mt-1">Lotado — sem vagas no momento</p>
                    ) : servico.vagas_disponiveis !== null && servico.vagas_disponiveis !== undefined ? (
                      <p className="text-xs text-teal-700 mt-1">
                        {servico.vagas_disponiveis} {servico.vagas_disponiveis === 1 ? "vaga disponível" : "vagas disponíveis"}
                      </p>
                    ) : null}
                  </div>
                </div>
              )}

              {servico.telefone && (
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-teal-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">Telefone</p>
                    <p className="text-sm font-medium">{servico.telefone}</p>
                  </div>
                </div>
              )}

              {servico.email && (
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-teal-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">Email</p>
                    <p className="text-sm font-medium">{servico.email}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">
                  Oferecido por: <span className="font-semibold text-foreground">{servico.usuario.nome}</span>
                </p>
                {servico.usuario.telefone && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Contato: {servico.usuario.telefone}
                  </p>
                )}
              </div>
              {!canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-amber-700 border-amber-200 hover:bg-amber-50"
                  onClick={() => setReportOpen(true)}
                >
                  <Flag className="w-4 h-4 mr-2" />
                  Denunciar
                </Button>
              )}
            </div>

            {!canEdit && (
              <Button
                onClick={() => setOpenBookingDialog(true)}
                className="w-full bg-teal-600 hover:bg-teal-700 mt-4"
                disabled={servico.tipo === "HOSPEDAGEM_CRECHE" && servico.vagas_disponiveis === 0}
              >
                <Calendar className="w-4 h-4 mr-2" />
                {servico.tipo === "HOSPEDAGEM_CRECHE" && servico.vagas_disponiveis === 0
                  ? "Sem vagas disponíveis"
                  : "Agendar Serviço"}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <BookingDialog
        servicoId={servico?.id || 0}
        servicoNome={servico?.nome || ""}
        ofereceAgendamento={servico?.oferece_agendamento}
        tipoAgendamento={servico?.tipo_agendamento}
        valorBase={servico?.valor_base}
        horaInicio={servico?.hora_inicio}
        horaFim={servico?.hora_fim}
        duracao={servico?.duracao_agendamento}
        diasFuncionamento={servico?.dias_funcionamento}
        horariosBloqueados={servico?.horarios_bloqueados}
        vagasDisponiveis={servico?.vagas_disponiveis}
        atendeDomicilio={servico?.atende_domicilio}
        taxaDomicilio={servico?.taxa_domicilio}
        variacoes={servico?.variacoes}
        prestadorVerificado={servico?.prestador_verificado}
        identidadeVerificada={servico?.identidade_verificada}
        open={openBookingDialog}
        onOpenChange={setOpenBookingDialog}
        onSuccess={loadServico}
      />

      <ReportDialog
        target={servico ? { type: 'servico', id: servico.id, titulo: servico.nome } : null}
        open={reportOpen}
        onClose={() => setReportOpen(false)}
      />
    </div>
  )
}
