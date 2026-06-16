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
import { Download, Share2, Printer, Smartphone, Loader2 } from 'lucide-react'
import Image from 'next/image'

interface SharePosterDialogProps {
  pet: Pet | null
  open: boolean
  onClose: () => void
}

export function SharePosterDialog({ pet, open, onClose }: SharePosterDialogProps) {
  const socialPosterRef = useRef<HTMLDivElement>(null)
  const a4PosterRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState<'social' | 'a4'>('social')
  const [isGenerating, setIsGenerating] = useState(false)

  if (!pet) return null

  const statusConfig = {
    lost: { label: 'PERDIDO', color: '#dc2626', datePrefix: 'Perdido em' },
    found: { label: 'ENCONTRADO', color: '#2563eb', datePrefix: 'Encontrado em' },
    adoption: { label: 'PARA ADOÇÃO', color: '#16a34a', datePrefix: 'Disponível desde' },
    rescue: { label: 'SOS RESGATE', color: '#9333ea', datePrefix: 'Emergência desde' }
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

  const getCanvas = async (ref: { current: HTMLDivElement | null }, scale: number) => {
    if (!ref.current) return null
    // @ts-ignore
    const html2canvas = (await import('html2canvas')).default
    return html2canvas(ref.current, {
      scale,
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: true,
    })
  }

  const handleNativeShare = async () => {
    setIsGenerating(true)
    try {
      const canvas = await getCanvas(socialPosterRef, 5)
      if (!canvas) return

      canvas.toBlob(async (blob) => {
        if (!blob) return
        const file = new File([blob], `poster-${pet.name || 'pet'}.png`, { type: 'image/png' })
        const message = getShareMessage()
        const url = window.location.href
        const fullText = `${message}\n\n${url}\n\nvia PetFinder 🐾`

        if (navigator.share) {
          try {
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              await navigator.share({ files: [file], title: message, text: fullText })
            } else {
              await navigator.share({ title: message, text: fullText, url })
            }
          } catch (error) {
            if ((error as any).name !== 'AbortError') console.error('Error sharing:', error)
          }
        } else {
          alert('Seu navegador não suporta compartilhamento nativo. Use "Baixar Imagem".')
        }
      }, 'image/png')
    } catch (error) {
      console.error('Erro ao gerar poster:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownloadSocial = async () => {
    setIsGenerating(true)
    try {
      const canvas = await getCanvas(socialPosterRef, 5)
      if (!canvas) return
      const link = document.createElement('a')
      link.download = `poster-${pet.name || 'pet'}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      console.error('Erro ao baixar poster:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePrint = async () => {
    setIsGenerating(true)
    try {
      const canvas = await getCanvas(a4PosterRef, 4)
      if (!canvas) return
      const dataUrl = canvas.toDataURL('image/png')
      const win = window.open('', '_blank')
      if (!win) {
        alert('Permita pop-ups para esta página e tente novamente.')
        return
      }
      win.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Poster - ${pet.name || 'Pet'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 210mm; height: 297mm; background: white; }
    img { width: 210mm; height: 297mm; display: block; }
    @page { size: A4 portrait; margin: 0; }
  </style>
</head>
<body>
  <img src="${dataUrl}" />
  <script>window.onload = function() { setTimeout(function(){ window.print(); }, 300); }<\/script>
</body>
</html>`)
      win.document.close()
    } catch (error) {
      console.error('Erro ao preparar impressão:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownloadA4 = async () => {
    setIsGenerating(true)
    try {
      const canvas = await getCanvas(a4PosterRef, 4)
      if (!canvas) return
      const link = document.createElement('a')
      link.download = `poster-A4-${pet.name || 'pet'}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      console.error('Erro ao baixar poster A4:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const qrUrl = typeof window !== 'undefined' ? `${window.location.origin}/pet/${pet.id}` : ''

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm md:max-w-lg max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Compartilhar Anúncio</DialogTitle>
          <DialogDescription>
            Ajude a divulgar para encontrar este pet mais rápido!
          </DialogDescription>
        </DialogHeader>

        {/* Tab switcher */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab('social')}
            className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium py-2 px-3 rounded-md transition-colors ${
              activeTab === 'social' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            Redes Sociais
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('a4')}
            className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium py-2 px-3 rounded-md transition-colors ${
              activeTab === 'a4' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Printer className="w-4 h-4" />
            Imprimir A4
          </button>
        </div>

        {/* ── SOCIAL POSTER ── */}
        {activeTab === 'social' && (
          <div className="flex justify-center w-full overflow-y-auto overflow-x-hidden py-2">
            <div
              ref={socialPosterRef}
              className="bg-white overflow-hidden flex flex-col shrink-0 shadow-lg relative w-full max-w-[400px] mx-auto rounded-xl"
              style={{ backgroundColor: '#ffffff' }}
            >
              <div
                className="text-white text-center py-3 shrink-0 flex items-center justify-center"
                style={{ backgroundColor: config.color, color: '#ffffff' }}
              >
                <h2 className="text-2xl font-black tracking-wider uppercase">{config.label}</h2>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <div
                  className="relative w-full aspect-square rounded-xl overflow-hidden mb-4 shrink-0 border-4 shadow-sm"
                  style={{ borderColor: '#ffffff' }}
                >
                  <Image src={pet.photoUrl || '/placeholder.svg'} alt={pet.name || 'Pet'} fill className="object-cover" />
                  {pet.reward && (
                    <div
                      className="absolute bottom-0 right-0 text-white text-sm font-bold px-3 py-1 rounded-tl-xl shadow-sm z-10"
                      style={{ backgroundColor: '#f59e0b' }}
                    >
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

                  <div
                    className="flex items-center justify-between gap-4 p-4 rounded-xl mt-4"
                    style={{ backgroundColor: '#111827', color: '#ffffff' }}
                  >
                    <div className="flex-1">
                      <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#9ca3af' }}>Entre em contato</p>
                      <p className="text-xl font-black leading-none mb-1">{pet.contactPhone}</p>
                      <p className="text-sm" style={{ color: '#d1d5db' }}>{pet.contactName}</p>
                    </div>
                    <div className="shrink-0 p-1.5 rounded-lg" style={{ backgroundColor: '#ffffff' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrUrl)}`}
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
        )}

        {/* ── A4 POSTER ── */}
        {activeTab === 'a4' && (
          <div className="flex justify-center w-full overflow-y-auto overflow-x-hidden py-2">
            <div
              ref={a4PosterRef}
              style={{
                backgroundColor: '#ffffff',
                width: '100%',
                maxWidth: '420px',
                aspectRatio: '210 / 297',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                borderRadius: '4px',
              }}
            >
              {/* Header */}
              <div style={{
                backgroundColor: config.color,
                color: '#ffffff',
                padding: '14px 22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
              }}>
                <div>
                  <div style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '0.08em', lineHeight: 1 }}>
                    {config.label}
                  </div>
                  <div style={{ fontSize: '10px', fontWeight: 600, opacity: 0.8, marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Ajude a encontrar este pet
                  </div>
                </div>
                <div style={{ fontSize: '36px', opacity: 0.25 }}>🐾</div>
              </div>

              {/* Photo + traits row */}
              <div style={{ display: 'flex', gap: '14px', padding: '14px 18px', flexShrink: 0 }}>
                <div style={{
                  position: 'relative',
                  width: '160px',
                  height: '160px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  flexShrink: 0,
                  border: `4px solid ${config.color}`,
                }}>
                  <Image
                    src={pet.photoUrl || '/placeholder.svg'}
                    alt={pet.name || 'Pet'}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                  {pet.reward && (
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      backgroundColor: '#f59e0b',
                      color: 'white',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderTopLeftRadius: '6px',
                    }}>
                      R$ {pet.reward}
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '7px' }}>
                  {pet.name && (
                    <div style={{ fontSize: '22px', fontWeight: 900, color: '#111827', lineHeight: 1.1 }}>
                      {pet.name}
                    </div>
                  )}
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>{pet.breed}</div>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      backgroundColor: `${config.color}20`,
                      color: config.color,
                      padding: '2px 8px',
                      borderRadius: '99px',
                      border: `1px solid ${config.color}40`,
                    }}>
                      {pet.size === 'small' ? 'Porte Pequeno' : pet.size === 'medium' ? 'Porte Médio' : 'Porte Grande'}
                    </span>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      padding: '2px 8px',
                      borderRadius: '99px',
                    }}>
                      {pet.type === 'dog' ? '🐕 Cachorro' : pet.type === 'cat' ? '🐈 Gato' : '🐾 Outro'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {pet.description && (
                <div style={{ padding: '0 18px 12px', flexShrink: 0 }}>
                  <div style={{
                    fontSize: '11px',
                    color: '#4b5563',
                    fontStyle: 'italic',
                    lineHeight: 1.6,
                    backgroundColor: '#f9fafb',
                    padding: '9px 13px',
                    borderRadius: '7px',
                    borderLeft: `3px solid ${config.color}`,
                  }}>
                    "{pet.description}"
                  </div>
                </div>
              )}

              {/* Location + date */}
              <div style={{
                margin: '0 18px 12px',
                padding: '11px 13px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                backgroundColor: '#f9fafb',
                flexShrink: 0,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
              }}>
                <div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>
                    📍 Local
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#111827' }}>{pet.location.address}</div>
                  {pet.location.neighborhood && (
                    <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '1px' }}>
                      {pet.location.neighborhood}, {pet.location.city}
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>
                    📅 {config.datePrefix}
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#111827' }}>{formatDate(pet.lastSeenDate)}</div>
                </div>
              </div>

              {/* Spacer */}
              <div style={{ flex: 1 }} />

              {/* Contact + QR */}
              <div style={{
                margin: '0 18px 14px',
                padding: '13px 15px',
                borderRadius: '10px',
                backgroundColor: '#111827',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                flexShrink: 0,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px' }}>
                    Entre em Contato
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 900, lineHeight: 1, marginBottom: '4px' }}>
                    {pet.contactPhone}
                  </div>
                  <div style={{ fontSize: '12px', color: '#d1d5db' }}>{pet.contactName}</div>
                </div>
                <div style={{ flexShrink: 0, textAlign: 'center' }}>
                  <div style={{ backgroundColor: '#ffffff', padding: '5px', borderRadius: '7px', display: 'inline-block' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrUrl)}`}
                      alt="QR Code"
                      style={{ width: '60px', height: '60px', display: 'block' }}
                      crossOrigin="anonymous"
                    />
                  </div>
                  <div style={{ fontSize: '8px', color: '#9ca3af', marginTop: '3px' }}>Ver no app</div>
                </div>
              </div>

              {/* Footer */}
              <div style={{
                padding: '9px 18px',
                borderTop: `3px solid ${config.color}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
              }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  🐾 PetFinder
                </div>
                <div style={{ fontSize: '9px', color: '#d1d5db' }}>
                  Escaneie o QR Code para ver mais detalhes
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Action buttons ── */}
        {activeTab === 'social' ? (
          <div className="space-y-2">
            <Button
              onClick={handleNativeShare}
              disabled={isGenerating}
              className="w-full h-12 text-base bg-teal-600 hover:bg-teal-700 shadow-md"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Share2 className="w-5 h-5 mr-2" />}
              {isGenerating ? 'Gerando...' : 'Compartilhar'}
            </Button>
            <Button onClick={handleDownloadSocial} disabled={isGenerating} variant="outline" className="w-full">
              {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Baixar Imagem (PNG)
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Button
              onClick={handlePrint}
              disabled={isGenerating}
              className="w-full h-12 text-base bg-teal-600 hover:bg-teal-700 shadow-md"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Printer className="w-5 h-5 mr-2" />}
              {isGenerating ? 'Preparando...' : 'Imprimir em A4'}
            </Button>
            <Button onClick={handleDownloadA4} disabled={isGenerating} variant="outline" className="w-full">
              {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Baixar PNG (alta resolução)
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
