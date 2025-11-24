import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:8080';

test.describe('Fluxo de Assinatura Stripe', () => {
  
  test('deve iniciar fluxo de upgrade e tratar retorno de sucesso', async ({ page }) => {
    // 1. Mock da API de Checkout Session para não depender do Stripe real
    await page.route('**/functions/v1/create-checkout-session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ url: 'http://localhost:8080/perfil?tab=plans&success=true&mocked=true' })
      });
    });

    // 2. Setup: Login falso ou navegar direto se possível (aqui assumindo fluxo de login necessário)
    // Para testes mais rápidos, poderíamos mockar o estado de auth, mas vamos pelo login UI para garantir
    await page.goto(`${BASE_URL}/auth/login`);
    
    // Se já estiver logado, redireciona, senão preenche login
    if (await page.getByLabel('Telefone').isVisible()) {
        await page.getByLabel('Telefone').fill('11999999999');
        await page.getByRole('button', { name: 'Continuar' }).click();
        await page.getByLabel('Senha').fill('12345678');
        await page.getByRole('button', { name: 'Entrar' }).click();
    }

    await page.waitForURL('**/dashboard', { timeout: 15000 });

    // 3. Ir para Planos
    await page.goto(`${BASE_URL}/perfil?tab=plans`);
    
    // 4. Clicar em Upgrade (Ex: Plano Business)
    // Usamos um seletor mais específico para evitar ambiguidade
    const businessCard = page.locator('.border-green-200, .dark\\:border-green-800').first();
    await expect(businessCard).toBeVisible();
    
    // Interceptar a navegação
    const upgradeButton = businessCard.getByRole('button', { name: /Fazer Upgrade/i });
    await upgradeButton.click();

    // 5. Validar que o app tentou redirecionar para a URL retornada pelo backend (nosso mock)
    await page.waitForURL('**/?tab=plans&success=true&mocked=true', { timeout: 10000 });

    // 6. Validar comportamento de sucesso (Toast e refresh)
    // O toast de sucesso deve aparecer
    await expect(page.getByText('Pagamento realizado com sucesso')).toBeVisible();
    
    // Validar que a função de refresh foi chamada (indiretamente, verificando se elementos de UI de plano ativo aparecem ou se o toast apareceu)
  });

  test('deve tratar retorno de cancelamento', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/login`);
    // ... login logic se necessário ...
    await page.waitForURL('**/dashboard');

    // Simular retorno de cancelamento do Stripe
    await page.goto(`${BASE_URL}/perfil?tab=plans&canceled=true`);

    // Validar toast de informação
    await expect(page.getByText('O processo de pagamento foi cancelado')).toBeVisible();
  });
});
