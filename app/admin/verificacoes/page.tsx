'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react'

interface VerificacaoPendente {
  id: string
  status: string
  cpf_ultimos4: string
  doc_frente_url?: string
  doc_verso_url?: string
  selfie_url?: string
  criado_em: string
  usuario: {
    id: string
    nome: string
    email: string
    telefone: string
    foto_perfil?: string
    telefone_verificado: boolean
    email_verificado: boolean
  }
}

export default function AdminVerificacoesPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [pendentes, setPendentes] = useState<VerificacaoPendente[]>([])
  const [loading, setLoading] = useState(true)
  const [motivos, setMotivos] = useState<Record<string, string>>({})
  const [processando, setProcessando] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && !user) router.push('/login')
  }, [user, isLoading, router])

  const carregar = async () => {
    try {
      const data = await apiFetch('/api/verificacao/admin/pendentes')
      setPendentes(Array.isArray(data) ? data : [])
    } catch (err: any) {
      if (err.message?.includes('403') || err.message?.includes('admin')) {
        toast({ title: 'Acesso negado', description: 'Você não tem permissão de administrador.', variant: 'destructive' })
        router.push('/profile')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) carregar()
  }, [user])

  const aprovar = async (id: string) => {
    setProcessando(id)
    try {
      await apiFetch(`/api/verificacao/admin/${id}/aprovar`, { method: 'PATCH' })
      toast({ title: 'Prestador aprovado' })
      await carregar()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setProcessando(null)
    }
  }

  const rejeitar = async (id: string) => {
    const motivo = motivos[id]
    if (!motivo || motivo.length < 10) {
      toast({ title: 'Informe o motivo (mín. 10 caracteres)', variant: 'destructive' })
      return
    }
    setProcessando(id)
    try {
      await apiFetch(`/api/verificacao/admin/${id}/rejeitar`, {
        method: 'PATCH',
        body: JSON.stringify({ motivo }),
      })
      toast({ title: 'Verificação rejeitada' })
      await carregar()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setProcessando(null)
    }
  }

  if (loading) return <div className="p-8 text-center">Carregando...</div>

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/profile">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <h1 className="font-bold text-lg">Análise de Prestadores</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 space-y-4">
        <p className="text-sm text-muted-foreground">
          Configure seu ID em <code className="text-xs bg-muted px-1 rounded">ADMIN_USER_IDS</code> no backend para acessar esta página.
        </p>

        {pendentes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Nenhuma verificação pendente no momento.
            </CardContent>
          </Card>
        ) : (
          pendentes.map((v) => (
            <Card key={v.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{v.usuario.nome}</CardTitle>
                    <p className="text-sm text-muted-foreground">{v.usuario.email} · {v.usuario.telefone}</p>
                  </div>
                  <Badge>{v.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">CPF terminado em ••••{v.cpf_ultimos4}</p>
                <div className="grid grid-cols-3 gap-2">
                  {[v.doc_frente_url, v.doc_verso_url, v.selfie_url].map((url, i) => (
                    url ? (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                        <img src={url} alt={`Doc ${i}`} className="w-full h-24 object-cover rounded border" />
                      </a>
                    ) : (
                      <div key={i} className="h-24 bg-muted rounded border flex items-center justify-center text-xs text-muted-foreground">
                        Sem foto
                      </div>
                    )
                  ))}
                </div>
                <Textarea
                  placeholder="Motivo da rejeição (obrigatório para rejeitar)"
                  value={motivos[v.id] || ''}
                  onChange={(e) => setMotivos((prev) => ({ ...prev, [v.id]: e.target.value }))}
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => aprovar(v.id)}
                    disabled={processando === v.id}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" /> Aprovar
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => rejeitar(v.id)}
                    disabled={processando === v.id}
                  >
                    <XCircle className="w-4 h-4 mr-1" /> Rejeitar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </main>
    </div>
  )
}
