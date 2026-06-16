const fs = require('fs');

function addLocationLogic(path) {
  let code = fs.readFileSync(path, 'utf8');

  // Add useEffect to the imports if missing
  code = code.replace(/import \{ useState \} from "react"/g, 'import { useState, useEffect } from "react"');

  // Replace component states to include isGettingLocation
  if (!code.includes('isGettingLocation')) {
    code = code.replace(
      /const \[mapLocation, setMapLocation\] = useState<\{ lat: number; lng: number \} \| null>\(null\)/,
      "const [mapLocation, setMapLocation] = useState<{ lat: number; lng: number } | null>(null)\n  const [isGettingLocation, setIsGettingLocation] = useState(false)"
    );
  }

  // Insert methods handleGetCurrentLocation & useEffect
  if (!code.includes('handleGetCurrentLocation')) {
    const methods = `
  const handleGetCurrentLocation = () => {
    setIsGettingLocation(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setMapLocation({ lat: latitude, lng: longitude })
          setIsGettingLocation(false)
          toast({
            title: "Localização capturada",
            description: \`Coordenadas: \${latitude.toFixed(6)}, \${longitude.toFixed(6)}\`,
            duration: 3000,
          })
        },
        (error) => {
          setIsGettingLocation(false)
          toast({
            variant: "destructive",
            title: "Erro de localização",
            description: "Não foi possível obter sua localização. Verifique as permissões.",
            duration: 3000,
          })
        }
      )
    } else {
      setIsGettingLocation(false)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Geolocalização não é suportada pelo seu navegador.",
        duration: 3000,
      })
    }
  }

  useEffect(() => {
    const doReverse = async () => {
      if (!mapLocation) return
      try {
        const res = await fetch(\`https://nominatim.openstreetmap.org/reverse?lat=\${mapLocation.lat}&lon=\${mapLocation.lng}&format=json&addressdetails=1\`)
        const data = await res.json()
        const a = data?.address || {}
        
        let street = a.road || a.pedestrian || a.footway || a.cycleway || ''
        if (a.house_number) {
          street = street ? \`\${street}, \${a.house_number}\` : \`\${a.house_number}\`
        }
        const city = a.city || a.town || a.village || a.county || a.state || ''
        const parts = []
        if (street) parts.push(street)
        if (city) parts.push(city)
        const display = parts.length ? parts.join(', ') : (data.display_name || '')

        setFormData(prev => ({
          ...prev,
          endereco_texto: display,
          cidade: city // Just in case it's a service form
        }))
      } catch (err) {
        console.error('Erro no reverse geocoding', err)
      }
    }
    doReverse()
  }, [mapLocation])
`;
    // Insert before handleSubmit
    code = code.replace(/const handleSubmit = async/, methods + '\n  const handleSubmit = async');
  }

  // Insert button below SelectableMap
  if (!code.includes('handleGetCurrentLocation}')) {
    const buttonHtml = `/>
                <div className="mt-2 text-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGetCurrentLocation}
                    disabled={isGettingLocation}
                    className="w-full text-sm"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    {isGettingLocation ? 'Obtendo localização...' : 'Usar Minha Localização Atual'}
                  </Button>
                </div>`;
    code = code.replace(/\/>\s*<\/div>\s*<\/div>\s*<div className="space-y-2">/, buttonHtml + '\n              </div>\n            </div>\n            <div className="space-y-2">');
  }

  fs.writeFileSync('app/' + path.split('app/')[1], code);
  console.log(path + ' updated to include handleGetCurrentLocation & reverse geocoding.');
}

addLocationLogic('Frontend/app/novo-evento/page.tsx');
addLocationLogic('Frontend/app/novo-servico/page.tsx');
