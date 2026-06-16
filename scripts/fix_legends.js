const fs = require('fs');
const p = 'C:/Users/vinic.VINICIUS/Desktop/PetFinder/Frontend/components/leaflet-map.client.tsx';
let c = fs.readFileSync(p, 'utf8');
fs.writeFileSync(p, c, 'utf8');
