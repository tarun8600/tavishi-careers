# Tavishi Aurora Light — Design System

Original, **light-only** visual identity for Tavishi Careers. No dark mode, black backgrounds, dark sidebars, neon or aggressive effects. Not derived from Tsenta's layouts, icons, illustrations, components, CSS or assets.

## 1. Color tokens (contrast verified, WCAG 2.1 AA)
| Token | Hex | Use | Contrast |
|---|---|---|---|
| `--bg` | #FAFBF7 | App background (warm ivory) | – |
| `--surface` | #FFFFFF | Cards, panels, modals | – |
| `--primary` | #267569 | Links, primary text accents, focus ring | 5.48:1 on white, 5.27 on bg |
| `--primary-strong` | #1F665B | Primary button fill (white text) | 6.75:1 |
| `--primary-light` | #E1F4EA | Mint tint, selected states | primary text 4.78:1 |
| `--lavender` | #ECE7FA | Accent tint; text `--lavender-ink` #5B3FA6 (6.42:1) |
| `--peach` | #FBE9DE | Accent tint; text `--peach-ink` #9A4A1E (5.28:1) |
| `--sky` | #E3F1FC | Info tint; text `--sky-ink` #1F5F9E (5.72:1) |
| `--yellow` | #FFF2D8 | Warning tint; text `--yellow-ink` #8A5A00 (5.35:1) |
| `--text` | #243B3A | Body/headings | 11.47:1 on bg |
| `--text-muted` | #5B6E6C | Secondary text | 5.40:1 on white |
| `--border` | #E4EAE5 | Decorative dividers only (1.22:1) | inputs use `--border-strong` #A9B8B3 |
| `--danger` | #B42318 | Errors | 6.57:1 |

Rule: never use `#8A9B98`-like greys (<4.5:1) for text. Tints are backgrounds only; text on tints uses the paired `*-ink`.

**Aurora gradient** (hero/headers only, low saturation): `linear-gradient(120deg, #E1F4EA 0%, #E3F1FC 45%, #ECE7FA 75%, #FBE9DE 100%)`.

## 2. Typography
- Headings: "Fraunces" (variable serif, elegant), weights 500–600. Body/UI: "Inter", 400/500/600. Self-hosted via `next/font` (no external runtime calls).
- Scale (rem): 0.8125 / 0.875 / 1 / 1.125 / 1.375 / 1.75 / 2.25 / 3. Line-height 1.55 body, 1.2 headings.

## 3. Shape, elevation, spacing, motion
- Radius: `--r-sm` 8px (inputs), `--r-md` 14px (cards), `--r-lg` 22px (panels/modals), `--r-pill` 999px (chips).
- Shadows (green-tinted, soft): `--shadow-1: 0 1px 2px rgba(36,59,58,.06), 0 2px 8px rgba(36,59,58,.05)`; `--shadow-2: 0 8px 28px rgba(36,59,58,.09)`.
- Spacing: 4px base (4, 8, 12, 16, 24, 32, 48, 64). Content max-width 1200px; generous whitespace.
- Motion: 160–220 ms `cubic-bezier(.2,.7,.2,1)`; hover lift ≤2px + shadow-2; respect `prefers-reduced-motion`.

## 4. Logo
Wordmark "Tavishi" in Fraunces 600 with "Careers" in Inter 500 small-caps; mark = an original rising-arc "aurora" glyph (three overlapping soft arcs in mint/sky/lavender) as inline SVG. Original artwork.

## 5. Layout
- Top navigation (light surface, sticky, subtle bottom border) — no sidebar on desktop by default; a light contextual left rail allowed inside dashboard ≥1024px.
- Breakpoints: 480 / 768 / 1024 / 1280. Mobile: bottom-sheet filters, single-column cards.
- Dashboard communicates: discovery, recommendations (only when real scores exist), application queue, recent activity, progress.

## 6. Shared components (`src/components/ui/`)
Nav, Button (primary/secondary/ghost/danger; sizes), Input/Select/Textarea/Field with error + hint, SearchFilters (keyword, country, city, workplace, salary, seniority, employment type), CountrySelector (default **United States**; Worldwide, India, Canada, United Kingdom, Australia, Germany, then all ISO countries), JobCard, ResumeCard, StatusBadge (one color per application status, text label always present), Modal (focus trap, Esc), Toast/NotificationItem, DataTable, EmptyState, Skeleton/Spinner, StatCard/analytics chart wrapper.

## 7. Accessibility & content
Visible focus ring (2px `--primary` + 2px offset), 44px min touch targets, labels on all inputs, status never by color alone. Empty states explain what real data is missing — never placeholder employers or fake percentages.

## 8. Forbidden
Dark mode, `#000`/near-black backgrounds, dark sidebars, neon, glassmorphism overload, copied third-party UI or assets.
