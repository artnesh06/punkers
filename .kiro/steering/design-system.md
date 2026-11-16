---
inclusion: auto
---

# PUNKERS Design System

## Color Palette

### Primary Colors
- **Background**: `#0a0a0a` (--bg)
- **Surface**: `#111` (--surface) 
- **Border**: `#333` (--border)
- **Text**: `#e0e0e0` (--text)
- **Dim**: `#666` (--dim)

### Accent Colors
- **Red**: `#ff2222` (--red) - Primary brand color, warnings, danger
- **Green**: `#00ff66` (--green) - Success, positive values, treasury
- **Gold**: `#ffd700` (--gold) - Special highlights, rewards
- **Blue**: `#0000cc` (--blue) - Links, information

## Typography

### Font Families
- **Primary**: `'VT323', monospace` - Main UI font, retro gaming aesthetic
- **Brand**: `'Permanent Marker', cursive` - Logo and special headings
- **Accent**: `'Patrick Hand', cursive` - Decorative elements

### Font Sizes
- **Hero Title**: 48px (32px mobile)
- **Section Title**: 15px with 3px letter-spacing, uppercase
- **Body Text**: 16-18px
- **Labels**: 13px with 2px letter-spacing
- **Large Values**: 32px (stats, numbers)

## Layout & Spacing

### Container Widths
- **Max Width**: 1052px (main content, consistent with rules page)
- **Padding**: 20px (10px on mobile)

### Grid Systems
- **Stats Grid**: `repeat(3, 1fr)` (responsive to 2 cols, then 1 col)
- **Punker Grid**: `repeat(4, 1fr)` (responsive to 2 cols, then 1 col)
- **Gap**: 12px standard, 16px for larger elements

## Components

### Cards
- **Background**: `rgba(255, 255, 255, 0.02)` over surface
- **Border**: 1px solid var(--border)
- **Padding**: 20px
- **Top Accent**: 2px red gradient line for important cards

### Buttons
- **Font**: VT323, 15-18px
- **Padding**: 10px 20px
- **Border**: 1px solid
- **Letter Spacing**: 2px
- **Transform**: uppercase

### Progress Bars
- **Height**: 40px
- **Background**: #1a1a1a
- **Fill**: Linear gradient (red to orange to red)
- **Text**: Centered, white with black text-shadow

## Visual Effects

### Gradients
- **Red Accent**: `linear-gradient(90deg, transparent, var(--red), transparent)`
- **Progress Fill**: `linear-gradient(90deg, var(--red), #ff6600, var(--red))`

### Borders & Shadows
- **Standard Border**: 1px solid var(--border)
- **Hover Effects**: Border color changes to accent colors
- **Text Shadow**: `0 0 6px black` for text over images

## Responsive Breakpoints

### Desktop (1200px+)
- Full 4-column punker grid
- 3-column stats grid with spanning cards

### Tablet (768px - 1199px) 
- 2-column punker grid
- 2-column stats grid

### Mobile (< 768px)
- Single column layouts
- Reduced font sizes
- Stacked warning content
- Smaller image heights

## Brand Guidelines

### Tone & Voice
- Aggressive, survival-focused
- Gaming/retro aesthetic
- High-stakes, competitive
- Technical/crypto terminology

### Visual Style
- Dark, cyberpunk aesthetic
- Retro gaming fonts
- Red as primary danger/brand color
- Minimal, functional UI
- Scanline effects and CRT-inspired design

## Implementation Notes

### CSS Variables
All colors should use CSS custom properties defined in globals.css:
```css
:root {
  --bg: #0a0a0a;
  --surface: #111;
  --border: #333;
  --text: #e0e0e0;
  --dim: #666;
  --red: #ff2222;
  --green: #00ff66;
  --gold: #ffd700;
  --blue: #0000cc;
}
```

### Component Patterns
- Use CSS Modules for component-specific styles
- Follow BEM-like naming conventions
- Maintain consistent spacing using the 12px/16px/20px scale
- Always include responsive breakpoints
- Use semantic HTML with proper accessibility attributes

### Performance
- Optimize images for web
- Use CSS transforms for animations
- Minimize layout shifts
- Progressive enhancement for interactive elements