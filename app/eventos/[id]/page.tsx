"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiFetch } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { ArrowLeft, Calendar, Clock, MapPin, Users, Edit2, X, Upload } from "lucide-react"
import Link from "next/link"

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
  usuario: { id: string; nome: string; email: string }
}

export default function EventoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [evento, setEvento] = useState<Evento | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingFotos, setIsUploadingFotos] = useState(false)
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    endereco_texto: "",
    data_hora_inicio: "",
    data_hora_fim: "",
    capacidade_max: "",
  })

  useEffect(() => {
    loadEvento()
  }, [params.id])

  const loadEvento = async () => {
    try {
      setIsLoading(true)
      const data = await apiFetch(`/api/eventos/${params.id}`)
      setEvento(data)
      setFormData({
        titulo: data.titulo,
        descricao: data.descricao,
        endereco_texto: data.endereco_texto,
        data_hora_inicio: new Date(data.data_hora_inicio).toISOString().slice(0, 16),
        data_hora_fim: data.data_hora_fim ? new Date(data.data_hora_fim).toISOString().slice(0, 16) : "",
        capacidade_max: data.capacidade_max?.toString() || "",
      })
    } catch (error) {
      console.error("Erro ao carregar evento:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar o evento",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUploadFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    setIsUploadingFotos(true)
    try {
      for (const file of Array.from(files)) {
        const formDataUpload = new FormData()
        formDataUpload.append("foto_evento", file)

        const data = await apiFetch("/api/upload/evento", {
          method: "POST",
          body: formDataUpload,
        })

        if (!data.foto_url) {
          throw new Error("Erro ao obter URL da foto")
        }

        setEvento((prev) =>
          prev
            ? {
                ...prev,
                fotos_urls: [...prev.fotos_urls, data.foto_url],
              }
            : null
        )
      }

      toast({
        title: "Sucesso!",
        description: "Foto(s) enviada(s) com sucesso",
      })
    } catch (error: any) {
      toast({
        title: "Erro ao fazer upload",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsUploadingFotos(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const payload = {
        usuarioId: evento?.usuario.id,
        titulo: formData.titulo,
        descricao: formData.descricao,
        endereco_texto: formData.endereco_texto,
        data_hora_inicio: new Date(formData.data_hora_inicio).toISOString(),
        data_hora_fim: formData.data_hora_fim ? new Date(formData.data_hora_fim).toISOString() : undefined,
        capacidade_max: formData.capacidade_max ? parseInt(formData.capacidade_max) : undefined,
        fotos_urls: evento?.fotos_urls || [],
        latitude: -23.5505,
        longitude: -46.6333,
      }

      await apiFetch(`/api/eventos/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      toast({
        title: "Sucesso!",
        description: "Evento atualizado com sucesso",
      })
      setIsEditing(false)
      loadEvento()
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar evento",
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

  if (!evento) {
    return (
      <div className="container max-w-4xl mx-auto p-4 pb-24">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Evento não encontrado</p>
          <Button onClick={() => router.push("/eventos")}>Voltar aos Eventos</Button>
        </div>
      </div>
    )
  }

  const canEdit = user?.id === evento.usuario.id

  return (
    <div className="container max-w-4xl mx-auto p-4 pb-24 space-y-6">
      <Link href="/eventos" className="flex items-center gap-2 text-teal-600 hover:text-teal-700 w-fit">
        <ArrowLeft className="w-4 h-4" />
        Voltar aos Eventos
      </Link>

      {evento.fotos_urls && evento.fotos_urls.length > 0 && (
        <div className="w-full h-64 rounded-lg overflow-hidden bg-gray-100">
          <img
            src={evento.fotos_urls[0]}
            alt={evento.titulo}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {isEditing ? (
        <Card className="border-teal-200">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-orange-50 flex flex-row items-center justify-between">
            <CardTitle>Editar Evento</CardTitle>
            <button
              onClick={() => {
                setIsEditing(false)
                loadEvento()
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Título</label>
              <Input
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              />
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
                <label className="text-sm font-semibold">Data e Hora de Início</label>
                <Input
                  type="datetime-local"
                  value={formData.data_hora_inicio}
                  onChange={(e) => setFormData({ ...formData, data_hora_inicio: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Data e Hora de Fim</label>
                <Input
                  type="datetime-local"
                  value={formData.data_hora_fim}
                  onChange={(e) => setFormData({ ...formData, data_hora_fim: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Capacidade Máxima</label>
              <Input
                type="number"
                value={formData.capacidade_max}
                onChange={(e) => setFormData({ ...formData, capacidade_max: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="fotos" className="text-sm font-semibold flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Adicionar Fotos
              </label>
              <div className="relative">
                <input
                  id="fotos"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleUploadFoto}
                  disabled={isUploadingFotos}
                  className="hidden"
                />
                <label
                  htmlFor="fotos"
                  className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 cursor-pointer hover:border-teal-400 hover:bg-teal-50 transition-colors"
                >
                  <div className="text-center">
                    <Upload className="w-5 h-5 mx-auto text-gray-400 mb-1" />
                    <p className="text-sm font-semibold text-gray-700">
                      {isUploadingFotos ? "Enviando..." : "Clique para adicionar fotos"}
                    </p>
                  </div>
                </label>
              </div>

              {evento?.fotos_urls && evento.fotos_urls.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-semibold mb-2">Fotos atuais ({evento.fotos_urls.length}):</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {evento.fotos_urls.map((url, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                        <img
                          src={url}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setEvento((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    fotos_urls: prev.fotos_urls.filter((_, i) => i !== index),
                                  }
                                : null
                            )
                          }}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        >
                          <X className="w-5 h-5 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
              <CardTitle className="text-2xl text-teal-800">{evento.titulo}</CardTitle>
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
            <p className="text-gray-700 leading-relaxed">{evento.descricao}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-teal-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Data de Início</p>
                  <p className="text-sm font-medium">
                    {new Date(evento.data_hora_inicio).toLocaleDateString("pt-BR")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(evento.data_hora_inicio).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              {evento.data_hora_fim && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-teal-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">Data de Fim</p>
                    <p className="text-sm font-medium">
                      {new Date(evento.data_hora_fim).toLocaleDateString("pt-BR")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(evento.data_hora_fim).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-teal-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground font-semibold">Endereço</p>
                <p className="text-sm font-medium">{evento.endereco_texto}</p>
              </div>
            </div>

            {evento.capacidade_max && (
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-teal-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Capacidade</p>
                  <p className="text-sm font-medium">
                    {evento.vagas_ocupadas} / {evento.capacidade_max} vagas ocupadas
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-teal-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min(
                          (evento.vagas_ocupadas / evento.capacidade_max) * 100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Organizado por: <span className="font-semibold text-foreground">{evento.usuario.nome}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}