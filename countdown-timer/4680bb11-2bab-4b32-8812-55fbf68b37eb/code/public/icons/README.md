# Timer State Favicon Icons

This directory contains SVG icons used for dynamic favicon swapping based
on the current timer state. The icons are referenced by `useDocumentTitle`
(or a dedicated favicon hook) to provide visual state feedback in the
browser tab even when the app is minimised or in the background.

## Files

| File | Timer State | Color Scheme | Description |
|------|-------------|--------------|-------------|
| `timer-idle.svg` | `idle` | Indigo / Purple | Clock face at rest, no progress arc |
| `timer-running.svg` | `running` | Green | Clock with ~75% green progress arc |
| `timer-complete.svg` | `completed` | Amber / Gold | Full gold ring + checkmark + sparkles |

## Design Specifications

### Dimensions
- **ViewBox:** `0 0 32 32` (32×32 pixel grid)
- **Width/Height:** 32px (scales gracefully to 16px, 48px, 64px)

### Color Palette

#### Idle (Indigo)
| Element | Color | Hex |
|---------|-------|-----|
| Background | Deep indigo | `#1e1b4b` |
| Ring | Indigo | `#6366f1` |
| Hands | Violet | `#a5b4fc` / `#818cf8` |
| Center dot | Lavender | `#c7d2fe` |

#### Running (Green)
| Element | Color | Hex |
|---------|-------|-----|
| Background | Deep green | `#052e16` |
| Ring (track) | Dark green | `#166534` |
| Ring (progress) | Bright green | `#22c55e` |
| Hands | Light green | `#4ade80` |
| Center dot | Pale green | `#bbf7d0` |

#### Complete (Amber)
| Element | Color | Hex |
|---------|-------|-----|
| Background | Deep amber | `#1c1208` |
| Ring (full) | Amber | `#f59e0b` |
| Glow halo | Light amber | `#fbbf24` |
| Checkmark | Golden | `#fbbf24` |
| Sparkles | Pale yellow | `#fde68a` |

## Usage

Icons are dynamically applied to the favicon link element by the
`useDocumentTitle` hook (or a dedicated `useFaviconState` hook):

```typescript
// Dynamic favicon swapping (implemented in useDocumentTitle.ts)
function setFaviconForState(status: TimerStatus) {
  const link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
  if (!link) return;
  
  const iconMap: Record<TimerStatus, string> = {
    [TimerStatus.Idle]:      '/icons/timer-idle.svg',
    [TimerStatus.Running]:   '/icons/timer-running.svg',
    [TimerStatus.Paused]:    '/icons/timer-running.svg', // reuse running icon
    [TimerStatus.Completed]: '/icons/timer-complete.svg',
  };
  
  link.href = iconMap[status] ?? '/favicon.svg';
}
```

## Browser Support

SVG favicons are supported in:
- Chrome 80+
- Firefox 41+
- Safari 13+
- Edge 80+

For legacy browser support, `public/favicon.ico` (multi-resolution ICO)
is also served as a fallback. See `public/favicon-placeholder.txt` for
generation instructions.

## Modifying Icons

These icons are plain SVG — open in any text editor or vector tool:

- **Inkscape** (free, cross-platform): best for SVG editing
- **Figma**: import SVG, edit, export back to SVG
- **VS Code**: SVG preview extensions available

When modifying, keep the `<title>` element for accessibility, and ensure
the `viewBox` remains `0 0 32 32` to maintain correct scaling.