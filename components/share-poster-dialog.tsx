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

  const handleDownload = async () => {
    if (!posterRef.current) return

    try {
      // @ts-ignore
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(posterRef.current, {
        scale: 5, // Increased scale for better print quality
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
      })

      const link = document.createElement('a')
      link.download = `poster-${pet.name || 'pet'}-${pet.id}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      console.error(error)
      alert('Erro ao gerar poster. Por favor, tente novamente.')
    }
  }

  const handleShare = async (platform: 'instagram' | 'whatsapp' | 'facebook') => {
    if (!posterRef.current) return

    try {
      // @ts-ignore
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(posterRef.current, {
        scale: 5, // Increased scale for better print quality
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
      })

      canvas.toBlob(async (blob) => {
        if (!blob) return

        const file = new File([blob], `poster-${pet.name || 'pet'}.png`, { type: 'image/png' })
        const text = `${config.label}: ${pet.name || 'Pet sem nome'} - Ajude a encontrar!`
        const url = window.location.href

        // Try Web Share API Level 2 (File Sharing)
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: text,
                    text: text,
                })
                return
            } catch (error) {
                if ((error as any).name !== 'AbortError') {
                    console.error('Error sharing:', error)
                }
                // If aborted or failed, continue to fallback
            }
        }

        // Fallback for Desktop or browsers without file sharing support
        if (platform === 'whatsapp') {
          const message = encodeURIComponent(`${text}\n\n${url}`)
          window.open(`https://wa.me/?text=${message}`, '_blank')
        } else if (platform === 'facebook') {
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
        } else if (platform === 'instagram') {
          const link = document.createElement('a')
          link.download = `poster-${pet.name || 'pet'}-instagram.png`
          link.href = canvas.toDataURL('image/png')
          link.click()
          alert('Imagem baixada! Abra o Instagram e compartilhe a imagem nos Stories ou Feed.')
        }
      }, 'image/png')
    } catch (error) {
      console.error('Erro ao gerar poster:', error)
      alert('Erro ao gerar imagem para compartilhamento.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm md:max-w-md max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Compartilhar Anúncio</DialogTitle>
          <DialogDescription>
            Baixe o poster ou compartilhe nas redes sociais
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center w-full overflow-y-auto overflow-x-hidden py-2">
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
          <Button onClick={handleDownload} className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Baixar Poster (PNG)
          </Button>

          <div className="space-y-2">
            <p className="text-sm font-medium text-center">Compartilhar em:</p>
            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={() => handleShare('whatsapp')}
                className="bg-green-600 hover:bg-green-700 h-10 text-xs"
              >
                <div className="relative w-4 h-4 mr-1">
                  <Image 
                    src="/wpplogo.webp" 
                    alt="WhatsApp" 
                    fill 
                    className="object-contain brightness-0 invert" 
                  />
                </div>
                WhatsApp
              </Button>
              <Button
                onClick={() => handleShare('facebook')}
                className="bg-blue-600 hover:bg-blue-700 h-10 text-xs"
              >
                <div className="relative w-4 h-4 mr-1">
                  <Image 
                    src="/facebooklogo.webp" 
                    alt="Facebook" 
                    fill 
                    className="object-contain brightness-0 invert" 
                  />
                </div>
                Facebook
              </Button>
              <Button
                onClick={() => handleShare('instagram')}
                className="bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-10 text-xs"
              >
                <div className="relative w-4 h-4 mr-1">
                  <Image 
                    src="/instagramlogo.png" 
                    alt="Instagram" 
                    fill 
                    className="object-contain brightness-0 invert" 
                  />
                </div>
                Instagram
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
