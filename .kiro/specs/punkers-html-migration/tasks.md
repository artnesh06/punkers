# Implementation Plan: PUNKERS HTML Migration

## Overview

This implementation plan converts the PUNKERS gaming website from static HTML (`PUNKERS_v2_bugfixed (12).html`) to the existing Next.js application while maintaining 100% visual and functional parity. The migration follows a 5-phase approach: Foundation (global styles & layout), Core Components, Page Migration, Animations & Effects, and Polish & Optimization.

## Tasks

### Phase 1: Foundation (Global Styles & Layout)

- [x] 1. Migrate global CSS system to Next.js
  - [x] 1.1 Migrate all CSS custom properties to app/globals.css
    - Extract all CSS variables from HTML source (:root section)
    - Implement dark mode variables (background, text, accent colors)
    - Implement light mode overrides (body.light-mode)
    - Add holographic color variables
    - Add typography variables (font families)
    - _Requirements: 1.1, 1.2_
  
  - [x] 1.2 Implement body pseudo-element effects
    - Add scanline effect (body::before with repeating gradient)
    - Add noise effect (body::after with SVG filter)
    - Add vignette overlay with radial gradient
    - Ensure effects work with theme switching
    - _Requirements: 1.3_
  
  - [x] 1.3 Migrate all keyframe animations
    - Add glitch animation for logo
    - Add glitchMain animation for hero title
    - Add tickerScroll animation for ad banner
    - Add modalIn animation for modal entrance
    - Add statusPulse animation for live indicators
    - Add scanline animation for hero overlay
    - _Requirements: 1.5, 9.1_

  - [x] 1.4 Configure font imports and scrollbar styling
    - Import Google Fonts (Press Start 2P, VT323, Share Tech Mono)
    - Configure font-display for optimal loading
    - Implement custom scrollbar styling
    - Test font rendering across browsers
    - _Requirements: 1.2, 1.7_

- [x] 2. Implement Aurora background canvas effect
  - [x] 2.1 Create AuroraBackground component
    - Create components/effects/AuroraBackground.tsx
    - Implement HTML5 canvas with animated gradient blobs
    - Add blur and saturation filters
    - Implement color animation loop
    - Position as fixed background layer
    - _Requirements: 1.4_
  
  - [x] 2.2 Integrate Aurora with theme system
    - Adjust opacity for dark mode (0.05)
    - Adjust opacity for light mode (0.08)
    - Apply mix-blend-mode: screen
    - Test performance on mobile devices
    - _Requirements: 1.4, 2.5_

- [x] 3. Implement Theme System
  - [x] 3.1 Create ThemeProvider context
    - Create components/providers/ThemeProvider.tsx
    - Implement theme state (dark/light)
    - Add localStorage persistence
    - Apply theme class to body element
    - Export useTheme hook
    - _Requirements: 2.1, 2.4_
  
  - [x] 3.2 Create ThemeToggle component
    - Create components/ui/ThemeToggle.tsx
    - Implement moon/sun icon toggle
    - Add click handler to switch themes
    - Style matching HTML source
    - Add smooth transition effects
    - _Requirements: 2.3, 2.6_

  - [ ]* 3.3 Write property test for theme toggle
    - **Property 1: Theme toggle switches state**
    - **Validates: Requirements 2.3**
  
  - [ ]* 3.4 Write property test for theme persistence
    - **Property 2: Theme persistence round trip**
    - **Validates: Requirements 2.4**

- [x] 4. Update Ticker component (Ad Banner)
  - [x] 4.1 Migrate ticker styling and animation
    - Update components/layout/Ticker.tsx
    - Implement ticker scroll animation (80s linear infinite)
    - Add pause on hover functionality
    - Duplicate content for seamless loop
    - Style with red accent and mono font
    - _Requirements: 11.1, 11.3_
  
  - [x] 4.2 Implement ad modal trigger
    - Add click handler to ticker items
    - Create modal state management
    - Implement modal open/close logic
    - _Requirements: 11.2_
  
  - [ ]* 4.3 Write property test for ticker pause
    - **Property 12: Ticker pause on hover**
    - **Validates: Requirements 11.3**

- [x] 5. Update Navbar component
  - [x] 5.1 Migrate navbar structure and styling
    - Update components/layout/Navbar.tsx
    - Implement sticky positioning with backdrop blur
    - Add gradient border effect (bottom)
    - Style logo with red accent and glow
    - Implement navigation links with borders
    - _Requirements: 3.1, 3.3_

  - [x] 5.2 Implement navigation features
    - Add active state styling with red underline
    - Add hover effects with background color
    - Implement glitch animation on logo hover
    - Add dropdown menu for "Game" section
    - Integrate wallet button
    - _Requirements: 3.2, 3.3, 3.4, 3.6_
  
  - [x] 5.3 Implement wallet-gated navigation
    - Add locked state styling for wallet-gated pages
    - Implement click prevention for locked links
    - Add wallet gate toast notification
    - Style toast with red border and backdrop blur
    - _Requirements: 3.7, 3.8_
  
  - [ ]* 5.4 Write property test for active navigation
    - **Property 3: Active navigation highlighting**
    - **Validates: Requirements 3.2**
  
  - [ ]* 5.5 Write property test for wallet gate
    - **Property 4: Wallet-gated navigation lock**
    - **Property 5: Wallet gate toast display**
    - **Validates: Requirements 3.7, 3.8**

- [x] 6. Implement mobile navigation
  - [x] 6.1 Create mobile menu component
    - Add hamburger menu icon
    - Implement slide-in menu overlay
    - Style full-screen navigation
    - Add close on link click
    - Add close on outside click
    - _Requirements: 3.5, 10.2_
  
  - [x] 6.2 Add responsive breakpoint logic
    - Show mobile menu below 768px
    - Hide desktop navigation on mobile
    - Test touch interactions
    - _Requirements: 10.1, 10.3_


- [x] 7. Update Footer component
  - [x] 7.1 Migrate footer structure and styling
    - Update components/layout/Footer.tsx
    - Implement 4-column grid layout
    - Add gradient border effect (top)
    - Add noise texture overlay
    - Style with dark background
    - _Requirements: 12.1, 12.7_
  
  - [x] 7.2 Implement footer brand section
    - Add logo with glitch animation on hover
    - Add tagline with mono font
    - Add chain status badge with pulse animation
    - Add social media buttons
    - _Requirements: 12.2, 12.4, 12.6_
  
  - [x] 7.3 Implement footer navigation columns
    - Add column titles with red accent
    - Add navigation links with hover effects
    - Add badge system (NEW, SOON)
    - Implement responsive grid (4→2→1 columns)
    - _Requirements: 12.3, 12.7_
  
  - [x] 7.4 Implement footer bottom bar
    - Add copyright text with skull icon
    - Add bottom links (Privacy, Terms)
    - Add chain badge with status dot
    - Style with responsive layout
    - _Requirements: 12.5, 12.7_

- [x] 8. Checkpoint - Foundation complete
  - Verify all global styles match HTML source
  - Test theme switching across all components
  - Test responsive behavior at all breakpoints
  - Ensure all animations run at 60fps
  - Ask user if questions arise

### Phase 2: Core Components

- [x] 9. Implement NFTCard component
  - [x] 9.1 Create base NFTCard component
    - Create components/game/NFTCard.tsx (update existing)
    - Implement card structure with image container
    - Add gradient border effect (top)
    - Add holographic shine effect on hover
    - Implement transform and glow on hover
    - _Requirements: 8.1, 9.3_
  
  - [x] 9.2 Add NFTCard variants
    - Implement default variant (gallery view)
    - Implement stake variant (with actions)
    - Implement gallery variant (with modal trigger)
    - Add status indicators (alive/dead/staked)
    - Add health bar display (conditional)
    - _Requirements: 8.1, 4.8_
  
  - [x] 9.3 Style NFTCard matching HTML source
    - Add label with red background
    - Implement emoji/image display
    - Add hover animation (translateY, scale)
    - Add holographic sweep effect
    - Test across all variants
    - _Requirements: 4.8, 6.2, 9.3_

- [x] 10. Implement Modal system
  - [x] 10.1 Create base Modal component
    - Update components/ui/Modal.tsx (or create new)
    - Implement overlay with backdrop blur
    - Add modal container with border
    - Implement close button
    - Add ESC key handler
    - Add outside click handler
    - _Requirements: 8.2, 11.5_

  - [x] 10.2 Create AdModal component
    - Create components/features/AdModal.tsx
    - Implement ad-specific styling (red border, shadow)
    - Add modal tag with red accent
    - Add message with left border
    - Add info rows with key-value pairs
    - _Requirements: 11.2, 11.5_
  
  - [x] 10.3 Create NFTModal component
    - Update components/game/NFTModal.tsx
    - Implement NFT detail view
    - Add image display
    - Add stats and attributes
    - Add action buttons
    - _Requirements: 6.5, 8.2_
  
  - [ ]* 10.4 Write property test for modal behavior
    - **Property 13: Modal close behavior**
    - **Property 15: Modal animation trigger**
    - **Validates: Requirements 11.5, 9.4**

- [x] 11. Implement Button component
  - [x] 11.1 Create Button component with variants
    - Update components/ui/Button.tsx
    - Implement primary variant (red background)
    - Implement secondary variant (border only)
    - Implement danger variant (red accent)
    - Implement success variant (green accent)
    - Add size variants (sm, md, lg)
    - _Requirements: 8.3_
  
  - [x] 11.2 Add button states and interactions
    - Add disabled state styling
    - Add loading state with spinner
    - Add hover effects matching HTML source
    - Add active/pressed state
    - Test across all variants
    - _Requirements: 8.3, 9.3_


- [x] 12. Implement ProgressBar component
  - [x] 12.1 Create ProgressBar component
    - Update components/ui/ProgressBar.tsx
    - Implement container with border
    - Add animated fill with gradient
    - Add glowing edge effect on fill
    - Add percentage text overlay
    - _Requirements: 8.4, 4.5_
  
  - [x] 12.2 Add ProgressBar color variants
    - Implement red variant (default)
    - Implement green variant
    - Implement orange variant
    - Implement yellow variant
    - Test fill animation smoothness
    - _Requirements: 8.4, 9.5_

- [x] 13. Implement StatsPanel component
  - [x] 13.1 Create StatsPanel component
    - Update components/ui/StatsPanel.tsx
    - Implement responsive grid layout (2/3/4 columns)
    - Add stat card with gradient borders
    - Add label with uppercase styling
    - Add value with display font
    - _Requirements: 8.5, 4.1_
  
  - [x] 13.2 Add StatsPanel features
    - Implement color variants (green, red, yellow, white)
    - Add live indicator with pulse animation
    - Add hover effects on cards
    - Add gradient border effects (top/bottom)
    - Test responsive column changes
    - _Requirements: 8.5, 4.1, 10.3_


- [x] 14. Implement Toast notification system
  - [x] 14.1 Create Toast component
    - Update components/ui/Toast.tsx
    - Implement toast container with border
    - Add type variants (info, success, warning, error)
    - Add message display
    - Add action button (optional)
    - _Requirements: 8.6, 3.8_
  
  - [x] 14.2 Create useToast hook
    - Update lib/hooks/useToast.tsx
    - Implement toast queue management
    - Add showToast function
    - Add auto-dismiss logic
    - Add entrance/exit animations
    - _Requirements: 8.6, 8.7_
  
  - [ ]* 14.3 Write property test for toast auto-dismiss
    - **Property 14: Toast auto-dismiss**
    - **Validates: Requirements 8.6**

- [x] 15. Implement feature components
  - [x] 15.1 Create FilterTabs component
    - Create components/features/FilterTabs.tsx
    - Implement tab button group
    - Add active state styling
    - Add hover effects
    - Handle tab selection
    - _Requirements: 5.3, 8.7_
  
  - [x] 15.2 Create LayoutSwitcher component
    - Create components/features/LayoutSwitcher.tsx
    - Implement grid/list toggle buttons
    - Add active state styling
    - Handle layout change
    - _Requirements: 5.5, 8.7_

  - [ ]* 15.3 Write property tests for feature components
    - **Property 6: Filter tab active state**
    - **Property 7: Layout switcher toggle**
    - **Validates: Requirements 5.3, 5.5**

- [x] 16. Checkpoint - Core components complete
  - Test all components in isolation
  - Verify styling matches HTML source
  - Test all interactive states
  - Test responsive behavior
  - Ask user if questions arise

### Phase 3: Page Migration

- [x] 17. Migrate Home page layout
  - [x] 17.1 Update Home page structure
    - Update app/page.tsx
    - Implement home stats bar with 4-column grid
    - Add gradient border effects (top/bottom)
    - Add stat items with prefix, value, and sub-text
    - Add live indicators with pulse animation
    - _Requirements: 4.1, 4.8_
  
  - [x] 17.2 Implement hero section
    - Add hero container with title
    - Implement glitch animation on "PUNKERS SURVIVAL"
    - Add scanline overlay effect
    - Add subtitle with mono font
    - Style matching HTML source
    - _Requirements: 4.2, 9.1_

  - [x] 17.3 Implement NFT gallery section
    - Add 4-column NFT grid
    - Use NFTCard component for each item
    - Add hover effects (transform, glow, holographic sweep)
    - Add gallery dots for pagination
    - Style cards with gradient borders
    - _Requirements: 4.3, 6.2, 9.3_
  
  - [x] 17.4 Implement stats grid section
    - Add 4-column stats grid
    - Add 2-column row for treasury and tax
    - Use gradient borders on cards
    - Add hover effects
    - Style values with color variants
    - _Requirements: 4.4_
  
  - [x] 17.5 Implement progress bar section
    - Add ProgressBar component
    - Configure with animated fill
    - Add glowing edge effect
    - Add percentage text overlay
    - _Requirements: 4.5_
  
  - [x] 17.6 Implement warning box section
    - Add warning container with orange border
    - Add avatar with emoji/image
    - Add warning title with icon
    - Add warning message text
    - Style matching HTML source
    - _Requirements: 4.6_
  
  - [x] 17.7 Implement transactions section
    - Add transactions container
    - Add section title with icon
    - Add empty state display
    - Style with card background and border
    - _Requirements: 4.7_


- [x] 18. Migrate Stake page layout
  - [x] 18.1 Update Stake page structure
    - Update app/stake/page.tsx
    - Add section header with yellow accent
    - Add description text
    - Style matching HTML source
    - _Requirements: 5.1_
  
  - [x] 18.2 Implement stake stats grid
    - Add 4-column stats grid
    - Add stat cards with borders
    - Add gradient border effects
    - Add color variants (green, red)
    - _Requirements: 5.2_
  
  - [x] 18.3 Implement filter and layout controls
    - Add FilterTabs component (All, Staked, Unstaked)
    - Add LayoutSwitcher component (Grid, List)
    - Add showing count display
    - Arrange in responsive row
    - _Requirements: 5.3, 5.5, 5.6_
  
  - [x] 18.4 Implement NFT grid with stake cards
    - Add 3-column NFT grid
    - Use NFTCard component with stake variant
    - Add stake action buttons
    - Implement grid/list layout switching
    - Add responsive behavior
    - _Requirements: 5.4, 5.7_

- [x] 19. Migrate Gallery page layout
  - [x] 19.1 Update Gallery page structure
    - Update app/gallery/page.tsx
    - Add gallery header with title
    - Add filter controls
    - Add search input
    - _Requirements: 6.1, 6.4_

  - [x] 19.2 Implement NFT gallery grid
    - Add responsive NFT grid
    - Use NFTCard component with gallery variant
    - Add click handler to open modal
    - Add hover effects
    - _Requirements: 6.2, 6.5_
  
  - [x] 19.3 Implement pagination controls
    - Add pagination component
    - Add page number display
    - Add prev/next buttons
    - Style matching HTML source
    - _Requirements: 6.3_
  
  - [x] 19.4 Implement NFT detail modal
    - Use NFTModal component
    - Display selected NFT details
    - Add close functionality
    - Add animations
    - _Requirements: 6.5, 6.6_
  
  - [ ]* 19.5 Write property tests for gallery features
    - **Property 8: Gallery search filtering**
    - **Property 9: NFT modal display**
    - **Validates: Requirements 6.4, 6.5**

- [x] 20. Migrate additional pages
  - [x] 20.1 Migrate Graveyard page
    - Update app/graveyard/page.tsx
    - Implement dead NFT display grid
    - Add graveyard-specific styling
    - Add filters and search
    - _Requirements: 7.1_

  - [x] 20.2 Migrate Ranks page
    - Update app/ranks/page.tsx
    - Implement leaderboard table
    - Add rank styling with colors
    - Add player stats columns
    - Style matching HTML source
    - _Requirements: 7.2_
  
  - [x] 20.3 Migrate Rules page
    - Update app/rules/page.tsx
    - Implement accordion sections
    - Add rules tables
    - Add styling for code blocks
    - Add responsive layout
    - _Requirements: 7.3_
  
  - [x] 20.4 Migrate Treasury page
    - Update app/treasury/page.tsx
    - Implement treasury layout
    - Add stats display
    - Style matching HTML source
    - _Requirements: 7.4_
  
  - [x] 20.5 Migrate Survival page
    - Update app/survival/page.tsx
    - Implement survival layout
    - Add game-specific components
    - Style matching HTML source
    - _Requirements: 7.5_
  
  - [x] 20.6 Migrate Bounty page
    - Update app/bounty/page.tsx
    - Implement bounty layout
    - Add bounty-specific components
    - Style matching HTML source
    - _Requirements: 7.6_

- [x] 21. Checkpoint - Page migration complete
  - Test all pages render correctly
  - Verify layouts match HTML source
  - Test navigation between pages
  - Test responsive behavior on all pages
  - Ask user if questions arise


### Phase 4: Animations & Effects

- [x] 22. Implement glitch animations
  - [x] 22.1 Add logo glitch animation
    - Apply glitch keyframe to navbar logo on hover
    - Test animation timing and smoothness
    - Ensure works across browsers
    - _Requirements: 9.1, 3.6_
  
  - [x] 22.2 Add hero title glitch animation
    - Apply glitchMain keyframe to hero title
    - Add scanline overlay animation
    - Add color shift effects
    - Test animation performance
    - _Requirements: 9.1, 4.2_
  
  - [x] 22.3 Verify all glitch effects
    - Test on different devices
    - Ensure 60fps performance
    - Test with theme switching
    - _Requirements: 9.1, 9.7_

- [x] 23. Implement hover effects
  - [x] 23.1 Add NFT card hover effects
    - Implement transform (translateY, scale)
    - Add border glow effect
    - Add holographic sweep animation
    - Test smoothness and timing
    - _Requirements: 9.3, 4.8, 6.2_
  
  - [x] 23.2 Add button hover effects
    - Implement background color transitions
    - Add border color changes
    - Add glow effects where applicable
    - Test across all button variants
    - _Requirements: 9.3, 8.3_

  - [x] 23.3 Add navigation hover effects
    - Implement link background color transitions
    - Add text color changes
    - Test hover states on all nav items
    - _Requirements: 9.3, 3.3_
  
  - [x] 23.4 Add footer link hover effects
    - Implement padding-left transition
    - Add color changes
    - Test on all footer links
    - _Requirements: 9.3, 12.7_

- [x] 24. Implement modal and ticker animations
  - [x] 24.1 Add modal entrance/exit animations
    - Implement modalIn keyframe for entrance
    - Add fade-out animation for exit
    - Add backdrop fade animations
    - Test animation timing
    - _Requirements: 9.4, 11.5_
  
  - [x] 24.2 Verify ticker scroll animation
    - Ensure tickerScroll runs smoothly
    - Test pause on hover
    - Verify seamless loop
    - Test on mobile devices
    - _Requirements: 9.2, 11.1, 11.3_
  
  - [ ]* 24.3 Write property test for ad banner modal
    - **Property 11: Ad banner modal trigger**
    - **Validates: Requirements 11.2**

- [x] 25. Implement status and progress animations
  - [x] 25.1 Add status pulse animations
    - Apply statusPulse to live indicators
    - Apply to status dots
    - Test animation smoothness
    - _Requirements: 9.6_

  - [x] 25.2 Add progress bar fill animation
    - Implement smooth fill transition
    - Add glowing edge effect
    - Test with different values
    - _Requirements: 9.5, 4.5_
  
  - [x] 25.3 Verify all animations run at 60fps
    - Profile animation performance
    - Test on mobile devices
    - Optimize if needed
    - _Requirements: 9.7_

- [x] 26. Checkpoint - Animations complete
  - Test all animations across pages
  - Verify 60fps performance
  - Test on mobile devices
  - Test with theme switching
  - Ask user if questions arise

### Phase 5: Polish & Optimization

- [x] 27. Visual regression testing
  - [x] 27.1 Compare Home page with HTML source
    - Capture screenshots at all breakpoints
    - Compare both themes
    - Document any discrepancies
    - Fix visual differences
    - _Requirements: 4.1-4.8_
  
  - [x] 27.2 Compare Stake page with HTML source
    - Capture screenshots at all breakpoints
    - Compare both themes
    - Fix visual differences
    - _Requirements: 5.1-5.7_
  
  - [x] 27.3 Compare Gallery page with HTML source
    - Capture screenshots at all breakpoints
    - Compare both themes
    - Fix visual differences
    - _Requirements: 6.1-6.6_

  - [x] 27.4 Compare all other pages with HTML source
    - Test Graveyard, Ranks, Rules, Treasury, Survival, Bounty
    - Capture screenshots at all breakpoints
    - Compare both themes
    - Fix visual differences
    - _Requirements: 7.1-7.6_
  
  - [x] 27.5 Compare components with HTML source
    - Test Navbar, Footer, Ticker
    - Test all UI components
    - Fix any styling discrepancies
    - _Requirements: 3.1-3.8, 11.1-11.5, 12.1-12.7_

- [x] 28. Responsive design testing
  - [x] 28.1 Test at mobile breakpoints (375px, 414px, 560px)
    - Test all pages
    - Verify grid layouts adapt correctly
    - Test mobile navigation
    - Test touch interactions
    - _Requirements: 10.1-10.7_
  
  - [x] 28.2 Test at tablet breakpoints (768px, 834px)
    - Test all pages
    - Verify grid layouts adapt correctly
    - Test navigation behavior
    - _Requirements: 10.1-10.7_
  
  - [x] 28.3 Test at desktop breakpoints (1024px, 1200px, 1440px, 1920px)
    - Test all pages
    - Verify layouts match HTML source
    - Test all interactions
    - _Requirements: 10.1-10.7_
  
  - [ ]* 28.4 Write property test for responsive grid
    - **Property 10: Responsive grid adaptation**
    - **Validates: Requirements 10.3**


- [x] 29. Performance optimization
  - [x] 29.1 Optimize images with Next.js Image
    - Replace img tags with Next.js Image component
    - Configure image optimization settings
    - Add proper sizes and priority attributes
    - Test image loading performance
    - _Requirements: Performance goals_
  
  - [x] 29.2 Implement code splitting and lazy loading
    - Lazy load modal components
    - Lazy load page-specific components
    - Test bundle size reduction
    - Verify loading performance
    - _Requirements: Performance goals_
  
  - [x] 29.3 Optimize animations for performance
    - Use transform and opacity for animations
    - Add will-change where appropriate
    - Profile animation performance
    - Ensure 60fps on all devices
    - _Requirements: 9.7_
  
  - [x] 29.4 Run Lighthouse audits
    - Test performance score (target ≥90)
    - Test accessibility score
    - Test best practices score
    - Test SEO score
    - Fix any issues identified
    - _Requirements: Performance goals_

- [x] 30. Accessibility improvements
  - [x] 30.1 Add ARIA labels to interactive elements
    - Add labels to buttons
    - Add labels to navigation
    - Add labels to modals
    - Add labels to form controls
    - _Requirements: Accessibility goals_

  - [x] 30.2 Ensure keyboard navigation works
    - Test tab navigation through all pages
    - Ensure focus indicators are visible
    - Test modal keyboard controls (ESC to close)
    - Test dropdown keyboard controls
    - _Requirements: Accessibility goals_
  
  - [x] 30.3 Test with screen readers
    - Test with NVDA/JAWS on Windows
    - Test with VoiceOver on macOS
    - Fix any screen reader issues
    - _Requirements: Accessibility goals_
  
  - [x] 30.4 Verify color contrast ratios
    - Test all text/background combinations
    - Ensure WCAG AA compliance minimum
    - Fix any contrast issues
    - _Requirements: Accessibility goals_

- [x] 31. Browser compatibility testing
  - [x] 31.1 Test on Chrome (latest 2 versions)
    - Test all pages and features
    - Test animations
    - Fix any Chrome-specific issues
    - _Requirements: Browser compatibility goals_
  
  - [x] 31.2 Test on Firefox (latest 2 versions)
    - Test all pages and features
    - Test animations
    - Fix any Firefox-specific issues
    - _Requirements: Browser compatibility goals_
  
  - [x] 31.3 Test on Safari (latest 2 versions)
    - Test all pages and features
    - Test animations
    - Fix any Safari-specific issues
    - _Requirements: Browser compatibility goals_

  - [x] 31.4 Test on Edge (latest 2 versions)
    - Test all pages and features
    - Test animations
    - Fix any Edge-specific issues
    - _Requirements: Browser compatibility goals_
  
  - [x] 31.5 Test on mobile browsers
    - Test on iOS Safari
    - Test on Chrome Mobile
    - Fix any mobile browser issues
    - _Requirements: Browser compatibility goals_

- [x] 32. Final integration and wiring
  - [x] 32.1 Verify all pages are connected
    - Test navigation between all pages
    - Verify all links work correctly
    - Test wallet-gated page access
    - Test theme persistence across navigation
    - _Requirements: 3.1-3.8_
  
  - [x] 32.2 Verify all components are integrated
    - Test component interactions
    - Verify state management works correctly
    - Test modal system across pages
    - Test toast notifications
    - _Requirements: 8.1-8.7_
  
  - [x] 32.3 Verify API integrations work
    - Test data fetching on all pages
    - Verify existing APIs still work
    - Test error handling
    - Test loading states
    - _Requirements: All page requirements_

- [x] 33. Final checkpoint - Migration complete
  - Verify 100% visual parity with HTML source
  - Verify all functionality works identically
  - Verify all animations match HTML source
  - Verify responsive behavior at all breakpoints
  - Verify both themes work correctly
  - Run all property-based tests
  - Ensure all tests pass
  - Ask user for final review

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties from the design document
- All styling must match the HTML source pixel-perfectly
- All animations must run at 60fps for smooth user experience
- Theme switching must work seamlessly across all components
- Responsive behavior must match HTML source at all breakpoints
