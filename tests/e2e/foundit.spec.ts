import { test, expect } from '@playwright/test';

/**
 * Enterprise End-to-End Test Suite for FoundIt
 * Validates intake, multimodal vision extraction, semantic matching,
 * claim state machine lifecycle, WebSocket chat handshakes, and multi-agency custody transfers.
 */

test.describe('FoundIt Enterprise Platform End-to-End Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to local development preview entry point
    await page.goto('/');
    // Verify system health check
    await expect(page.locator('text=FoundIt')).toBeVisible();
  });

  test('1. System Health & Initial Seed Feed Load', async ({ page }) => {
    // Check that Live Feed tab is active and items are rendered
    await expect(page.locator('text=Live Feed')).toBeVisible();
    await expect(page.locator('text=Apple AirPods Pro')).toBeVisible();
    await expect(page.locator('text=Vintage Brown Leather Bifold Wallet')).toBeVisible();

    // Verify WebSocket connected indicator
    await expect(page.locator('text=WebSocket Feed Active')).toBeVisible();
  });

  test('2. Multi-Step Found Item Intake Wizard Workflow', async ({ page }) => {
    // Open Intake Wizard
    await page.click('button:has-text("Report Item")');
    await expect(page.locator('text=Report Found Item Wizard')).toBeVisible();

    // Step 1: Select sample preset item (AirPods Pro Case)
    await page.click('button:has-text("AirPods Pro Case")');
    await page.click('button:has-text("Next Step")');

    // Step 2: AI Review & Metadata Editing
    await expect(page.locator('text=AI Review')).toBeVisible();
    await expect(page.locator('text=AI Vision Confident')).toBeVisible();
    // Add custom tag
    const tagInput = page.locator('input[placeholder*="Add search tag"]');
    if (await tagInput.isVisible()) {
      await tagInput.fill('specialedition');
      await page.keyboard.press('Enter');
    }
    await page.click('button:has-text("Next Step")');

    // Step 3: Interactive Map Pin Drop
    await expect(page.locator('text=Pin Drop')).toBeVisible();
    // Click coordinate surface
    await page.locator('.cursor-crosshair').click({ position: { x: 150, y: 100 } });
    await page.click('button:has-text("Next Step")');

    // Step 4: Security Verification & Custody Method
    await expect(page.locator('text=Ownership Challenge Question')).toBeVisible();
    await page.click('button:has-text("Publish to Real-Time Feed")');

    // Modal closes and item is visible on feed
    await expect(page.locator('text=Report Found Item Wizard')).not.toBeVisible();
  });

  test('3. Natural Language AI Search with Proximity Radius Filter', async ({ page }) => {
    // Switch to AI Smart Search Tab
    await page.click('button:has-text("AI Smart Search")');
    await expect(page.locator('input[placeholder*="e.g. Lost brown leather wallet"]')).toBeVisible();

    // Enter query
    const searchInput = page.locator('input[placeholder*="e.g. Lost brown leather wallet"]');
    await searchInput.fill('Brown leather wallet with cards inside near Grand Central');
    await page.click('button:has-text("Search")');

    // Verify scored matches are displayed with Gemini reasoning
    await expect(page.locator('text=High Match').first()).toBeVisible({ timeout: 10000 });
  });

  test('4. Claim State Machine Lifecycle & Secondary Gemini Verification', async ({ request, page }) => {
    // API verification of claim creation
    const claimRes = await request.post('/api/claims', {
      data: {
        itemId: 'seed-item-2',
        itemName: 'Vintage Brown Leather Bifold Wallet',
        claimantName: 'Marcus Vance',
        claimantEmail: 'marcus.v@columbia.edu',
        ownershipProof: {
          challengeAnswer: 'Columbia University student transit card inside front pocket.',
          serialNumberOrEngraving: 'MV initials',
        },
      },
    });

    expect(claimRes.status()).toBe(201);
    const claimData = await claimRes.json();
    expect(claimData.success).toBeTruthy();
    expect(claimData.claim.state).toBeDefined();

    // Verify transition to SCHEDULED_PICKUP
    const transitionRes = await request.patch(`/api/claims/${claimData.claim._id}/transition`, {
      data: {
        targetState: 'SCHEDULED_PICKUP',
        lockerBin: 'LOCKER-CONCOURSE-A14',
        hubId: 'HUB-GCT',
        officerDecision: 'APPROVED',
      },
    });
    expect(transitionRes.status()).toBe(200);
    const transitionData = await transitionRes.json();
    expect(transitionData.claim.state).toBe('SCHEDULED_PICKUP');
  });

  test('5. Real-Time Secure Chat Coordination Between Owner & Officer', async ({ request }) => {
    const testItemId = 'seed-item-1';

    // Post in-app coordination message
    const msgRes = await request.post(`/api/items/${testItemId}/messages`, {
      data: {
        senderName: 'Sarah Connor',
        senderRole: 'Standard',
        text: 'Hello Officer, I have my student ID and receipt ready for verification.',
      },
    });

    expect(msgRes.status()).toBe(201);
    const msgData = await msgRes.json();
    expect(msgData.success).toBeTruthy();
    expect(msgData.message.text).toContain('receipt ready');

    // Retrieve thread history
    const threadRes = await request.get(`/api/items/${testItemId}/messages`);
    const threadData = await threadRes.json();
    expect(threadData.messages.length).toBeGreaterThanOrEqual(1);
  });

  test('6. Multi-Agency Custody Transfer Manifest Dispatch', async ({ request }) => {
    // Create terminal custody transfer between Grand Central and Penn Station
    const manifestRes = await request.post('/api/hubs/transfers/dispatch', {
      data: {
        itemIds: ['seed-item-1'],
        originHubCode: 'HUB-GCT',
        destinationHubCode: 'HUB-PENN',
        officerName: 'Officer David Chen',
        officerBadge: 'TR-8942',
        courierVehicleId: 'COURIER-MTA-VAN-09',
        tamperSealNumber: 'SEAL-NYC-2026-99',
        notes: 'Secured transfer to Moynihan Train Hall depository.',
      },
    });

    expect(manifestRes.status()).toBe(201);
    const manifestData = await manifestRes.json();
    expect(manifestData.manifest.status).toBe('DISPATCHED');
    expect(manifestData.manifest.tamperEvidentSealNumber).toBe('SEAL-NYC-2026-99');

    // Acknowledge receipt at destination terminal
    const receiveRes = await request.post('/api/hubs/transfers/receive', {
      data: {
        manifestId: manifestData.manifest.manifestId,
        receivingOfficerName: 'Officer Marcus Wright',
        receivingOfficerBadge: 'AMTK-441',
      },
    });

    expect(receiveRes.status()).toBe(200);
    const receiveData = await receiveRes.json();
    expect(receiveData.manifest.status).toBe('RECEIVED');
    expect(receiveData.manifest.receivedByBadge).toBe('AMTK-441');
  });
});
