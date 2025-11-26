"use client"

import React, { useEffect, useState } from 'react'
import { Bell, Check, X, ExternalLink } from 'lucide-react'
import apiFetch from '../lib/api'
import { formatDistanceToNow } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR'
import { useRouter } from 'next/navigation'

type Notificacao = {
  id: string
  titulo: string
  corpo?: string | null
  lida: boolean
  criadaEm: string
  dados?: any
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [loading, setLoading] = useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const fetchNotificacoes = async () => {
    setLoading(true)
    try {
      // Se não houver token armazenado, não tenta buscar (rota protegida)
      if (typeof window !== 'undefined') {
        const t = localStorage.getItem('token')
        if (!t) {
          setNotificacoes([])
          setLoading(false)
          return
        }
      }

      const res: any = await apiFetch('/api/notificacoes')
      setNotificacoes(res.data || [])
    } catch (err) {
      // Se for erro de autenticação, não poluir o console (usuário pode não estar logado)
      const status = (err as any)?.status
      const msg = (err as any)?.message || ''
      if (status === 401 || /token/i.test(msg) || /acesso obrigatório/i.test(msg)) {
        // Silencioso: limpar lista e parar
        setNotificacoes([])
      } else {
        console.error('Erro ao buscar notificações', err)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotificacoes()
    // Poll every 30s for new notifications while component mounted
    const iv = setInterval(fetchNotificacoes, 30000)
    return () => clearInterval(iv)
  }, [])

  const unreadCount = notificacoes.filter(n => !n.lida).length
  const displayedNotifications = notificacoes.slice(0, 5)

  const marcarLidas = async (ids: string[]) => {
    try {
      await apiFetch('/api/notificacoes/marcar-lidas', {
        method: 'POST',
        body: JSON.stringify({ ids })
      })
      // otimista
      setNotificacoes(prev => prev.map(p => ids.includes(p.id) ? { ...p, lida: true } : p))
    } catch (err) {
      console.error('Erro ao marcar lidas', err)
    }
  }

  const handleNotificationClick = async (n: Notificacao) => {
    if (!n.lida) {
      await marcarLidas([n.id])
    }
    
    // Navegar para o recurso relacionado
    if (n.dados?.publicacaoId || n.dados?.petId) {
      router.push(`/pet/${n.dados.publicacaoId || n.dados.petId}`)
      setOpen(false)
    } else {
      // Fallback
      router.push('/notifications')
      setOpen(false)
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button aria-label="Notificações" onClick={() => setOpen(!open)} className="relative p-2 rounded-md hover:bg-slate-100">
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="fixed left-2 right-2 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-96 bg-white border rounded-md shadow-lg z-50 flex flex-col">
          <div className="px-3 py-2 border-b flex items-center justify-between bg-slate-50 rounded-t-md">
            <strong className="text-sm font-semibold">Notificações</strong>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={() => marcarLidas(notificacoes.filter(n => !n.lida).map(n => n.id))} className="text-xs text-teal-600 hover:underline font-medium">Marcar todas como lidas</button>
              )}
            </div>
          </div>

          <div className="max-h-[60vh] overflow-auto">
            {loading && <div className="p-4 text-center text-sm text-muted-foreground">Carregando...</div>}
            {!loading && notificacoes.length === 0 && <div className="p-8 text-center text-sm text-slate-500">Você não tem notificações</div>}

            {displayedNotifications.map(n => (
              <div 
                key={n.id} 
                onClick={() => handleNotificationClick(n)}
                className={`px-3 py-3 border-b hover:bg-slate-50 cursor-pointer transition-colors flex items-start gap-3 ${n.lida ? 'bg-white' : 'bg-blue-50/50'}`}
              >
                <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.lida ? 'bg-transparent' : 'bg-blue-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className={`text-sm ${n.lida ? 'font-medium text-slate-700' : 'font-bold text-slate-900'}`}>{n.titulo}</span>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">{formatDistanceToNow(new Date(n.criadaEm), { addSuffix: true, locale: ptBR })}</span>
                  </div>
                  {n.corpo && <p className="text-xs text-slate-600 line-clamp-2">{n.corpo}</p>}
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-2 border-t bg-slate-50 rounded-b-md text-center">
            <button 
              onClick={() => {
                router.push('/notifications')
                setOpen(false)
              }}
              className="text-xs font-medium text-teal-600 hover:text-teal-700 hover:underline flex items-center justify-center gap-1 w-full py-1"
            >
              Ver todas as notificações
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationCenter
