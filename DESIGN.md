# Design System: Bahi-Khata Modern (बही-खाता मॉडर्न)

## 1. Visual Theme & Atmosphere
A prestigious, archival-grade financial ledger engineered for high-volume family retail shops in India. The aesthetic blends the physical dignity of century-old hand-bound merchant ledgers (*Lal Kitab / Rokad Bahi*) with the high-velocity precision of modern financial terminals. 

- **Density: 7.5 / 10 ("Cockpit Dense Ledger")** — Information-dense without visual exhaustion. Numerical columns, transaction notes, and drawer balances are crisp, structured with hairline dividers, and prioritized for instant counter scanning.
- **Variance: 7.0 / 10 ("Offset Asymmetric")** — Rejects monotonous identical card grids. Primary metrics (Live Cash Galla and Bank Reserve) carry weighted visual presence with asymmetric proportions over secondary liabilities.
- **Motion: 6.0 / 10 ("Kinetic Spring Physics")** — Spring physics (`stiffness: 100, damping: 20`) grant every button press and drawer slide physical inertia and weight. Active cash drawers possess subtle perpetual micro-breathing indicators.

---

## 2. Color Palette & Roles

Strictly one singular primary accent with saturation capped under 80%. Pure black (`#000000`) is permanently banned.

### Surface & Canvas Foundations
- **Warm Alabaster Canvas (`#F7F5F0`)** — Primary application background; evokes tactile, unbleached cotton ledger paper.
- **Pure Linen Surface (`#FFFFFF`)** — Elevated card fill, modal sheets, and active container canvases.
- **Warm Stone Neutral (`#EFECE5`)** — Secondary panels, table column headers, and passive tab controls.
- **Hairline Rule (`#E5E0D6`)** — 1px razor-sharp structural borders and accounting grid lines.

### Dark Mode (Deep Obsidian Canvas)
- **Charcoal Ink Ground (`#141518`)** — Primary dark viewport background with subtle warm undertones (never pure black).
- **Obsidian Surface (`#1C1E23`)** — Elevated dark card fill and data containers.
- **Obsidian Hairline (`#292C34`)** — 1px dark structural border dividers.

### Typography Ink
- **Deep Charcoal Ink (`#18191C`)** — Primary typography, ledger titles, and high-contrast numbers in light mode.
- **Parchment Mist (`#73716A`)** — Secondary captions, category tags, timestamps, and breadcrumbs.
- **Parchment White (`#F5F4EE`)** — Primary headline text in dark mode.
- **Muted Graphite (`#949188`)** — Secondary descriptions and column metadata in dark mode.

### Singular Primary Accent
- **Heritage Forest Emerald (`#164032`)** — The authoritative single accent color. Represents fiscal custody, mercantile trust, and ancestral balance books. Used for primary CTAs, active indicators, and confirmed states (Dark mode: `#D4AF37` / Burnished Brass highlight).

### Calibrated Functional Semantics (Desaturated, Non-Neon)
- **Terracotta Vermilion (`#B93E3E`)** — Expense outflows, mid-month salary advances (*Upaad*), overdrawn limits, and critical alerts.
- **Deep Forest Sage (`#225942`)** — Settled payroll, verified payments, and positive treasury balance.
- **Raw Umber Amber (`#B27B18`)** — Pending credit vouchers, Kaccha slips, and due-soon reminders.

---

## 3. Typography Rules

Hierarchy is established through weight, optical spacing, and font discipline rather than giant font sizes.

- **Display & Prestige Branding:** `Instrument Serif` (400 / Italic). Used exclusively for shop mastheads, executive figures, and major ledger titles. Tracked tight (`-0.02em`).
- **Interface & Operational Controls:** `Plus Jakarta Sans` (400, 500, 600, 700). Clean geometric legibility with relaxed leading for shop counter readability.
- **Ledger Numbers & Monetary Columns:** `JetBrains Mono` / Tabular Numerals (`tabular-nums font-mono font-medium`). Every rupee amount (`₹1,45,200`) strictly occupies identical vertical columns to guarantee effortless vertical scanning across hundreds of rows.
- **Banned:** `Inter` is strictly forbidden. Generic system serif fonts (`Times New Roman`, `Georgia`, `Garamond`) are strictly forbidden. Pure black text (`#000000`) is forbidden.

---

## 4. Component Stylings

### Buttons & Interactive Controls
- **Primary CTA:** Flat Heritage Emerald fill (`#164032`), white text, 12px rounded corners (`rounded-xl`), zero blurry neon box-shadows. On press, tactile mechanical translation (`active:scale-[0.98]` and `active:translate-y-px`).
- **Secondary Actions:** 1px Hairline Rule (`#E5E0D6`), Linen Surface fill, Charcoal Ink text. Hover brings subtle neutral wash (`hover:bg-[#EFECE5]`).
- **Keyboard Shortcut Badges:** Monospace micro-pills (`font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10`).

### Cards & Container Architecture
- **Elevation Philosophy:** Elevation communicates relational hierarchy, never decoration. Heavy blur drop-shadows are banned.
- **Border Treatment:** 1px Hairline Rule (`#E5E0D6` light / `#292C34` dark). 
- **Corner Radii:** Consistent 16px (`rounded-2xl`) for outer cards; 10px (`rounded-xl`) for internal nested modules.
- **High-Density Ledger Surfaces:** In dense data tables, replace card containers with top hairline borders and alternating stone rows to maximize vertical viewport space.

### Form Inputs & Shop Counter Fields
- **Labeling:** Concise uppercase labels above the field (`text-[11px] font-semibold tracking-wider text-stone-500`).
- **Input Fill:** Warm Alabaster (`#F7F5F0` light / `#141518` dark) with 1px border. Focus state invokes a crisp 2px Heritage Emerald ring (`focus:ring-2 focus:ring-[#164032]/30`).
- **Monetary Inputs:** Currency symbol (`₹`) hard-pinned on the left in monospace font, input values rendered in large tabular digits (`text-lg font-mono font-bold`).

### Skeletal Loaders & State Handling
- **Loading:** Dimensional skeleton blocks matching exact component aspect ratios with gentle 1.5s wave shimmer. Circular spinning loaders are banned on main views.
- **Empty States:** Composed, purposeful compositions with contextual action triggers (e.g. "+ Record First Customer Outflow") rather than plain empty text.
- **Badges:** Pill-shaped, semi-opaque background (`bg-[#164032]/10 text-[#164032] border border-[#164032]/20`), uppercase tracked-wide text.

---

## 5. Layout Principles

- **Asymmetric Command Bento:** The primary viewport is divided into asymmetric visual anchors: Live Drawer Balances on the left with prominent visual volume, secondary liabilities and payroll accruals on the right.
- **Clean Spatial Zones:** Zero overlapping text or absolute floating elements. Every card, table, and ribbon occupies its own deterministic CSS Grid cell.
- **Mobile Single-Column Collapse:** On viewports `< 768px`, all multi-column bento grids collapse strictly into a single vertical sequence without horizontal overflow.
- **Vertical Viewport Safeguard:** Full-height sections must use `min-h-[100dvh]` to avoid mobile address bar jumps.
- **Containment:** Desktop views are centered within `max-w-[1440px]` with generous horizontal gutter padding (`px-4 sm:px-6 lg:px-8`).

---

## 6. Motion & Interaction

- **Spring Dynamics:** Framer Motion physics configured with `type: "spring", stiffness: 100, damping: 20` for physical, dampened realism without artificial linear curves.
- **Waterfall Cascade:** Lists, ledger rows, and bento cards enter via staggered cascade delays (`staggerChildren: 0.06s`) with `opacity: 0 -> 1` and `y: 12px -> 0px`.
- **Perpetual Micro-Interactions:**
  - Live Cash Drawer indicator pulses with a subtle 3s opacity wave (`opacity: 0.6 <-> 1.0`).
  - Active navigation pill uses fluid layout animation (`layoutId="active-pill"`).
- **GPU Acceleration:** All motion restricted to `transform` and `opacity` properties. Layout recalculating properties (`width`, `height`, `margin`, `top`) are never animated.

---

## 7. Anti-Patterns (Strictly Banned)

1. **NO EMOJIS ANYWHERE:** Unicode emojis (such as ⚠️, ✓, 🚀, 🖨️, ⚡, 💰) are strictly banned. All visual metaphors must use refined, vector SVG icons (`lucide-react`).
2. **NO Inter Font:** Banned in favor of `Plus Jakarta Sans` for geometric character and `Instrument Serif` for prestige editorial.
3. **NO Pure Black (`#000000`):** Use Charcoal Ink (`#18191C`) or Obsidian (`#141518`).
4. **NO Neon Glowing Shadows / AI Gradients:** Banned. No purple halos or oversaturated gradient buttons.
5. **NO Generic 3-Equal-Card Rows:** Feature rows must use hierarchical bento or asymmetric proportions.
6. **NO Generic AI Copy:** Words like "Elevate", "Seamless", "Unleash", "Next-Gen" are banned. Use authentic Indian commerce vernacular: *Galla Hisab, Upaad, Pakka Bill, Kaccha Slip, Khata Passbook, Vyapar Outflow*.
7. **NO Floating Labels or Disappearing Form Hints.**
8. **NO Horizontal Scroll on Mobile Devices.**
