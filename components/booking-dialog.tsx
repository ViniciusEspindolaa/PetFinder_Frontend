"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { apiFetch } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface BookingDialogProps {
  servicoId: number
  servicoNome: string
  ofereceAgendamento?: boolean
  tipoAgendamento?: string
  valorBase?: number
  horaInicio?: string
  horaFim?: string
  duracao?: number
  diasFuncionamento?: string[]
  atendeDomicilio?: boolean
  taxaDomicilio?: number
  variacoes?: { nome: string; preco: number }[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function BookingDialog({
  servicoId,
  servicoNome,
  ofereceAgendamento,
  tipoAgendamento,
  valorBase = 50,
  horaInicio,
  horaFim,
  duracao = 60,
  diasFuncionamento,
  atendeDomicilio,
  taxaDomicilio = 0,
  variacoes = [],
  open,
  onOpenChange,
  onSuccess,
}: BookingDialogProps) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState("")
  const [hora, setHora] = useState("")
  const [turno, setTurno] = useState("")
  const [observacao, setObservacao] = useState("")
  const [formaPagamento, setFormaPagamento] = useState("")
  const [emDomicilio, setEmDomicilio] = useState(false)
  const [selectedVariacaoIndex, setSelectedVariacaoIndex] = useState("-1")
  const [erro, setErro] = useState("")

  const isHorario = tipoAgendamento === "HORARIO"
  const isTurno = tipoAgendamento === "TURNO"

  // Calcular valor total dinâmico
  const calcValorBase = selectedVariacaoIndex !== '-1' && variacoes.length > 0 ? Number(variacoes[parseInt(selectedVariacaoIndex)]?.preco || 0) : Number(valorBase) || 0
  const calcTaxa = Number(taxaDomicilio) || 0
  const valorFinal = emDomicilio ? calcValorBase + calcTaxa : calcValorBase

  // Gerar horários disponíveis das horaInicio até horaFim com base na duracao
  const gerarHorarios = () => {
    if (!horaInicio || !horaFim) return []
    const horarios = []
    
    // Convert to minutes from midnight
    const strToMins = (str: string) => {
      const [h, m] = str.split(':').map(Number)
      return h * 60 + m
    }
    const minsToStr = (mins: number) => {
      const h = Math.floor(mins / 60).toString().padStart(2, '0')
      const m = (mins % 60).toString().padStart(2, '0')
      return `${h}:${m}`
    }

    let start = strToMins(horaInicio)
    const end = strToMins(horaFim)

    while (start + duracao <= end) {
      horarios.push(minsToStr(start))
      start += duracao
    }
    return horarios
  }

  const horariosDisponiveis = gerarHorarios()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro("")

    if (!data || !formaPagamento) {
      setErro("Data e forma de pagamento são obrigatórios")
      return
    }

    if (isHorario && !hora) {
      setErro("Horário é obrigatório")
      return
    }

    if (isTurno && !turno) {
      setErro("Turno é obrigatório")
      return
    }

    try {
      setIsLoading(true)
      const dataHora = `${data}T${hora || "00:00"}:00Z` // Usamos 00:00 para turno p evitar invalidação de iso

      const response = await apiFetch("/api/agendamentos", {
        method: "POST",
        body: JSON.stringify({
          servicoId,
          data_hora: dataHora,
          horario_agendado: isHorario ? hora : null,
          turno_agendado: isTurno ? turno : null,
          observacao: observacao,
          formaPagamento: formaPagamento,
          forma_pagamento: formaPagamento,
          valor_simulado: valorFinal,
        }),
      })

      if (response) {
        setData("")
        setHora("")
        setTurno("")
        setObservacao("")
        setFormaPagamento("")
        setEmDomicilio(false)
        onOpenChange(false)

        // Mostrar mensagem de sucesso
        alert("Agendamento realizado com sucesso!")
        onSuccess?.()
      }
    } catch (error: any) {
      setErro(error.message || "Erro ao criar agendamento")
    } finally {
      setIsLoading(false)
    }
  }

  // Data mínima é hoje
  const hoje = new Date().toISOString().split("T")[0]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agendar Serviço</DialogTitle>
          <DialogDescription>
            Agende {servicoNome} e simule o pagamento
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {diasFuncionamento && diasFuncionamento.length > 0 && (
            <div className="text-sm text-teal-700 bg-teal-50 p-2 rounded-md border border-teal-100">
              <span className="font-semibold">Dias de atendimento:</span>{" "}
              {diasFuncionamento
                .map((d) => ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][parseInt(d)])
                .filter(Boolean)
                .join(", ")}
            </div>
          )}

          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
              {erro}
            </div>
          )}

          {variacoes && variacoes.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-semibold">Opção de Serviço</label>
              <Select value={selectedVariacaoIndex} onValueChange={setSelectedVariacaoIndex}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o pacote/serviço" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-1">Serviço Base - R$ {Number(valorBase || 0).toFixed(2)}</SelectItem>
                  {variacoes.map((v, idx) => (
                    <SelectItem key={idx} value={idx.toString()}>
                      {v.nome} - R$ {Number(v.preco).toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-semibold">Data</label>
            <Input
              type="date"
              value={data}
              onChange={(e) => {
                const selectedDate = e.target.value
                if (selectedDate && diasFuncionamento && diasFuncionamento.length > 0) {
                  const dayOfWeek = new Date(selectedDate + "T12:00:00").getDay().toString()
                  if (!diasFuncionamento.includes(dayOfWeek)) {
                    setErro("Este prestador não atende no dia da semana selecionado. Verifique os dias acima.")
                    setData("")
                    return
                  }
                }
                setErro("")
                setData(selectedDate)
              }}
              min={hoje}
              required
            />
          </div>

          {isHorario && (
            <div className="space-y-2">
              <label className="text-sm font-semibold">Hora Disponível (Duração: {duracao}m)</label>
              {(horariosDisponiveis.length > 0) ? (
                <Select value={hora} onValueChange={setHora} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o horário" />
                  </SelectTrigger>
                  <SelectContent>
                    {horariosDisponiveis.map(h => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type="time"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  required
                />
              )}
            </div>
          )}

          {isTurno && (
            <div className="space-y-2">
              <label className="text-sm font-semibold">Turno</label>
              <Select value={turno} onValueChange={setTurno} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o turno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANHA">Manhã (08:00 - 12:00)</SelectItem>
                  <SelectItem value="TARDE">Tarde (13:00 - 18:00)</SelectItem>
                  <SelectItem value="NOITE">Noite (18:00 - 22:00)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-semibold">Observação para o prestador</label>
            <Input
              type="text"
              placeholder="Ex: Meu cachorro é medroso..."
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Forma de Pagamento</label>
              <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a forma de pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CARTAO">Cartão de Crédito</SelectItem>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {atendeDomicilio && (
              <div className="flex items-center space-x-2 border p-3 rounded bg-accent">
                <input
                  type="checkbox"
                  id="emDomicilio"
                  checked={emDomicilio}
                  onChange={(e) => setEmDomicilio(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="emDomicilio" className="text-sm">
                  Atendimento em Domicílio (adicional de R$ {taxaDomicilio?.toFixed(2)})
                </label>
              </div>
            )}

            <div className="space-y-2 border-t pt-2">
              <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                <span className="font-semibold">Valor Total (R$)</span>
                <span className="text-xl font-bold text-orange-600">
                  R$ {valorFinal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-teal-50 border border-teal-200 rounded-md p-3">
            <p className="text-xs text-teal-800">
              💡 <strong>Simulação:</strong> Este é um agendamento simulado. O pagamento não será processado.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-teal-600 hover:bg-teal-700"
              disabled={isLoading}
            >
              {isLoading ? "Agendando..." : "Confirmar Agendamento"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}



