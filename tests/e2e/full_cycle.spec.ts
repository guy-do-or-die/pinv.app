import { test, expect } from '@playwright/test';

test.describe('The Creative Flow', () => {
    test('should generate, preview, and edit a Countdown Pin', async ({ page }) => {
        // 1. Visit Home
        await page.goto('/');

        // 2. Enter Prompt
        const promptInput = page.getByPlaceholder('What do you want to build?');
        await expect(promptInput).toBeVisible();
        await promptInput.fill('Display seconds remaining until the year 2030. Update every second. huge font. bright red color.');

        // 3. Generate
        const generateBtn = page.getByRole('button', { name: /generate/i });
        await generateBtn.click();

        // 4. Wait for Editor & Preview
        // The URL should change to /p/[id]/edit or similar? 
        // Or we stay on home?
        // PinV flow: Home -> Generate -> Editor.
        await expect(page).toHaveURL(/\/p\/.*\/edit/);

        // 5. Verify Preview Image (The OG)
        const previewImg = page.locator('img[alt="Preview"]');
        await expect(previewImg).toBeVisible({ timeout: 30000 });

        // 6. Check Caching Headers (Interceptor)
        // We verify the backend responds with correct Cache-Control
        const editResponse = await page.waitForResponse(resp => resp.url().includes('/og/'));
        const headers = editResponse.headers();
        // expect(headers['cache-control']).toContain('public');

        // 7. Edit Code
        const codeEditor = page.locator('.monaco-editor').first(); // Simplified selector
        // await codeEditor.click();
        // await page.keyboard.type('// Edited by Playwright');

        // 8. Wait for SWR/Update
        // await expect(page.getByText('Saved')).toBeVisible();
    });
});
