'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Notification } from '@/lib/types'
import { apiFetch } from '@/lib/api'
import { NotificationItem } from '@/components/notification-item'
import { NotificationDetailDialog } from '@/components/notification-detail-dialog'
import { MobileNav } from '@/components/mobile-nav'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, CheckCheck } from 'lucide-react'

export default function NotificationsPage() {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    async function fetchNotifications() {
      if (!user) return
      try {
        const res = await apiFetch('/api/notificacoes')
        const mapped = (res.data || []).map((n: any) => ({
          id: n.id,
          userId: n.usuarioId,
          type: n.dados?.tipo || 'message',
          petId: n.dados?.publicacaoId || n.dados?.petId ? String(n.dados.publicacaoId || n.dados.petId) : '',
          sightingId: n.dados?.avistamentoId,
          title: n.titulo,
          message: n.corpo || '',
          read: n.lida,
          createdAt: new Date(n.criadaEm),
          sighting: undefined
        }))
        setNotifications(mapped)
      } catch (error: any) {
        console.error('Erro ao buscar notificações:', error)
        const msg = error?.message || ''
        if (error?.status === 401 || /token/i.test(msg) || /expirado/i.test(msg)) {
          logout()
          router.push('/login')
        }
      }
    }
    fetchNotifications()
  }, [user, logout, router])

  const unreadCount = notifications.filter((n) => !n.read).length

  const filteredNotifications =
    filter === 'unread' ? notifications.filter((n) => !n.read) : notifications

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await apiFetch('/api/notificacoes/marcar-lidas', {
        method: 'POST',
        body: JSON.stringify({ ids: [notificationId] })
      })
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      )
    } catch (error) {
      console.error('Erro ao marcar como lida:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
    if (unreadIds.length === 0) return

    try {
      await apiFetch('/api/notificacoes/marcar-lidas', {
        method: 'POST',
        body: JSON.stringify({ ids: unreadIds })
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error)
    }
  }

  const handleViewNotification = async (notification: Notification & { sightingId?: number }) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id)
    }

    if (notification.petId) {
      router.push(`/pet/${notification.petId}`)
      return
    }

    let notifToView = notification

    if (notification.type === 'sighting' && !notification.sighting && notification.sightingId) {
      try {
        const sightingData = await apiFetch(`/api/avistamentos/${notification.sightingId}`)
        if (sightingData) {
          notifToView = {
            ...notification,
            sighting: {
              id: String(sightingData.id),
              petId: String(sightingData.publicacaoId),
              location: {
                lat: Number(sightingData.latitude),
                lng: Number(sightingData.longitude),
                address: sightingData.endereco_texto,
                city: '',
              },
              date: new Date(sightingData.data_avistamento),
              time: new Date(sightingData.data_avistamento).toLocaleTimeString(),
              description: sightingData.observacoes || '',
              reporterName: sightingData.usuario?.nome || 'Anônimo',
              reporterPhone: sightingData.usuario?.telefone || '',
              createdAt: new Date(sightingData.data_avistamento)
            }
          }
          setNotifications(prev => prev.map(n => n.id === notification.id ? notifToView : n))
        }
      } catch (err) {
        console.error('Erro ao carregar detalhes do avistamento', err)
      }
    }

    setSelectedNotification(notifToView)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-teal-50 to-orange-50 pb-20">

      <main className="container mx-auto px-3 py-3 sm:px-4 sm:py-6">
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/')}
                className="p-1.5"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-base sm:text-xl font-bold">Notificações</h1>
                {unreadCount > 0 && (
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    {unreadCount} não {unreadCount === 1 ? 'lida' : 'lidas'}
                  </p>
                )}
              </div>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-[10px] sm:text-xs px-2 h-7"
              >
                <CheckCheck className="w-3.5 h-3.5 mr-1" />
                Marcar todas
              </Button>
            )}
          </div>

          <Tabs value={filter} onValueChange={(value) => setFilter(value as any)}>
            <TabsList className="w-full h-8 sm:h-10">
              <TabsTrigger value="all" className="flex-1 text-xs sm:text-sm">
                Todas ({notifications.length})
              </TabsTrigger>
              <TabsTrigger value="unread" className="flex-1 text-xs sm:text-sm">
                Não lidas ({unreadCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCheck className="w-6 h-6 text-gray-400" />
            </div>
            <h2 className="text-base font-semibold mb-1.5">
              {filter === 'unread' ? 'Tudo em dia!' : 'Sem notificações'}
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm">
              {filter === 'unread'
                ? 'Você não tem notificações não lidas'
                : 'Você ainda não recebeu nenhuma notificação'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onView={handleViewNotification}
                onMarkAsRead={handleMarkAsRead}
              />
            ))}
          </div>
        )}
      </main>

      <NotificationDetailDialog
        notification={selectedNotification}
        open={!!selectedNotification}
        onClose={() => setSelectedNotification(null)}
      />

      <MobileNav />
    </div>
  )
}
