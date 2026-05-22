const fs = require('fs');
const p = 'C:/Users/vinic.VINICIUS/Desktop/PetFinder/Frontend/components/leaflet-map.client.tsx';
let c = fs.readFileSync(p, 'utf8');

c = c.replace('<FlyToSelected', 
  '{serviceMarkers.map((m) => (' + String.fromCharCode(10) +
  '  <Marker key={"srv-" + m.id} position={[m.lat || 0, m.lng || 0]} icon={serviceIcon}>' + String.fromCharCode(10) +
  '    <Popup>' + String.fromCharCode(10) +
  '      <div style={{ maxWidth: 240 }} className="text-sm">' + String.fromCharCode(10) +
  '        <div className="font-bold mb-1">{m.nome}</div>' + String.fromCharCode(10) +
  '        <div className="text-xs text-muted-foreground mb-2">{m.categoria || "Serviço"}</div>' + String.fromCharCode(10) +
  '        {m.photo && <img src={m.photo} alt={m.nome} className="w-full h-24 object-cover rounded mb-2" />}' + String.fromCharCode(10) +
  '        <div className="flex justify-end gap-2 mt-2">' + String.fromCharCode(10) +
  '          <Button size="sm" className="h-8 px-2 text-xs bg-teal-600 hover:bg-teal-700" onClick={() => window.location.href = "/servicos/" + m.id}>' + String.fromCharCode(10) +
  '            Ver Serviço' + String.fromCharCode(10) +
  '          </Button>' + String.fromCharCode(10) +
  '        </div>' + String.fromCharCode(10) +
  '      </div>' + String.fromCharCode(10) +
  '    </Popup>' + String.fromCharCode(10) +
  '  </Marker>' + String.fromCharCode(10) +
  '))}' + String.fromCharCode(10) +
  '{eventMarkers.map((m) => (' + String.fromCharCode(10) +
  '  <Marker key={"evt-" + m.id} position={[m.lat || 0, m.lng || 0]} icon={eventIcon}>' + String.fromCharCode(10) +
  '    <Popup>' + String.fromCharCode(10) +
  '      <div style={{ maxWidth: 240 }} className="text-sm">' + String.fromCharCode(10) +
  '        <div className="font-bold mb-1">{m.nome}</div>' + String.fromCharCode(10) +
  '        {m.photo && <img src={m.photo} alt={m.nome} className="w-full h-24 object-cover rounded mb-2" />}' + String.fromCharCode(10) +
  '        {m.data_inicio && <div className="text-xs mb-1">Início: {new Date(m.data_inicio).toLocaleDateString()}</div>}' + String.fromCharCode(10) +
  '        <div className="flex justify-end gap-2 mt-2">' + String.fromCharCode(10) +
  '          <Button size="sm" className="h-8 px-2 text-xs bg-yellow-500 hover:bg-yellow-600" onClick={() => window.location.href = "/eventos/" + m.id}>' + String.fromCharCode(10) +
  '            Ver Evento' + String.fromCharCode(10) +
  '          </Button>' + String.fromCharCode(10) +
  '        </div>' + String.fromCharCode(10) +
  '      </div>' + String.fromCharCode(10) +
  '    </Popup>' + String.fromCharCode(10) +
  '  </Marker>' + String.fromCharCode(10) +
  '))}' + String.fromCharCode(10) +
  '<FlyToSelected');

fs.writeFileSync(p, c);
console.log('Fixed missing markers JSX');
