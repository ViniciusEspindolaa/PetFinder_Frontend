'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { ArrowLeft, Bell, MapPin, Shield, Eye } from 'lucide-react'

interface UserSettings {
  notifySightings: boolean
  notifyNearby: boolean
  notifyAdoption: boolean
  autoLocation: boolean
  alertRadius: number
  highContrast?: boolean
}

const defaultSettings: UserSettings = {
  notifySightings: true,
  notifyNearby: true,
  notifyAdoption: true,
  autoLocation: true,
  alertRadius: 10,
  highContrast: false,
}

export default function SettingsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [settings, setSettings] = useState<UserSettings>(defaultSettings)
  const [loadingSettings, setLoadingSettings] = useState(true)
  
  // Password Change State
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    // Load high contrast from local storage
    const isHighContrast = localStorage.getItem('high-contrast') === 'true'
    
    if (user) {
      apiFetch(`/api/usuarios/${user.id}`)
        .then((userData: any) => {
          if (userData.configuracoes) {
             // Merge with default settings to ensure all keys exist
             setSettings({ 
               ...defaultSettings, 
               ...userData.configuracoes,
               highContrast: isHighContrast // Local storage overrides or syncs
             })
          } else {
            setSettings(prev => ({ ...prev, highContrast: isHighContrast }))
          }
        })
        .catch(err => console.error(err))
        .finally(() => setLoadingSettings(false))
    }
  }, [user])

  const updateSetting = async (key: keyof UserSettings, value: any) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)

    if (key === 'highContrast') {
      localStorage.setItem('high-contrast', String(value))
      window.dispatchEvent(new Event('high-contrast-change'))
      // We don't necessarily need to save this to the backend if it's a device preference, 
      // but we can if we want to sync it. For now, let's just keep it local + backend sync if possible.
    }

    try {
      await apiFetch(`/api/usuarios/${user!.id}/config`, {
        method: 'PATCH',
        body: JSON.stringify({ configuracoes: newSettings })
      })
    } catch (error) {
      console.error('Failed to update settings', error)
      // Don't revert UI for high contrast as it is local
      if (key !== 'highContrast') {
        setSettings(settings)
        toast({
          title: "Erro",
          description: "Não foi possível salvar a configuração.",
          variant: "destructive"
        })
      }
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast({
        title: "Erro",
        description: "A nova senha e a confirmação não coincidem.",
        variant: "destructive"
      })
      return
    }

    setIsChangingPassword(true)
    try {
      await apiFetch(`/api/usuarios/${user!.id}/password`, {
        method: 'PATCH',
        body: JSON.stringify({ senhaAtual: currentPassword, novaSenha: newPassword })
      })
      
      toast({
        title: "Sucesso",
        description: "Sua senha foi alterada com sucesso.",
      })
      setChangePasswordOpen(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      console.error('Failed to change password', error)
      toast({
        title: "Erro",
        description: error.message || "Não foi possível alterar a senha. Verifique sua senha atual.",
        variant: "destructive"
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  if (isLoading || loadingSettings) {
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
    <div className="min-h-screen bg-linear-to-br from-teal-50 to-orange-50">

      <main className="container mx-auto px-4 py-6 space-y-4 max-w-2xl">
        <div className="mb-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/profile')}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Configurações</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notificações
            </CardTitle>
            <CardDescription>Gerencie suas preferências de notificação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notify-sightings">Avistamentos</Label>
                <p className="text-sm text-muted-foreground">Receber notificações de avistamentos dos seus pets</p>
              </div>
              <Switch 
                id="notify-sightings" 
                checked={settings.notifySightings}
                onCheckedChange={(checked) => updateSetting('notifySightings', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notify-nearby">Pets próximos</Label>
                <p className="text-sm text-muted-foreground">Alertas de pets perdidos/encontrados perto de você</p>
              </div>
              <Switch 
                id="notify-nearby" 
                checked={settings.notifyNearby}
                onCheckedChange={(checked) => updateSetting('notifyNearby', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notify-adoption">Pets para Adoção</Label>
                <p className="text-sm text-muted-foreground">Receber alertas sobre novos pets disponíveis para adoção</p>
              </div>
              <Switch 
                id="notify-adoption" 
                checked={settings.notifyAdoption}
                onCheckedChange={(checked) => updateSetting('notifyAdoption', checked)}
              />
            </div>
            
            {settings.notifyNearby && (
              <div className="space-y-3 pt-2 border-t">
                <div className="flex justify-between">
                  <Label>Raio de Alerta</Label>
                  <span className="text-sm text-muted-foreground">{settings.alertRadius} km</span>
                </div>
                <Slider
                  defaultValue={[settings.alertRadius]}
                  value={[settings.alertRadius]}
                  max={20}
                  min={1}
                  step={1}
                  onValueChange={(vals) => setSettings({ ...settings, alertRadius: vals[0] })}
                  onValueCommit={(vals) => updateSetting('alertRadius', vals[0])}
                />
                <p className="text-xs text-muted-foreground">
                  Você receberá alertas de pets dentro deste raio de distância.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Acessibilidade
            </CardTitle>
            <CardDescription>Opções de visualização e acessibilidade</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="high-contrast">Alto Contraste</Label>
                <p className="text-sm text-muted-foreground">Aumenta o contraste das cores para melhor legibilidade</p>
              </div>
              <Switch 
                id="high-contrast" 
                checked={settings.highContrast}
                onCheckedChange={(checked) => updateSetting('highContrast', checked)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Segurança
            </CardTitle>
            <CardDescription>Gerencie a segurança da sua conta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Senha</Label>
                <p className="text-sm text-muted-foreground">Altere sua senha periodicamente para manter sua conta segura</p>
              </div>
              <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">Alterar Senha</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Alterar Senha</DialogTitle>
                    <DialogDescription>
                      Digite sua senha atual e a nova senha desejada.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleChangePassword} className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Senha Atual</Label>
                      <Input
                        id="current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">Nova Senha</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={8}
                      />
                      <p className="text-xs text-muted-foreground">Mínimo de 8 caracteres</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setChangePasswordOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isChangingPassword}>
                        {isChangingPassword ? 'Alterando...' : 'Salvar Nova Senha'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Localização
            </CardTitle>
            <CardDescription>Configurações de localização e privacidade</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-location">Detecção automática</Label>
                <p className="text-sm text-muted-foreground">Usar sua localização para sugestões personalizadas</p>
              </div>
              <Switch 
                id="auto-location" 
                checked={settings.autoLocation}
                onCheckedChange={(checked) => updateSetting('autoLocation', checked)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Privacidade e Dados</CardTitle>
            <CardDescription>Gerencie seus dados e privacidade</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              Baixar meus dados
            </Button>
            <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
              Excluir conta
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

