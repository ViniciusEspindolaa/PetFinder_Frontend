'use client'

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import Image from 'next/image'
import { X } from 'lucide-react'

interface ImageDialogProps {
  src: string
  alt: string
  open: boolean
  onClose: () => void
}

export function ImageDialog({ src, alt, open, onClose }: ImageDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-transparent border-none shadow-none flex items-center justify-center focus:outline-none">
        <DialogTitle className="sr-only">Visualização da imagem</DialogTitle>
        <div className="relative w-full h-full flex items-center justify-center" onClick={onClose}>
          <div className="relative w-full h-full max-w-5xl max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <Image
              src={src}
              alt={alt}
              fill
              className="object-contain"
              priority
              sizes="90vw"
            />
          </div>
          <button
            onClick={onClose}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-50"
          >
            <X className="w-6 h-6" />
            <span className="sr-only">Fechar</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
