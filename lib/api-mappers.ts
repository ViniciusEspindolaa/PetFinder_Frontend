import { Pet, Sighting } from './types'

function mapTipo(tipo: string): Pet['status'] {
  switch (tipo) {
    case 'PERDIDO': return 'lost'
    case 'ENCONTRADO': return 'found'
    case 'ADOCAO': return 'adoption'
    default: return 'lost'
  }
}

function mapEspecie(especie: string): Pet['type'] {
  switch (especie) {
    case 'CACHORRO': return 'dog'
    case 'GATO': return 'cat'
    default: return 'other'
  }
}

function mapPorte(porte?: string) {
  switch (porte) {
    case 'PEQUENO': return 'small'
    case 'MEDIO': return 'medium'
    case 'GRANDE': return 'large'
    default: return 'medium'
  }
}

export function mapPublicacaoToPet(pub: any): Pet {
  const fotos = pub.fotos_urls
  let photo = '/placeholder-pet.png'

  if (Array.isArray(fotos) && fotos.length > 0) {
    photo = fotos[0]
  } else if (typeof fotos === 'string' && fotos.length > 0) {
    photo = fotos
  } else if (fotos && typeof fotos === 'object' && Object.keys(fotos).length > 0) {
    const vals = Object.values(fotos)
    if (vals.length > 0) photo = String(vals[0])
  }

  const sightings: Sighting[] = (pub.avistamentos || []).map((a: any) => ({
    id: String(a.id),
    petId: String(pub.id),
    location: {
      lat: Number(a.latitude),
      lng: Number(a.longitude),
      address: a.endereco_texto || '',
      city: '',
      neighborhood: ''
    },
    date: a.data_avistamento ? new Date(a.data_avistamento) : new Date(),
    time: a.data_avistamento ? new Date(a.data_avistamento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '',
    description: a.observacoes || '',
    reporterName: a.usuario?.nome || '',
    reporterPhone: a.usuario?.telefone || '',
    createdAt: a.data_criacao ? new Date(a.data_criacao) : (a.data_avistamento ? new Date(a.data_avistamento) : new Date())
  }))

  const pet: Pet = {
    id: String(pub.id),
    userId: pub.usuarioId || (pub.usuario && pub.usuario.id) || '',
    status: mapTipo(pub.tipo),
    name: pub.nome_pet || pub.titulo || undefined,
    type: mapEspecie(pub.especie),
    breed: pub.raca || '',
    size: mapPorte(pub.porte),
    age: pub.idade ? String(pub.idade) : undefined,
    ageUnit: pub.unidadeIdade || 'ANOS',
    location: {
      lat: Number(pub.latitude),
      lng: Number(pub.longitude),
      address: pub.endereco_texto || '',
      city: pub.cidade || '',
      neighborhood: pub.bairro || ''
    },
    lastSeenDate: pub.data_evento ? new Date(pub.data_evento) : (pub.data_publicacao ? new Date(pub.data_publicacao) : new Date()),
    description: pub.descricao || '',
    photoUrl: photo,
    reward: pub.recompensa ? Number(pub.recompensa) : undefined,
    contactPhone: pub.usuario?.telefone || '',
    contactName: pub.usuario?.nome || '',
    sightings,
    createdAt: pub.data_publicacao ? new Date(pub.data_publicacao) : new Date(),
    completed: pub.status === 'RESOLVIDO' || pub.status === 'RESGATADO',
    completionReason: pub.motivo_encerramento || undefined
  }

  return pet
}

export default mapPublicacaoToPet
