export interface ReverseGeocodeResult {
  endereco_texto: string
  bairro: string
  cidade: string
}

export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`
  )
  const data = await res.json()
  const a = data?.address || {}

  let street = a.road || a.pedestrian || a.footway || a.cycleway || ''
  const house = a.house_number || ''
  const streetFull = house ? (street ? `${street}, ${house}` : house) : street
  const cidade = a.city || a.town || a.village || a.county || a.state || ''
  const bairro = a.neighbourhood || a.suburb || a.village || a.hamlet || ''

  const parts: string[] = []
  if (streetFull) parts.push(streetFull)
  if (cidade) parts.push(cidade)
  const endereco_texto = parts.length ? parts.join(', ') : (data.display_name || '')

  return { endereco_texto, bairro, cidade }
}
