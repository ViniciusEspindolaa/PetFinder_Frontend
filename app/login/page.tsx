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
import { Eye, EyeOff } from 'lucide-react'
import Script from 'next/script'
import Image from 'next/image'

declare global {
  interface Window {
    google: any;
  }
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login, loginWithGoogle } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const user = await login(email, password)
      toast({
        title: 'Login realizado com sucesso!',
        description: `Bem-vindo(a), ${user.name}!`,
        className: 'bg-green-50 border-green-200 text-green-800',
      })
      router.push('/')
    } catch (error) {
      const msg = (error as any)?.message || (error as any)?.response?.erro || 'Erro ao realizar login'
      toast({ title: 'Erro no login', description: String(msg), variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleCredentialResponse = async (response: any) => {
    setIsLoading(true)
    try {
      await loginWithGoogle(response.credential)
      router.push('/')
    } catch (error) {
      console.error('Google login error:', error)
      toast({ title: 'Erro no login com Google', description: 'Falha ao autenticar.', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const initializeGoogle = () => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "1002878856731-bctq4bcn2lcohnaskj7351gd9l205oc4.apps.googleusercontent.com",
        callback: handleGoogleCredentialResponse
      });
      window.google.accounts.id.renderButton(
        document.getElementById("googleBtn"),
        { theme: "outline", size: "large", width: "100%" }
      );
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-teal-50 to-orange-50">
      <Script 
        src="https://accounts.google.com/gsi/client" 
        strategy="lazyOnload" 
        onLoad={initializeGoogle}
      />
      <Card className="w-full max-w-md">
        <CardHeader className="text-center flex flex-col items-center">
          <div className="mb-4 flex flex-col items-center">
            <div className="flex flex-col items-center gap-2 mb-1">
              <Image src="/logo.png" alt="PetFinder" width={80} height={80} className="rounded-xl mb-2" />
              <span className="font-bold text-4xl font-[family-name:var(--font-nunito)]">
                <span className="text-[#8EDCB9]">Pet</span>
                <span className="text-[#F39C12]">Finder</span>
              </span>
            </div>
            <span className="text-base text-muted-foreground font-medium mt-1">Reunindo famílias</span>
          </div>
          <CardTitle className="text-xl font-bold mt-2 font-[family-name:var(--font-nunito)]">Bem-vindo de volta</CardTitle>
          <CardDescription>Entre para ajudar pets perdidos</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link 
                  href="/forgot-password" 
                  className="text-sm text-teal-600 hover:underline"
                >
                  Esqueceu a senha?
                </Link>
              </div>
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
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Entrando...' : 'Entrar'}
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

          <div id="googleBtn" className="w-full flex justify-center"></div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Não tem uma conta?{' '}
            <Link href="/signup" className="text-teal-600 hover:underline font-medium">
              Cadastre-se
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
