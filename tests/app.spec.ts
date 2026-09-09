import { expect, test } from '@playwright/test'

test('room scan, AI analysis, 3D configure, and final preview flow works', async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 932 })
  await page.goto('/')

  await expect(page.getByRole('button', { name: 'START' })).toBeVisible()
  await page.screenshot({ path: 'test-results/app-start.png', fullPage: true })

  await page.getByRole('button', { name: 'START' }).click()
  await expect(page.getByLabel('Live camera preview')).toBeVisible()
  await expect(page.getByRole('button', { name: 'upload' })).toBeVisible()

  await page.locator('input[type="file"]').setInputFiles({
    name: 'large-living-room.png',
    mimeType: 'image/png',
    buffer: Buffer.alloc(4_000_000, 1),
  })
  await expect(page.getByText('AI check')).toBeVisible()
  await expect(page.getByText('check!')).toBeVisible({ timeout: 7000 })
  await expect(page.getByRole('button', { name: 'luxury' })).toBeVisible()
  await page.getByRole('button', { name: 'luxury' }).click()
  await expect(page.getByRole('button', { name: 'luxury' })).toHaveClass(/active/)
  await page.getByRole('button', { name: 'Specs' }).click()
  await expect(page.getByAltText('Luxury frame specification drawing')).toBeVisible()
  await page.getByRole('button', { name: 'back' }).click()
  await page.screenshot({ path: 'test-results/app-check-3d.png', fullPage: true })

  await page.getByRole('button', { name: 'Confirm' }).click()
  await expect(page.getByText('preset case?')).toBeVisible()
  await page.getByRole('button', { name: 'customize' }).click()
  await expect(page.locator('.live-model-stage h1')).toHaveText('try!')
  await page.getByRole('button', { name: 'plank' }).click()
  await page.getByRole('button', { name: 'large' }).click()
  await expect(page.locator('.live-model-stage h1')).toHaveText('suit!')
  await page.waitForTimeout(900)
  await page.screenshot({ path: 'test-results/app-configure-3d.png', fullPage: true })

  await page.getByRole('button', { name: 'final preview' }).click()
  await expect(page.getByText('Final effect')).toBeVisible()
  await expect(page.getByText(/1 modules: plank large/)).toBeVisible()
  await page.getByRole('button', { name: 'next' }).click()
  await expect(page.getByText('Preview saved locally for this session.')).toBeVisible()
  await page.getByRole('button', { name: 'home' }).click()
  await expect(page.getByRole('button', { name: 'START' })).toBeVisible()
  await page.screenshot({ path: 'test-results/app-final-preview.png', fullPage: true })
})

test('scan page opens live camera inline and keeps controls', async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 932 })
  await page.goto('/')
  await page.getByRole('button', { name: 'START' }).click()
  await expect(page.getByLabel('Live camera preview')).toBeVisible()
  await expect(page.getByRole('button', { name: 'capture room' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'upload' })).toBeVisible()
  await expect(page.getByText('Input it yourself')).toBeVisible()
  await page.screenshot({ path: 'test-results/app-camera.png', fullPage: true })
})

test('home intro cards loop and open detail modal', async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 932 })
  await page.goto('/')

  await expect(page.locator('.intro-tile')).toHaveCount(12)
  await page.locator('.tile-carousel').evaluate((element) => { element.scrollLeft += 760 })
  await page.locator('.intro-tile').filter({ hasText: 'Smart' }).first().click()
  await expect(page.getByRole('dialog', { name: 'Smart Scan' })).toBeVisible()
  await expect(page.getByText('Use the camera scan to generate room dimensions')).toBeVisible()
  await page.getByRole('button', { name: 'close' }).click()
  await expect(page.getByRole('dialog', { name: 'Smart Scan' })).toBeHidden()
})

test('standard only allows swing while luxury allows every module', async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 932 })
  await page.goto('/')
  await page.getByRole('button', { name: 'START' }).click()
  await page.locator('input[type="file"]').setInputFiles({
    name: 'large-living-room.png',
    mimeType: 'image/png',
    buffer: Buffer.alloc(4_000_000, 1),
  })
  await page.getByText('check!').waitFor({ timeout: 7000 })
  await page.getByRole('button', { name: 'standard' }).click()
  await page.getByRole('button', { name: 'Confirm' }).click()
  await page.getByRole('button', { name: 'customize' }).click()

  await expect(page.getByRole('button', { name: 'swing' })).toBeEnabled()
  await expect(page.getByRole('button', { name: 'plank locked for standard' })).toBeDisabled()
  await page.screenshot({ path: 'test-results/app-standard-module-rules.png', fullPage: true })

  await page.getByRole('button', { name: 'back' }).click()
  await page.getByRole('button', { name: 'back' }).click()
  await page.getByRole('button', { name: 'luxury' }).click()
  await page.getByRole('button', { name: 'next' }).click()
  await page.getByRole('button', { name: 'customize' }).click()
  await expect(page.getByRole('button', { name: 'plank' })).toBeEnabled()
})

test('luxury plank variants can coexist and swing or rings require large plank', async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 932 })
  await page.goto('/')
  await page.getByRole('button', { name: 'START' }).click()
  await page.locator('input[type="file"]').setInputFiles({
    name: 'large-living-room.png',
    mimeType: 'image/png',
    buffer: Buffer.alloc(4_000_000, 1),
  })
  await page.getByText('check!').waitFor({ timeout: 7000 })
  await page.getByRole('button', { name: 'luxury' }).click()
  await page.getByRole('button', { name: 'Confirm' }).click()
  await page.getByRole('button', { name: 'customize' }).click()

  await page.getByRole('button', { name: 'swing' }).click()
  await expect(page.getByRole('dialog', { name: 'support point required' })).toBeVisible()
  await expect(page.getByText('swing needs plank large first')).toBeVisible()
  await page.getByRole('button', { name: 'place plank large' }).click()
  await page.getByRole('button', { name: 'place' }).click()
  await expect(page.getByText('Tap place to install swing.')).toBeVisible()
  await page.getByRole('button', { name: 'place' }).click()
  await page.getByRole('button', { name: 'plank' }).click()
  await page.getByRole('button', { name: 'small' }).click()
  await page.getByRole('button', { name: 'plank' }).click()
  await page.getByRole('button', { name: 'medium' }).click()
  await page.getByRole('button', { name: 'rings' }).click()
  await page.getByRole('button', { name: 'place' }).click()
  await page.getByRole('button', { name: 'final preview' }).click()

  await expect(page.getByText(/5 modules: plank large, swing, plank small, plank medium, rings/)).toBeVisible()
  await page.screenshot({ path: 'test-results/app-luxury-plank-variants.png', fullPage: true })
})

test('preset case can load every module and preview directly', async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 932 })
  await page.goto('/')
  await page.getByRole('button', { name: 'START' }).click()
  await page.locator('input[type="file"]').setInputFiles({
    name: 'large-living-room.png',
    mimeType: 'image/png',
    buffer: Buffer.alloc(4_000_000, 1),
  })
  await page.getByText('check!').waitFor({ timeout: 7000 })
  await page.getByRole('button', { name: 'luxury' }).click()
  await page.getByRole('button', { name: 'Confirm' }).click()

  await expect(page.getByText('luxury ready case')).toBeVisible()
  await expect(page.getByText(/8 modules:/)).toBeVisible()
  await page.getByRole('button', { name: 'preview case' }).click()

  await expect(page.getByAltText('luxury final case render')).toBeVisible()
  await expect(page.getByText(/8 modules: plank large, plank medium, plank small, lever, rings, swing, climbing wall, shelf/)).toBeVisible()
  await page.getByRole('button', { name: 'home' }).click()
  await expect(page.getByRole('button', { name: 'START' })).toBeVisible()
})
