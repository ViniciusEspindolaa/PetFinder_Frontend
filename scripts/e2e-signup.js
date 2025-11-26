const { chromium } = require('playwright');

;(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('dialog', async dialog => {
    console.log('Dialog shown:', dialog.message());
    await dialog.accept();
  });

  try {
    const unique = Date.now();
    const testEmail = `e2e+${unique}@local.test`;
    const password = 'Aa1!teste';
    console.log('Abrindo /signup...');
    await page.goto('http://localhost:3000/signup', { waitUntil: 'networkidle' });

    // Preencher formulário
    await page.fill('#name', 'Usuario Teste E2E');
    await page.fill('#email', testEmail);
    // usar telefone somente dígitos e compatível com DB (até 15)
    await page.fill('#phone', '5511999990000');
    await page.fill('#password', password);
    await page.fill('#confirmPassword', password);

    // Submete e captura a resposta da API para diagnóstico
    console.log('Enviando formulário de signup com email', testEmail);
    const responsePromise = page.waitForResponse(resp => resp.url().includes('/api/usuarios') && resp.request().method() === 'POST', { timeout: 8000 }).catch(() => null)
    await page.click('button[type="submit"]')

    const apiResponse = await responsePromise
    if (apiResponse) {
      console.log('Resposta /api/usuarios status:', apiResponse.status())
      try {
        const body = await apiResponse.json()
        console.log('Resposta /api/usuarios body:', JSON.stringify(body))
      } catch (e) {
        const text = await apiResponse.text()
        console.log('Resposta /api/usuarios body (text):', text)
      }
    } else {
      console.log('Nenhuma resposta /api/usuarios capturada (timeout)')
    }

    // Poll localStorage for token (caso o fluxo tenha continuado)
    const start = Date.now();
    let token = null;
    while (Date.now() - start < 10000) {
      token = await page.evaluate(() => localStorage.getItem('token'));
      if (token) break;
      await page.waitForTimeout(300);
    }

    if (token) {
      console.log('Token encontrado:', token.substring(0, 20) + '...');
      const user = await page.evaluate(() => localStorage.getItem('user'));
      console.log('User in localStorage:', user);
      await browser.close();
      process.exit(0);
    } else {
      console.error('Token não encontrado após submit. Possível erro no cadastro.');
      await browser.close();
      process.exit(2);
    }
  } catch (err) {
    console.error('Erro no teste E2E signup:', err);
    await browser.close();
    process.exit(3);
  }

})();
