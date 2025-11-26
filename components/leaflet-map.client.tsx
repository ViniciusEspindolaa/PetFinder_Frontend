"use client"

import React, { useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Locate } from 'lucide-react'
import L from 'leaflet'
import { DirectionsDialog } from '@/components/directions-dialog'
import { Eye } from 'lucide-react'

// We dynamically inject Leaflet CSS at runtime to avoid Next.js global CSS restrictions
// and to ensure the stylesheet is present only in the browser.

// Ensure marker icons load correctly from CDN (avoids bundler image issues)
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

type Pet = {
  id: string
  nome?: string
  status?: string
  fotos_urls?: string[]
  localizacao?: {
    latitude?: number
    longitude?: number
    lat?: number
    lng?: number
  }
  location?: {
    lat: number
    lng: number
    address?: string
  }
  photoUrl?: string
  breed?: string
  sightings?: any[]
}

function FlyToSelected({ lat, lng }: { lat?: number; lng?: number }) {
  const map = useMap()
  React.useEffect(() => {
    if (lat && lng) {
      map.flyTo([lat, lng], 14, { duration: 0.8 })
    }
  }, [lat, lng, map])
  return null
}

export default function LeafletMap({
  pets = [],
  selectedPetId,
  onPetSelect,
  onReportSighting,
  onViewDetails,
  onDeselect,
  statusFilter = 'all',
  userLocation,
}: {
  pets?: Pet[]
  selectedPetId?: string | null
  onPetSelect?: (p: Pet) => void
  onReportSighting?: (p: Pet) => void
  onViewDetails?: (p: Pet) => void
  onDeselect?: () => void
  statusFilter?: 'all' | 'lost' | 'found' | 'adoption'
  userLocation?: { lat: number; lng: number }
}) {
  // Inject Leaflet CSS in the browser because importing 'leaflet/dist/leaflet.css'
  // directly in a component can cause issues with Next.js app router / SSR.
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const id = 'leaflet-css'
    if (!document.getElementById(id)) {
      const link = document.createElement('link')
      link.id = id
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      link.crossOrigin = ''
      document.head.appendChild(link)
      // Inject small custom stylesheet to ensure our DivIcon SVGs are visible
      const styleId = 'leaflet-custom-css'
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style')
        style.id = styleId
        style.innerHTML = `
          /* Ensure custom div icons are visible and not blocked by default marker styles */
          .custom-div-icon, .leaflet-marker-icon.custom-div-icon {
            background: transparent !important;
            border: 0 !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 36px !important;
            height: 36px !important;
            padding: 0 !important;
          }
          .custom-div-icon svg { width: 36px; height: 36px; display: block; }
          /* remove default icon image fallback box-sizing that can hide svg */
          .leaflet-marker-icon { box-sizing: content-box; }
        `
        document.head.appendChild(style)
      }
    }
    return () => {
      // keep the CSS; optionally remove if needed
      // const el = document.getElementById(id)
      // if (el) el.remove()
    }
  }, [])

  // Status colors (used both for icons and legend)
  const STATUS_COLORS: Record<string, string> = {
    lost: '#ef4444',
    found: '#3b82f6',
    adoption: '#10b981',
    default: '#6b7280',
  }

  const [legendOpen, setLegendOpen] = useState(false)
  const [liveLocation, setLiveLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [directionsData, setDirectionsData] = useState<{ lat: number; lng: number; address?: string } | null>(null)

  const userIcon = L.divIcon({
    html: `
      <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="8" fill="#3b82f6" stroke="#ffffff" stroke-width="2"/>
        <circle cx="12" cy="12" r="12" fill="#3b82f6" fill-opacity="0.2"/>
      </svg>
    `,
    className: 'custom-div-icon user-location-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })

  const sightingIcon = L.divIcon({
    html: `
      <svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <filter id="eyeShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="#000" flood-opacity="0.3" />
        </filter>
        <g filter="url(#eyeShadow)">
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" fill="#ffffff" />
          <circle cx="12" cy="12" r="3" fill="#f59e0b" />
        </g>
      </svg>
    `,
    className: 'custom-div-icon sighting-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })

  const router = useRouter()
  const markers = useMemo(() => {
    return (pets || [])
      .map((p) => {
        // Support different shapes: `localizacao: { latitude, longitude }` or `location: { lat, lng }`
        const lat = p?.localizacao?.latitude ?? p?.location?.lat ?? p?.localizacao?.lat
        const lng = p?.localizacao?.longitude ?? p?.location?.lng ?? p?.localizacao?.lng
        const photo = Array.isArray(p.fotos_urls) && p.fotos_urls.length
          ? p.fotos_urls[0]
          : p.photoUrl ?? (Array.isArray((p as any).fotos) && (p as any).fotos.length ? (p as any).fotos[0] : undefined)

        return {
          id: p.id,
          nome: (p as any).nome ?? (p as any).name ?? 'Pet',
          lat,
          lng,
          photo,
          raw: p,
          status: p.status,
          sightings: (p as any).sightings || []
        }
      })
      .filter((m) => !!m.lat && !!m.lng)
      .filter((m) => {
        if (statusFilter === 'all') return true
        if (statusFilter === 'lost') return m.status === 'lost'
        if (statusFilter === 'found') return m.status === 'found'
        if (statusFilter === 'adoption') return m.status === 'adoption'
        return true
      })
  }, [pets, statusFilter])

  // Debug: log presence of Leaflet resources and markers to help diagnose render issues
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const hasCss = !!document.getElementById('leaflet-css')
    const hasL = typeof (window as any).L !== 'undefined'
    // eslint-disable-next-line no-console
    console.info('[leaflet-debug] cssIncluded=', hasCss, 'window.L=', hasL, 'markersCount=', markers.length, 'userLocation=', userLocation)
  }, [markers, userLocation])

  // default center: User location or São Paulo
  const center: [number, number] = useMemo(() => {
    if (selectedPetId) {
      const sp = markers.find((m) => m.id === selectedPetId)
      if (sp && sp.lat && sp.lng) return [sp.lat, sp.lng]
    }
    if (userLocation) return [userLocation.lat, userLocation.lng]
    if (markers.length) return [markers[0].lat || -23.55, markers[0].lng || -46.63]
    return [-23.55, -46.63]
  }, [markers, selectedPetId, userLocation])

  const selected = markers.find((m) => m.id === selectedPetId)

  return (
    <div className="w-full h-full relative">
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%', minHeight: '360px' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {markers.map((m) => {
          // create a colored DivIcon based on publication status (lost/found/adoption)
          const color = STATUS_COLORS[m.status || 'default'] || STATUS_COLORS.default
          const svg = `
            <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="pin">
              <defs>
                <filter id="pinShadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="1" stdDeviation="1.2" flood-color="#000" flood-opacity="0.25" />
                </filter>
              </defs>
              <g filter="url(#pinShadow)">
                <path d="M18 2
                          C12 2 8 6 8 12
                          C8 20 18 32 18 32
                          C18 32 28 20 28 12
                          C28 6 24 2 18 2 Z"
                      fill="${color}" stroke="#ffffff" stroke-width="1.6"/>
                <circle cx="18" cy="12" r="5" fill="#ffffff" />
              </g>
            </svg>
          `
          const icon = L.divIcon({
            html: svg,
            className: 'custom-div-icon',
            iconSize: [36, 36],
            iconAnchor: [18, 34],
            popupAnchor: [0, -36]
          })

          const isSelected = selectedPetId === m.id

          return (
            <React.Fragment key={m.id}>
              <Marker 
                position={[m.lat || 0, m.lng || 0]} 
                icon={icon}
                eventHandlers={{
                  click: () => {
                    if (onPetSelect && m.raw) onPetSelect(m.raw)
                  }
                }}
              >
                <Popup>
                  <div style={{ maxWidth: 240 }}>
                    <div className="flex items-start gap-3">
                      <div className="shrink-0" style={{ width: 64 }}>
                        {m.photo ? (
                          <img src={m.photo} alt={m.nome} className="w-16 h-16 object-cover rounded" />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-sm text-gray-500">Sem foto</div>
                        )}
                      </div>
                      <div className="flex-1 text-sm">
                        <div className="font-medium">{m.nome}</div>
                        {m.raw?.breed && <div className="text-xs text-muted-foreground">{m.raw.breed}</div>}
                        {m.raw?.location?.address && <div className="text-xs text-muted-foreground">{m.raw.location.address}</div>}
                      </div>
                    </div>

                    <div className="mt-2 flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-2 text-xs"
                        onClick={() => {
                          setDirectionsData({ lat: m.lat || 0, lng: m.lng || 0, address: m.raw?.location?.address })
                        }}
                      >
                        Como chegar
                      </Button>
                      {onReportSighting && m.status === 'lost' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 px-2 text-xs"
                          onClick={() => {
                            if (m.raw) onReportSighting(m.raw)
                          }}
                        >
                          Avistei!
                        </Button>
                      )}
                      <Button
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={() => {
                          if (onViewDetails && m.raw) {
                            onViewDetails(m.raw)
                          } else {
                            try {
                              router.push(`/pet/${m.id}`)
                            } catch (e) {
                              // fallback to full navigation
                              window.location.href = `/pet/${m.id}`
                            }
                          }
                        }}
                      >
                        Ver mais
                      </Button>
                    </div>
                  </div>
                </Popup>
              </Marker>

              {/* Render Sightings if this pet is selected */}
              {isSelected && m.sightings && m.sightings.map((s: any) => (
                <Marker
                  key={`sighting-${s.id}`}
                  position={[s.location.lat, s.location.lng]}
                  icon={sightingIcon}
                >
                  <Popup>
                    <div className="text-sm">
                      <div className="font-bold flex items-center gap-1 mb-1">
                        <Eye className="w-3 h-3" />
                        Avistamento
                      </div>
                      <div className="text-xs text-muted-foreground mb-1">
                        {new Date(s.date).toLocaleDateString()} às {s.time}
                      </div>
                      <div className="text-xs mb-2">{s.location.address}</div>
                      <div className="text-xs italic">"{s.description}"</div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </React.Fragment>
          )
        })}

        <FlyToSelected lat={selected?.lat} lng={selected?.lng} />
        <MapController userLocation={userLocation} />
        <LocationHandler onLocationFound={setLiveLocation} />
        <MapClickHandler onDeselect={onDeselect} />
        <AutoCenter selectedPetId={selectedPetId} userLocation={userLocation} />
        
        {(userLocation || liveLocation) && (
          <Marker 
            position={userLocation ? [userLocation.lat, userLocation.lng] : [liveLocation!.lat, liveLocation!.lng]} 
            icon={userIcon}
          >
            <Popup>
              <div className="text-sm font-medium">Sua localização atual</div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Legend overlay (visible on sm+, toggle button on xs) */}
      <div className="absolute bottom-24 right-3 text-sm" style={{ zIndex: 99999 }}>
        <div className="hidden sm:block bg-white/95 dark:bg-slate-900/95 text-gray-900 dark:text-gray-100 rounded shadow-md p-2 pointer-events-auto border border-gray-200 dark:border-slate-700">
          <div className="flex flex-col gap-1">
            <LegendRow label="Perdido" color={STATUS_COLORS.lost} />
            <LegendRow label="Encontrado" color={STATUS_COLORS.found} />
            <LegendRow label="Adoção" color={STATUS_COLORS.adoption} />
            <div className="flex items-center gap-2">
              <span className="inline-block" style={{ width: 18, height: 18 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" fill="#ffffff" />
                  <circle cx="12" cy="12" r="3" fill="#f59e0b" />
                </svg>
              </span>
              <span>Avistamento</span>
            </div>
          </div>
        </div>
        {/* Small screen toggle */}
        <div className="sm:hidden">
          <button
            aria-label="Legenda"
            onClick={() => setLegendOpen((v) => !v)}
            className="bg-white/95 dark:bg-slate-900/95 text-gray-900 dark:text-gray-100 p-2 rounded-full shadow-md border border-gray-200 dark:border-slate-700"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="6" cy="6" r="3" fill="#ef4444" />
              <circle cx="12" cy="6" r="3" fill="#3b82f6" />
              <circle cx="18" cy="6" r="3" fill="#10b981" />
            </svg>
          </button>
        </div>
      </div>

      {/* Small screen legend panel */}
      {legendOpen && (
        <div className="absolute bottom-24 right-4 bg-white/95 dark:bg-slate-900/95 text-gray-900 dark:text-gray-100 rounded shadow-md p-3 w-40 border border-gray-200 dark:border-slate-700" style={{ zIndex: 99999 }}>
          <div className="flex flex-col gap-2">
            <div className="flex justify-end">
              <button aria-label="Fechar legenda" onClick={() => setLegendOpen(false)} className="text-xs text-gray-600">Fechar</button>
            </div>
            <LegendRow label="Perdido" color={STATUS_COLORS.lost} />
            <LegendRow label="Encontrado" color={STATUS_COLORS.found} />
            <LegendRow label="Adoção" color={STATUS_COLORS.adoption} />
            <div className="flex items-center gap-2">
              <span className="inline-block" style={{ width: 18, height: 18 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" fill="#ffffff" />
                  <circle cx="12" cy="12" r="3" fill="#f59e0b" />
                </svg>
              </span>
              <span>Avistamento</span>
            </div>
          </div>
        </div>
      )}

      <DirectionsDialog 
        open={!!directionsData} 
        onClose={() => setDirectionsData(null)} 
        lat={directionsData?.lat || 0} 
        lng={directionsData?.lng || 0} 
        address={directionsData?.address}
      />
    </div>
  )
}

// Helper components defined outside to prevent re-mounting on every render
function LocationHandler({ onLocationFound }: { onLocationFound: (latlng: { lat: number; lng: number }) => void }) {
  useMapEvents({
    locationfound(e) {
      onLocationFound(e.latlng)
    },
  })
  return null
}

function MapClickHandler({ onDeselect }: { onDeselect?: () => void }) {
  useMapEvents({
    click(e) {
      if (onDeselect) {
        onDeselect()
      }
    }
  })
  return null
}

function MapController({ userLocation }: { userLocation?: { lat: number; lng: number } }) {
  const map = useMap()
  
  const handleCenterOnUser = () => {
    if (userLocation) {
      map.flyTo([userLocation.lat, userLocation.lng], 16, { duration: 0.8 })
    } else {
      map.locate({ setView: true, maxZoom: 16 })
    }
  }

  return (
    <div className="leaflet-top leaflet-right" style={{ top: '20px', right: '10px' }}>
      <div className="leaflet-control leaflet-bar">
        <button
          className="bg-white hover:bg-gray-100 text-gray-800 font-semibold px-3 py-2 border border-gray-400 rounded shadow flex items-center gap-2 h-auto"
          onClick={handleCenterOnUser}
          title="Centralizar na minha localização"
          aria-label="Centralizar na minha localização"
        >
          <Locate className="w-4 h-4" />
          <span className="text-sm font-medium">Minha localização</span>
        </button>
      </div>
    </div>
  )
}

function AutoCenter({ selectedPetId, userLocation }: { selectedPetId?: string | null, userLocation?: { lat: number; lng: number } }) {
  const map = useMap()
  const hasCentered = React.useRef(false)

  React.useEffect(() => {
    if (hasCentered.current) return

    if (selectedPetId) {
      hasCentered.current = true
      return
    }

    if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 14)
      hasCentered.current = true
    } else {
      map.locate({ setView: true, maxZoom: 14 })
      hasCentered.current = true
    }
  }, [map, selectedPetId, userLocation])

  return null
}

// small presentational helper: legend row with a mini-pin svg
function LegendRow({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-block" style={{ width: 18, height: 18 }}>
        <svg width="18" height="18" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 2 C12 2 8 6 8 12 C8 20 18 32 18 32 C18 32 28 20 28 12 C28 6 24 2 18 2 Z" fill={color} stroke="#ffffff" strokeWidth="1.2" />
          <circle cx="18" cy="12" r="4" fill="#ffffff" />
        </svg>
      </span>
      <span>{label}</span>
    </div>
  )
}
