'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import { Button } from '@/components/ui/button'
import { MapPin, Locate } from 'lucide-react'
import L from 'leaflet'

// Ensure marker icons load correctly
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface LocationPickerProps {
  initialLat?: number
  initialLng?: number
  onLocationSelect: (lat: number, lng: number) => void
}

function LocationMarker({ position, setPosition, onLocationSelect }: { 
  position: { lat: number, lng: number } | null, 
  setPosition: (pos: { lat: number, lng: number }) => void,
  onLocationSelect: (lat: number, lng: number) => void
}) {
  const map = useMap()

  useMapEvents({
    click(e) {
      setPosition(e.latlng)
      onLocationSelect(e.latlng.lat, e.latlng.lng)
    },
  })

  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom())
    }
  }, [position, map])

  const customIcon = L.divIcon({
    html: `
      <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="pinShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.2" flood-color="#000" flood-opacity="0.25" />
          </filter>
        </defs>
        <g filter="url(#pinShadow)">
          <path d="M18 2 C12 2 8 6 8 12 C8 20 18 32 18 32 C18 32 28 20 28 12 C28 6 24 2 18 2 Z" fill="#ef4444" stroke="#ffffff" stroke-width="1.6"/>
          <circle cx="18" cy="12" r="5" fill="#ffffff" />
        </g>
      </svg>
    `,
    className: 'custom-div-icon',
    iconSize: [36, 36],
    iconAnchor: [18, 34],
  })

  return position === null ? null : (
    <Marker position={position} icon={customIcon}></Marker>
  )
}

function MapController({ onLocate }: { onLocate: () => void }) {
  return (
    <div className="leaflet-top leaflet-right" style={{ top: '10px', right: '10px' }}>
      <div className="leaflet-control leaflet-bar">
        <button
          type="button"
          className="bg-white hover:bg-gray-100 text-gray-800 p-2 border border-gray-400 rounded shadow flex items-center justify-center w-10 h-10"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onLocate()
          }}
          title="Usar minha localização"
        >
          <Locate className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

export default function LocationPicker({ initialLat, initialLng, onLocationSelect }: LocationPickerProps) {
  const [position, setPosition] = useState<{ lat: number, lng: number } | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Inject Leaflet CSS
    if (typeof window !== 'undefined' && !document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }
  }, [])

  useEffect(() => {
    if (initialLat !== undefined && initialLng !== undefined) {
      const lat = Number(initialLat)
      const lng = Number(initialLng)
      if (!isNaN(lat) && !isNaN(lng)) {
        setPosition({ lat, lng })
      }
    }
  }, [initialLat, initialLng])

  const handleLocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          setPosition(newPos)
          onLocationSelect(newPos.lat, newPos.lng)
        },
        (err) => {
          console.error("Error getting location", err)
          alert("Não foi possível obter sua localização.")
        }
      )
    } else {
      alert("Geolocalização não suportada pelo navegador.")
    }
  }

  if (!mounted) return <div className="w-full h-[300px] bg-gray-100 animate-pulse rounded-lg flex items-center justify-center text-gray-400">Carregando mapa...</div>

  // Default center (São Paulo) if no position
  const center = position || { lat: -23.5505, lng: -46.6333 }

  return (
    <div className="w-full h-[300px] rounded-lg overflow-hidden border border-gray-200 relative z-0">
      <MapContainer 
        center={center} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={position} setPosition={setPosition} onLocationSelect={onLocationSelect} />
        <MapController onLocate={handleLocate} />
      </MapContainer>
      
      {!position && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/90 px-4 py-2 rounded-full shadow-lg text-sm font-medium text-gray-600 pointer-events-none z-[1000]">
          Toque no mapa para selecionar
        </div>
      )}
    </div>
  )
}
