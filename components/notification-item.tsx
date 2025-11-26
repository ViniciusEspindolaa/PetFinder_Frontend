'use client'

import { Notification } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Bell, Eye, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NotificationItemProps {
  notification: Notification
  onView: (notification: Notification) => void
  onMarkAsRead: (notificationId: string) => void
}

export function NotificationItem({ notification, onView, onMarkAsRead }: NotificationItemProps) {
  const getIcon = () => {
    switch (notification.type) {
      case 'sighting':
        return <Eye className="w-4 h-4 text-orange-600" />
      case 'nearby':
        return <MapPin className="w-4 h-4 text-blue-600" />
      default:
        return <Bell className="w-4 h-4 text-gray-600" />
    }
  }

  const getTypeLabel = () => {
    switch (notification.type) {
      case 'sighting':
        return 'Avistamento'
      case 'nearby':
        return 'Pet próximo'
      default:
        return 'Notificação'
    }
  }

  return (
    <Card
      className={cn(
        'overflow-hidden cursor-pointer transition-colors hover:bg-gray-50 active:scale-[0.99]',
        !notification.read && 'bg-teal-50 border-teal-200'
      )}
      onClick={() => onView(notification)}
    >
      <CardContent className="p-2.5 sm:p-4">
        <div className="flex gap-2">
          <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-0.5">
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0.5 h-4">
                {getTypeLabel()}
              </Badge>
              {!notification.read && (
                <div className="w-1.5 h-1.5 bg-teal-600 rounded-full flex-shrink-0 mt-1" />
              )}
            </div>

            <h3 className="font-semibold text-xs sm:text-sm mb-0.5 leading-tight">{notification.title}</h3>
            <p className="text-[11px] text-muted-foreground mb-1 line-clamp-2 leading-snug">{notification.message}</p>

            <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {new Date(notification.createdAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        </div>

        {!notification.read && (
          <div className="mt-1.5 pt-1.5 border-t">
            <Button
              size="sm"
              variant="outline"
              className="w-full text-[10px] h-6"
              onClick={(e) => {
                e.stopPropagation()
                onMarkAsRead(notification.id)
              }}
            >
              Marcar como lida
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
