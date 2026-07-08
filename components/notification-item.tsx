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
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0 mt-1">{getIcon()}</div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                {getTypeLabel()}
              </Badge>
              {!notification.read && (
                <div className="w-2 h-2 bg-teal-600 rounded-full flex-shrink-0 mt-1" />
              )}
            </div>

            <h3 className="font-semibold text-sm sm:text-base mb-1 leading-tight">{notification.title}</h3>
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2 leading-snug">{notification.message}</p>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
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
          <div className="mt-3 pt-3 border-t">
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs h-8"
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
