# ProgressBar Color Variants

## Overview

The ProgressBar component supports four color variants: red, green, orange, and yellow. Each variant has a unique gradient background and glowing edge effect.

## Implementation Status

✅ **Task 12.2 Complete**: All color variants implemented and tested

### Color Variants

#### 1. Red Variant (Default)
- **Usage**: `<ProgressBar value={50} max={100} color="red" />` or `<ProgressBar value={50} max={100} />`
- **Gradient**: `linear-gradient(90deg, var(--accent-orange), var(--accent-red))`
- **Glow Color**: Orange (`var(--accent-orange)`)
- **Use Case**: Default progress, danger states, health bars

#### 2. Green Variant
- **Usage**: `<ProgressBar value={75} max={100} color="green" />`
- **Gradient**: `linear-gradient(90deg, var(--accent-green-dim), var(--accent-green))`
- **Glow Color**: Green (`var(--accent-green)`)
- **Use Case**: Success states, positive progress, completion indicators

#### 3. Orange Variant
- **Usage**: `<ProgressBar value={45} max={100} color="orange" />`
- **Gradient**: `linear-gradient(90deg, #ff8800, var(--accent-orange))`
- **Glow Color**: Orange (`var(--accent-orange)`)
- **Use Case**: Warning states, moderate progress

#### 4. Yellow Variant
- **Usage**: `<ProgressBar value={90} max={100} color="yellow" />`
- **Gradient**: `linear-gradient(90deg, #ffaa00, var(--accent-yellow))`
- **Glow Color**: Yellow (`var(--accent-yellow)`)
- **Use Case**: Attention states, special progress indicators

## Animation Smoothness

### CSS Transition
All progress bars use a smooth CSS transition for width changes:
```css
.fill {
  transition: width 0.5s ease;
}
```

### Features
- **Smooth width updates**: 0.5s ease transition
- **Glowing edge effect**: 3px wide glow on the right edge
- **Gradient backgrounds**: Each variant has a unique gradient
- **Box shadow**: Subtle glow effect around the entire bar

### Performance
- Uses CSS transitions (GPU-accelerated)
- No JavaScript animation required
- Maintains 60fps during updates
- Handles rapid value changes smoothly

## Testing

### Test Coverage
- ✅ 56 total tests passing
- ✅ All 4 color variants tested
- ✅ Animation smoothness verified
- ✅ Edge cases covered (0%, 50%, 100%)
- ✅ Rapid value changes tested

### Test Files
1. `components/ui/ProgressBar.test.tsx` - Basic functionality tests
2. `components/ui/ProgressBar.colorVariants.test.tsx` - Color variant tests
3. `components/game/ProgressBar.test.tsx` - Game component tests

## Examples

### Static Examples
See `components/ui/ProgressBar.example.tsx` for static examples of all variants.

### Animation Demo
See `components/ui/ProgressBar.animation.example.tsx` for an interactive demo showing smooth animations at different speeds.

## CSS Variables Used

```css
/* From app/globals.css */
--accent-red: #e53030;
--accent-red-glow: #ff4040;
--accent-green: #00ff66;
--accent-green-dim: #00cc52;
--accent-orange: #ff6600;
--accent-yellow: #ffcc00;
--bg-card: #151515;
--border-color: #2a2a2a;
--text-primary: #e0e0e0;
--text-secondary: #888;
--font-mono: 'Share Tech Mono', monospace;
```

## Component Locations

- **UI Component**: `components/ui/ProgressBar.tsx`
- **Game Component**: `components/game/ProgressBar.tsx`
- **UI Styles**: `components/ui/ProgressBar.module.css`
- **Game Styles**: `components/game/ProgressBar.module.css`

Both components have identical functionality and styling.

## Requirements Validated

This implementation validates:
- **Requirement 8.4**: Component System Migration - Progress bar component
- **Requirement 9.5**: Animation System Migration - Progress bar fill animations

## Visual Features

1. **Gradient Fill**: Each color has a unique gradient from darker to lighter shade
2. **Glowing Edge**: 3px wide glowing edge on the right side of the fill
3. **Box Shadow**: Subtle glow around the entire fill bar
4. **Smooth Transition**: 0.5s ease transition for width changes
5. **Percentage Display**: Optional percentage or current/max format
6. **Label Support**: Optional label above the progress bar
