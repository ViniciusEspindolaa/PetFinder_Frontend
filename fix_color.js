const fs = require('fs');
const p = 'C:/Users/vinic.VINICIUS/Desktop/PetFinder/Frontend/components/leaflet-map.client.tsx';
let c = fs.readFileSync(p, 'utf8');
c = c.replace(/#a855f7/g, '#0d9488');
fs.writeFileSync(p, c);
console.log('Fixed colors');
