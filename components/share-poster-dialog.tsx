'use client'

import { useState, useRef } from 'react'
import { Pet } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, Share2 } from 'lucide-react'
import Image from 'next/image'

interface SharePosterDialogProps {
  pet: Pet | null
  open: boolean
  onClose: () => void
}

export function SharePosterDialog({ pet, open, onClose }: SharePosterDialogProps) {
  const posterRef = useRef<HTMLDivElement>(null)

  if (!pet) return null

  const statusConfig = {
    lost: { label: 'PERDIDO', color: '#dc2626', datePrefix: 'Perdido em' }, // red-600
    found: { label: 'ENCONTRADO', color: '#2563eb', datePrefix: 'Encontrado em' }, // blue-600
    adoption: { label: 'PARA ADOÇÃO', color: '#16a34a', datePrefix: 'Disponível desde' }, // green-600
  }

  const config = statusConfig[pet.status]

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const getShareMessage = () => {
    const name = pet.name || 'Este pet'
    switch (pet.status) {
      case 'adoption':
        return `🏠 ADOÇÃO: ${name} procura um lar! Ajude a compartilhar ❤️`
      case 'found':
        return `👀 ENCONTRADO: ${name} foi encontrado! Ajude a achar o dono 🙏`
      default:
        return `🆘 PERDIDO: ${name} precisa de ajuda para voltar pra casa! 😢`
    }
  }

  const handleNativeShare = async () => {
    if (!posterRef.current) return

    try {
      // @ts-ignore
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(posterRef.current, {
        scale: 5,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
      })

      canvas.toBlob(async (blob) => {
        if (!blob) return

        const file = new File([blob], `poster-${pet.name || 'pet'}.png`, { type: 'image/png' })
        const message = getShareMessage()
        const url = window.location.href
        const fullText = `${message}\n\n${url}\n\nvia PetFinder 🐾`

        if (navigator.share) {
          try {
            // Tenta compartilhar com a imagem (suportado na maioria dos mobiles modernos)
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              await navigator.share({
                files: [file],
                title: message,
                text: fullText,
              })
            } else {
              // Fallback para compartilhar apenas texto e link (se não suportar imagem)
              await navigator.share({
                title: message,
                text: fullText,
                url: url
              })
            }
          } catch (error) {
            if ((error as any).name !== 'AbortError') {
              console.error('Error sharing:', error)
            }
          }
        } else {
          alert('Seu navegador não suporta compartilhamento nativo. Use os botões abaixo.')
        }
      }, 'image/png')
    } catch (error) {
      console.error('Erro ao gerar poster:', error)
      alert('Erro ao preparar compartilhamento.')
    }
  }

  const handleDownload = async () => {
    if (!posterRef.current) return

    try {
      // @ts-ignore
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(posterRef.current, {
        scale: 5,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
      })

      const link = document.createElement('a')
      link.download = `poster-${pet.name || 'pet'}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      console.error('Erro ao baixar poster:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm md:max-w-md max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Compartilhar Anúncio</DialogTitle>
          <DialogDescription>
            Ajude a divulgar para encontrar este pet mais rápido!
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center w-full overflow-y-auto overflow-x-hidden py-2">
          {/* ...existing code... */}
          <div 
            ref={posterRef} 
            className="bg-white overflow-hidden flex flex-col shrink-0 shadow-lg relative w-full max-w-[400px] mx-auto rounded-xl" 
            style={{ 
              backgroundColor: '#ffffff' 
            }}
          >
            <div className="text-white text-center py-3 shrink-0 flex items-center justify-center" style={{ backgroundColor: config.color, color: '#ffffff' }}>
              <h2 className="text-2xl font-black tracking-wider uppercase">{config.label}</h2>
            </div>

            <div className="p-5 flex-1 flex flex-col">
              <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-4 shrink-0 border-4 shadow-sm" style={{ borderColor: '#ffffff' }}>
                <Image
                  src={pet.photoUrl || "/placeholder.svg"}
                  alt={pet.name || 'Pet'}
                  fill
                  className="object-cover"
                />
                {pet.reward && (
                  <div className="absolute bottom-0 right-0 text-white text-sm font-bold px-3 py-1 rounded-tl-xl shadow-sm z-10" style={{ backgroundColor: '#f59e0b' }}>
                    R$ {pet.reward}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="text-center space-y-1">
                  {pet.name && (
                    <h3 className="text-3xl font-black leading-tight" style={{ color: '#111827' }}>{pet.name}</h3>
                  )}
                  <p className="text-lg font-medium" style={{ color: '#4b5563' }}>{pet.breed}</p>
                </div>

                {pet.description && (
                  <div className="px-2">
                    <p className="text-center text-sm italic leading-relaxed" style={{ color: '#4b5563' }}>
                      "{pet.description}"
                    </p>
                  </div>
                )}

                <div className="space-y-2 p-3 rounded-lg border" style={{ backgroundColor: '#f9fafb', borderColor: '#f3f4f6' }}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold" style={{ color: '#374151' }}>Local:</span>
                    <span className="font-medium text-right" style={{ color: '#111827' }}>{pet.location.address}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm border-t pt-2" style={{ borderColor: '#e5e7eb' }}>
                    <span className="font-bold" style={{ color: '#374151' }}>{config.datePrefix}:</span>
                    <span className="font-medium" style={{ color: '#111827' }}>{formatDate(pet.lastSeenDate)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 p-4 rounded-xl mt-4" style={{ backgroundColor: '#111827', color: '#ffffff' }}>
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#9ca3af' }}>Entre em contato</p>
                    <p className="text-xl font-black leading-none mb-1">{pet.contactPhone}</p>
                    <p className="text-sm" style={{ color: '#d1d5db' }}>{pet.contactName}</p>
                  </div>
                  <div className="shrink-0 p-1.5 rounded-lg" style={{ backgroundColor: '#ffffff' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(typeof window !== 'undefined' ? `${window.location.origin}/pet/${pet.id}` : '')}`}
                      alt="QR Code"
                      className="w-14 h-14"
                      crossOrigin="anonymous"
                    />
                  </div>
                </div>

                <div className="text-center pt-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#9ca3af' }}>
                    Veja mais no PetFinder • Escaneie o QR Code
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button onClick={handleNativeShare} className="w-full h-12 text-base bg-teal-600 hover:bg-teal-700 shadow-md">
            <Share2 className="w-5 h-5 mr-2" />
            Compartilhar
          </Button>

          <Button onClick={handleDownload} variant="outline" className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Baixar Poster (PNG)
          </Button>


        </div>
      </DialogContent>
    </Dialog>
  )
}
