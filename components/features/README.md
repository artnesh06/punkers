# Feature Components

This directory contains feature-specific components for the PUNKERS application.

## FilterTabs

The `FilterTabs` component provides a tab-based filtering interface for pages like Stake, Gallery, and Graveyard. It displays a horizontal row of filter buttons with active state styling and hover effects.

### Features

- **Tab button group**: Displays multiple filter options as connected buttons
- **Active state styling**: Highlights the currently selected filter with red accent
- **Hover effects**: Smooth hover transitions with background and color changes
- **Scanline animation**: Subtle scanline effect on hover matching the PUNKERS theme
- **Adjacent border adjustment**: Active tab affects the border of the next tab
- **Responsive design**: Adapts to mobile screens with wrapped layout
- **Keyboard accessible**: Proper button semantics for keyboard navigation

### Usage

```tsx
import { useState } from 'react';
import { FilterTabs } from '@/components/features';

function StakePage() {
  const [activeFilter, setActiveFilter] = useState('all');

  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'staked', label: 'Staked' },
    { value: 'unstaked', label: 'Unstaked' },
  ];

  return (
    <FilterTabs
      options={filterOptions}
      activeFilter={activeFilter}
      onFilterChange={setActiveFilter}
    />
  );
}
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `options` | `FilterOption[]` | Yes | Array of filter options to display |
| `activeFilter` | `string` | Yes | Currently active filter value |
| `onFilterChange` | `(filter: string) => void` | Yes | Callback when filter is changed |
| `className` | `string` | No | Additional CSS class for the container |

#### FilterOption Type

```typescript
type FilterOption = {
  value: string;  // Unique identifier for the filter
  label: string;  // Display text for the filter button
};
```

### Common Use Cases

#### Stake Page Filters

```tsx
const stakeFilters = [
  { value: 'all', label: 'All' },
  { value: 'staked', label: 'Staked' },
  { value: 'unstaked', label: 'Unstaked' },
];
```

#### Gallery Page Filters

```tsx
const galleryFilters = [
  { value: 'all', label: 'All' },
  { value: 'common', label: 'Common' },
  { value: 'epic', label: 'Epic' },
  { value: 'legendary', label: 'Legendary' },
  { value: '1/1 art', label: '1/1 Art' },
];
```

#### Graveyard Page Filters

```tsx
const graveyardFilters = [
  { value: 'all', label: 'All' },
  { value: 'recent', label: 'Recent' },
];
```

### Styling

The component uses CSS Modules (`FilterTabs.module.css`) and follows the PUNKERS design system:

- Monospace font (`--font-mono`)
- Red accent for active state (`--accent-red`)
- Border color (`--border-color`)
- Text colors (`--text-primary`, `--text-secondary`)
- Uppercase text transformation
- Letter spacing for readability
- Smooth transitions (0.2s ease)
- Scanline hover effect

### Visual Design

- **Connected buttons**: Tabs share borders (no gap between them)
- **Last tab border**: Ensures the last tab has a right border
- **Active state**: Red background with white text
- **Hover state**: Subtle background highlight and text color change
- **Mobile responsive**: Wraps to multiple rows with gaps on small screens

### Accessibility

- Semantic `<button>` elements with `type="button"`
- Keyboard navigation support
- Clear visual indication of active state
- Sufficient color contrast for text
- Touch-friendly tap targets on mobile

### Requirements

Validates requirements:
- **5.3**: Filter tabs with active state styling
- **8.7**: Tab selection handling

### Testing

The component includes comprehensive unit tests covering:
- Rendering all filter options
- Active state styling
- Click handling and callbacks
- Custom className support
- Button type attributes
- Edge cases (empty array, single option)

Run tests:
```bash
npm test -- FilterTabs.test.tsx
```

### Examples

See `FilterTabs.example.tsx` for complete usage examples including:
- Stake page filters
- Gallery page filters
- Graveyard page filters
- Custom className usage

## AdModal

The `AdModal` component displays ad information in a modal overlay with ad-specific styling including a red border, shadow effects, and structured content layout.

### Features

- **Red accent styling**: Modal has a red border and shadow matching the PUNKERS theme
- **Modal tag**: Displays "📢 Ad Info" with red accent and decorative line
- **Message display**: Shows the ad message with a left red border accent
- **Info rows**: Displays key-value pairs for ad details (By, Date, Slot, Duration, Status)
- **Status coloring**: LIVE status shows in green, other statuses in muted color
- **Close functionality**: 
  - Close button in top-right corner
  - ESC key to close
  - Click outside modal to close
- **Responsive design**: Adapts to mobile screens
- **Animations**: Smooth entrance animation

### Usage

```tsx
import { AdModal } from '@/components/features';

function MyComponent() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const adDetails = {
    by: 'PUNKERS Team',
    date: '2024-01-15',
    slot: '#1',
    duration: '7 days',
    status: 'LIVE',
  };

  return (
    <>
      <button onClick={() => setIsModalOpen(true)}>
        Show Ad Info
      </button>

      <AdModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        message="Join the PUNKERS Survival Game!"
        details={adDetails}
      />
    </>
  );
}
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | Yes | Controls modal visibility |
| `onClose` | `() => void` | Yes | Callback when modal should close |
| `message` | `string` | Yes | Main ad message to display |
| `details` | `object` | No | Ad details object with optional fields |
| `details.by` | `string` | No | Advertiser name |
| `details.date` | `string` | No | Ad date |
| `details.slot` | `string` | No | Ad slot number |
| `details.duration` | `string` | No | Ad duration |
| `details.status` | `string` | No | Ad status (LIVE shows in green) |

### Integration with Ticker

The AdModal is typically used with the Ticker component to display ad information when a ticker item is clicked:

```tsx
import { useState } from 'react';
import { Ticker } from '@/components/layout';
import { AdModal } from '@/components/features';

function AdBanner() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState(null);

  const handleTickerClick = (adData) => {
    setSelectedAd(adData);
    setIsModalOpen(true);
  };

  return (
    <>
      <Ticker onItemClick={handleTickerClick} />
      
      {selectedAd && (
        <AdModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          message={selectedAd.message}
          details={selectedAd.details}
        />
      )}
    </>
  );
}
```

### Styling

The component uses CSS Modules (`AdModal.module.css`) and follows the PUNKERS design system:

- Red accent color (`--accent-red`)
- Card background (`--bg-card`)
- Monospace font (`--font-mono`)
- Display font for labels (`--font-display`)
- Backdrop blur effect
- Smooth animations

### Accessibility

- Close button has `aria-label="Close modal"`
- ESC key support for keyboard users
- Focus management for modal interaction
- Semantic HTML structure

### Requirements

Validates requirements:
- **11.2**: Ad modal system with overlay
- **11.5**: Modal close functionality (button, ESC, outside click)

### Testing

The component includes comprehensive unit tests covering:
- Rendering behavior (open/closed states)
- Message and details display
- Close functionality (button, overlay, ESC key)
- Status color styling
- Responsive behavior

Run tests:
```bash
npm test -- AdModal.test.tsx
```

### Examples

See `AdModal.example.tsx` for complete usage examples including:
- Full ad modal with all details
- Minimal ad modal with just a message
- Expired ad modal with muted status
