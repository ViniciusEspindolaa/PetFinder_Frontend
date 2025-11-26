'use client'

import { useState } from 'react'
import { Pet } from '@/lib/types'
import {
  Dialog,
  DialogContent,
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
import { CheckCircle } from 'lucide-react'

interface CompletePetDialogProps {
  pet: Pet | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: (petId: string, reason: string) => void
}

export function CompletePetDialog({ pet, open, onOpenChange, onComplete }: CompletePetDialogProps) {
  const [reasonType, setReasonType] = useState('')
  const [reason, setReason] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (pet && reasonType) {
      const fullReason = reason.trim() 
        ? `${reasonType} - ${reason}` 
        : reasonType
      onComplete(pet.id, fullReason)
      setReasonType('')
      setReason('')
      onOpenChange(false)
    }
  }

  const getCompletionOptions = () => {
    if (!pet) return []
    
    switch (pet.status) {
      case 'lost':
        return [
          'Pet foi encontrado',
          'Pet voltou para casa sozinho',
          'Desistiu de procurar',
          'Outros'
        ]
      case 'found':
        return [
          'Tutor foi encontrado',
          'Pet foi adotado por outra pessoa',
          'Pet foi encaminhado para abrigo',
          'Outros'
        ]
      case 'adoption':
        return [
          'Pet foi adotado',
          'Pet não está mais disponível',
          'Desistiu da doação',
          'Outros'
        ]
      default:
        return ['Outros']
    }
  }

  const getStatusMessage = () => {
    if (!pet) return ''
    switch (pet.status) {
      case 'lost':
        return 'Pet foi encontrado?'
      case 'found':
        return 'Dono do pet foi localizado?'
      case 'adoption':
        return 'Pet foi adotado?'
      default:
        return 'Finalizar publicação'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Finalizar Publicação
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {getStatusMessage()}
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="reasonType">Motivo da finalização *</Label>
              <Select value={reasonType} onValueChange={setReasonType}>
                <SelectTrigger id="reasonType">
                  <SelectValue placeholder="Selecione o motivo" />
                </SelectTrigger>
                <SelectContent>
                  {getCompletionOptions().map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Detalhes adicionais (opcional)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Pet foi encontrado e está em casa com segurança!"
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Compartilhe detalhes sobre como a situação foi resolvida!
              </p>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-green-600 hover:bg-green-700 text-white transition-colors" 
              disabled={!reasonType}
            >
              Finalizar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
