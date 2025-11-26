const { chromium } = require('playwright');

;(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('Navegando para /new-pet...')
    await page.goto('http://localhost:3000/new-pet', { waitUntil: 'networkidle' });

    // Esperar o mapa carregar
    await page.waitForSelector('.leaflet-container', { timeout: 15000 });
    const map = await page.$('.leaflet-container');
    if (!map) throw new Error('Mapa não encontrado na página')

    const box = await map.boundingBox();
    if (!box) throw new Error('Não foi possível obter bounding box do mapa')

    // Clicar próximo ao centro do mapa
    const clickX = box.x + box.width / 2
    const clickY = box.y + box.height / 2
    console.log('Clicando no mapa em', clickX, clickY)
    await page.mouse.click(clickX, clickY)

    // Aguarda o reverse-geocode preencher os campos (polling)
    const selectors = ['#location', '#neighborhood', '#city']
    const values = {}

    for (const sel of selectors) {
      values[sel] = ''
    }

    const started = Date.now()
    while (Date.now() - started < 15000) {
      for (const sel of selectors) {
        const el = await page.$(sel)
        if (el) {
          const v = (await el.inputValue()).trim()
          values[sel] = v
        }
      }
      // continuar se todos preenchidos
      if (values['#location'] || values['#neighborhood'] || values['#city']) break
      await page.waitForTimeout(500)
    }

    console.log('Valores obtidos:')
    console.log('location:', values['#location'])
    console.log('neighborhood:', values['#neighborhood'])
    console.log('city:', values['#city'])

    await browser.close();
    process.exit(0)
  } catch (err) {
    console.error('Erro no E2E:', err)
    await browser.close();
    process.exit(2)
  }

})()
