'use client'

import { useState } from 'react'
import { Pet } from '@/lib/types'
import { useAuth } from '@/lib/auth-context'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertTriangle } from 'lucide-react'

export type ReportTarget = {
  type: 'publicacao' | 'evento' | 'servico'
  id: number | string
  titulo: string
}

interface ReportDialogProps {
  pet?: Pet | null
  target?: ReportTarget | null
  open: boolean
  onClose: () => void
}

const tipoLabels: Record<ReportTarget['type'], string> = {
  publicacao: 'Publicação',
  evento: 'Evento',
  servico: 'Serviço',
}

const motivosPublicacao = [
  { value: 'fake', label: 'Anúncio falso ou enganoso' },
  { value: 'inappropriate', label: 'Conteúdo inapropriado' },
  { value: 'spam', label: 'Spam ou propaganda' },
  { value: 'abuse', label: 'Maus tratos ao animal' },
  { value: 'duplicate', label: 'Publicação duplicada' },
  { value: 'scam', label: 'Tentativa de golpe' },
  { value: 'other', label: 'Outro motivo' },
]

const motivosEventoServico = [
  { value: 'fake', label: 'Informações falsas ou enganosas' },
  { value: 'inappropriate', label: 'Conteúdo inapropriado' },
  { value: 'spam', label: 'Spam ou propaganda' },
  { value: 'scam', label: 'Tentativa de golpe' },
  { value: 'cancelled', label: 'Evento/serviço inexistente ou cancelado' },
  { value: 'other', label: 'Outro motivo' },
]

export function ReportDialog({ pet, target, open, onClose }: ReportDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resolvedTarget: ReportTarget | null = target ?? (pet ? {
    type: 'publicacao',
    id: pet.id,
    titulo: pet.name,
  } : null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resolvedTarget) return

    setIsSubmitting(true)

    const payload: Record<string, unknown> = {
      usuarioId: user?.id,
      motivo: reason,
      descricao: details,
    }

    if (resolvedTarget.type === 'publicacao') {
      payload.publicacaoId = Number(resolvedTarget.id)
    } else if (resolvedTarget.type === 'evento') {
      payload.eventoId = Number(resolvedTarget.id)
    } else {
      payload.servicoId = Number(resolvedTarget.id)
    }

    try {
      await apiFetch('/api/denuncias', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      toast({
        title: 'Denúncia enviada',
        description: 'Nossa equipe analisará o caso. Obrigado por ajudar a manter a comunidade segura.',
      })

      setReason('')
      setDetails('')
      onClose()
    } catch (error) {
      console.error('Erro ao enviar denúncia:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a denúncia. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!resolvedTarget) return null

  const motivos = resolvedTarget.type === 'publicacao' ? motivosPublicacao : motivosEventoServico

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            Denunciar {tipoLabels[resolvedTarget.type]}
          </DialogTitle>
          <DialogDescription>
            Informe o motivo da denúncia sobre &quot;{resolvedTarget.titulo}&quot;. Nossa equipe analisará o caso.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm">Motivo da denúncia *</Label>
            <Select value={reason} onValueChange={setReason} required>
              <SelectTrigger id="reason" className="text-sm z-2060">
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent className="z-2060">
                {motivos.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details" className="text-sm">
              Detalhes adicionais (opcional)
            </Label>
            <Textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Forneça mais informações sobre a denúncia..."
              rows={4}
              className="text-sm resize-none"
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-800">
              Denúncias falsas ou mal-intencionadas podem resultar em suspensão da conta.
              Por favor, denuncie apenas conteúdo que viole nossas diretrizes.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} className="text-sm">
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!reason || isSubmitting}
              variant="destructive"
              className="text-sm"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Denúncia'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
