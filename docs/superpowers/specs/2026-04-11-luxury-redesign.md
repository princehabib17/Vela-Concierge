# Vela — Luxury Redesign Spec
_2026-04-11_

## Vision

Transform Vela from a feature-grid app into the digital equivalent of walking into a private jewellery atelier. A visitor should feel desire before they feel understanding. The ring pulls them in; Paul's voice earns their trust; the process makes them feel invited, not onboarded.

**North star**: Cartier app x Wallpaper* editorial x private commission house. Every pixel earns its place.

---

## Design Direction: Golden Atelier

**Palette**
| Token | Value | Usage |
|---|---|---|
| `--vela-black` | `#020202` | Full-bleed screens |
| `--vela-dark` | `#08070a` | Card surfaces |
| `--vela-gold` | `#c8a05a` | Primary accent |
| `--vela-gold-bright` | `#e8c57a` | Hover, glow, highlights |
| `--vela-gold-dim` | `#7a5c28` | Borders, subtle dividers |
| `--vela-cream` | `#f0ede8` | Body text |
| `--vela-cream-muted` | `rgba(240,237,232,0.38)` | Secondary text |

**Typography**
- Display / Headline: `Cormorant Garamond` — weight 300/400, italic available
- UI / Body: `Inter` — weight 300/400/500 only. Never bold.
- No other fonts.

**Spacing law**: every spacing value is a multiple of 8px. Generous — luxury lives in negative space.

**Motion law**: nothing under 300ms. Ease curves: `cubic-bezier(0.25, 0.46, 0.45, 0.94)` for entrances, `cubic-bezier(0.55, 0.06, 0.68, 0.19)` for exits. No bounce, no spring.

**Anti-patterns to eliminate**:
- Cards with `aspect-[4/5]` stacked vertically (a feature-dump grid)
- Emojis, gradient buttons, rounded pill chips
- Copy that says "Generate Concepts" or "Configure Ring" (product language, not human language)
- Any hover effect that causes layout shift

---

## Narrative Architecture (Home Page)

The home page is a **vertical scroll story** — 5 acts. No tabs, no dashboard.

### Act 1 — The Ring _(full-screen hook)_
- `100dvh` canvas: the 3D ring rotating slowly against pure black
- Radial gold glow behind it, no other light source
- Wordmark `VELA` appears last, 0.5em tracking, barely 20% opacity
- `↓ scroll` whisper at bottom — 7px, 40% white, letter-spaced
- **Zero other UI.** No nav visible on first load. Nav fades in on first scroll.

### Act 2 — The Voice _(Paul's quote)_
- Full-width dark panel, `min-height: 80dvh`
- One quote: _"I don't make jewellery. I make the ring you'll pass down."_
- Paul's portrait (small, circular, 56px), name + "Master Goldsmith · 40 years"
- No biography. No credentials list. One sentence, one face.
- Entrance: quote fades + rises on scroll intersection. GSAP ScrollTrigger.

### Act 3 — The Ritual _(5-step process)_
- Vertical timeline. Steps: Dream → Design → Commission → Craft → Yours
- Active dot at Step 01 (visitor's current position in the story)
- Copy is human language only: "Tell us what you imagine" not "Submit brief"
- Each step reveals on scroll with a 80ms stagger between items

### Act 4 — The Entry Points _(tools, reframed)_
- Headline: "Choose how you want to start."
- Three rows (not cards): AI Design Studio, 3D Configurator, Virtual Try-On
- Each row: icon (Lucide, 18px, strokeWidth 1) + name (Cormorant 16px) + one-line promise + `→`
- No images. No aspect-ratio boxes. No opacity-50 Unsplash photos.
- Subtle `border: 0.5px solid rgba(gold, 0.12)` row separators

### Act 5 — The Invitation _(closing CTA)_
- Centred, generous padding
- Scarcity line: "Paul is accepting commissions · Limited to 12 per year"
- Headline (Cormorant italic 32px): "Your ring begins here."
- Single CTA button: `BEGIN YOUR COMMISSION` — ghost style, gold border, no fill
- No footer, no social links, no noise

---

## Navigation Redesign

Current nav is fine structurally. Improvements:
- **Hidden on Act 1** (first screen). Fades in with `opacity: 0 → 1` on first scroll event
- Active indicator: 20px horizontal line above the icon, gold, `border-radius: 1px`
- Labels: 7px, tracking 0.18em, uppercase. Active: gold. Inactive: 22% cream.
- Background: `bg-black/95 backdrop-blur-xl` — remove the gray border-t, use `opacity: 0` line instead

---

## Typography System Upgrade

Replace `Playfair Display` with `Cormorant Garamond`. Reasons: lighter weight (300 available), more refined at large sizes, better italic, loads faster.

```css
/* New imports */
Cormorant Garamond: 300, 300i, 400, 400i
Inter: 300, 400, 500
```

Remove: `Cardo`, `Gotham` references (Gotham isn't on Google Fonts anyway).

---

## Copy Rewrites (all pages)

| Old | New |
|---|---|
| "AI Design" / "Generate Concepts" | "AI Design Studio" / "Describe it, we visualise it" |
| "3D Build" / "Configure Ring" | "3D Configurator" / "Build it stone by stone" |
| "Virtual Try-On" / "Experience in AR" | "Virtual Try-On" / "See it on your hand now" |
| "Your Vela Journey" / "Active Order" | "Your Commission" / "In progress" |
| "Digital Jewellery Box" | "Your Collection" |
| "Ring Sizer Tool" | "Find your size" |

---

## 3D Configurator (unchanged architecture, visual upgrade)

- Environment: `"studio"` preset (already done) ✓
- Materials: per-metal PBR values (already done) ✓
- **Add**: subtle `UnrealBloomPass` — strength 0.3, radius 0.4, threshold 0.85
- **Add**: `VignetteShader` — offset 0.9, darkness 0.8
- Background: keep light-theme `radial-gradient` — the contrast with the dark app is intentional

---

## Splash Screen (keep, refine)

Current GSAP splash is good. One refinement:
- Replace `<Diamond />` Lucide icon with an inline SVG diamond shape — cleaner stroke, no rounded Lucide style
- Increase hold time by 400ms before exit fade

---

## Pages: Other Routes

Each non-home page uses `PageShell` (already exists). Upgrades:
- Replace font: `Playfair Display` → `Cormorant Garamond` everywhere
- Kicker color stays gold, spacing stays consistent
- `vela-card-surface` border changes: `border-vela-gray/25` → `border: 0.5px solid rgba(gold, 0.12)`

---

## What Does NOT Change

- React Router structure
- R3F / Three.js canvas architecture  
- GSAP + motion library usage
- Tailwind v4 `@theme` token system
- `PageShell` component
- Bottom navigation route structure

---

## Success Criteria

A visitor who has never heard of Vela should, in one scroll:
1. **Feel desire** — the ring is beautiful
2. **Feel trust** — Paul is real and skilled
3. **Feel invited** — the process is clear and personal
4. **Feel ready** — the tools make sense as next steps
5. **Feel urgency** — 12 commissions per year

If they still feel confused after one scroll, the redesign has failed.
