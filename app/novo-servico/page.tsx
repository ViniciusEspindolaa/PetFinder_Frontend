"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { apiFetch } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { ArrowLeft, Plus, Upload, X } from "lucide-react"
import Link from "next/link"

export default function NovoServicoPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingFotos, setIsUploadingFotos] = useState(false)

  const [formData, setFormData] = useState({
    nome: "",
    tipo: "",
    descricao: "",
    endereco_texto: "",
    bairro: "",
    cidade: "",
    telefone: "",
    email: "",
    fotos_urls: [] as string[],
    latitude: -23.5505,
    longitude: -46.6333,
    oferece_agendamento: true,
    tipo_agendamento: "HORARIO",
    variacoes: [{ nome: "", preco: 0 }] as { nome: string; preco: number }[],
    especies_atendidas: [] as string[],
    dias_funcionamento: [] as string[],
    hora_inicio: "08:00",
    hora_fim: "18:00",
    duracao_agendamento: 60,
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

  const diasSemana = [
    { value: "1", label: "Segunda" },
    { value: "2", label: "Terça" },
    { value: "3", label: "Quarta" },
    { value: "4", label: "Quinta" },
    { value: "5", label: "Sexta" },
    { value: "6", label: "Sábado" },
    { value: "0", label: "Domingo" },
  ]

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

  const toggleDia = (dia: string) => {
    setFormData(prev => {
      if (prev.dias_funcionamento.includes(dia)) {
        return { ...prev, dias_funcionamento: prev.dias_funcionamento.filter(d => d !== dia) }
      } else {
        return { ...prev, dias_funcionamento: [...prev.dias_funcionamento, dia] }
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para criar um serviço",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    if (!formData.nome || !formData.tipo || !formData.descricao || !formData.endereco_texto) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    const variacoesVazias = formData.variacoes.some(v => !v.nome || v.preco <= 0)
    if (variacoesVazias || formData.variacoes.length === 0) {
      toast({
        title: "Erro",
        description: "Preencha corretamente o nome e o valor de suas opções de serviço.",
        variant: "destructive",
      })
      return
    }
    
    if (formData.dias_funcionamento.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um dia de funcionamento.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const payload = {
        nome: formData.nome,
        tipo: formData.tipo,
        descricao: formData.descricao,
        endereco_texto: formData.endereco_texto,
        bairro: formData.bairro || undefined,
        cidade: formData.cidade || undefined,
        telefone: formData.telefone || undefined,
        email: formData.email || undefined,
        horario: undefined,
        fotos_urls: formData.fotos_urls,
        latitude: formData.latitude,
        longitude: formData.longitude,
        oferece_agendamento: formData.oferece_agendamento,
        tipo_agendamento: formData.tipo_agendamento,
        variacoes: formData.variacoes,
        especies_atendidas: formData.especies_atendidas,
        dias_funcionamento: formData.dias_funcionamento,
        hora_inicio: formData.hora_inicio || "08:00",
        hora_fim: formData.hora_fim || "18:00",
        duracao_agendamento: formData.duracao_agendamento ? Number(formData.duracao_agendamento) : 60,
        atende_domicilio: formData.atende_domicilio,
        taxa_domicilio: formData.atende_domicilio && formData.taxa_domicilio ? Number(formData.taxa_domicilio) : undefined,
      }

      const response = await apiFetch("/api/servicos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      toast({
        title: "Sucesso!",
        description: "Serviço criado com sucesso",
      })

      setTimeout(() => {
        router.push("/servicos")
      }, 1500)
    } catch (error: any) {
      console.error("Erro ao criar serviço:", error)
      toast({
        title: "Erro ao criar serviço",
        description: error.message || "Ocorreu um erro ao criar o serviço",
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
          <p className="text-muted-foreground mb-4">Você precisa estar logado para criar um serviço</p>
          <Button onClick={() => router.push("/login")}>Fazer Login</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl mx-auto p-4 pb-24">
      <Link
        href="/servicos"
        className="flex items-center gap-2 text-teal-600 hover:text-teal-700 mb-6 w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </Link>

      <Card>
        <CardHeader className="bg-gradient-to-r from-teal-50 to-orange-50">
          <CardTitle className="text-2xl">Adicionar Novo Serviço</CardTitle>
          <CardDescription>
            Cadastre seu serviço para pets e receba clientes
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="nome" className="text-sm font-semibold">
                Nome do Serviço *
              </label>
              <Input
                id="nome"
                placeholder="Ex: Clínica Veterinária PetCare"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="tipo" className="text-sm font-semibold">
                Tipo de Serviço *
              </label>
              <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                <SelectTrigger id="tipo">
                  <SelectValue placeholder="Selecione um tipo..." />
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
              <label htmlFor="descricao" className="text-sm font-semibold">
                Descrição *
              </label>
              <Textarea
                id="descricao"
                placeholder="Descreva seu serviço, especialidades, experiência, etc..."
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="endereco" className="text-sm font-semibold">
                Endereço *
              </label>
              <Input
                id="endereco"
                placeholder="Ex: Rua das Flores, 123"
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
                  placeholder="Ex: Vila Mariana"
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
                  placeholder="Ex: São Paulo"
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="telefone" className="text-sm font-semibold">
                  Telefone
                </label>
                <Input
                  id="telefone"
                  type="tel"
                  placeholder="Ex: (11) 98765-4321"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-semibold">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Ex: contato@servico.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-4 border p-4 rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Opções e Valores do Serviço *</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData(prev => ({ 
                    ...prev, 
                    variacoes: [...prev.variacoes, { nome: "", preco: 0 }] 
                  }))}
                >
                  <Plus className="w-4 h-4 mr-1" /> Adicionar Opção
                </Button>
              </div>
              <p className="text-sm text-gray-500 mb-2">Adicione os tipos de serviço que você oferece (ex: Só Banho, Banho e Tosa, etc.)</p>
              
              {formData.variacoes.map((variacao, index) => (
                <div key={index} className="flex gap-2 items-start mt-2">
                  <div className="flex-1 space-y-1">
                    <Input
                      placeholder="Nome da opção (Ex: Banho e Tosa)"
                      value={variacao.nome}
                      onChange={(e) => {
                        const newVariacoes = [...formData.variacoes]
                        newVariacoes[index].nome = e.target.value
                        setFormData({ ...formData, variacoes: newVariacoes })
                      }}
                      required
                    />
                  </div>
                  <div className="w-32 space-y-1">
                    <Input
                      type="number"
                      placeholder="Preço R$"
                      value={variacao.preco || ""}
                      onChange={(e) => {
                        const newVariacoes = [...formData.variacoes]
                        newVariacoes[index].preco = Number(e.target.value)
                        setFormData({ ...formData, variacoes: newVariacoes })
                      }}
                      required
                    />
                  </div>
                  {formData.variacoes.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const newVariacoes = [...formData.variacoes]
                        newVariacoes.splice(index, 1)
                        setFormData({ ...formData, variacoes: newVariacoes })
                      }}
                    >
                      <X className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              ))}
              
              <div className="space-y-2 mt-6 pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="atende_domicilio"
                    checked={formData.atende_domicilio}
                    onCheckedChange={(checked) => setFormData({ ...formData, atende_domicilio: checked })}
                  />
                  <label htmlFor="atende_domicilio" className="text-sm font-medium">
                    Atende em Domicílio?
                  </label>
                </div>
                {formData.atende_domicilio && (
                  <div className="pl-12 pt-2">
                    <Input
                      id="taxa_domicilio"
                      type="number"
                      placeholder="Taxa de Deslocamento R$ (Opcional)"
                      value={formData.taxa_domicilio || ""}
                      onChange={(e) => setFormData({ ...formData, taxa_domicilio: Number(e.target.value) })}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 border p-4 rounded-lg bg-gray-50">
              <h3 className="font-semibold text-lg mb-4">Disponibilidade e Agendamento *</h3>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Dias de Funcionamento *</label>
                <div className="flex flex-wrap gap-2">
                  {diasSemana.map((dia) => (
                    <div
                      key={dia.value}
                      onClick={() => toggleDia(dia.value)}
                      className={`
                        px-3 py-1 border rounded-full text-sm cursor-pointer transition-colors
                        ${formData.dias_funcionamento.includes(dia.value) ? "bg-teal-600 border-teal-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"}
                      `}
                    >
                      {dia.label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                <div className="space-y-2">
                  <label htmlFor="hora_inicio" className="text-sm font-semibold">
                    Abre às
                  </label>
                  <Input
                    id="hora_inicio"
                    type="time"
                    value={formData.hora_inicio}
                    onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="hora_fim" className="text-sm font-semibold">
                    Fecha às
                  </label>
                  <Input
                    id="hora_fim"
                    type="time"
                    value={formData.hora_fim}
                    onChange={(e) => setFormData({ ...formData, hora_fim: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="duracao" className="text-sm font-semibold">
                    Duração média (min)
                  </label>
                  <Input
                    id="duracao"
                    type="number"
                    min="15"
                    step="15"
                    value={formData.duracao_agendamento}
                    onChange={(e) => setFormData({ ...formData, duracao_agendamento: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">
                Fotos do Serviço
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.fotos_urls.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-md overflow-hidden">
                    <img src={url} alt={`Foto ${i + 1}`} className="object-cover w-full h-full" />
                    <button
                      type="button"
                      onClick={() => {
                        const newUrls = formData.fotos_urls.filter((_, index) => index !== i);
                        setFormData({ ...formData, fotos_urls: newUrls });
                      }}
                      className="absolute top-1 right-1 bg-black/50 p-1 rounded-full text-white hover:bg-black/70"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                <label className="relative aspect-square border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                  {isUploadingFotos ? (
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">Adicionar</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleUploadFoto}
                    disabled={isUploadingFotos}
                  />
                </label>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-6 text-lg">
              {isLoading ? "Salvando..." : "Adicionar Serviço"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
