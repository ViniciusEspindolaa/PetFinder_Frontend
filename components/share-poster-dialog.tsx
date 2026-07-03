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
import { Download, Share2, Loader2 } from 'lucide-react'
import Image from 'next/image'

interface SharePosterDialogProps {
  pet: Pet | null
  open: boolean
  onClose: () => void
}

export function SharePosterDialog({ pet, open, onClose }: SharePosterDialogProps) {
  const posterRef = useRef<HTMLDivElement>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  if (!pet) return null

  const statusConfig = {
    lost:     { label: 'PERDIDO',     color: '#dc2626', datePrefix: 'Perdido em' },
    found:    { label: 'ENCONTRADO',  color: '#2563eb', datePrefix: 'Encontrado em' },
    adoption: { label: 'PARA ADOÇÃO', color: '#16a34a', datePrefix: 'Disponível desde' },
    rescue:   { label: 'SOS RESGATE', color: '#9333ea', datePrefix: 'Emergência desde' },
  }
  const cfg = statusConfig[pet.status]

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  const getShareMessage = () => {
    const name = pet.name || 'Este pet'
    if (pet.status === 'adoption') return `🏠 ADOÇÃO: ${name} procura um lar! ❤️`
    if (pet.status === 'found')    return `👀 ENCONTRADO: ${name} foi encontrado! Ajude a achar o dono 🙏`
    return `🆘 PERDIDO: ${name} precisa de ajuda para voltar pra casa! 😢`
  }

  const getCanvas = async () => {
    if (!posterRef.current) return null
    // @ts-ignore
    const html2canvas = (await import('html2canvas')).default
    return html2canvas(posterRef.current, { scale: 5, backgroundColor: '#ffffff', useCORS: true, allowTaint: true })
  }

  const handleShare = async () => {
    setIsGenerating(true)
    try {
      const canvas = await getCanvas()
      if (!canvas) return
      canvas.toBlob(async (blob) => {
        if (!blob) return
        const filename = `poster-${pet.name || 'pet'}.png`
        const file = new File([blob], filename, { type: 'image/png' })
        const message = getShareMessage()
        const url = window.location.href
        const fullText = `${message}\n\n${url}\n\nvia PetFinder 🐾`
        if (navigator.share) {
          try {
            if (navigator.canShare?.({ files: [file] })) {
              await navigator.share({ files: [file], title: message, text: fullText })
            } else {
              await navigator.share({ title: message, text: fullText, url })
            }
          } catch (e) {
            if ((e as any).name !== 'AbortError') console.error(e)
          }
        } else {
          alert('Use "Baixar Imagem" para salvar e compartilhar manualmente.')
        }
      }, 'image/png')
    } catch (e) {
      console.error(e)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = async () => {
    setIsGenerating(true)
    try {
      const canvas = await getCanvas()
      if (!canvas) return
      const link = document.createElement('a')
      link.download = `poster-${pet.name || 'pet'}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (e) {
      console.error(e)
    } finally {
      setIsGenerating(false)
    }
  }

  const qrUrl = typeof window !== 'undefined' ? `${window.location.origin}/pet/${pet.id}` : ''
  const ageLabel = pet.age
    ? `${pet.age} ${(pet.unidadeIdade || pet.ageUnit) === 'MESES' ? 'meses' : 'anos'}`
    : null
  const locationLine = [pet.location.neighborhood, pet.location.city].filter(Boolean).join(', ')

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm md:max-w-lg max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Compartilhar Anúncio</DialogTitle>
          <DialogDescription>Ajude a divulgar para encontrar este pet mais rápido!</DialogDescription>
        </DialogHeader>

        {/* Poster */}
        <div className="flex justify-center w-full overflow-y-auto overflow-x-hidden py-2">
          <div
            ref={posterRef}
            className="bg-white overflow-hidden flex flex-col shrink-0 shadow-lg w-full max-w-[380px] mx-auto"
            style={{ backgroundColor: '#ffffff', fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            {/* header */}
            <div style={{ backgroundColor: cfg.color, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '0.07em', color: '#fff', lineHeight: 1 }}>{cfg.label}</div>
                <div style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Você viu este pet? Entre em contato!
                </div>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff', opacity: 0.5, letterSpacing: '0.04em', fontFamily: 'Nunito, sans-serif' }}>PetFinder</div>
            </div>

            {/* foto 4:5 */}
            <div style={{ position: 'relative', width: '100%', aspectRatio: '4/5' }}>
              <Image src={pet.photoUrl || '/placeholder.svg'} alt={pet.name || 'Pet'} fill style={{ objectFit: 'cover' }} />
              {pet.reward && (
                <div style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: '#f59e0b', color: '#fff', fontSize: '13px', fontWeight: 900, padding: '5px 14px', borderTopLeftRadius: '10px' }}>
                  🎁 R$ {pet.reward}
                </div>
              )}
            </div>
            <div style={{ height: '4px', backgroundColor: cfg.color }} />

            {/* info */}
            <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                {pet.name && <div style={{ fontSize: '26px', fontWeight: 900, color: cfg.color, lineHeight: 1 }}>{pet.name}</div>}
                <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '3px' }}>{[pet.breed, ageLabel].filter(Boolean).join(' · ')}</div>
              </div>
              {pet.description && (
                <div style={{ fontSize: '12px', color: '#4b5563', lineHeight: 1.6, borderLeft: `3px solid ${cfg.color}`, paddingLeft: '10px', fontStyle: 'italic' }}>
                  "{pet.description.length > 140 ? pet.description.slice(0, 137) + '...' : pet.description}"
                </div>
              )}
              <div style={{ padding: '10px 12px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', borderLeft: `3px solid ${cfg.color}`, fontSize: '12px' }}>
                <div style={{ fontWeight: 700, color: '#374151' }}>📍 {pet.location.address}</div>
                {locationLine && <div style={{ color: '#6b7280', marginTop: '2px' }}>{locationLine}</div>}
                <div style={{ borderTop: '1px solid #e5e7eb', marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, color: '#374151' }}>{cfg.datePrefix}:</span>
                  <span style={{ color: '#111827', fontWeight: 600 }}>{formatDate(pet.lastSeenDate)}</span>
                </div>
              </div>
            </div>

            {/* contato */}
            <div style={{ backgroundColor: '#111827', display: 'flex', alignItems: 'stretch' }}>
              <div style={{ flex: 1, padding: '14px 18px' }}>
                <div style={{ fontSize: '8px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Entre em Contato</div>
                <div style={{ fontSize: '27px', fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>{pet.contactPhone}</div>
                <div style={{ fontSize: '13px', color: '#d1d5db', marginTop: '3px' }}>{pet.contactName}</div>
              </div>
              <div style={{ width: '1px', backgroundColor: '#374151', margin: '12px 0' }} />
              <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ backgroundColor: '#fff', padding: '5px', borderRadius: '6px' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrUrl)}`} alt="QR" style={{ width: '56px', height: '56px', display: 'block' }} crossOrigin="anonymous" />
                </div>
              </div>
            </div>

            {/* footer */}
            <div style={{ padding: '7px 20px', borderTop: `3px solid ${cfg.color}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '9px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Nunito, sans-serif' }}>PetFinder</div>
              <div style={{ fontSize: '8px', color: '#aaa' }}>Escaneie o QR Code para ver mais</div>
            </div>
          </div>
        </div>

        {/* Botões */}
        <div className="space-y-2">
          <Button onClick={handleShare} disabled={isGenerating} className="w-full h-11 bg-teal-600 hover:bg-teal-700">
            {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Share2 className="w-4 h-4 mr-2" />}
            {isGenerating ? 'Gerando...' : 'Compartilhar'}
          </Button>
          <Button onClick={handleDownload} disabled={isGenerating} variant="outline" className="w-full">
            {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Baixar Imagem
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
