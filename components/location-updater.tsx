'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { apiFetch } from '@/lib/api'

export function LocationUpdater() {
  const { user, updateCoordinates } = useAuth()
  const lastUpdateRef = useRef<{ lat: number; lng: number } | null>(null)
  const processingRef = useRef(false)

  useEffect(() => {
    if (!user) return

    // Função para verificar configuração e atualizar
    const checkAndUpdateLocation = async () => {
      if (processingRef.current) return
      processingRef.current = true

      try {
        // 1. Verificar se o usuário permitiu "Detecção automática"
        // Buscamos as configurações atualizadas do backend para garantir
        const userData = await apiFetch(`/api/usuarios/${user.id}`)
        const config = userData.configuracoes || {}
        
        // Se autoLocation for false (e não undefined, pois default é true), paramos
        if (config.autoLocation === false) {
          processingRef.current = false
          return
        }

        // 2. Obter geolocalização do navegador
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords

              // 3. Verificar se mudou o suficiente para justificar update (ex: 100 metros)
              // Se nunca atualizou, atualiza.
              let shouldUpdate = true
              
              if (lastUpdateRef.current) {
                const dist = haversineKm(
                  lastUpdateRef.current.lat,
                  lastUpdateRef.current.lng,
                  latitude,
                  longitude
                )
                // Só atualiza se moveu mais de 100 metros (0.1 km)
                if (dist < 0.1) shouldUpdate = false
              }

              // Também verifica se a localização no objeto user está muito diferente
              // (caso tenha logado em outro dispositivo recentemente)
              if (user.location) {
                 const distUser = haversineKm(
                   user.location.lat,
                   user.location.lng,
                   latitude,
                   longitude
                 )
                 if (distUser < 0.1) shouldUpdate = false
              }

              if (shouldUpdate) {
                console.log('[LocationUpdater] Atualizando localização do usuário...', { latitude, longitude })
                await updateCoordinates(latitude, longitude)
                lastUpdateRef.current = { lat: latitude, lng: longitude }
              }
              
              processingRef.current = false
            },
            (error) => {
              console.warn('[LocationUpdater] Erro ao obter geolocalização:', error.message)
              processingRef.current = false
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 60000 // Aceita cache de 1 minuto
            }
          )
        } else {
          processingRef.current = false
        }
      } catch (error) {
        console.error('[LocationUpdater] Erro no processo:', error)
        processingRef.current = false
      }
    }

    // Executa ao montar
    checkAndUpdateLocation()

    // Executa a cada 5 minutos (300000 ms) para manter atualizado sem gastar muita bateria/dados
    const intervalId = setInterval(checkAndUpdateLocation, 300000)

    return () => clearInterval(intervalId)
  }, [user, updateCoordinates])

  return null // Componente lógico, sem renderização visual
}

// Helper simples para distância
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371 // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
