import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:8080';
const TEST_PHONE = '55 (11) 9 4974-6110';
const TEST_PASSWORD = '12345678';

test('fluxo completo: login, upgrade de plano e liberação de exportar relatórios', async ({ page }) => {
  // Login – etapa telefone
  await page.goto(`${BASE_URL}/auth/login`);

  await page.getByLabel('Telefone').fill(TEST_PHONE);
  await page.getByRole('button', { name: 'Continuar' }).click();

  // Etapa senha
  await page.getByLabel('Senha').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();

  // Deve ir para o dashboard
  await page.waitForURL('**/dashboard', { timeout: 15000 });

  // Ir direto para a aba de planos no perfil
  await page.goto(`${BASE_URL}/perfil?tab=plans`);

  // Clicar em "Fazer Upgrade" no plano Básico
  const basicCard = page.getByText('Plano Básico', { exact: false }).first();
  await expect(basicCard).toBeVisible();

  const basicUpgradeButton = basicCard.getByRole('button', { name: /Fazer Upgrade/i });
  await basicUpgradeButton.click();

  // Deve redirecionar para o Stripe Checkout
  await page.waitForURL('https://checkout.stripe.com/**', { timeout: 20000 });

  // Preencher dados do cartão de teste Stripe
  // Observação: os seletores abaixo assumem o layout padrão do Stripe Checkout em modo de teste.
  // Eles podem precisar de ajustes finos caso o HTML mude.
  const frame = page.frameLocator('iframe[name="__privateStripeFrame*"]').first();

  await frame.getByPlaceholder('Cartão ou número da conta').fill('5555 5555 5555 4444');
  await frame.getByPlaceholder('MM / AA').fill('12 / 33');
  await frame.getByPlaceholder('CVC').fill('333');

  // Confirmar pagamento
  await frame.getByRole('button', { name: /Pagar|Pay/i }).click();

  // Aguardar redirecionamento de volta para o app
  await page.waitForURL('**/perfil?tab=plans&success=true', { timeout: 60000 });

  // Ir para aba Configurações
  await page.goto(`${BASE_URL}/perfil?tab=settings`);

  // Validar que a assinatura está ativa e com plano não-free
  await expect(page.getByText(/Assinatura ativa/i)).toBeVisible();
  await expect(page.getByText(/plano básico|plano business|plano premium/i)).toBeVisible();

  // Ir para Relatórios e validar que o botão Exportar está liberado
  await page.goto(`${BASE_URL}/relatorios`);

  const exportButton = page.getByRole('button', { name: /Exportar/i }).first();
  await expect(exportButton).toBeVisible();

  // Abrir dropdown de exportação – se não estiver bloqueado pelo ProtectedExportButton,
  // o menu com opções deve aparecer.
  await exportButton.click();

  await expect(page.getByText(/Exportar PDF/i)).toBeVisible();
  await expect(page.getByText(/Exportar JSON/i)).toBeVisible();
  await expect(page.getByText(/Exportar CSV/i)).toBeVisible();
});




