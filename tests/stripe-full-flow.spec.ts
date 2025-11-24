import { test, expect } from '@playwright/test';

test('fluxo completo de upgrade com stripe', async ({ page }) => {
  // 1. Login
  await page.goto('http://localhost:8080/auth/login');
  await page.fill('input[type="tel"]', '5511949746110');
  await page.fill('input[type="password"]', '12345678');
  await page.click('button:has-text("Entrar")');
  
  // Aguardar redirecionamento para dashboard
  await expect(page).toHaveURL('/dashboard');
  
  // 2. Ir para Perfil e aba Planos
  await page.goto('http://localhost:8080/perfil?tab=plans');
  
  // 3. Clicar em Upgrade (Plano Basic)
  // Procura pelo botão no card do plano Basic
  const upgradeButton = page.locator('.text-blue-600').locator('xpath=../../..').getByRole('button', { name: 'Fazer Upgrade' });
  await upgradeButton.click();

  // 4. Aguardar redirecionamento para Stripe Checkout
  await page.waitForURL(/checkout.stripe.com/);
  
  // 5. Preencher dados do Stripe (Ambiente de Teste)
  // O Stripe usa iframes, então pode ser tricky, mas vamos tentar os seletores padrão de teste
  
  // Email (se pedir)
  if (await page.isVisible('#email')) {
    await page.fill('#email', 'teste@exemplo.com');
  }

  // Cartão
  await page.fill('#cardNumber', '5555555555554444');
  await page.fill('#cardExpiry', '0330'); // 03/30
  await page.fill('#cardCvc', '333');
  await page.fill('#billingName', 'Teste Playwright');
  
  // Endereço (Stripe costuma pedir CEP em testes br)
  if (await page.isVisible('#billingPostalCode')) {
    await page.fill('#billingPostalCode', '01001000');
  }

  // 6. Pagar
  await page.click('button[type="submit"]');

  // 7. Aguardar retorno para a aplicação (Sucesso)
  await page.waitForURL(/perfil\?tab=plans&success=true/, { timeout: 30000 });
  
  // 8. Validar mensagem de sucesso na UI
  await expect(page.getByText('Pagamento realizado com sucesso')).toBeVisible();
});

