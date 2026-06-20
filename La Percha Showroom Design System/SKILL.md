---
name: la-percha-design
description: Use this skill to generate well-branded interfaces and assets for La Percha Showroom — a warm, local, mobile-first marketplace (Tienda Oficial + Feria de Ropa) — for production or throwaway prototypes/mocks. Contains brand guidelines, colours, type, fonts, the logo asset, and a React UI kit (buttons, product cards, status pills, bottom nav, shopper app, seller & admin panels).
user-invocable: true
---

Read `readme.md` in this skill first — it holds the brand context, content tone (Argentine voseo,
warm and close), visual foundations, iconography (Lucide) and a full index of files.

Then explore as needed:
- `styles.css` + `tokens/` — the colour, type, spacing, radius and shadow custom properties. Link
  `styles.css` and build with the `--*` tokens; don't hardcode hex.
- `components/` — reusable React primitives (Button, IconButton, Input, Switch, QuantityStepper,
  Badge, FilterChip, StatusPill, Rating, EmptyState, PriceTag, ProductCard, BottomNav, Tabs). Each
  has a `.prompt.md` with a usage example.
- `ui_kits/` — full screens to copy from: `shopper-app/` (mobile buyer flow), `seller-dashboard/`
  and `admin/` (desktop panels).
- `assets/logo.jpg` — the brand badge.

If you're making **visual artifacts** (slides, mocks, throwaway prototypes), copy assets out and
produce static HTML files the user can view. If you're working on **production code**, copy the
assets and follow the rules here to design as an expert in the La Percha brand.

If invoked with no other guidance, ask the user what they want to build, ask a few clarifying
questions, then act as an expert designer who outputs HTML artifacts or production code as needed.

**Brand essentials:** mobile-first; warm taupe/cream surfaces; sage-green primary, mint-blue
secondary, terracotta for errors; Marcellus display + Mulish UI; soft radii; warm taupe-tinted
shadows; Lucide line icons; voseo, second-person, close and friendly copy.
