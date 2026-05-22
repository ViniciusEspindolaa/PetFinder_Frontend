const fs = require('fs');
let p = 'C:/Users/vinic.VINICIUS/Desktop/PetFinder/Frontend/app/novo-servico/page.tsx';
let txt = fs.readFileSync(p, 'utf8');
txt = txt.replace(/""/g, '"');
fs.writeFileSync(p, txt);
