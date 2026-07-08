"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { apiFetch } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CheckCircle2, Loader2 } from "lucide-react"
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
  horariosBloqueados?: string[]
  vagasDisponiveis?: number | null
  atendeDomicilio?: boolean
  taxaDomicilio?: number
  variacoes?: { nome: string; preco: number }[]
  prestadorVerificado?: boolean
  identidadeVerificada?: boolean
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
  horariosBloqueados = [],
  vagasDisponiveis,
  atendeDomicilio,
  taxaDomicilio = 0,
  variacoes = [],
  prestadorVerificado,
  identidadeVerificada,
  open,
  onOpenChange,
  onSuccess,
}: BookingDialogProps) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState(0)
  const [data, setData] = useState("")
  const [hora, setHora] = useState("")
  const [turno, setTurno] = useState("")
  const [observacao, setObservacao] = useState("")
  const [formaPagamento, setFormaPagamento] = useState("")
  const [emDomicilio, setEmDomicilio] = useState(false)
  const [selectedVariacaoIndex, setSelectedVariacaoIndex] = useState("-1")
  const [erro, setErro] = useState("")
  const [ocupados, setOcupados] = useState<{ horarios: string[]; turnos: string[] }>({ horarios: [], turnos: [] })

  const isHorario = tipoAgendamento === "HORARIO"
  const isTurno = tipoAgendamento === "TURNO"
  const isVagas = tipoAgendamento === "VAGAS"

  const lotado = isVagas && vagasDisponiveis !== null && vagasDisponiveis !== undefined && vagasDisponiveis === 0

  // Busca horários/turnos já ocupados quando a data muda
  useEffect(() => {
    if (!data || !servicoId) {
      setOcupados({ horarios: [], turnos: [] })
      return
    }
    setHora("")
    apiFetch(`/api/agendamentos/servico/${servicoId}/ocupados?data=${data}`)
      .then((res) => setOcupados(res))
      .catch(() => setOcupados({ horarios: [], turnos: [] }))
  }, [data, servicoId])

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
    .filter((h) => !ocupados.horarios.includes(h))
    .filter((h) => !horariosBloqueados.includes(h))

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

    if (isVagas && lotado) {
      setErro("Este serviço está sem vagas disponíveis no momento")
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
          atendimento_domicilio: emDomicilio,
        }),
      })

      if (response) {
        setIsLoading(false)
        setIsProcessing(true)
        setProcessingStep(0)
        setTimeout(() => setProcessingStep(1), 800)
        setTimeout(() => setProcessingStep(2), 1800)
        setTimeout(() => {
          setIsProcessing(false)
          setProcessingStep(0)
          setData("")
          setHora("")
          setTurno("")
          setObservacao("")
          setFormaPagamento("")
          setEmDomicilio(false)
          onOpenChange(false)
          onSuccess?.()
        }, 2800)
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
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Agendar Serviço</DialogTitle>
          <DialogDescription>
            Agende {servicoNome} e simule o pagamento
          </DialogDescription>
        </DialogHeader>

        {isProcessing && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-10">
            {processingStep < 2 ? (
              <>
                <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
                <div className="text-center space-y-1">
                  <p className="font-semibold text-sm">
                    {processingStep === 0 ? 'Enviando agendamento...' : 'Processando pagamento...'}
                  </p>
                  <p className="text-xs text-muted-foreground">Aguarde um momento</p>
                </div>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-10 h-10 text-green-600" />
                <div className="text-center space-y-1">
                  <p className="font-semibold text-sm text-green-700">Agendamento confirmado!</p>
                  <p className="text-xs text-muted-foreground">Pagamento simulado com sucesso</p>
                </div>
              </>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className={`space-y-4 overflow-y-auto flex-1 pr-1 ${isProcessing ? 'hidden' : ''}`}>
          {(diasFuncionamento && diasFuncionamento.length > 0) || horaInicio || horaFim ? (
            <div className="text-sm text-teal-700 bg-teal-50 p-2 rounded-md border border-teal-100 space-y-0.5">
              {diasFuncionamento && diasFuncionamento.length > 0 && (
                <p>
                  <span className="font-semibold">Dias de atendimento:</span>{" "}
                  {diasFuncionamento
                    .map((d) => ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][parseInt(d)])
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}
              {horaInicio && horaFim && (
                <p>
                  <span className="font-semibold">Horário:</span>{" "}
                  {horaInicio === "00:00" && horaFim === "23:59" ? "24 horas" : `${horaInicio} – ${horaFim}`}
                </p>
              )}
            </div>
          ) : null}

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
              <label className="text-sm font-semibold">
                Horário disponível{duracao ? ` · ${duracao}min por sessão` : ""}
              </label>
              {!data ? (
                <p className="text-sm text-gray-400 bg-gray-50 text-center py-3 rounded-md border">
                  Selecione uma data para ver os horários
                </p>
              ) : gerarHorarios().length === 0 ? (
                <p className="text-sm text-amber-700 bg-amber-50 text-center py-3 rounded-md border border-amber-200">
                  Horários não configurados pelo prestador
                </p>
              ) : horariosDisponiveis.length === 0 ? (
                <p className="text-sm text-amber-700 bg-amber-50 text-center py-3 rounded-md border border-amber-200">
                  Nenhum horário disponível nesta data
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {horariosDisponiveis.map((h) => (
                    <button
                      key={h}
                      type="button"
                      className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                        hora === h
                          ? "bg-teal-600 text-white border-teal-600"
                          : "bg-white text-gray-700 border-gray-200 hover:border-teal-400 hover:text-teal-700"
                      }`}
                      onClick={() => setHora(h)}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {isVagas && (
            <div className="space-y-2">
              {lotado ? (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm font-medium text-center">
                  Sem vagas disponíveis no momento
                </div>
              ) : vagasDisponiveis !== null && vagasDisponiveis !== undefined ? (
                <div className="bg-teal-50 border border-teal-200 text-teal-700 px-3 py-2 rounded-md text-sm text-center">
                  {vagasDisponiveis} {vagasDisponiveis === 1 ? "vaga disponível" : "vagas disponíveis"}
                </div>
              ) : (
                <div className="bg-teal-50 border border-teal-200 text-teal-700 px-3 py-2 rounded-md text-sm text-center">
                  Vagas disponíveis
                </div>
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
                  {[
                    { value: "MANHA", label: "Manhã (08:00 - 12:00)" },
                    { value: "TARDE", label: "Tarde (13:00 - 18:00)" },
                    { value: "NOITE", label: "Noite (18:00 - 22:00)" },
                  ].map((t) => (
                    <SelectItem key={t.value} value={t.value} disabled={ocupados.turnos.includes(t.value)}>
                      {t.label}{ocupados.turnos.includes(t.value) ? " — Ocupado" : ""}
                    </SelectItem>
                  ))}
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
              <div className="space-y-2">
                <div className="flex items-center space-x-2 border p-3 rounded bg-accent">
                  <input
                    type="checkbox"
                    id="emDomicilio"
                    checked={emDomicilio}
                    onChange={(e) => setEmDomicilio(e.target.checked)}
                    className="rounded border-gray-300"
                    disabled={!identidadeVerificada}
                  />
                  <label htmlFor="emDomicilio" className="text-sm">
                    Atendimento em Domicílio (adicional de R$ {taxaDomicilio?.toFixed(2)})
                  </label>
                </div>
                {!identidadeVerificada && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                    Atendimento em domicílio indisponível: o prestador ainda não concluiu a verificação de identidade.
                  </p>
                )}
              </div>
            )}

            {prestadorVerificado === false && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                Este prestador ainda não concluiu a verificação de contato na plataforma.
              </p>
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
              disabled={isLoading || lotado}
            >
              {isLoading ? "Agendando..." : lotado ? "Sem vagas" : "Confirmar Agendamento"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}



