 'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { MapPin, Eye, EyeOff } from 'lucide-react'

const SelectableMap = dynamic(() => import('@/components/selectable-map'), { ssr: false })

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Location state
  const [location, setLocation] = useState('')
  const [city, setCity] = useState('')
  const [mapLocation, setMapLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [addressQuery, setAddressQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<Array<any>>([])
  const [isGettingLocation, setIsGettingLocation] = useState(false)

  const { signup, loginWithGoogle } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const handleGetCurrentLocation = () => {
    setIsGettingLocation(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setMapLocation({ lat: latitude, lng: longitude })
          setIsGettingLocation(false)
          toast({ title: 'Localização capturada', description: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` })
        },
        (error) => {
          setIsGettingLocation(false)
          toast({ title: 'Erro', description: 'Não foi possível obter sua localização. Verifique as permissões.', variant: 'destructive' })
        }
      )
    } else {
      setIsGettingLocation(false)
      toast({ title: 'Erro', description: 'Geolocalização não suportada.', variant: 'destructive' })
    }
  }

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

  useEffect(() => {
    const doReverse = async () => {
      if (!mapLocation) return
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${mapLocation.lat}&lon=${mapLocation.lng}&format=json&addressdetails=1`)
        const data = await res.json()
        const a = data?.address || {}
        const street = a.road || a.pedestrian || a.footway || a.cycleway || ''
        const house = a.house_number || ''
        const streetFull = house ? (street ? `${street}, ${house}` : house) : street
        setLocation(streetFull || '')
        const cityVal = a.city || a.town || a.village || a.county || a.state || ''
        setCity(cityVal)
      } catch (err) {
        console.error('Erro no reverse geocoding', err)
      }
    }
    doReverse()
  }, [mapLocation])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast({ title: 'Senhas não coincidem', description: 'Verifique a confirmação da senha.', variant: 'destructive' })
      return
    }
    // Frontend validation antes de enviar
    // Valida formato do e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast({ title: 'E-mail inválido', description: 'Informe um e-mail no formato exemplo@dominio.com.', variant: 'destructive' })
      return
    }
    if (name.trim().length < 10) {
      toast({ title: 'Nome inválido', description: 'Por favor informe seu nome completo (mínimo 10 caracteres).', variant: 'destructive' })
      return
    }
    if (name.length > 60) {
      toast({ title: 'Nome muito longo', description: 'O nome deve ter no máximo 60 caracteres.', variant: 'destructive' })
      return
    }
    if (email.length > 40) {
      toast({ title: 'E-mail muito longo', description: 'O e-mail deve ter no máximo 40 caracteres.', variant: 'destructive' })
      return
    }
    if (password.length < 8) {
      toast({ title: 'Senha muito curta', description: 'Senha deve ter ao menos 8 caracteres.', variant: 'destructive' })
      return
    }
    // senha deve conter maiúscula, minúscula, número e símbolo
    const hasLower = /[a-z]/.test(password)
    const hasUpper = /[A-Z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    const hasSymbol = /[^A-Za-z0-9]/.test(password)
    if (!(hasLower && hasUpper && hasNumber && hasSymbol)) {
      toast({ title: 'Senha fraca', description: 'Senha deve conter letras maiúsculas, minúsculas, números e símbolos.', variant: 'destructive' })
      return
    }
    // Sanitiza telefone: remove caracteres não numéricos e valida tamanho
    const sanitizedPhone = phone.replace(/\D/g, '')
    if (sanitizedPhone.length === 0 || sanitizedPhone.length > 15) {
      toast({ title: 'Telefone inválido', description: 'Informe um telefone com até 15 dígitos (ex: 5511999999999).', variant: 'destructive' })
      return
    }

    if (!mapLocation) {
      toast({ title: 'Localização necessária', description: 'Por favor, selecione sua localização no mapa para receber alertas de pets próximos.', variant: 'destructive' })
      return
    }

    setIsLoading(true)
    try {
      await signup(name, email, password, sanitizedPhone, mapLocation.lat, mapLocation.lng, location, city)
      router.push('/')
    } catch (error: any) {
      // Tenta extrair mensagem amigável do erro
      let msg = 'Erro ao criar conta'
      if (error?.response?.erro) {
        if (typeof error.response.erro === 'string') {
          msg = error.response.erro
        } else if (typeof error.response.erro === 'object') {
           // Zod error format
           if (error.response.erro.issues) {
             msg = error.response.erro.issues.map((i: any) => i.message).join(', ')
           } else {
             msg = JSON.stringify(error.response.erro)
           }
        }
      } else if (error?.message) {
        msg = error.message
      }
      
      toast({ title: 'Erro ao cadastrar', description: msg, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setIsLoading(true)
    try {
      await loginWithGoogle()
      router.push('/')
    } catch (error) {
      console.error('Google signup error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-teal-50 to-orange-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-8 h-8 text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold">Criar conta</CardTitle>
          <CardDescription>Junte-se para ajudar pets a encontrarem seu caminho</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={60}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={40}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+55 11 98765-4321"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="sr-only">
                    {showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  </span>
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="sr-only">
                    {showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  </span>
                </Button>
              </div>
            </div>

            {/* Location Section */}
            <div className="space-y-3 pt-2 border-t">
              <Label className="text-base font-semibold">Sua Localização</Label>
              <p className="text-xs text-muted-foreground">
                Necessário para receber alertas de pets perdidos na sua região.
              </p>
              
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Buscar endereço (ex: Rua, bairro, cidade)"
                    value={addressQuery}
                    onChange={(e) => setAddressQuery(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="button" variant="secondary" onClick={searchAddress} disabled={searching}>
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
                          setMapLocation({ lat, lng: lon })
                          setLocation(formatShortAddress(r))
                          const a = r.address || {}
                          const cityVal = a.city || a.town || a.village || a.county || a.state || ''
                          setCity(cityVal)
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
                    latitude={mapLocation?.lat ?? null}
                    longitude={mapLocation?.lng ?? null}
                    onChange={(lat, lng) => {
                      setMapLocation({ lat, lng })
                    }}
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGetCurrentLocation}
                  disabled={isGettingLocation}
                  className="w-full"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  {isGettingLocation ? 'Obtendo...' : 'Usar Minha Localização Atual'}
                </Button>

                <div className="grid grid-cols-1 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="location" className="text-xs">Endereço</Label>
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="h-8 text-sm"
                      placeholder="Endereço selecionado"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="city" className="text-xs">Cidade</Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="h-8 text-sm"
                      placeholder="Cidade"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Criando conta...' : 'Criar conta'}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">Ou continue com</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignup}
            disabled={isLoading}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </Button>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Já tem uma conta?{' '}
            <Link href="/login" className="text-teal-600 hover:underline font-medium">
              Entrar
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
