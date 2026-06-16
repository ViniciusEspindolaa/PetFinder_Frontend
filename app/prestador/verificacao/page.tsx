'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Upload, CheckCircle2, Clock, XCircle, ShieldCheck, Phone, Mail, Camera } from 'lucide-react'

interface VerificacaoStatus {
  telefone_verificado: boolean
  email_verificado: boolean
  foto_perfil: string | null
  contato_verificado: boolean
  identidade_verificada: boolean
  verificacao: {
    status: string
    cpf_ultimos4?: string
    motivo_rejeicao?: string
    doc_frente_url?: string
    doc_verso_url?: string
    selfie_url?: string
  } | null
}

const statusLabel: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  PENDENTE: { label: 'Pendente', color: 'bg-amber-100 text-amber-800', icon: Clock },
  EM_ANALISE: { label: 'Em análise', color: 'bg-blue-100 text-blue-800', icon: Clock },
  APROVADO: { label: 'Aprovado', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  REJEITADO: { label: 'Rejeitado', color: 'bg-red-100 text-red-800', icon: XCircle },
}

export default function VerificacaoPrestadorPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [status, setStatus] = useState<VerificacaoStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [codigoTelefone, setCodigoTelefone] = useState('')
  const [codigoEmail, setCodigoEmail] = useState('')
  const [cpf, setCpf] = useState('')
  const [docFrente, setDocFrente] = useState('')
  const [docVerso, setDocVerso] = useState('')
  const [selfie, setSelfie] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) router.push('/login')
  }, [user, isLoading, router])

  const carregarStatus = async () => {
    try {
      const data = await apiFetch('/api/verificacao/status')
      setStatus(data)
      if (data.verificacao?.doc_frente_url) setDocFrente(data.verificacao.doc_frente_url)
      if (data.verificacao?.doc_verso_url) setDocVerso(data.verificacao.doc_verso_url)
      if (data.verificacao?.selfie_url) setSelfie(data.verificacao.selfie_url)
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível carregar o status.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) carregarStatus()
  }, [user])

  const uploadDoc = async (file: File): Promise<string> => {
    const fd = new FormData()
    fd.append('documento', file)
    const res = await apiFetch('/api/upload/verificacao', { method: 'POST', body: fd })
    return res.documento_url
  }

  const handleUploadFotoPerfil = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setEnviando(true)
    try {
      const fd = new FormData()
      fd.append('avatar', file)
      const res = await apiFetch('/api/upload/avatar', { method: 'POST', body: fd })
      await apiFetch('/api/verificacao/foto-perfil', {
        method: 'PUT',
        body: JSON.stringify({ foto_url: res.avatar_url }),
      })
      toast({ title: 'Foto de perfil atualizada' })
      await carregarStatus()
    } catch {
      toast({ title: 'Erro no upload', variant: 'destructive' })
    } finally {
      setEnviando(false)
    }
  }

  const handleUploadDoc = (tipo: 'frente' | 'verso' | 'selfie') => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setEnviando(true)
    try {
      const url = await uploadDoc(file)
      if (tipo === 'frente') setDocFrente(url)
      if (tipo === 'verso') setDocVerso(url)
      if (tipo === 'selfie') setSelfie(url)
      toast({ title: 'Documento enviado' })
    } catch {
      toast({ title: 'Erro no upload', variant: 'destructive' })
    } finally {
      setEnviando(false)
    }
  }

  const enviarCodigoTelefone = async () => {
    setEnviando(true)
    try {
      const res = await apiFetch('/api/verificacao/telefone/enviar', { method: 'POST' })
      toast({
        title: 'Código enviado',
        description: res.codigo_dev ? `Dev: ${res.codigo_dev}` : res.mensagem,
      })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setEnviando(false)
    }
  }

  const confirmarTelefone = async () => {
    setEnviando(true)
    try {
      await apiFetch('/api/verificacao/telefone/confirmar', {
        method: 'POST',
        body: JSON.stringify({ codigo: codigoTelefone }),
      })
      toast({ title: 'Telefone verificado!' })
      await carregarStatus()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setEnviando(false)
    }
  }

  const enviarCodigoEmail = async () => {
    setEnviando(true)
    try {
      const res = await apiFetch('/api/verificacao/email/enviar', { method: 'POST' })
      toast({
        title: 'Código enviado',
        description: res.codigo_dev ? `Dev: ${res.codigo_dev}` : res.mensagem,
      })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setEnviando(false)
    }
  }

  const confirmarEmail = async () => {
    setEnviando(true)
    try {
      await apiFetch('/api/verificacao/email/confirmar', {
        method: 'POST',
        body: JSON.stringify({ codigo: codigoEmail }),
      })
      toast({ title: 'E-mail verificado!' })
      await carregarStatus()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setEnviando(false)
    }
  }

  const enviarDocumentos = async () => {
    if (!cpf || !docFrente || !docVerso || !selfie) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' })
      return
    }
    setEnviando(true)
    try {
      await apiFetch('/api/verificacao/prestador', {
        method: 'POST',
        body: JSON.stringify({
          cpf,
          doc_frente_url: docFrente,
          doc_verso_url: docVerso,
          selfie_url: selfie,
        }),
      })
      toast({
        title: 'Documentos enviados',
        description: 'Sua verificação será analisada em até 48 horas.',
      })
      await carregarStatus()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setEnviando(false)
    }
  }

  if (isLoading || loading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando...</div>
  }

  const verStatus = status?.verificacao?.status
  const statusInfo = verStatus ? statusLabel[verStatus] : null

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/profile">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="font-bold text-lg">Verificação de Prestador</h1>
            <p className="text-xs text-muted-foreground">Segurança para quem contrata e presta serviços</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-4">
        {status?.identidade_verificada && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4 flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-green-600 shrink-0" />
              <div>
                <p className="font-semibold text-green-800">Você é um prestador verificado!</p>
                <p className="text-sm text-green-700">Seus serviços com atendimento em domicílio estão liberados.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fase 1 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              Fase 1 — Verificação de contato
              {status?.contato_verificado && <CheckCircle2 className="w-4 h-4 text-green-600" />}
            </CardTitle>
            <CardDescription>Obrigatória para publicar qualquer serviço na plataforma.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Foto perfil */}
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="w-14 h-14 rounded-full bg-muted overflow-hidden shrink-0">
                {status?.foto_perfil ? (
                  <img src={status.foto_perfil} alt="Perfil" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Camera className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Foto de perfil</p>
                {status?.foto_perfil ? (
                  <Badge className="bg-green-100 text-green-800 mt-1">Enviada</Badge>
                ) : (
                  <label className="cursor-pointer">
                    <span className="text-xs text-teal-600 underline">Enviar foto</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleUploadFotoPerfil} disabled={enviando} />
                  </label>
                )}
              </div>
            </div>

            {/* Telefone */}
            <div className="p-3 border rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Telefone</span>
                </div>
                {status?.telefone_verificado ? (
                  <Badge className="bg-green-100 text-green-800">Verificado</Badge>
                ) : (
                  <Button size="sm" variant="outline" onClick={enviarCodigoTelefone} disabled={enviando}>
                    Enviar código
                  </Button>
                )}
              </div>
              {!status?.telefone_verificado && (
                <div className="flex gap-2">
                  <Input
                    placeholder="000000"
                    maxLength={6}
                    value={codigoTelefone}
                    onChange={(e) => setCodigoTelefone(e.target.value.replace(/\D/g, ''))}
                    className="h-8 text-sm"
                  />
                  <Button size="sm" onClick={confirmarTelefone} disabled={enviando || codigoTelefone.length !== 6}>
                    Confirmar
                  </Button>
                </div>
              )}
            </div>

            {/* Email */}
            <div className="p-3 border rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">E-mail</span>
                </div>
                {status?.email_verificado ? (
                  <Badge className="bg-green-100 text-green-800">Verificado</Badge>
                ) : (
                  <Button size="sm" variant="outline" onClick={enviarCodigoEmail} disabled={enviando}>
                    Enviar código
                  </Button>
                )}
              </div>
              {!status?.email_verificado && (
                <div className="flex gap-2">
                  <Input
                    placeholder="000000"
                    maxLength={6}
                    value={codigoEmail}
                    onChange={(e) => setCodigoEmail(e.target.value.replace(/\D/g, ''))}
                    className="h-8 text-sm"
                  />
                  <Button size="sm" onClick={confirmarEmail} disabled={enviando || codigoEmail.length !== 6}>
                    Confirmar
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Fase 2 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              Fase 2 — Verificação de identidade
              {status?.identidade_verificada && <CheckCircle2 className="w-4 h-4 text-green-600" />}
            </CardTitle>
            <CardDescription>
              Obrigatória para serviços com atendimento em domicílio. Seus documentos são analisados manualmente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {statusInfo && verStatus !== 'APROVADO' && (
              <div className={`p-3 rounded-lg flex items-center gap-2 ${statusInfo.color}`}>
                <statusInfo.icon className="w-4 h-4" />
                <span className="text-sm font-medium">Status: {statusInfo.label}</span>
              </div>
            )}
            {status?.verificacao?.motivo_rejeicao && (
              <div className="p-3 rounded-lg bg-red-50 text-red-800 text-sm border border-red-200">
                <strong>Motivo da rejeição:</strong> {status.verificacao.motivo_rejeicao}
              </div>
            )}

            {!status?.contato_verificado ? (
              <p className="text-sm text-muted-foreground">Complete a Fase 1 antes de enviar documentos.</p>
            ) : !status?.identidade_verificada ? (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 11)
                      const masked = digits
                        .replace(/(\d{3})(\d)/, '$1.$2')
                        .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
                        .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4')
                      setCpf(masked)
                    }}
                    disabled={verStatus === 'EM_ANALISE'}
                  />
                </div>

                {(['frente', 'verso', 'selfie'] as const).map((tipo) => {
                  const labels = { frente: 'Documento (frente)', verso: 'Documento (verso)', selfie: 'Selfie com documento' }
                  const urls = { frente: docFrente, verso: docVerso, selfie }
                  const url = urls[tipo]
                  return (
                    <div key={tipo} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{labels[tipo]}</p>
                        {url && <p className="text-xs text-green-600">Enviado ✓</p>}
                      </div>
                      {verStatus !== 'EM_ANALISE' && (
                        <label className="cursor-pointer">
                          <Button size="sm" variant="outline" asChild disabled={enviando}>
                            <span><Upload className="w-3 h-3 mr-1" />Enviar</span>
                          </Button>
                          <input type="file" accept="image/*" className="hidden" onChange={handleUploadDoc(tipo)} />
                        </label>
                      )}
                    </div>
                  )
                })}

                {verStatus !== 'EM_ANALISE' && (
                  <Button className="w-full bg-teal-600 hover:bg-teal-700" onClick={enviarDocumentos} disabled={enviando}>
                    Enviar para análise
                  </Button>
                )}
              </>
            ) : null}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
