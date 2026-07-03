"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { apiFetch } from "@/lib/api"
import { reverseGeocode } from "@/lib/geocoding"
import { useAuth } from "@/lib/auth-context"
import { ArrowLeft, Calendar, MapPin, Users, Upload, X } from "lucide-react"
import Link from "next/link"
import dynamic from "next/dynamic"
const SelectableMap = dynamic(() => import('@/components/selectable-map'), { ssr: false })

export default function NovoEventoPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingFotos, setIsUploadingFotos] = useState(false)
  const [mapLocation, setMapLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isGettingLocation, setIsGettingLocation] = useState(false)

  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    endereco_texto: "",
    bairro: "",
    cidade: "",
    data_inicio: "",
    hora_inicio: "",
    data_fim: "",
    hora_fim: "",
    capacidade_max: "",
    fotos_urls: [] as string[],
  })

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

        setFormData((prev) => ({
          ...prev,
          fotos_urls: [...prev.fotos_urls, data.foto_url],
        }))
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

  const handleGetCurrentLocation = () => {
    setIsGettingLocation(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setMapLocation({ lat: latitude, lng: longitude })
          setIsGettingLocation(false)
          toast({
            title: "Localização capturada",
            description: `Coordenadas: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            duration: 3000,
          })
        },
        () => {
          setIsGettingLocation(false)
          toast({
            variant: "destructive",
            title: "Erro de localização",
            description: "Não foi possível obter sua localização. Verifique as permissões.",
            duration: 3000,
          })
        }
      )
    } else {
      setIsGettingLocation(false)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Geolocalização não é suportada pelo seu navegador.",
        duration: 3000,
      })
    }
  }

  useEffect(() => {
    const doReverse = async () => {
      if (!mapLocation) return
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
  }, [mapLocation])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para criar um evento",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    if (!formData.titulo || !formData.descricao || !formData.endereco_texto || !formData.data_inicio || !formData.hora_inicio) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    if (!mapLocation) {
      toast({
        title: "Localização necessária",
        description: 'Selecione o local no mapa ou use "Usar Minha Localização Atual" antes de criar o evento.',
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // Combina data e hora
      const dataHoraInicio = new Date(`${formData.data_inicio}T${formData.hora_inicio}:00`)
      const dataHoraFim = formData.data_fim && formData.hora_fim 
        ? new Date(`${formData.data_fim}T${formData.hora_fim}:00`)
        : undefined

      const payload = {
        usuarioId: user.id,
        titulo: formData.titulo,
        descricao: formData.descricao,
        endereco_texto: formData.endereco_texto,
        bairro: formData.bairro || undefined,
        cidade: formData.cidade || undefined,
        data_hora_inicio: dataHoraInicio.toISOString(),
        data_hora_fim: dataHoraFim?.toISOString(),
        capacidade_max: formData.capacidade_max ? parseInt(formData.capacidade_max) : undefined,
        fotos_urls: formData.fotos_urls,
        latitude: mapLocation.lat,
        longitude: mapLocation.lng,
      }

      const response = await apiFetch("/api/eventos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      toast({
        title: "Sucesso!",
        description: "Evento criado com sucesso",
      })

      setTimeout(() => {
        router.push("/eventos")
      }, 1500)
    } catch (error: any) {
      console.error("Erro ao criar evento:", error)
      toast({
        title: "Erro ao criar evento",
        description: error.message || "Ocorreu um erro ao criar o evento",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="container max-w-2xl mx-auto p-4 pb-24">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Você precisa estar logado para criar um evento</p>
          <Button onClick={() => router.push("/login")}>Fazer Login</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl mx-auto p-4 pb-24">
      <Link
        href="/"
        className="flex items-center gap-2 text-teal-600 hover:text-teal-700 mb-6 w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </Link>

      <Card>
        <CardHeader className="bg-gradient-to-r from-teal-50 to-orange-50">
          <CardTitle className="text-2xl">Criar Novo Evento</CardTitle>
          <CardDescription>
            Organize uma feira de adoção, campanha de vacinação ou outro evento para ajudar os pets
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="titulo" className="text-sm font-semibold">
                Título do Evento *
              </label>
              <Input
                id="titulo"
                placeholder="Ex: Feira de Adoção - Maio 2026"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="descricao" className="text-sm font-semibold">
                Descrição *
              </label>
              <Textarea
                id="descricao"
                placeholder="Descreva o evento, o que será realizado, informações importantes, etc..."
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                rows={4}
                required
              />
            </div>

            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4" />
                  Selecione o Local no Mapa *
                </label>
                <SelectableMap
                  latitude={mapLocation?.lat ?? null}
                  longitude={mapLocation?.lng ?? null}
                  onChange={(lat, lng) => {
                    setMapLocation({ lat, lng })
                  }}
                />
                <div className="mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGetCurrentLocation}
                    disabled={isGettingLocation}
                    className="w-full text-sm"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    {isGettingLocation ? "Obtendo localização..." : "Usar Minha Localização Atual"}
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="endereco" className="text-sm font-semibold flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Endereço *
              </label>
              <Input
                id="endereco"
                placeholder="Ex: Rua das Flores, 123 - São Paulo, SP"
                value={formData.endereco_texto}
                onChange={(e) => setFormData({ ...formData, endereco_texto: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="bairro" className="text-sm font-semibold">
                  Bairro
                </label>
                <Input
                  id="bairro"
                  placeholder="Ex: Centro"
                  value={formData.bairro}
                  onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="cidade" className="text-sm font-semibold">
                  Cidade
                </label>
                <Input
                  id="cidade"
                  placeholder="Ex: Florianópolis"
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="data_inicio" className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Data de Início *
                </label>
                <Input
                  id="data_inicio"
                  type="date"
                  value={formData.data_inicio}
                  onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="hora_inicio" className="text-sm font-semibold">
                  Hora de Início *
                </label>
                <Input
                  id="hora_inicio"
                  type="time"
                  value={formData.hora_inicio}
                  onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="data_fim" className="text-sm font-semibold">
                  Data de Fim (Opcional)
                </label>
                <Input
                  id="data_fim"
                  type="date"
                  value={formData.data_fim}
                  onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="hora_fim" className="text-sm font-semibold">
                  Hora de Fim (Opcional)
                </label>
                <Input
                  id="hora_fim"
                  type="time"
                  value={formData.hora_fim}
                  onChange={(e) => setFormData({ ...formData, hora_fim: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="capacidade" className="text-sm font-semibold flex items-center gap-2">
                <Users className="w-4 h-4" />
                Capacidade Máxima de Participantes
              </label>
              <Input
                id="capacidade"
                type="number"
                placeholder="Ex: 100"
                min="1"
                value={formData.capacidade_max}
                onChange={(e) => setFormData({ ...formData, capacidade_max: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="fotos" className="text-sm font-semibold flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Fotos do Evento (Opcional)
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
                  className="flex items-center justify-center w-full p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 cursor-pointer hover:border-teal-400 hover:bg-teal-50 transition-colors"
                >
                  <div className="text-center">
                    <Upload className="w-6 h-6 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm font-semibold text-gray-700">
                      {isUploadingFotos ? "Enviando fotos..." : "Clique para selecionar fotos"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">ou arraste arquivos aqui</p>
                  </div>
                </label>
              </div>

              {formData.fotos_urls.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold mb-2">Fotos adicionadas ({formData.fotos_urls.length}):</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {formData.fotos_urls.map((url, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                        <img
                          src={url}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              fotos_urls: prev.fotos_urls.filter((_, i) => i !== index),
                            }))
                          }}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        >
                          <X className="w-6 h-6 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <p className="font-semibold mb-1">ℹ️ Informações</p>
              <p>
                Os campos marcados com * são obrigatórios. Você pode adicionar fotos do evento em breve.
              </p>
            </div>

            <div className="flex gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-teal-600 hover:bg-teal-700"
                disabled={isLoading}
              >
                {isLoading ? "Criando..." : "Criar Evento"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}