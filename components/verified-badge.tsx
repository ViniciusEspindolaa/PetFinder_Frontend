'use client'

import { BadgeCheck, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface VerifiedBadgeProps {
  contatoVerificado?: boolean
  identidadeVerificada?: boolean
  className?: string
  size?: 'sm' | 'md'
}

export function VerifiedBadge({
  contatoVerificado,
  identidadeVerificada,
  className,
  size = 'sm',
}: VerifiedBadgeProps) {
  if (!contatoVerificado && !identidadeVerificada) return null

  const textClass = size === 'sm' ? 'text-[10px]' : 'text-xs'

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {contatoVerificado && (
        <Badge
          variant="secondary"
          className={cn('bg-teal-50 text-teal-700 border-teal-200 gap-0.5', textClass)}
        >
          <BadgeCheck className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          Contato verificado
        </Badge>
      )}
      {identidadeVerificada && (
        <Badge
          variant="secondary"
          className={cn('bg-blue-50 text-blue-700 border-blue-200 gap-0.5', textClass)}
        >
          <ShieldCheck className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          Identidade verificada
        </Badge>
      )}
    </div>
  )
}
