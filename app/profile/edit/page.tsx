'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { MobileNav } from '@/components/mobile-nav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Save, MapPin, Eye, EyeOff } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import dynamic from 'next/dynamic'
import { apiFetch } from '@/lib/api'

const SelectableMap = dynamic(() => import('@/components/selectable-map'), { ssr: false })

export default function EditProfilePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: {
      address: '',
      city: '',
      lat: 0,
      lng: 0,
    },
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [addressQuery, setAddressQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<Array<any>>([])
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
    if (user) {
      // Fetch user details to get location
      apiFetch(`/api/usuarios/${user.id}`).then((userData: any) => {
        setFormData({
          name: userData.nome || user.name,
          phone: userData.telefone || user.phone,
          location: {
            address: '', // Will be filled by reverse geocoding
            city: '',    // Will be filled by reverse geocoding
            lat: userData.latitude ? parseFloat(userData.latitude) : 0,
            lng: userData.longitude ? parseFloat(userData.longitude) : 0,
          },
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
      }).catch(err => console.error('Failed to fetch user details', err))
    }
  }, [user, isLoading, router])

  // Reverse geocoding when location changes
  useEffect(() => {
    const doReverse = async () => {
      if (!formData.location.lat || !formData.location.lng) return
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${formData.location.lat}&lon=${formData.location.lng}&format=json&addressdetails=1`)
        const data = await res.json()
        const a = data?.address || {}
        const street = a.road || a.pedestrian || a.footway || a.cycleway || ''
        const house = a.house_number || ''
        const streetFull = house ? (street ? `${street}, ${house}` : house) : street
        const cityVal = a.city || a.town || a.village || a.county || a.state || ''
        
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            address: streetFull || data.display_name || '',
            city: cityVal
          }
        }))
      } catch (err) {
        console.error('Erro no reverse geocoding', err)
      }
    }
    
    doReverse()
  }, [formData.location.lat, formData.location.lng])

  const searchAddress = async () => {
    if (!addressQuery || addressQuery.trim().length < 3) return
    setSearching(true)
    try {
      const q = encodeURIComponent(addressQuery)
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=8&addressdetails=1`)
      const data = await res.json()

      const filtered = (data || []).filter((r: any) => {
        const a = r.address || {}
        const hasStreet = !!(a.road || a.pedestrian || a.footway || a.cycleway || a.house_number)
        const hasCity = !!(a.city || a.town || a.village || a.county || a.state)
        return hasStreet && hasCity
      })

      setSearchResults(filtered)
    } catch (err) {
      console.error('Erro ao buscar endereço', err)
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  function formatShortAddress(r: any) {
    const a = r.address || {}
    let street = a.road || a.pedestrian || a.footway || a.cycleway || ''
    if (a.house_number) {
      street = street ? `${street}, ${a.house_number}` : `${a.house_number}`
    }
    const city = a.city || a.town || a.village || a.county || a.state || ''
    const parts = [] as string[]
    if (street) parts.push(street)
    if (city) parts.push(city)
    return parts.length ? parts.join(', ') : (r.display_name || '')
  }

  const getCurrentLocation = () => {
    setIsGettingLocation(true)
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          
          setFormData(prev => ({
            ...prev,
            location: {
              ...prev.location,
              lat: latitude,
              lng: longitude
            }
          }))
          
          // Force reverse geocoding
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`)
            const data = await res.json()
            const a = data?.address || {}
            const street = a.road || a.pedestrian || a.footway || a.cycleway || ''
            const house = a.house_number || ''
            const streetFull = house ? (street ? `${street}, ${house}` : house) : street
            const cityVal = a.city || a.town || a.village || a.county || a.state || ''
            
            setFormData(prev => ({
              ...prev,
              location: {
                ...prev.location,
                address: streetFull || data.display_name || '',
                city: cityVal
              }
            }))
          } catch (e) { console.error(e) }

          setIsGettingLocation(false)
          toast({
            title: 'Localização obtida!',
            description: 'Sua localização foi atualizada com sucesso.',
          })
        },
        (error) => {
          setIsGettingLocation(false)
          toast({
            title: 'Erro ao obter localização',
            description: 'Não foi possível obter sua localização. Verifique as permissões.',
            variant: 'destructive',
          })
        }
      )
    } else {
      setIsGettingLocation(false)
      toast({
        title: 'Geolocalização não suportada',
        description: 'Seu navegador não suporta geolocalização.',
        variant: 'destructive',
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        toast({
          title: 'Erro',
          description: 'Por favor, informe sua senha atual.',
          variant: 'destructive',
        })
        return
      }
      
      if (formData.newPassword !== formData.confirmPassword) {
        toast({
          title: 'Erro',
          description: 'As senhas não coincidem.',
          variant: 'destructive',
        })
        return
      }
      
      if (formData.newPassword.length < 6) {
        toast({
          title: 'Erro',
          description: 'A nova senha deve ter pelo menos 6 caracteres.',
          variant: 'destructive',
        })
        return
      }
    }
    
    ;(async () => {
      try {
        if (user && user.id) {
          const payload: any = {
            nome: formData.name,
            telefone: formData.phone,
            latitude: formData.location.lat,
            longitude: formData.location.lng
          }
          
          if (formData.newPassword) {
            // TODO: Backend should verify current password before updating
            payload.senha = formData.newPassword
          }

          await apiFetch(`/api/usuarios/${user.id}`, {
            method: 'PUT',
            body: JSON.stringify(payload)
          })
        }

        toast({
          title: 'Perfil atualizado!',
          description: 'Suas informações foram salvas com sucesso.',
        })

        setTimeout(() => {
          router.push('/profile')
        }, 1000)
      } catch (err: any) {
        toast({
          title: 'Erro',
          description: err.message || 'Falha ao salvar informações. Tente novamente.',
          variant: 'destructive',
        })
      }
    })()
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-orange-50 pb-20">

      <main className="container mx-auto px-3 py-3 sm:px-4 sm:py-6 max-w-2xl">
        <div className="mb-3 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="p-2 h-auto"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-base sm:text-xl font-bold">Editar Perfil</h1>
        </div>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="h-10"
                />
              </div>


              {/* Phone Field */}
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                  required
                  className="h-10"
                />
              </div>

              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Localização</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Sua localização é usada para notificar sobre pets próximos a você
                </p>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Buscar endereço (ex: Rua, bairro, cidade)"
                      value={addressQuery}
                      onChange={(e) => setAddressQuery(e.target.value)}
                      className="flex-1 h-9 text-sm"
                    />
                    <Button type="button" variant="secondary" onClick={searchAddress} disabled={searching} className="h-9">
                      {searching ? '...' : 'Buscar'}
                    </Button>
                  </div>
                  
                  {searchResults.length > 0 && (
                    <div className="max-h-40 overflow-auto border rounded p-2 bg-white text-sm">
                      {searchResults.map((r: any) => (
                        <button
                          key={r.place_id}
                          type="button"
                          onClick={() => {
                            const lat = parseFloat(r.lat)
                            const lon = parseFloat(r.lon)
                            setFormData(prev => ({
                              ...prev,
                              location: {
                                ...prev.location,
                                lat,
                                lng: lon
                              }
                            }))
                            setSearchResults([])
                          }}
                          className="w-full text-left p-1 hover:bg-slate-50 block"
                        >
                          {formatShortAddress(r)}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="h-64 w-full rounded-md overflow-hidden border">
                    <SelectableMap
                      latitude={formData.location.lat || null}
                      longitude={formData.location.lng || null}
                      onChange={(lat, lng) => {
                        setFormData(prev => ({
                          ...prev,
                          location: {
                            ...prev.location,
                            lat,
                            lng
                          }
                        }))
                      }}
                    />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={getCurrentLocation}
                    disabled={isGettingLocation}
                    className="w-full h-9 text-xs"
                  >
                    <MapPin className="w-3.5 h-3.5 mr-1" />
                    {isGettingLocation ? 'Obtendo...' : 'Usar minha localização atual'}
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    type="text"
                    value={formData.location.address}
                    readOnly
                    placeholder="Endereço selecionado"
                    className="h-10 bg-slate-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    type="text"
                    value={formData.location.city}
                    readOnly
                    placeholder="Cidade - Estado"
                    className="h-10 bg-slate-50"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-10"
                  onClick={() => router.back()}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 h-10">
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      <MobileNav />
    </div>
  )
}
