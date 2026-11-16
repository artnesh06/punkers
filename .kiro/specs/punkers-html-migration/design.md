# Design Document: PUNKERS HTML Migration

## Overview

This design document outlines the technical approach for migrating the PUNKERS gaming website from a static HTML file (`PUNKERS_v2_bugfixed (12).html`) to the existing Next.js application while maintaining 100% visual and functional parity.

### Goals

- Achieve pixel-perfect visual parity with the HTML source
- Maintain all animations, effects, and interactions
- Convert static HTML/CSS/JS to React components and Next.js patterns
- Preserve responsive behavior across all breakpoints
- Implement proper state management for interactive features
- Ensure performance optimization through Next.js features

### Scope

The migration covers:
- Global styling system (CSS variables, animations, effects)
- Theme system (dark/light mode toggle)
- Navigation system with wallet gating
- All page layouts (Home, Stake, Gallery, Graveyard, Ranks, Rules, Treasury, Survival, Bounty)
- Component system (NFT cards, modals, buttons, progress bars, stats panels)
- Animation system (glitch effects, ticker scroll, hover animations)
- Responsive design across all breakpoints
- Ad banner system with ticker animation
- Footer system with multi-column layout

### Non-Goals

- Backend API modifications (existing APIs remain unchanged)
- Wallet integration changes (existing wallet system remains)
- Database schema changes
- Smart contract modifications

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Next.js App Router                      │
├─────────────────────────────────────────────────────────────┤
│  Layout Layer                                                │
│  ├─ RootLayout (app/layout.tsx)                             │
│  │  ├─ Global Styles (app/globals.css)                      │
│  │  ├─ Theme Provider                                        │
│  │  ├─ Ticker Component                                      │
│  │  ├─ Navbar Component                                      │
│  │  └─ Footer Component                                      │
│  └─ Aurora Background Effect                                 │
├─────────────────────────────────────────────────────────────┤
│  Page Layer                                                  │
│  ├─ Home Page (app/page.tsx)                                │
│  ├─ Stake Page (app/stake/page.tsx)                         │
│  ├─ Gallery Page (app/gallery/page.tsx)                     │
│  ├─ Graveyard Page (app/graveyard/page.tsx)                 │
│  ├─ Ranks Page (app/ranks/page.tsx)                         │
│  ├─ Rules Page (app/rules/page.tsx)                         │
│  ├─ Treasury Page (app/treasury/page.tsx)                   │
│  ├─ Survival Page (app/survival/page.tsx)                   │
│  └─ Bounty Page (app/bounty/page.tsx)                       │
├─────────────────────────────────────────────────────────────┤
│  Component Layer                                             │
│  ├─ Layout Components                                        │
│  │  ├─ Navbar (with mobile menu)                            │
│  │  ├─ Footer (4-column grid)                               │
│  │  └─ Ticker (ad banner)                                    │
│  ├─ UI Components                                            │
│  │  ├─ NFTCard (multiple variants)                          │
│  │  ├─ Modal (ad modal, NFT modal)                          │
│  │  ├─ Button (multiple styles)                             │
│  │  ├─ ProgressBar                                           │
│  │  ├─ StatsPanel                                            │
│  │  └─ Toast (wallet gate notifications)                    │
│  └─ Feature Components                                       │
│     ├─ StatsBar (home page stats)                           │
│     ├─ FilterTabs (stake page filters)                      │
│     ├─ LayoutSwitcher (grid/list toggle)                    │
│     └─ ThemeToggle (dark/light mode)                        │
├─────────────────────────────────────────────────────────────┤
│  State Management                                            │
│  ├─ Theme Context (dark/light mode)                         │
│  ├─ Wallet Context (existing)                               │
│  └─ Component State (React hooks)                           │
├─────────────────────────────────────────────────────────────┤
│  Styling Layer                                               │
│  ├─ CSS Modules (component-scoped)                          │
│  ├─ Global CSS (app/globals.css)                            │
│  └─ CSS Variables (theme tokens)                            │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: CSS Modules + Global CSS
- **State Management**: React Context API + Hooks
- **Fonts**: Google Fonts (Press Start 2P, VT323, Share Tech Mono)
- **Animations**: CSS Keyframes + Transitions
- **Canvas**: HTML5 Canvas (Aurora effect)

### Design Patterns

1. **Component Composition**: Break down HTML into reusable React components
2. **CSS Modules**: Scope styles to components while maintaining global theme
3. **Server Components**: Use RSC where possible for better performance
4. **Client Components**: Use 'use client' for interactive features
5. **Progressive Enhancement**: Ensure core functionality works without JS

## Components and Interfaces

### Global Styling System

#### CSS Variables Migration

All CSS custom properties from HTML source will be migrated to `app/globals.css`:

```css
:root {
  /* Background Colors */
  --bg-primary: #0a0a0a;
  --bg-secondary: #111111;
  --bg-card: #151515;
  --bg-card-hover: #1a1a1a;
  
  /* Border Colors */
  --border-color: #2a2a2a;
  --border-glow: #333;
  
  /* Text Colors */
  --text-primary: #e0e0e0;
  --text-secondary: #888;
  --text-muted: #555;
  
  /* Accent Colors */
  --accent-red: #e53030;
  --accent-red-glow: #ff4040;
  --accent-green: #00ff66;
  --accent-green-dim: #00cc52;
  --accent-orange: #ff6600;
  --accent-yellow: #ffcc00;
  --accent-purple: #b44dff;
  --accent-magenta: #ff2d95;
  
  /* Holographic Colors */
  --holo-1: #ff003c;
  --holo-2: #00ff66;
  --holo-3: #ff6600;
  
  /* Typography */
  --font-display: 'Press Start 2P', monospace;
  --font-body: 'VT323', monospace;
  --font-mono: 'Share Tech Mono', monospace;
}
```

#### Light Mode Theme

Light mode overrides will be applied via `body.light-mode` class:

```css
body.light-mode {
  --bg-primary: #f5f5f5;
  --bg-secondary: #ffffff;
  --bg-card: #ffffff;
  --bg-card-hover: #fafafa;
  --border-color: #e0e0e0;
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --text-muted: #999999;
}
```

#### Pseudo-Element Effects

Global effects applied to body:

1. **Scanline Effect** (`body::before`): Repeating linear gradient for CRT effect
2. **Noise Effect** (`body::after`): SVG noise filter for texture
3. **Vignette Effect** (`.vignette`): Radial gradient overlay

#### Aurora Background

Canvas-based animated background effect:

```typescript
interface AuroraConfig {
  width: number;
  height: number;
  colors: string[];
  speed: number;
  blur: number;
  opacity: number;
}
```

Component: `components/effects/AuroraBackground.tsx`

### Theme System

#### ThemeProvider Component

```typescript
interface ThemeContextValue {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

// components/providers/ThemeProvider.tsx
export const ThemeProvider: React.FC<{ children: React.ReactNode }>;
export const useTheme: () => ThemeContextValue;
```

#### ThemeToggle Component

```typescript
interface ThemeToggleProps {
  className?: string;
}

// components/ui/ThemeToggle.tsx
export const ThemeToggle: React.FC<ThemeToggleProps>;
```

Features:
- Moon/sun icon toggle
- Persists preference to localStorage
- Applies theme class to body element
- Smooth transition between themes

### Navigation System

#### Navbar Component

```typescript
interface NavLink {
  href: string;
  label: string;
  id: string;
  disabled: boolean;
  requiresWallet?: boolean;
}

interface NavbarProps {
  className?: string;
}

// components/layout/Navbar.tsx
export const Navbar: React.FC<NavbarProps>;
```

Features:
- Logo with glitch animation on hover
- Navigation links with active state
- Dropdown menu for "Game" section
- Mobile hamburger menu
- Wallet button integration
- Locked state for wallet-gated pages
- Toast notifications for wallet gate

#### Mobile Navigation

Responsive breakpoint: `max-width: 768px`

Features:
- Hamburger menu icon
- Slide-in menu overlay
- Full-screen navigation
- Close on link click
- Close on outside click

### Layout Components

#### Ticker Component (Ad Banner)

```typescript
interface TickerProps {
  messages: string[];
  speed?: number;
  pauseOnHover?: boolean;
}

// components/layout/Ticker.tsx
export const Ticker: React.FC<TickerProps>;
```

Features:
- Infinite scroll animation
- Pause on hover
- Click to open ad modal
- Duplicate content for seamless loop

#### AdModal Component

```typescript
interface AdModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  details?: Record<string, string>;
}

// components/ui/AdModal.tsx
export const AdModal: React.FC<AdModalProps>;
```

Features:
- Overlay with backdrop blur
- Close button
- Animated entrance/exit
- Responsive layout

#### Footer Component

```typescript
interface FooterLink {
  label: string;
  href?: string;
  badge?: 'new' | 'soon';
  onClick?: () => void;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

interface FooterProps {
  columns: FooterColumn[];
}

// components/layout/Footer.tsx
export const Footer: React.FC<FooterProps>;
```

Layout:
- 4-column grid (desktop)
- 2-column grid (tablet)
- 1-column stack (mobile)
- Brand section with logo and tagline
- Status badge (chain connection)
- Social media buttons
- Bottom bar with copyright and links

### Page Components

#### Home Page

Components:
- `HomeStatsBar`: 4-column stats grid
- `HeroSection`: Title with glitch animation
- `NFTGallery`: 4-column grid with hover effects
- `StatsGrid`: 4-column + 2-column layout
- `ProgressBar`: Animated fill bar
- `WarningBox`: Alert with avatar
- `TransactionsSection`: Recent activity list

#### Stake Page

Components:
- `SectionHeader`: Page title with icon
- `StakeStats`: 4-column stats grid
- `FilterTabs`: Tab navigation
- `LayoutSwitcher`: Grid/list toggle
- `NFTGrid`: 3-column responsive grid
- `StakeCard`: NFT card with actions

#### Gallery Page

Components:
- `GalleryHeader`: Title and filters
- `NFTGalleryGrid`: Responsive grid
- `PaginationControls`: Page navigation
- `NFTModal`: Detail view modal

#### Other Pages

Similar component structure adapted to each page's requirements.

### UI Components

#### NFTCard Component

```typescript
interface NFTCardProps {
  id: string;
  image: string;
  name: string;
  status?: 'alive' | 'dead' | 'staked';
  health?: number;
  onClick?: () => void;
  variant?: 'default' | 'stake' | 'gallery';
}

// components/game/NFTCard.tsx
export const NFTCard: React.FC<NFTCardProps>;
```

Features:
- Hover effects (transform, glow)
- Status indicators
- Health bar (if applicable)
- Gradient border animation
- Holographic shine effect

#### Modal Component

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

// components/ui/Modal.tsx
export const Modal: React.FC<ModalProps>;
```

Features:
- Overlay with backdrop
- Animated entrance/exit
- Close on ESC key
- Close on outside click
- Responsive sizing

#### Button Component

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

// components/ui/Button.tsx
export const Button: React.FC<ButtonProps>;
```

Variants match HTML source styling.

#### ProgressBar Component

```typescript
interface ProgressBarProps {
  value: number;
  max: number;
  showPercentage?: boolean;
  color?: 'red' | 'green' | 'orange' | 'yellow';
}

// components/ui/ProgressBar.tsx
export const ProgressBar: React.FC<ProgressBarProps>;
```

Features:
- Animated fill
- Gradient background
- Glowing edge effect
- Percentage text overlay

#### StatsPanel Component

```typescript
interface StatItem {
  label: string;
  value: string | number;
  color?: 'green' | 'red' | 'yellow' | 'white';
  live?: boolean;
}

interface StatsPanelProps {
  stats: StatItem[];
  columns?: 2 | 3 | 4;
}

// components/ui/StatsPanel.tsx
export const StatsPanel: React.FC<StatsPanelProps>;
```

Features:
- Responsive grid layout
- Gradient borders
- Hover effects
- Live indicator with pulse animation

#### Toast Component

```typescript
interface ToastProps {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// components/ui/Toast.tsx
export const Toast: React.FC<ToastProps>;
export const useToast: () => {
  showToast: (props: ToastProps) => void;
};
```

Features:
- Auto-dismiss
- Action button
- Animated entrance/exit
- Queue management

## Data Models

### Theme State

```typescript
type Theme = 'dark' | 'light';

interface ThemeState {
  current: Theme;
  preference: Theme | null; // null = system preference
}
```

### Navigation State

```typescript
interface NavigationState {
  currentPage: string;
  isMenuOpen: boolean;
  walletConnected: boolean;
}
```

### Page State Models

#### Home Page State

```typescript
interface HomePageState {
  stats: {
    totalStaked: number;
    survivors: number;
    graveyard: number;
    treasury: number;
    taxToday: number;
    day: number;
  };
  transactions: Transaction[];
  loading: boolean;
}
```

#### Stake Page State

```typescript
interface StakePageState {
  filter: 'all' | 'staked' | 'unstaked';
  layout: 'grid' | 'list';
  nfts: NFT[];
  stats: {
    totalStaked: number;
    yourStaked: number;
    earnings: number;
    taxRate: number;
  };
  loading: boolean;
}
```

#### Gallery Page State

```typescript
interface GalleryPageState {
  nfts: NFT[];
  currentPage: number;
  totalPages: number;
  filters: {
    search: string;
    status: 'all' | 'alive' | 'dead';
  };
  selectedNFT: NFT | null;
  loading: boolean;
}
```

### Component State Models

#### Modal State

```typescript
interface ModalState {
  isOpen: boolean;
  content: React.ReactNode | null;
  size: 'sm' | 'md' | 'lg';
}
```

#### Toast State

```typescript
interface ToastState {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  visible: boolean;
  duration: number;
}

interface ToastQueueState {
  toasts: ToastState[];
}
```

## Data Models

### Animation Configuration

```typescript
interface AnimationConfig {
  glitch: {
    duration: string;
    timing: string;
    iterations: number | 'infinite';
  };
  ticker: {
    duration: string;
    timing: string;
  };
  modal: {
    duration: string;
    timing: string;
  };
  hover: {
    duration: string;
    timing: string;
  };
}
```

### Responsive Breakpoints

```typescript
interface Breakpoints {
  mobile: number;    // 560px
  tablet: number;    // 768px
  desktop: number;   // 1024px
  wide: number;      // 1200px
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

After analyzing all acceptance criteria, I've identified the following testable properties. Many criteria are specific examples or visual checks that are better suited for unit tests or visual regression testing rather than property-based tests.

### Property 1: Theme Toggle Switches State

*For any* current theme state (dark or light), clicking the theme toggle button should switch to the opposite theme state.

**Validates: Requirements 2.3**

### Property 2: Theme Persistence Round Trip

*For any* theme selection (dark or light), setting the theme and then reading from localStorage should return the same theme value.

**Validates: Requirements 2.4**

### Property 3: Active Navigation Highlighting

*For any* page route in the application, the navigation link corresponding to that route should have the active state styling applied.

**Validates: Requirements 3.2**

### Property 4: Wallet-Gated Navigation Lock

*For any* wallet-gated page, when the wallet is not connected, the navigation link to that page should be in a locked state and clicking it should not navigate.

**Validates: Requirements 3.7**

### Property 5: Wallet Gate Toast Display

*For any* locked navigation link, clicking it when the wallet is not connected should display a wallet gate toast notification.

**Validates: Requirements 3.8**

### Property 6: Filter Tab Active State

*For any* selected filter option on the stake page, the corresponding filter tab should have active state styling applied.

**Validates: Requirements 5.3**

### Property 7: Layout Switcher Toggle

*For any* current layout state (grid or list), clicking the layout switcher should toggle to the opposite layout state.

**Validates: Requirements 5.5**

### Property 8: Gallery Search Filtering

*For any* search term entered in the gallery, the displayed NFTs should only include those whose names or IDs contain the search term.

**Validates: Requirements 6.4**

### Property 9: NFT Modal Display

*For any* NFT card clicked in the gallery, a modal should open displaying the details of that specific NFT.

**Validates: Requirements 6.5**

### Property 10: Responsive Grid Adaptation

*For any* page with a grid layout, changing the viewport width to cross a breakpoint should change the number of grid columns accordingly.

**Validates: Requirements 10.3**

### Property 11: Ad Banner Modal Trigger

*For any* clickable element in the ad banner ticker, clicking it should open the ad modal with the corresponding content.

**Validates: Requirements 11.2**

### Property 12: Ticker Pause on Hover

*For any* state of the ticker animation, hovering over the ticker should pause the animation, and moving the mouse away should resume it.

**Validates: Requirements 11.3**

### Property 13: Modal Close Behavior

*For any* open modal, clicking the close button, pressing ESC key, or clicking outside the modal should close it.

**Validates: Requirements 11.5**

### Property 14: Toast Auto-Dismiss

*For any* toast notification displayed with a duration, the toast should automatically dismiss after that duration has elapsed.

**Validates: Requirements 8.6**

### Property 15: Modal Animation Trigger

*For any* modal, opening it should trigger an entrance animation, and closing it should trigger an exit animation.

**Validates: Requirements 9.4**


## Error Handling

### Client-Side Error Handling

#### Component Error Boundaries

Implement React Error Boundaries for graceful degradation:

```typescript
// components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  // Catches rendering errors in child components
  // Displays fallback UI
  // Logs errors for debugging
}
```

Apply to:
- Page-level components
- Complex interactive components (modals, galleries)
- Third-party integrations (wallet, canvas)

#### API Error Handling

```typescript
interface APIError {
  status: number;
  message: string;
  code?: string;
}

// Centralized error handling for API calls
async function fetchWithErrorHandling(url: string): Promise<Response> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new APIError(response.status, await response.text());
    }
    return response;
  } catch (error) {
    // Log error
    // Show user-friendly toast
    // Return fallback data if available
  }
}
```


#### State Management Errors

Handle state inconsistencies:

- Invalid theme values: Default to 'dark'
- Missing localStorage data: Use defaults
- Invalid navigation state: Redirect to home
- Corrupted component state: Reset to initial state

#### Animation Errors

Handle animation failures gracefully:

- Canvas rendering errors: Hide canvas, continue without effect
- CSS animation not supported: Provide static fallback
- Performance issues: Reduce animation complexity

### User Feedback

#### Loading States

Show loading indicators for:
- Page transitions
- API calls
- Image loading
- Component mounting

#### Error Messages

User-friendly error messages for:
- Network failures: "Connection lost. Please check your internet."
- API errors: "Unable to load data. Please try again."
- Wallet errors: "Wallet connection failed. Please reconnect."
- Not found: "Page not found. Return to home."

#### Toast Notifications

Use toast system for:
- Success messages (green)
- Error messages (red)
- Warning messages (orange)
- Info messages (default)


### Fallback Strategies

#### Progressive Enhancement

Core functionality works without:
- JavaScript (server-rendered content visible)
- CSS animations (static styles applied)
- Canvas effects (page still usable)
- Custom fonts (system fonts as fallback)

#### Graceful Degradation

If features fail:
- Theme toggle: Falls back to dark mode
- Ticker animation: Shows static text
- Modal animations: Opens/closes without animation
- Hover effects: Basic styling still applied

## Testing Strategy

### Dual Testing Approach

This migration requires both unit testing and property-based testing for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, component rendering, and visual parity
- **Property tests**: Verify universal behaviors across all inputs and states
- Both approaches are complementary and necessary for ensuring 100% visual and functional parity

### Unit Testing

#### Component Testing

Test each component in isolation:

```typescript
// Example: NFTCard.test.tsx
describe('NFTCard', () => {
  it('renders with correct image and name', () => {});
  it('applies correct status styling', () => {});
  it('triggers onClick when clicked', () => {});
  it('shows health bar when health prop provided', () => {});
  it('applies hover effects on mouse enter', () => {});
});
```


#### Page Testing

Test page layouts and integration:

```typescript
// Example: Home.test.tsx
describe('Home Page', () => {
  it('renders stats bar with 4 columns', () => {});
  it('displays hero section with glitch animation', () => {});
  it('renders NFT gallery grid', () => {});
  it('shows warning box with avatar', () => {});
  it('displays empty state for transactions', () => {});
});
```

#### Visual Regression Testing

Use visual regression tools to ensure pixel-perfect parity:

- Capture screenshots of HTML source
- Capture screenshots of Next.js implementation
- Compare pixel-by-pixel differences
- Test across multiple viewport sizes
- Test both dark and light themes

Tools: Percy, Chromatic, or Playwright visual comparisons

#### Accessibility Testing

Ensure WCAG compliance:

- Keyboard navigation works
- Screen reader compatibility
- Color contrast ratios meet standards
- Focus indicators visible
- ARIA labels present


### Property-Based Testing

#### Configuration

Use **fast-check** library for TypeScript property-based testing:

```typescript
import * as fc from 'fast-check';

// Configure each test to run minimum 100 iterations
const testConfig = { numRuns: 100 };
```

#### Property Test Examples

Each correctness property must be implemented as a property-based test:

```typescript
// Property 1: Theme Toggle Switches State
describe('Theme System Properties', () => {
  it('should toggle theme state on button click', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('dark' as const, 'light' as const),
        (initialTheme) => {
          // Feature: punkers-html-migration, Property 1: Theme toggle switches state
          const expectedTheme = initialTheme === 'dark' ? 'light' : 'dark';
          // Test implementation
          expect(toggledTheme).toBe(expectedTheme);
        }
      ),
      testConfig
    );
  });
});
```

```typescript
// Property 8: Gallery Search Filtering
describe('Gallery Properties', () => {
  it('should filter NFTs by search term', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({ id: fc.string(), name: fc.string() })),
        fc.string(),
        (nfts, searchTerm) => {
          // Feature: punkers-html-migration, Property 8: Gallery search filtering
          const filtered = filterNFTs(nfts, searchTerm);
          const allMatch = filtered.every(nft => 
            nft.name.includes(searchTerm) || nft.id.includes(searchTerm)
          );
          expect(allMatch).toBe(true);
        }
      ),
      testConfig
    );
  });
});
```


#### Property Test Coverage

All 15 correctness properties must have corresponding property-based tests:

1. Theme toggle state switching
2. Theme persistence round trip
3. Active navigation highlighting
4. Wallet-gated navigation lock
5. Wallet gate toast display
6. Filter tab active state
7. Layout switcher toggle
8. Gallery search filtering
9. NFT modal display
10. Responsive grid adaptation
11. Ad banner modal trigger
12. Ticker pause on hover
13. Modal close behavior
14. Toast auto-dismiss
15. Modal animation trigger

Each test must:
- Run minimum 100 iterations
- Include property tag comment
- Test across generated inputs
- Verify universal behavior

### Integration Testing

Test component interactions:

- Navigation → Page transitions
- Theme toggle → Global style updates
- Wallet connection → Navigation state changes
- Filter selection → Grid updates
- Search input → Results filtering

### End-to-End Testing

Test complete user flows:

- User visits home → sees stats → clicks gallery → views NFT
- User toggles theme → preference persists → reload maintains theme
- User without wallet → clicks stake → sees toast → connects wallet → accesses page
- User searches gallery → filters results → clicks NFT → views modal → closes modal

Tools: Playwright or Cypress


### Performance Testing

Ensure migration doesn't degrade performance:

- **Lighthouse scores**: Maintain or improve scores
- **Core Web Vitals**: LCP < 2.5s, FID < 100ms, CLS < 0.1
- **Bundle size**: Monitor JavaScript bundle size
- **Animation performance**: 60fps for all animations
- **Image optimization**: Use Next.js Image component

### Browser Compatibility Testing

Test across browsers:

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

### Responsive Testing

Test at breakpoints:

- Mobile: 375px, 414px, 560px
- Tablet: 768px, 834px
- Desktop: 1024px, 1200px, 1440px
- Wide: 1920px

### Test Coverage Goals

- Unit test coverage: >80%
- Property test coverage: 100% of identified properties
- Visual regression: 100% of pages and components
- E2E test coverage: All critical user flows


## Implementation Approach

### Migration Strategy

#### Phase 1: Foundation (Global Styles & Layout)

1. **Global CSS Migration**
   - Migrate all CSS variables to `app/globals.css`
   - Implement pseudo-element effects (scanline, noise, vignette)
   - Add keyframe animations
   - Configure responsive breakpoints
   - Set up font imports

2. **Layout Components**
   - Update Ticker component to match HTML source
   - Update Navbar component with all features
   - Update Footer component with 4-column layout
   - Implement Aurora background canvas effect

3. **Theme System**
   - Create ThemeProvider context
   - Implement ThemeToggle component
   - Add localStorage persistence
   - Apply theme classes to body

#### Phase 2: Core Components

1. **UI Components**
   - NFTCard with all variants
   - Modal system (base + variants)
   - Button with all styles
   - ProgressBar with animations
   - StatsPanel with grid layouts
   - Toast notification system

2. **Feature Components**
   - StatsBar (home page)
   - FilterTabs (stake page)
   - LayoutSwitcher (grid/list toggle)
   - PaginationControls (gallery)
   - AdModal (ad banner modal)


#### Phase 3: Page Migration

1. **Home Page**
   - Stats bar with 4-column grid
   - Hero section with glitch animation
   - NFT gallery with carousel
   - Stats grid with gradient borders
   - Progress bar section
   - Warning box
   - Transactions section

2. **Stake Page**
   - Section header with yellow accent
   - Stake stats grid
   - Filter tabs
   - Layout switcher
   - NFT grid (3 columns)
   - Stake actions

3. **Gallery Page**
   - Gallery header
   - Search and filters
   - NFT grid with pagination
   - NFT detail modal

4. **Other Pages**
   - Graveyard page
   - Ranks page (leaderboard)
   - Rules page (accordion)
   - Treasury page
   - Survival page
   - Bounty page

#### Phase 4: Animations & Effects

1. **Glitch Animations**
   - Logo hover glitch
   - Title glitch effect
   - Scanline overlay

2. **Hover Effects**
   - NFT card transforms
   - Button hover states
   - Navigation hover effects
   - Footer link animations

3. **Transitions**
   - Modal entrance/exit
   - Page transitions
   - Theme switching
   - Toast animations


#### Phase 5: Polish & Optimization

1. **Visual Regression Testing**
   - Compare all pages with HTML source
   - Test all breakpoints
   - Test both themes
   - Fix any visual discrepancies

2. **Performance Optimization**
   - Optimize images with Next.js Image
   - Code splitting for pages
   - Lazy load components
   - Optimize animations for 60fps

3. **Accessibility**
   - Add ARIA labels
   - Ensure keyboard navigation
   - Test with screen readers
   - Fix color contrast issues

4. **Browser Testing**
   - Test across all target browsers
   - Fix browser-specific issues
   - Add polyfills if needed

### File Structure

```
app/
├── globals.css                 # Global styles with CSS variables
├── layout.tsx                  # Root layout with providers
├── page.tsx                    # Home page
├── stake/
│   ├── page.tsx               # Stake page
│   └── stake.module.css       # Stake-specific styles
├── gallery/
│   ├── page.tsx               # Gallery page
│   └── gallery.module.css     # Gallery-specific styles
├── graveyard/
│   └── page.tsx               # Graveyard page
├── ranks/
│   └── page.tsx               # Ranks page
├── rules/
│   ├── page.tsx               # Rules page
│   └── rules.module.css       # Rules-specific styles
├── treasury/
│   └── page.tsx               # Treasury page
├── survival/
│   └── page.tsx               # Survival page
└── bounty/
    └── page.tsx               # Bounty page

components/
├── effects/
│   ├── AuroraBackground.tsx   # Canvas aurora effect
│   └── AuroraBackground.module.css
├── layout/
│   ├── Navbar.tsx             # Navigation bar
│   ├── Navbar.module.css
│   ├── Footer.tsx             # Footer
│   ├── Footer.module.css
│   ├── Ticker.tsx             # Ad banner ticker
│   └── Ticker.module.css
├── ui/
│   ├── NFTCard.tsx            # NFT card component
│   ├── NFTCard.module.css
│   ├── Modal.tsx              # Modal component
│   ├── Modal.module.css
│   ├── Button.tsx             # Button component
│   ├── Button.module.css
│   ├── ProgressBar.tsx        # Progress bar
│   ├── ProgressBar.module.css
│   ├── StatsPanel.tsx         # Stats panel
│   ├── StatsPanel.module.css
│   ├── Toast.tsx              # Toast notifications
│   ├── Toast.module.css
│   ├── ThemeToggle.tsx        # Theme toggle button
│   └── ThemeToggle.module.css
├── features/
│   ├── StatsBar.tsx           # Home stats bar
│   ├── StatsBar.module.css
│   ├── FilterTabs.tsx         # Filter tabs
│   ├── FilterTabs.module.css
│   ├── LayoutSwitcher.tsx     # Layout switcher
│   ├── LayoutSwitcher.module.css
│   ├── AdModal.tsx            # Ad modal
│   └── AdModal.module.css
└── providers/
    ├── ThemeProvider.tsx      # Theme context provider
    └── Providers.tsx          # Combined providers

lib/
├── hooks/
│   ├── useTheme.ts           # Theme hook
│   ├── useToast.ts           # Toast hook
│   └── useMediaQuery.ts      # Responsive hook
└── utils/
    ├── animations.ts          # Animation utilities
    └── theme.ts               # Theme utilities
```


### CSS Architecture

#### Global Styles (app/globals.css)

- CSS custom properties (variables)
- Font imports
- Reset/normalize styles
- Body pseudo-elements (scanline, noise)
- Global animations (keyframes)
- Scrollbar styling
- Theme overrides (light mode)

#### CSS Modules (Component-scoped)

- Component-specific styles
- Use CSS variables for theming
- BEM-like naming within modules
- Responsive styles with media queries

#### Naming Conventions

```css
/* Component styles */
.componentName { }
.componentName__element { }
.componentName--modifier { }

/* State classes */
.isActive { }
.isDisabled { }
.isLoading { }

/* Responsive classes */
.hideOnMobile { }
.showOnDesktop { }
```

### Animation Implementation

#### CSS Keyframes

All animations from HTML source will be preserved:

- `glitch`: Logo/title glitch effect
- `glitchMain`: Hero title glitch
- `tickerScroll`: Ticker scroll animation
- `modalIn`: Modal entrance
- `statusPulse`: Status indicator pulse
- `scanline`: Scanline overlay movement
- `emojiFloat`: NFT emoji float (if used)

#### Animation Performance

- Use `transform` and `opacity` for 60fps
- Use `will-change` sparingly
- Prefer CSS animations over JS
- Use `requestAnimationFrame` for JS animations


### State Management Strategy

#### Theme State

Use React Context for global theme state:

```typescript
// lib/contexts/ThemeContext.tsx
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  
  useEffect(() => {
    // Load from localStorage
    // Apply to body class
  }, []);
  
  const toggleTheme = () => {
    // Toggle state
    // Save to localStorage
    // Update body class
  };
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

#### Component State

Use React hooks for local state:

- `useState`: Simple state (open/closed, selected item)
- `useReducer`: Complex state (form state, multi-step flows)
- `useRef`: DOM references, animation state
- `useCallback`: Memoized callbacks
- `useMemo`: Memoized computed values

#### Server State

Use existing patterns for API data:

- Fetch in Server Components where possible
- Use `useEffect` + `useState` in Client Components
- Consider React Query for complex data fetching (future enhancement)

### Responsive Design Strategy

#### Breakpoints

```typescript
const breakpoints = {
  mobile: 560,
  tablet: 768,
  desktop: 1024,
  wide: 1200,
};
```

#### Media Queries

```css
/* Mobile first approach */
.component { /* mobile styles */ }

@media (min-width: 768px) {
  .component { /* tablet styles */ }
}

@media (min-width: 1024px) {
  .component { /* desktop styles */ }
}
```

#### useMediaQuery Hook

```typescript
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);
    
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);
  
  return matches;
}
```


## Migration Checklist

### Pre-Migration

- [ ] Audit HTML source file completely
- [ ] Document all CSS variables
- [ ] Document all animations
- [ ] Document all interactive behaviors
- [ ] Capture screenshots of all pages (both themes)
- [ ] Capture screenshots at all breakpoints
- [ ] Document all edge cases

### Phase 1: Foundation

- [ ] Migrate CSS variables to globals.css
- [ ] Implement body pseudo-elements
- [ ] Add all keyframe animations
- [ ] Configure font imports
- [ ] Implement Aurora background
- [ ] Update Ticker component
- [ ] Update Navbar component
- [ ] Update Footer component
- [ ] Implement ThemeProvider
- [ ] Implement ThemeToggle
- [ ] Test theme switching
- [ ] Test theme persistence

### Phase 2: Components

- [ ] Implement NFTCard component
- [ ] Implement Modal component
- [ ] Implement Button component
- [ ] Implement ProgressBar component
- [ ] Implement StatsPanel component
- [ ] Implement Toast system
- [ ] Implement StatsBar component
- [ ] Implement FilterTabs component
- [ ] Implement LayoutSwitcher component
- [ ] Implement AdModal component
- [ ] Test all components in isolation

### Phase 3: Pages

- [ ] Migrate Home page
- [ ] Migrate Stake page
- [ ] Migrate Gallery page
- [ ] Migrate Graveyard page
- [ ] Migrate Ranks page
- [ ] Migrate Rules page
- [ ] Migrate Treasury page
- [ ] Migrate Survival page
- [ ] Migrate Bounty page
- [ ] Test all pages


### Phase 4: Animations

- [ ] Implement glitch animations
- [ ] Implement hover effects
- [ ] Implement modal animations
- [ ] Implement ticker scroll
- [ ] Implement status pulse
- [ ] Implement scanline overlay
- [ ] Test all animations at 60fps
- [ ] Test animations on mobile

### Phase 5: Testing

- [ ] Write unit tests for all components
- [ ] Write property-based tests for all properties
- [ ] Run visual regression tests
- [ ] Test all breakpoints
- [ ] Test both themes
- [ ] Test all browsers
- [ ] Test keyboard navigation
- [ ] Test screen reader compatibility
- [ ] Run Lighthouse audits
- [ ] Measure Core Web Vitals

### Phase 6: Polish

- [ ] Fix visual discrepancies
- [ ] Optimize performance
- [ ] Add accessibility improvements
- [ ] Fix browser-specific issues
- [ ] Optimize bundle size
- [ ] Add loading states
- [ ] Add error boundaries
- [ ] Document components
- [ ] Update README

### Post-Migration

- [ ] Deploy to staging
- [ ] QA testing
- [ ] User acceptance testing
- [ ] Performance monitoring
- [ ] Bug fixes
- [ ] Deploy to production
- [ ] Monitor for issues

## Risk Assessment

### High Risk

1. **Visual Parity**: Achieving 100% pixel-perfect match
   - Mitigation: Extensive visual regression testing
   - Mitigation: Side-by-side comparison during development

2. **Animation Performance**: Maintaining 60fps on all devices
   - Mitigation: Performance profiling
   - Mitigation: Optimize animations for mobile

3. **Browser Compatibility**: Ensuring consistent behavior
   - Mitigation: Cross-browser testing
   - Mitigation: Progressive enhancement

### Medium Risk

1. **State Management**: Complex interactions between components
   - Mitigation: Clear state management patterns
   - Mitigation: Comprehensive testing

2. **Responsive Behavior**: Matching HTML source at all breakpoints
   - Mitigation: Test at all breakpoints
   - Mitigation: Use same media query values

3. **Theme System**: Ensuring all components respect theme
   - Mitigation: Use CSS variables consistently
   - Mitigation: Test both themes thoroughly

### Low Risk

1. **Component Reusability**: Creating maintainable components
   - Mitigation: Follow React best practices
   - Mitigation: Code reviews

2. **Bundle Size**: Keeping JavaScript bundle small
   - Mitigation: Code splitting
   - Mitigation: Lazy loading

## Success Criteria

### Visual Parity

- [ ] All pages match HTML source pixel-perfectly
- [ ] All animations match HTML source
- [ ] All hover effects match HTML source
- [ ] Both themes match HTML source
- [ ] All breakpoints match HTML source

### Functional Parity

- [ ] All interactions work identically
- [ ] Theme toggle works correctly
- [ ] Navigation works correctly
- [ ] Modals work correctly
- [ ] Filters work correctly
- [ ] Search works correctly

### Performance

- [ ] Lighthouse score ≥ 90
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1
- [ ] All animations at 60fps

### Quality

- [ ] Unit test coverage > 80%
- [ ] All properties tested
- [ ] Zero accessibility violations
- [ ] Works in all target browsers
- [ ] No console errors

### Maintainability

- [ ] Components are reusable
- [ ] Code is well-documented
- [ ] Styles are organized
- [ ] State management is clear
- [ ] Easy to add new features

