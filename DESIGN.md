---
name: Student Flea Market Design System
description: Warm cream & toasted orange marketplace UI tokens supporting accessible Light and Dark modes.
colors:
  light:
    background: "#FAF7F2"
    background-alt: "#FCF9F4"
    surface: "#FFFFFF"
    surface-subtle: "#FBF8F3"
    surface-sidebar: "#F2EAE0"
    border: "#EADBCE"
    border-subtle: "#EFE8DD"
    text-primary: "#2A211B"
    text-secondary: "#6D5D52"
    text-muted: "#75675C"
    brand-primary: "#E89650"
    brand-warm: "#F5A764"
    brand-tint: "#FBD6B0"
    brand-text: "#C46A28"
    cta-solid-bg: "#C46A28"
    cta-solid-text: "#FFFFFF"
  dark:
    background: "#0C0A09"
    surface: "#1C1917"
    surface-elevated: "#292524"
    border: "#292524"
    border-strong: "#44403C"
    text-primary: "#F5F5F4"
    text-secondary: "#D6D3D1"
    text-muted: "#A8A29E"
    brand-accent: "#F5A764"
    brand-hover: "#FBD6B0"
    cta-solid-bg: "#F5A764"
    cta-solid-text: "#0C0A09"
typography:
  display: "'Times New Roman', Georgia, serif"
  sans: "'Montserrat', sans-serif"
  numeric: "tabular-nums"
spacing:
  page-gutter-mobile: "1rem"
  page-gutter-desktop: "1.5rem"
  card-padding: "1.5rem"
  touch-target-min: "44px"
rounded:
  card: "20px"
  auth-card: "32px"
  input: "16px"
  pill: "9999px"
components:
  theme-toggle: "class-based .dark on <html> via sfm_theme in localStorage"
  focus-ring: "2px solid #C46A28 (light) / #F5A764 (dark) with 2px offset on :focus-visible"
---

# Student Flea Market Design System

## Overview

Student Flea Market uses a warm editorial-marketplace aesthetic tailored for university students buying, selling, and exchanging campus items. Light mode pairs warm parchment cream surfaces with toasted amber-orange accents, while Dark mode translates the warmth into deep charcoal-stone (`stone-950` / `stone-900` / `stone-800`) surfaces with high-contrast amber (`#F5A764`) highlights—avoiding harsh cold slate or generic purple gradients.

## Colors

### Light Mode
- **Canvas**: `#FAF7F2` (app/auth/admin backdrop) and `#FCF9F4` (storefront).
- **Surfaces**: `#FFFFFF` cards, `#FBF8F3` secondary panels, `#F2EAE0` admin navigation rail.
- **Borders**: `#EFE8DD` card borders, `#EADBCE` input and control borders, `#E4D6C4` admin dividers.
- **Ink**: `#2A211B` primary headings/body, `#6D5D52` secondary descriptions, `#75675C` placeholders/captions (WCAG AA compliant on cream/white surfaces), `#C46A28` brand links/headings.
- **Brand & CTAs**: Use `#C46A28` / `#B55E20` with `#FFFFFF` text for solid white-on-orange primary actions, or `#F5A764` / `#E89650` backgrounds with `#2A211B` dark ink so contrast stays >= 4.5:1.

### Dark Mode (`.dark`)
- **Canvas**: `stone-950` (`#0C0A09`).
- **Surfaces**: `stone-900` (`#1C1917`) cards/sidebars, `stone-800` (`#292524`) inputs/subtle pills.
- **Borders**: `stone-800` structural borders, `stone-700` interactive field borders.
- **Ink**: `stone-100` (`#F5F5F4`) primary text, `stone-300` (`#D6D3D1`) secondary text, `stone-400` (`#A8A29E`) muted labels, `#F5A764` brand accents.
- **Brand & CTAs**: `bg-[#F5A764] hover:bg-[#E89650] text-stone-950` or high-contrast `bg-[#C46A28] text-white`.

## Typography

- **Headings / Editorial Display**: `Times New Roman`, serif (tight tracking on auth titles and hero headline).
- **UI / Body**: `Montserrat`, sans-serif.
- **Numerical Alignment**: Apply `tabular-nums` to all prices, wallet balances, OTP inputs, and admin KPI counters.

## Layout

- **Viewport Safety**: Use `min-h-[100dvh]` for full-height auth and portal shells instead of `min-h-screen` to prevent mobile address-bar clipping.
- **Landmarks & Skip Link**: Every layout provides an accessible skip-to-main-content link targeting `#main-content` on `<main>`.
- **Theme Synchronization**: Every standalone route tree (`Auth`, `Admin`, `Policies`, `Storefront`) initializes `useThemeStore().initTheme()` alongside the pre-paint inline script in `app/layout.tsx`.

## Elevation & Depth

- Soft warm-tinted shadows (`rgba(195,170,140,0.16)`) in light mode; crisp `1px` `stone-800` borders and `dark:shadow-none` / subtle `shadow-black/40` in dark mode.
- Backdrop-blurred headers/overlays include `@media (prefers-reduced-transparency: reduce)` solid surface fallbacks.

## Shapes

- Auth containers: `rounded-[32px]`
- Dashboard & Marketplace cards: `rounded-2xl` / `rounded-[20px]`
- Inputs & action buttons: `rounded-2xl` / `rounded-xl`
- Pills, tags, avatars, language chips: `rounded-full`

## Components

- **Inputs**: Always pair visible `<label>` or `sr-only` `<label>` (`htmlFor` matching `id`) with `aria-label` when visual placeholders are used alone.
- **Icon-Only Buttons**: Minimum `44x44px` interactive hit area (`min-h-[44px] min-w-[44px]` on touch/navigation actions) with descriptive `aria-label`, plus `aria-expanded` / `aria-pressed` on toggles and menus.
- **Badges & Status Tags**: Condition badges and status pills must achieve >= 4.5:1 foreground-to-background contrast (e.g., `#7D5435` / `#855A3C` with white text instead of low-contrast tan).
- **Live Feedback**: Inline error alerts and form toasts expose `role="alert"` or `aria-live="polite"`.

## Accessibility & Motion

- Respect `@media (prefers-reduced-motion: reduce)` globally in `globals.css` (collapse transitions/animations).
- Respect `@media (prefers-reduced-transparency: reduce)` for sticky translucent navbars and drawers.
- Provide high-contrast `:focus-visible` outlines across links, buttons, and custom inputs.

## Do's and Don'ts

- **Do**: Keep `dark:` classes on every page canvas, card, modal, dropdown, input, divider, and brand slogan.
- **Do**: Verify WCAG AA (>= 4.5:1 normal text, >= 3:1 large text/icons) in both Light and Dark themes.
- **Don't**: Put white text on light `#F5A764` without dark ink (`text-[#2A211B]` / `text-stone-950`) or darker `#C46A28` / `#B55E20` backgrounds.
- **Don't**: Leave icon buttons without `aria-label` or OTP boxes unlabeled for screen readers.
