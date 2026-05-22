const fs = require('fs');
const p = 'C:/Users/vinic.VINICIUS/Desktop/PetFinder/Frontend/components/leaflet-map.client.tsx';
let c = fs.readFileSync(p, 'utf8');

const srvMarkerJSX = 

        {serviceMarkers.map((m) => (
          <Marker 
            key={\srv-\\}
            position={[m.lat || 0, m.lng || 0]} 
            icon={serviceIcon}
          >
            <Popup>
              <div style={{ maxWidth: 240 }} className="text-sm">
                <div className="font-bold mb-1">{m.nome}</div>
                <div className="text-xs text-muted-foreground mb-2">{m.categoria || 'Serviço'}</div>
                {m.photo && <img src={m.photo} alt={m.nome} className="w-full h-24 object-cover rounded mb-2" />}
                <div className="flex justify-end gap-2 mt-2">
                  <Button size="sm" className="h-8 px-2 text-xs" onClick={() => window.location.href = \/servicos/\\}>
                    Ver Serviço
                  </Button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {eventMarkers.map((m) => (
          <Marker 
            key={\evt-\\}
            position={[m.lat || 0, m.lng || 0]} 
            icon={eventIcon}
          >
            <Popup>
              <div style={{ maxWidth: 240 }} className="text-sm">
                <div className="font-bold mb-1">{m.nome}</div>
                {m.photo && <img src={m.photo} alt={m.nome} className="w-full h-24 object-cover rounded mb-2" />}
                {m.data_inicio && <div className="text-xs mb-1">Início: {new Date(m.data_inicio).toLocaleDateString()}</div>}
                <div className="flex justify-end gap-2 mt-2">
                  <Button size="sm" className="h-8 px-2 text-xs border-yellow-500 bg-yellow-500 hover:bg-yellow-600" onClick={() => window.location.href = \/eventos/\\}>
                    Ver Evento
                  </Button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        <FlyToSelected;

c = c.replace(/<FlyToSelected/g, srvMarkerJSX);
fs.writeFileSync(p, c);
console.log('Fixed missing markers JSX');
