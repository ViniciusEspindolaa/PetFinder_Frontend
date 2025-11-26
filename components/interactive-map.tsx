'use client'

import { useState, useEffect } from 'react'
import { Pet, PetStatus } from '@/lib/types'
import { MapPin } from 'lucide-react'

interface InteractiveMapProps {
  pets: Pet[]
  selectedPetId?: string | null
  onPetSelect: (pet: Pet) => void
  statusFilter?: PetStatus | 'all'
  onStatusFilterChange?: (value: PetStatus | 'all') => void
}

export function InteractiveMap({ pets, selectedPetId, onPetSelect, statusFilter = 'all' }: InteractiveMapProps) {
  const [filteredPets, setFilteredPets] = useState<Pet[]>(pets)
  const [mapCenter, setMapCenter] = useState({ lat: -23.5505, lng: -46.6333 })

  useEffect(() => {
    const filtered = statusFilter === 'all' ? pets : pets.filter((pet) => pet.status === statusFilter)
    setFilteredPets(filtered)
  }, [statusFilter, pets])

  useEffect(() => {
    if (selectedPetId) {
      const pet = pets.find((p) => p.id === selectedPetId)
      if (pet) {
        setMapCenter({ lat: pet.location.lat, lng: pet.location.lng })
        onPetSelect(pet)
      }
    }
  }, [selectedPetId, pets, onPetSelect])

  const getMarkerColor = (status: PetStatus) => {
    switch (status) {
      case 'lost':
        return 'bg-red-500'
      case 'found':
        return 'bg-blue-500'
      case 'adoption':
        return 'bg-green-500'
    }
  }

  return (
    <div className="relative w-full h-full">

      {/* Mock Map Background */}
      <div className="w-full h-full bg-gray-200 relative overflow-hidden">
        {/* Grid lines for map effect */}
        <div className="absolute inset-0 opacity-20">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={`h-${i}`} className="absolute w-full h-px bg-gray-400" style={{ top: `${i * 10}%` }} />
          ))}
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={`v-${i}`} className="absolute h-full w-px bg-gray-400" style={{ left: `${i * 10}%` }} />
          ))}
        </div>

        {/* Street pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="streets" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <path d="M 0 20 L 100 20 M 0 50 L 100 50 M 0 80 L 100 80 M 20 0 L 20 100 M 60 0 L 60 100" stroke="#000" strokeWidth="2" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#streets)" />
          </svg>
        </div>

        {/* Pet Markers */}
        <div className="absolute inset-0">
          {filteredPets.map((pet, index) => {
            const offsetX = 20 + (index % 5) * 18
            const offsetY = 20 + Math.floor(index / 5) * 18
            const isSelected = pet.id === selectedPetId

            return (
              <button
                key={pet.id}
                onClick={() => onPetSelect(pet)}
                className="absolute transform -translate-x-1/2 -translate-y-full transition-all hover:scale-110"
                style={{
                  left: `${offsetX}%`,
                  top: `${offsetY}%`,
                }}
              >
                <div
                  className={`${getMarkerColor(pet.status)} ${
                    isSelected ? 'ring-4 ring-white shadow-xl scale-125' : 'shadow-lg'
                  } rounded-full p-2 transition-all`}
                >
                  <MapPin className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                {isSelected && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white rotate-45" />
                )}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg p-3 shadow-lg">
          <h3 className="text-xs font-semibold mb-2">Legenda</h3>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full" />
              <span className="text-xs">Perdidos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full" />
              <span className="text-xs">Encontrados</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full" />
              <span className="text-xs">Adoção</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
