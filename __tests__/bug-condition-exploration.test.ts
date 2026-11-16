/**
 * Bug Condition Exploration Test
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6**
 * 
 * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * DO NOT attempt to fix the test or the code when it fails
 * 
 * This test encodes the expected behavior - it will validate the fix when it passes after implementation
 * GOAL: Surface counterexamples that demonstrate the differences between Next.js and original HTML
 */

import fs from 'fs';
import path from 'path';

describe('Bug Condition Exploration: HTML Structure and Visual Effects Mismatch', () => {
  let originalHtml: string;

  beforeAll(() => {
    // Load original HTML file
    const originalHtmlPath = path.join(process.cwd(), 'PUNKERS_v2_bugfixed (12).html');
    originalHtml = fs.readFileSync(originalHtmlPath, 'utf-8');
  });

  describe('Property 1: Bug Condition - Missing Pages', () => {
    test('should have Treasury page route in Next.js app directory', () => {
      // Original HTML should have Treasury page
      const hasTreasuryOriginal = originalHtml.includes('data-page="treasury"') ||
                                  originalHtml.includes('#page-treasury');
      expect(hasTreasuryOriginal).toBeTruthy();
      
      // Check if Treasury page exists in Next.js app directory
      const treasuryPagePath = path.join(process.cwd(), 'app/treasury/page.tsx');
      const treasuryPageExists = fs.existsSync(treasuryPagePath);
      
      // Check if Treasury is in navigation
      const navbarPath = path.join(process.cwd(), 'components/layout/Navbar.tsx');
      const navbarContent = fs.readFileSync(navbarPath, 'utf-8');
      const treasuryInNav = navbarContent.includes('/treasury') && 
                            navbarContent.includes('TREASURY') &&
                            !navbarContent.includes('disabled: true');
      
      // This assertion will FAIL on unfixed code - that's expected!
      expect(treasuryPageExists && treasuryInNav).toBeTruthy();
    });

    test('should have Loot page route in Next.js app directory', () => {
      // Original HTML should have Loot page
      const hasLootOriginal = originalHtml.includes('data-page="loot"') ||
                              originalHtml.includes('#page-loot');
      expect(hasLootOriginal).toBeTruthy();
      
      // Check if Loot page exists in Next.js app directory
      const lootPagePath = path.join(process.cwd(), 'app/loot/page.tsx');
      const lootPageExists = fs.existsSync(lootPagePath);
      
      // Check if Loot is in navigation
      const navbarPath = path.join(process.cwd(), 'components/layout/Navbar.tsx');
      const navbarContent = fs.readFileSync(navbarPath, 'utf-8');
      const lootInNav = navbarContent.includes('/loot') && 
                        navbarContent.includes('LOOT');
      
      // This assertion will FAIL on unfixed code - that's expected!
      expect(lootPageExists && lootInNav).toBeTruthy();
    });

    test('should have Slot page route in Next.js app directory', () => {
      // Original HTML should have Slot page
      const hasSlotOriginal = originalHtml.includes('data-page="slot"') ||
                              originalHtml.includes('#page-slot');
      expect(hasSlotOriginal).toBeTruthy();
      
      // Check if Slot page exists in Next.js app directory
      const slotPagePath = path.join(process.cwd(), 'app/slot/page.tsx');
      const slotPageExists = fs.existsSync(slotPagePath);
      
      // Check if Slot is in navigation
      const navbarPath = path.join(process.cwd(), 'components/layout/Navbar.tsx');
      const navbarContent = fs.readFileSync(navbarPath, 'utf-8');
      const slotInNav = navbarContent.includes('/slot') && 
                        navbarContent.includes('SLOT');
      
      // This assertion will FAIL on unfixed code - that's expected!
      expect(slotPageExists && slotInNav).toBeTruthy();
    });

    test('should have Profile page route in Next.js app directory', () => {
      // Original HTML should have Profile page
      const hasProfileOriginal = originalHtml.includes('data-page="profile"') ||
                                  originalHtml.includes('#page-profile');
      expect(hasProfileOriginal).toBeTruthy();
      
      // Check if Profile page exists in Next.js app directory
      const profilePagePath = path.join(process.cwd(), 'app/profile/page.tsx');
      const profilePageExists = fs.existsSync(profilePagePath);
      
      // Check if Profile is in navigation
      const navbarPath = path.join(process.cwd(), 'components/layout/Navbar.tsx');
      const navbarContent = fs.readFileSync(navbarPath, 'utf-8');
      const profileInNav = navbarContent.includes('/profile') && 
                           navbarContent.includes('PROFILE');
      
      // This assertion will FAIL on unfixed code - that's expected!
      expect(profilePageExists && profileInNav).toBeTruthy();
    });
  });

  describe('Property 1: Bug Condition - Missing Visual Effects', () => {
    test('should have aurora background canvas component', () => {
      // Original HTML should have aurora canvas
      const hasAuroraOriginal = originalHtml.includes('#auroraCanvas') ||
                                originalHtml.includes('auroraCanvas');
      expect(hasAuroraOriginal).toBeTruthy();
      
      // Check if Aurora component exists in Next.js
      const auroraComponentPath = path.join(process.cwd(), 'components/effects/AuroraCanvas.tsx');
      const auroraComponentExists = fs.existsSync(auroraComponentPath);
      
      // Check if aurora is referenced in layout or globals.css
      const layoutPath = path.join(process.cwd(), 'app/layout.tsx');
      const globalsPath = path.join(process.cwd(), 'app/globals.css');
      const layoutContent = fs.readFileSync(layoutPath, 'utf-8');
      const globalsContent = fs.readFileSync(globalsPath, 'utf-8');
      
      const auroraInLayout = layoutContent.includes('Aurora') || layoutContent.includes('aurora');
      const auroraInGlobals = globalsContent.includes('aurora') || globalsContent.includes('Aurora');
      
      // This assertion will FAIL on unfixed code - that's expected!
      expect(auroraComponentExists || auroraInLayout || auroraInGlobals).toBeTruthy();
    });

    test('should have scanline overlay effect in CSS', () => {
      // Original HTML should have scanline effect
      const hasScanlineOriginal = originalHtml.includes('repeating-linear-gradient') &&
                                  originalHtml.includes('body::before');
      expect(hasScanlineOriginal).toBeTruthy();
      
      // Check if scanline effect exists in Next.js globals.css
      const globalsPath = path.join(process.cwd(), 'app/globals.css');
      const globalsContent = fs.readFileSync(globalsPath, 'utf-8');
      
      const hasScanlineNextjs = globalsContent.includes('repeating-linear-gradient') &&
                                (globalsContent.includes('body::before') || globalsContent.includes('scanline'));
      
      // This assertion will FAIL on unfixed code - that's expected!
      expect(hasScanlineNextjs).toBeTruthy();
    });

    test('should have noise texture effect in CSS', () => {
      // Original HTML should have noise effect
      const hasNoiseOriginal = originalHtml.includes('feTurbulence') &&
                               originalHtml.includes('body::after');
      expect(hasNoiseOriginal).toBeTruthy();
      
      // Check if noise effect exists in Next.js globals.css
      const globalsPath = path.join(process.cwd(), 'app/globals.css');
      const globalsContent = fs.readFileSync(globalsPath, 'utf-8');
      
      const hasNoiseNextjs = globalsContent.includes('feTurbulence') ||
                             (globalsContent.includes('noise') && globalsContent.includes('body::after'));
      
      // This assertion will FAIL on unfixed code - that's expected!
      expect(hasNoiseNextjs).toBeTruthy();
    });

    test('should have vignette effect in CSS', () => {
      // Original HTML should have vignette effect
      const hasVignetteOriginal = originalHtml.includes('radial-gradient') &&
                                  originalHtml.includes('vignette');
      expect(hasVignetteOriginal).toBeTruthy();
      
      // Check if vignette effect exists in Next.js globals.css
      const globalsPath = path.join(process.cwd(), 'app/globals.css');
      const globalsContent = fs.readFileSync(globalsPath, 'utf-8');
      
      const hasVignetteNextjs = globalsContent.includes('radial-gradient') &&
                                globalsContent.includes('vignette');
      
      // This assertion will FAIL on unfixed code - that's expected!
      expect(hasVignetteNextjs).toBeTruthy();
    });
  });

  describe('Property 1: Bug Condition - CSS Variables and Styling', () => {
    test('should have cyberpunk CSS variables matching original HTML', () => {
      // Original HTML should have cyberpunk color variables
      const hasCyberpunkVarsOriginal = originalHtml.includes('--bg-primary: #0a0a0a') &&
                                       originalHtml.includes('--accent-red: #e53030') &&
                                       originalHtml.includes('--holo-1: #ff003c') &&
                                       originalHtml.includes('--font-display: \'Press Start 2P\'');
      expect(hasCyberpunkVarsOriginal).toBeTruthy();
      
      // Check if cyberpunk variables exist in Next.js globals.css
      const globalsPath = path.join(process.cwd(), 'app/globals.css');
      const globalsContent = fs.readFileSync(globalsPath, 'utf-8');
      
      const hasCyberpunkVarsNextjs = globalsContent.includes('--bg-primary: #0a0a0a') &&
                                     globalsContent.includes('--accent-red: #e53030') &&
                                     globalsContent.includes('--holo-1: #ff003c') &&
                                     globalsContent.includes('--font-display');
      
      // This assertion will FAIL on unfixed code - that's expected!
      expect(hasCyberpunkVarsNextjs).toBeTruthy();
    });

    test('should have ad banner ticker component', () => {
      // Original HTML should have ad banner
      const hasAdBannerOriginal = originalHtml.includes('ad-banner') &&
                                  originalHtml.includes('ad-ticker');
      expect(hasAdBannerOriginal).toBeTruthy();
      
      // Check if ad banner component exists in Next.js
      const adBannerPath = path.join(process.cwd(), 'components/layout/AdBanner.tsx');
      const adBannerExists = fs.existsSync(adBannerPath);
      
      // Check if ad banner is referenced in layout
      const layoutPath = path.join(process.cwd(), 'app/layout.tsx');
      const layoutContent = fs.readFileSync(layoutPath, 'utf-8');
      const adBannerInLayout = layoutContent.includes('AdBanner') || layoutContent.includes('ad-banner');
      
      // This assertion will FAIL on unfixed code - that's expected!
      expect(adBannerExists || adBannerInLayout).toBeTruthy();
    });
  });

  describe('Property 1: Bug Condition - Navigation Completeness', () => {
    test('should have complete navigation with all pages from original HTML', () => {
      // Count expected pages from original HTML
      const expectedPages = ['gallery', 'rules', 'stake', 'survival', 'graveyard', 'ranks', 'treasury', 'bounty', 'loot', 'slot', 'profile'];
      
      // Check navigation in Next.js
      const navbarPath = path.join(process.cwd(), 'components/layout/Navbar.tsx');
      const navbarContent = fs.readFileSync(navbarPath, 'utf-8');
      
      // Count how many expected pages are in navigation (not disabled)
      let enabledPagesCount = 0;
      expectedPages.forEach(page => {
        const pageInNav = navbarContent.includes(`/${page}`) && 
                          navbarContent.includes(page.toUpperCase()) &&
                          !navbarContent.includes(`disabled: true`);
        if (pageInNav) enabledPagesCount++;
      });
      
      // This assertion will FAIL on unfixed code - that's expected!
      // Should have at least 10 of the 11 expected pages enabled
      expect(enabledPagesCount).toBeGreaterThanOrEqual(10);
    });

    test('should have mobile hamburger navigation structure', () => {
      // Original HTML should have mobile navigation
      const hasMobileNavOriginal = originalHtml.includes('mobile-nav') &&
                                   originalHtml.includes('hamburger');
      expect(hasMobileNavOriginal).toBeTruthy();
      
      // Check if mobile navigation exists in Next.js navbar
      const navbarPath = path.join(process.cwd(), 'components/layout/Navbar.tsx');
      const navbarContent = fs.readFileSync(navbarPath, 'utf-8');
      
      const hasMobileNavNextjs = navbarContent.includes('hamburger') &&
                                 (navbarContent.includes('mobile') || navbarContent.includes('Menu'));
      
      // This assertion will FAIL on unfixed code - that's expected!
      expect(hasMobileNavNextjs).toBeTruthy();
    });
  });
});