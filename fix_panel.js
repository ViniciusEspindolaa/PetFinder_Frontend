const fs = require('fs');
const p = 'C:/Users/vinic.VINICIUS/Desktop/PetFinder/Frontend/app/map/page.tsx';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/<div className="mt-2 sm:mt-0 sm:ml-auto flex flex-wrap gap-2">[\s\S]*?<\/div>\s*<\/div>\s*\{showPets && \([\s\S]*?<\/div>\s*\)\}\s*<\/div>/,
\<div className="flex flex-wrap gap-2 w-full justify-between items-center mb-3">
            <div className="flex flex-wrap gap-2 items-center">
              {showPets && (
                <>
                  <span className="text-sm font-medium flex items-center mr-2">Filtro Pets:</span>
                  <Button size="sm" variant={statusFilter === 'all' ? 'default' : 'outline'} onClick={() => setStatusFilter('all')}>Todos</Button>
                  <Button size="sm" variant={statusFilter === 'lost' ? 'default' : 'outline'} onClick={() => setStatusFilter('lost')}>Perdidos</Button>
                  <Button size="sm" variant={statusFilter === 'found' ? 'default' : 'outline'} onClick={() => setStatusFilter('found')}>Encontrados</Button>
                  <Button size="sm" variant={statusFilter === 'adoption' ? 'default' : 'outline'} onClick={() => setStatusFilter('adoption')}>Ado\u00E7\u00E3o</Button>
                  <Button size="sm" variant={statusFilter === 'rescue' ? 'default' : 'outline'} onClick={() => setStatusFilter('rescue')}>Resgate</Button>
                </>
              )}
            </div>

            <div className="mt-2 sm:mt-0 ml-auto flex flex-wrap gap-2 items-center">
              <Button size="sm" variant={showPets ? 'default' : 'outline'} className={showPets ? "bg-red-500 hover:bg-red-600 text-white border-red-500 shadow-sm" : ""} onClick={() => setShowPets(!showPets)}>Pets</Button>
              <Button size="sm" variant={showServices ? 'default' : 'outline'} className={showServices ? "bg-teal-600 hover:bg-teal-700 text-white border-teal-600 shadow-sm" : ""} onClick={() => setShowServices(!showServices)}>Servi\u00E7os</Button>
              <Button size="sm" variant={showEvents ? 'default' : 'outline'} className={showEvents ? "bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500 shadow-sm" : ""} onClick={() => setShowEvents(!showEvents)}>Eventos</Button>
            </div>
          </div>
        </div>\);

fs.writeFileSync(p, c);
console.log('Fixed panel UI');
