const fs = require('fs');
const p = 'C:/Users/vinic.VINICIUS/Desktop/PetFinder/Frontend/app/new-pet/page.tsx';
let c = fs.readFileSync(p, 'utf8');
const rep = '} catch (error: any) {\n        console.error(\'Erro na análise da IA\', error);\n        const errMsg = error?.message || (error instanceof Error ? error.message : \'\');\n        if (errMsg.toLowerCase().includes(\'animal\')) {\n          toast({\n            variant: \'destructive\',\n            title: \'Imagem Recusada\',\n            description: errMsg || \'A imagem parece não conter um animal.\',\n            duration: 5000,\n          });\n          setPhotoPreview(null);\n          setSelectedPhoto(null);\n          return;\n        }\n        toast({\n           variant: \'destructive\',\n           title: \'Erro na IA\',\n           description: \'Não foi possível analisar a imagem. Você pode preencher manualmente.\',\n        });\n      }';
c = c.replace(/\}\s*catch\s*\(error\)\s*\{[\s\S]*?\}\);\s*\}/, rep);
fs.writeFileSync(p, c, 'utf8'); console.log('OK');
