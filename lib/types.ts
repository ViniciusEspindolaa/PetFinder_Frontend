export type PetStatus = 'lost' | 'found' | 'adoption'
export type PetType = 'dog' | 'cat' | 'other'
export type PetSize = 'small' | 'medium' | 'large'

export interface User {
  id: string
  name: string
  email: string
  phone: string
  photoUrl?: string
  createdAt: Date
  location?: Location
}

export interface Location {
  lat: number
  lng: number
  address: string
  city: string
  neighborhood?: string
}

export interface Sighting {
  id: string
  petId: string
  location: Location
  date: Date
  time: string
  description: string
  reporterName: string
  reporterPhone: string
  createdAt: Date
}

export interface Pet {
  id: string
  userId: string
  status: PetStatus
  name?: string
  type: PetType
  breed: string
  size: PetSize
  age?: string | number
  ageUnit?: 'ANOS' | 'MESES'
  unidadeIdade?: 'ANOS' | 'MESES' // Backend field name
  location: Location
  lastSeenDate: Date
  description: string
  photoUrl: string
  reward?: number
  contactPhone: string
  contactName: string
  sightings: Sighting[]
  createdAt: Date
  completed?: boolean
  completionReason?: string
  completedAt?: Date
}

export interface Notification {
  id: string
  userId: string
  type: 'sighting' | 'message' | 'nearby'
  petId: string
  sightingId?: number
  title: string
  message: string
  read: boolean
  createdAt: Date
  sighting?: Sighting
}
