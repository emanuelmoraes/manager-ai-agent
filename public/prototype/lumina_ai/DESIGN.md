---
name: Lumina AI
colors:
  surface: '#13131b'
  surface-dim: '#13131b'
  surface-bright: '#393842'
  surface-container-lowest: '#0d0d16'
  surface-container-low: '#1b1b23'
  surface-container: '#1f1f27'
  surface-container-high: '#292932'
  surface-container-highest: '#34343d'
  on-surface: '#e4e1ed'
  on-surface-variant: '#cbc3d7'
  inverse-surface: '#e4e1ed'
  inverse-on-surface: '#302f39'
  outline: '#958ea0'
  outline-variant: '#494454'
  surface-tint: '#d0bcff'
  primary: '#d0bcff'
  on-primary: '#3c0091'
  primary-container: '#a078ff'
  on-primary-container: '#340080'
  inverse-primary: '#6d3bd7'
  secondary: '#ddb8ff'
  on-secondary: '#490081'
  secondary-container: '#62259b'
  on-secondary-container: '#d1a1ff'
  tertiary: '#4cd7f6'
  on-tertiary: '#003640'
  tertiary-container: '#009eb9'
  on-tertiary-container: '#002f38'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e9ddff'
  primary-fixed-dim: '#d0bcff'
  on-primary-fixed: '#23005c'
  on-primary-fixed-variant: '#5516be'
  secondary-fixed: '#f0dbff'
  secondary-fixed-dim: '#ddb8ff'
  on-secondary-fixed: '#2c0051'
  on-secondary-fixed-variant: '#62259b'
  tertiary-fixed: '#acedff'
  tertiary-fixed-dim: '#4cd7f6'
  on-tertiary-fixed: '#001f26'
  on-tertiary-fixed-variant: '#004e5c'
  background: '#13131b'
  on-background: '#e4e1ed'
  surface-variant: '#34343d'
typography:
  headline-xl:
    fontFamily: Outfit
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Outfit
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-padding-desktop: 40px
  container-padding-mobile: 16px
  gutter: 24px
  stack-gap-sm: 8px
  stack-gap-md: 16px
  stack-gap-lg: 32px
---

## Brand & Style
The design system is engineered for a high-performance AI SaaS environment, blending industrial professionalism with a futuristic, ethereal edge. The brand personality is "Intelligence Illuminated"—it feels precise, authoritative, yet approachable through soft light diffusion.

The visual style is **Glassmorphism meets Modern Corporate Dark**. It utilizes deep, ink-like backgrounds contrasted with luminous gradients and semi-transparent layers to create a sense of vast digital space. Key characteristics include:
- **Depth through Transparency:** Surfaces are not solid; they are frosted panes that allow ambient background colors to bleed through.
- **Luminescent Accents:** High-vibrancy purple and indigo are used as "light sources" rather than just flat colors.
- **Precision Engineering:** Sharp typography and consistent 8px-based spacing provide the "SaaS" reliability needed for complex management tools.

## Colors
The palette is rooted in a "Deep Space" theme. The primary background is a rich charcoal-navy (#0a0a12) which provides maximum contrast for the vibrant purple and indigo accents.

- **Primary Glow:** Vibrant Purple (#8b5cf6) is used for primary actions, active states, and focus rings. It should often be paired with a subtle outer glow (box-shadow) to simulate light emission.
- **Glass Surfaces:** Instead of solid grays, surfaces use low-opacity white or primary-tinted overlays (3-8%) with a backdrop-blur (12px to 20px).
- **High-Contrast Status:** Success, Warning, and Error colors are saturated and paired with matching glowing icons to ensure visibility against the dark backdrop.

## Typography
The typography system uses a dual-font approach to balance personality with readability.

- **Display & Headlines:** **Outfit** is the choice for headings. Its geometric but slightly rounded nature feels modern and high-tech. Use tighter letter-spacing for larger sizes to maintain a "locked-in" professional look.
- **Interface & Body:** **Inter** handles all functional text. It is chosen for its exceptional legibility in dark mode and its neutral, systematic feel.
- **Specialty:** For API keys, document paths, or AI prompt snippets, use **JetBrains Mono** to signal technical accuracy.

## Layout & Spacing
This design system employs a **Fluid Grid** model with strict 8px incremental spacing.

- **Desktop:** A 12-column grid with 24px gutters. Content is typically housed within glassmorphic "cards" that span various column widths (e.g., a 4-column sidebar and 8-column main view).
- **Safe Zones:** High-level containers should maintain a minimum of 40px padding from the viewport edges on desktop to allow the background gradients to breathe.
- **Density:** The UI is "Comfortable" but disciplined. Large gaps are used to separate logical sections (32px+), while internal component elements are tightly grouped (4px - 8px) to signify relationship.

## Elevation & Depth
Elevation is communicated through **Translucency and Inner Glows** rather than traditional drop shadows.

1.  **Level 0 (Base):** The deep #0a0a12 background with soft, large radial gradients of purple/blue in the corners.
2.  **Level 1 (Default Containers):** Surface background `rgba(255, 255, 255, 0.03)`, 1px border `rgba(255, 255, 255, 0.08)`, and a backdrop-blur of 16px.
3.  **Level 2 (Hover/Active):** Surface background increases to `0.06` opacity. A subtle 1px inner border highlight (top-left) in `rgba(255,255,255, 0.1)` is added.
4.  **Level 3 (Modals/Popovers):** Surface background `rgba(15, 15, 25, 0.8)`, backdrop-blur 32px, and a soft outer "aura" shadow in the primary accent color at 10% opacity.

## Shapes
The shape language is "Subtle Tech." Elements are rounded enough to feel modern and safe, but not so much that they lose their professional "tool" aesthetic.

- **Standard Elements (Buttons, Inputs):** 0.5rem (8px).
- **Cards & Containers:** 1rem (16px).
- **Inner Nested Elements:** When an element is inside a card, its radius should be 4px-8px smaller than the parent to maintain visual nesting harmony.
- **Status Pills:** Fully rounded (pill-shaped) to distinguish them from interactive buttons.

## Components

### Buttons
- **Primary:** Linear gradient from Purple (#8b5cf6) to Indigo (#6366f1). White text. Subtle glow effect on hover.
- **Secondary:** Transparent background with a 1px border of `white / 0.2`. White text.
- **Ghost:** No border or background until hover. Use for low-priority actions like "Cancel."

### Input Fields
- **Default State:** Dark background (`#0e0e1a`), 1px border (`white / 0.1`), 8px radius.
- **Focus State:** Border changes to Purple (#8b5cf6) with a 2px outer glow. Text remains white, placeholder at 40% opacity.

### Cards & Index Items
- Glassmorphic panels with `backdrop-filter: blur(20px)`.
- Use a vertical separator line (1px, `white / 0.05`) between internal metadata columns.
- On hover, cards should slightly brighten and the border opacity should increase.

### Chips & Status Indicators
- Use a "Soft Glow" style: A low-opacity background of the status color (e.g., green at 10%) with a high-saturation border and text.
- Include a small 6px dot icon next to the text for accessibility.

### Progress Bars & Sliders
- Track: Solid dark (`white / 0.05`). 
- Fill: Primary Purple gradient. 
- For AI processing states, use a "shimmer" animation that moves across the gradient.