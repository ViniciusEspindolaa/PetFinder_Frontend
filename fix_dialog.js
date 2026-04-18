const fs = require('fs');
let file = fs.readFileSync('components/complete-pet-dialog.tsx', 'utf8');

const rx = /const getCompletionOptions = \(\) => \{[\s\S]*?default:\s*return \['Outros'\]\n\s*\}/;
const newGetOptions = 'const getCompletionOptions = () => {\\n' +
'    if (!pet) return []\\n\\n' +
'    switch (pet.status) {\\n' +
'      case \'lost\':\\n' +
'        return [\\n' +
'          \'Pet foi encontrado\',\\n' +
'          \'Pet voltou para casa sozinho\',\\n' +
'          \'Desistiu de procurar\',\\n' +
'          \'Outros\'\\n' +
'        ]\\n' +
'      case \'found\':\\n' +
'        return [\\n' +
'          \'Tutor foi encontrado\',\\n' +
'          \'Pet foi adotado por outra pessoa\',\\n' +
'          \'Pet foi encaminhado para abrigo\',\\n' +
'          \'Outros\'\\n' +
'        ]\\n' +
'      case \'adoption\':\\n' +
'        return [\\n' +
'          \'Pet foi adotado\',\\n' +
'          \'Pet não está mais disponível\',\\n' +
'          \'Desistiu da doação\',\\n' +
'          \'Outros\'\\n' +
'        ]\\n' +
'      case \'rescue\':\\n' +
'        return [\\n' +
'          \'O pet foi resgatado com sucesso\',\\n' +
'          \'Ajudamos no resgate\',\\n' +
'          \'Pet encaminhado para tratamento\',\\n' +
'          \'Outros\'\\n' +
'        ]\\n' +
'      default:\\n' +
'        return [\'Outros\']\\n' +
'    }';

file = file.replace(rx, newGetOptions);
file = file.replace(/Ex:\s*Pet.*\n.*\!/g, 'Ex: Pet foi encontrado e está em segurança!');
file = file.replace(/Ex:\s*Pet.*seguran.*\!/g, 'Ex: Pet foi encontrado e está em segurança!');
file = file.replace(/Compartilhe detalhes.*/g, 'Compartilhe detalhes sobre como a situação foi resolvida!');

fs.writeFileSync('components/complete-pet-dialog.tsx', Buffer.from(file, 'utf-8'));
console.log('Fixed dialog text');
