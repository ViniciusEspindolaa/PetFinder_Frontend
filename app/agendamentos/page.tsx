"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { apiFetch } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Agendamento {
  id: number
  data_hora: string
  status: string
  forma_pagamento: string
  valor_simulado: number
  servico: {
    id: number
    nome: string
    tipo: string
    endereco_texto: string
    telefone?: string
  }
  usuario: {
    id: string
    nome: string
    email: string
  }
}

export default function AgendamentosPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    loadAgendamentos()
  }, [user])

  const loadAgendamentos = async () => {
    try {
      setIsLoading(true)
      const data = await apiFetch(`/api/agendamentos/usuario/${user?.id}`)
      setAgendamentos(data)
    } catch (error) {
      console.error("Erro ao carregar agendamentos:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelar = async (agendamentoId: number) => {
    if (!confirm("Tem certeza que deseja cancelar este agendamento?")) return

    try {
      await apiFetch(`/api/agendamentos/${agendamentoId}/cancelar`, {
        method: "PATCH",
      })
      loadAgendamentos()
    } catch (error) {
      console.error("Erro ao cancelar agendamento:", error)
    }
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDENTE: "bg-yellow-100 text-yellow-800",
      CONFIRMADO: "bg-green-100 text-green-800",
      CANCELADO: "bg-red-100 text-red-800",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  const formatData = (data: string) => {
    return new Date(data).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (!user) return null

  return (
    <div className="container max-w-4xl mx-auto p-4 pb-24">
      <Link href="/" className="flex items-center gap-2 text-teal-600 hover:text-teal-700 mb-6 w-fit">
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </Link>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-teal-800 mb-2">Meus Agendamentos</h1>
        <p className="text-gray-600">Gerencie seus agendamentos com prestadores de serviço</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        </div>
      ) : agendamentos.length > 0 ? (
        <div className="space-y-4">
          {agendamentos.map((agendamento) => (
            <Card key={agendamento.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle>{agendamento.servico.nome}</CardTitle>
                    <CardDescription className="mt-1">
                      {agendamento.servico.tipo}
                    </CardDescription>
                  </div>
                  <Badge className={statusBadge(agendamento.status)}>
                    {agendamento.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Data e Hora</p>
                    <p className="font-semibold">{formatData(agendamento.data_hora)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Forma de Pagamento</p>
                    <p className="font-semibold">{agendamento.forma_pagamento}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Valor</p>
                    <p className="font-semibold text-teal-600">
                      R$ {Number(agendamento.valor_simulado || 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Endereço</p>
                    <p className="text-sm">{agendamento.servico.endereco_texto}</p>
                  </div>
                </div>

                {agendamento.servico.telefone && (
                  <div className="pt-2">
                    <p className="text-sm text-gray-600">Telefone</p>
                    <a
                      href={`tel:${agendamento.servico.telefone}`}
                      className="text-teal-600 hover:text-teal-700 font-semibold"
                    >
                      {agendamento.servico.telefone}
                    </a>
                  </div>
                )}

                {agendamento.status !== "CANCELADO" && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelar(agendamento.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Cancelar Agendamento
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">Você ainda não tem nenhum agendamento</p>
          <Link href="/servicos">
            <Button className="bg-teal-600 hover:bg-teal-700">
              Explorar Serviços
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
