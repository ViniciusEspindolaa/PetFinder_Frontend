"use client"

import React from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'

export default function SelectableMap({
  latitude,
  longitude,
  onChange,
  className,
}: {
  latitude?: number | null
  longitude?: number | null
  onChange: (lat: number, lng: number) => void
  className?: string
}) {
  // Since we are using dynamic import with ssr: false, we are already on the client.
  // However, we keep a ref to ensure we don't initialize things multiple times if not needed.
  
  React.useEffect(() => {
    // Fix icons
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    })

    const id = 'leaflet-css'
    if (!document.getElementById(id)) {
      const link = document.createElement('link')
      link.id = id
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      link.crossOrigin = ''
      document.head.appendChild(link)
      
      const styleId = 'leaflet-selectable-custom'
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style')
        style.id = styleId
        style.innerHTML = `
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
        `
        document.head.appendChild(style)
      }
    }
  }, [])

  const center: [number, number] = React.useMemo(() => {
    if (latitude && longitude) return [latitude, longitude]
    return [-23.55, -46.63]
  }, [latitude, longitude])

  function ClickHandler() {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng
        onChange(lat, lng)
      }
    })
    return null
  }

  function PanTo({ lat, lng }: { lat?: number | null; lng?: number | null }) {
    const map = useMap()
    React.useEffect(() => {
      if (lat && lng) {
        try {
          map.flyTo([lat, lng], 14, { duration: 0.6 })
        } catch (e) {
          // ignore
        }
      }
    }, [lat, lng, map])
    return null
  }

  return (
    <div className={className || 'w-full h-64'}>
      <MapContainer 
        key="map-container"
        center={center} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler />
        {latitude && longitude && (() => {
          const color = '#2563eb'
          const svg = `
            <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="pin">
              <path d="M18 2 C12 2 8 6 8 12 C8 20 18 32 18 32 C18 32 28 20 28 12 C28 6 24 2 18 2 Z" fill="${color}" stroke="#ffffff" stroke-width="1.2" />
              <circle cx="18" cy="12" r="4" fill="#ffffff" />
            </svg>
          `
          const icon = L.divIcon({ html: svg, className: 'custom-div-icon', iconSize: [36, 36], iconAnchor: [18, 34] })
          return (
            <>
              <PanTo lat={latitude} lng={longitude} />
              <Marker
                position={[latitude, longitude]}
                icon={icon}
                draggable={true}
                eventHandlers={{
                  dragend(e: any) {
                    const { lat, lng } = e.target.getLatLng()
                    onChange(lat, lng)
                  }
                }}
              />
            </>
          )
        })()}
      </MapContainer>
    </div>
  )
}
