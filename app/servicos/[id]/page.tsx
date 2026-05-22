"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
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
import { useAuth } from "@/lib/auth-context"
import { ArrowLeft, Phone, Mail, MapPin, Clock, Star, Edit2, X, Calendar } from "lucide-react"
import Link from "next/link"
import { BookingDialog } from "@/components/booking-dialog"

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
  usuario: { id: string; nome: string; email: string; telefone: string }
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
  const { user } = useAuth()
  const { toast } = useToast()
  const [servico, setServico] = useState<Servico | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [openBookingDialog, setOpenBookingDialog] = useState(false)
  const [formData, setFormData] = useState({
    nome: "",
    tipo: "",
    descricao: "",
    endereco_texto: "",
    bairro: "",
    cidade: "",
    telefone: "",
    email: "",
    horario: "",
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
      setFormData({
        nome: data.nome,
        tipo: data.tipo,
        descricao: data.descricao,
        endereco_texto: data.endereco_texto,
        bairro: data.bairro || "",
        cidade: data.cidade || "",
        telefone: data.telefone || "",
        email: data.email || "",
        horario: data.horario || "",
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

  const handleSave = async () => {
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
        horario: formData.horario || undefined,
        fotos_urls: servico?.fotos_urls || [],
        latitude: -23.5505,
        longitude: -46.6333,
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
              <label className="text-sm font-semibold">Endereço</label>
              <Input
                value={formData.endereco_texto}
                onChange={(e) => setFormData({ ...formData, endereco_texto: e.target.value })}
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

            <div className="space-y-2">
              <label className="text-sm font-semibold">Horário</label>
              <Input
                value={formData.horario}
                onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                placeholder="Ex: 08:00-18:00 seg-sex, 09:00-14:00 sab"
              />
            </div>

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
            </div>
            {canEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Editar
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

              {servico.horario && (
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-teal-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">Horário</p>
                    <p className="text-sm font-medium">{servico.horario}</p>
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

            <div className="pt-4 border-t">
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
                onClick={() => setOpenBookingDialog(true)}
                className="w-full bg-teal-600 hover:bg-teal-700 mt-4"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Agendar Serviço
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <BookingDialog
        servicoId={servico?.id || 0}
        servicoNome={servico?.nome || ""}
        open={openBookingDialog}
        onOpenChange={setOpenBookingDialog}
        onSuccess={loadServico}
      />
    </div>
  )
}
