const fs = require('fs');
const p = 'C:/Users/vinic.VINICIUS/Desktop/PetFinder/Frontend/components/leaflet-map.client.tsx';
let c = fs.readFileSync(p, 'utf8');

const replacement = '<LegendRow label="Ado\u00E7\u00E3o" color={STATUS_COLORS.adoption} />\n' +
'              <LegendRow label="Resgate" color={STATUS_COLORS.rescue} />\n' +
'              \n' +
'              <div className="flex items-center gap-2">\n' +
'                <span className="inline-flex items-center justify-center bg-yellow-500 rounded-full border border-white shadow-sm" style={{ width: 18, height: 18 }}>\n' +
'                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">\n' +
'                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>\n' +
'                    <line x1="16" y1="2" x2="16" y2="6"></line>\n' +
'                    <line x1="8" y1="2" x2="8" y2="6"></line>\n' +
'                    <line x1="3" y1="10" x2="21" y2="10"></line>\n' +
'                  </svg>\n' +
'                </span>\n' +
'                <span>Eventos</span>\n' +
'              </div>\n' +
'              \n' +
'              <div className="flex items-center gap-2">\n' +
'                <span className="inline-flex items-center justify-center bg-[#0d9488] rounded-full border border-white shadow-sm" style={{ width: 18, height: 18 }}>\n' +
'                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">\n' +
'                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>\n' +
'                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>\n' +
'                  </svg>\n' +
'                </span>\n' +
'                <span>Servi\u00E7os</span>\n' +
'              </div>';

c = c.replace(/<LegendRow label=.Ado\S+o.[^>]*>\s*<LegendRow label=.Resgate.[^>]*>\s*<LegendRow label=.Eventos.[^>]*>\s*<LegendRow label=.Servi\S+os.[^>]*>/g, replacement);

fs.writeFileSync(p, c, 'utf8');
console.log('Fixed legends map');
