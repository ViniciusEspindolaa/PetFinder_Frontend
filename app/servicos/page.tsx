"use client"

import { useState, useEffect } from "react"
import { ServiceCard } from "@/components/service-card"
import { ServiceFilters } from "@/components/service-filters"
import { Button } from "@/components/ui/button"
import { apiFetch } from "@/lib/api"
import { ArrowLeft, Plus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

interface Servico {
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
  valor_base?: number
  variacoes?: { nome: string; preco: number }[]
  hora_inicio?: string
  hora_fim?: string
  dias_funcionamento?: string[]
  vagas_disponiveis?: number | null
  oferece_agendamento?: boolean
  tipo_agendamento?: string
  atende_domicilio?: boolean
  prestador_verificado?: boolean
  identidade_verificada?: boolean
}

export default function ServicosPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [servicos, setServicos] = useState<Servico[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [tipo, setTipo] = useState("")
  const [busca, setBusca] = useState("")
  const [cidade, setCidade] = useState("")
  const [abertoAgora, setAbertoAgora] = useState(false)
  const [pagina, setPagina] = useState(1)

  useEffect(() => {
    loadServicos()
  }, [tipo, busca, cidade, abertoAgora, pagina])

  const loadServicos = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (tipo && tipo !== 'todos') params.append("categoria", tipo)
      if (busca) params.append("search", busca)
      if (cidade) params.append("cidade", cidade)
      if (abertoAgora) params.append("abertoAgora", "true")
      params.append("pagina", pagina.toString())
      params.append("limite", "12")

      const data = await apiFetch(`/api/servicos?${params.toString()}`)
      setServicos(Array.isArray(data) ? data : data.servicos || [])
    } catch (error) {
      console.error("Erro ao carregar serviços:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLimpar = () => {
    setTipo("")
    setBusca("")
    setCidade("")
    setAbertoAgora(false)
    setPagina(1)
  }

  return (
    <div className="container max-w-7xl mx-auto p-4 pb-24">
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link href="/" className="flex items-center gap-2 text-teal-600 hover:text-teal-700 w-fit">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-teal-800 mb-2">Serviços para Pets</h1>
          <p className="text-gray-600">
            Encontre veterinários, pet shops, treinadores e outros serviços para seu pet
          </p>
        </div>

        <ServiceFilters
          tipo={tipo}
          busca={busca}
          cidade={cidade}
          abertoAgora={abertoAgora}
          onTipoChange={setTipo}
          onBuscaChange={setBusca}
          onCidadeChange={setCidade}
          onAbertoAgoraChange={setAbertoAgora}
          onLimpar={handleLimpar}
        />

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>
        ) : servicos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {servicos.map((servico) => (
              <ServiceCard key={servico.id} {...servico} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">Nenhum serviço encontrado com esses filtros</p>
            <Button variant="outline" onClick={handleLimpar}>
              Limpar Filtros
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
