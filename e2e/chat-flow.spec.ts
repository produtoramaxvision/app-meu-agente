import { test, expect } from '@playwright/test';

test('Chat flow verification', async ({ page }) => {
  // 1. Navigate to Login
  await page.goto('http://localhost:8080/auth/login');
  
  // 2. Enter Phone
  // The input might have a placeholder or label. Based on Login.tsx, it's likely the first input.
  // Let's try to find it by type="tel" or placeholder if possible, but generic input is safer if only one.
  // Looking at Login.tsx, it uses Input component.
  
  // Wait for the phone input to be visible
  const phoneInput = page.locator('input[type="tel"]');
  await expect(phoneInput).toBeVisible();
  
  // Fill phone number - the component formats it, so we might need to type it slowly or just fill the raw digits if it handles it.
  // The user provided 5511949746110.
  await phoneInput.fill('5511949746110');
  
  // Click Continue/Submit button
  // There should be a button with type="submit"
  await page.locator('button[type="submit"]').click();
  
  // 3. Enter Password
  // Wait for password input
  const passwordInput = page.locator('input[type="password"]');
  await expect(passwordInput).toBeVisible();
  
  await passwordInput.fill('123456789');
  
  // Click Login button
  await page.locator('button[type="submit"]').click();
  
  // 4. Verify Dashboard or redirection
  // Should redirect to /dashboard or /
  await expect(page).toHaveURL(/.*dashboard/);
  
  // 5. Navigate to Chat
  await page.goto('http://localhost:8080/chat');
  
  // 6. Check for Chat UI
  await expect(page.getByText('Agente de Scrape')).toBeVisible();
  
  // Check for error alerts
  const errorAlert = page.locator('.text-warning');
  if (await errorAlert.isVisible()) {
    const errorText = await errorAlert.textContent();
    console.log('Chat Configuration Warning:', errorText);
  }
  
  // Check if input is enabled/disabled
  const chatInput = page.locator('textarea');
  const isDisabled = await chatInput.isDisabled();
  console.log('Chat Input Disabled:', isDisabled);
  
  if (!isDisabled) {
    // Try to send a message
    await chatInput.fill('Teste automatizado Playwright');
    await page.locator('button[aria-label="Enviar mensagem"]').click();
    
    // Check for new message in the list
    await expect(page.getByText('Teste automatizado Playwright')).toBeVisible();
  }
});
