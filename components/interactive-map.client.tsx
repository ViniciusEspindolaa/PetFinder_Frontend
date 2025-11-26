"use client"

import dynamic from 'next/dynamic'

const LeafletMap = dynamic(() => import('./leaflet-map.client'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center text-gray-400">
      Carregando mapa...
    </div>
  ),
})

export { LeafletMap as InteractiveMap }
