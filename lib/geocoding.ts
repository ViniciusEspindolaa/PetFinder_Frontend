export interface ReverseGeocodeResult {
  endereco_texto: string
  bairro: string
  cidade: string
}

export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
  const base = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`

  const [resDetalhe, resMunicipio] = await Promise.all([
    fetch(base),
    fetch(`${base}&zoom=10`),
  ])

  const [detalhe, municipio] = await Promise.all([
    resDetalhe.json(),
    resMunicipio.json(),
  ])

  const a = detalhe?.address || {}
  const am = municipio?.address || {}

  const street = a.road || a.pedestrian || a.footway || a.cycleway || ''
  const house = a.house_number || ''
  const streetFull = house ? (street ? `${street}, ${house}` : house) : street

  // zoom=10 retorna municipality confiável (ex: "Pelotas") mesmo quando
  // o zoom padrão retorna apenas a subdivisão interna (ex: "Sede")
  const cidade = am.municipality || am.city || am.town || a.municipality || a.county || a.state || ''
  const bairro = a.suburb || a.neighbourhood || a.city_district || a.village || a.hamlet || ''

  const endereco_texto = streetFull || detalhe.display_name || ''

  return { endereco_texto, bairro, cidade }
}
