const fs = require('fs');
const path = 'C:/Users/vinic.VINICIUS/Desktop/PetFinder/Frontend/app/new-pet/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const newStr = } catch (error: any) {
      console.error('Erro na an\xE1lise da IA', error);
      const errMsg = error?.message || (error instanceof Error ? error.message : '');
      if (errMsg.toLowerCase().includes('animal')) {
        toast({
          variant: 'destructive',
          title: 'Imagem Recusada',
          description: errMsg || 'A imagem parece não conter um animal.',
          duration: 5000,
        });
        setPhotoPreview(null);
        setSelectedPhoto(null);
        return;
      }
      toast({
         variant: 'destructive',
         title: 'Erro na IA',
         description: 'N\xE3o foi poss\xEDvel analisar a imagem. Voc\xEA pode preencher manualmente.',
      });
    };

content = content.replace(/\}\s*catch\s*\(error\)\s*\{[\s\S]*?\}\);[\s\n]*\}/, newStr);

fs.writeFileSync(path, content, 'utf8');
console.log('Done!');
