# La Percha Showroom — Design System

A warm, local, boutique-marketplace design system for **La Percha Showroom**, a hybrid
marketplace from Palihue (Bahía Blanca, Argentina) run by Silvina Torres. It consists of
**two separate web apps**:

### App Cliente (mobile-first web app)
The customer-facing app. Anyone can browse and buy. Registered users who are authorized by
the admin can also sell clothing in the Feria de Ropa:

- **Tienda Oficial** — curated regalería, bazar, decoración, cosmética, accesorios and
  imported goods, managed only by the owner.
- **Feria de Ropa** — authorized community members sell clothing only (remeras, jeans,
  camperas, vestidos, calzado, deportiva, infantil). Every listing is hand-approved by the
  admin. Platform keeps a 20% commission; funds are held until delivery, then released to
  the seller.

### App Admin (desktop web app)
Silvina's management panel where she controls the entire platform:

- **Tienda Oficial** — upload and manage her own products.
- **Moderación** — approve, reject, or request changes to Feria de Ropa listings.
- **Gestión de vendedores** — authorize or revoke users who want to sell in the Feria.
- **Pedidos** — track all orders across both storefronts.
- **Finanzas** — commissions, payouts, monthly reports.

The product takes cues from Mercado Libre, Instagram Shopping and Tiendanube but is **simpler,
warmer and closer to the community**. The brand must read as: confianza, cercanía, moda,
comunidad, seguridad, profesionalismo.

> **Source material:** the brand badge `assets/logo.jpg` (circular hanger + leaf + script
> wordmark) and the founder brief. No prior codebase or Figma was provided — the visual system
> below is derived from the logo and brief. Fonts are Google-Fonts substitutes (see Caveats).

---

## Brand at a glance

- **Mobile-first** (390×844 / 414×896 base), responsive up through tablet (768/820) and desktop
  (1280/1440/1920). Desktop is **not** a stretched phone — it uses sidebars, grids and side panels
  (see the seller & admin kits).
- **Palette** sampled from the badge: warm **taupe/greige** field, **charcoal ink** text,
  **sage-green** (the leaf) as the primary accent, soft **mint-blue** (the ring) as secondary.
- **Type:** Marcellus (elegant boutique display) + Mulish (warm humanist UI/body), with Parisienne
  as an occasional script flourish that echoes the wordmark.

---

## CONTENT FUNDAMENTALS

How La Percha writes:

- **Language:** Argentine Spanish, **voseo** ("Renová tu placard", "Sumá prendas", "Te avisamos",
  "pasá a buscarla"). Always second-person and personal — talk *to* the customer, like the owner would.
- **Tone:** warm, close, encouraging, never corporate. Short sentences. A neighbour who has great taste,
  not a faceless platform.
- **Casing:** Sentence case for UI and body. Spaced **UPPERCASE** only for tiny eyebrows/section
  kickers (echoes "SHOWROOM" on the badge) — e.g. `FERIA DE ROPA`, `TIENDA OFICIAL`.
- **Display headings** use Marcellus and stay short and editorial: "Renová tu placard, cerca tuyo",
  "Seleccionado por Silvina".
- **Money & specifics:** Argentine peso, dot thousands — `$18.900`. Be concrete about logistics
  (Correo Argentino 3-5 días, retiro en showroom Palihue, envío gratis desde $25.000).
- **Emoji:** sparingly and only friendly/human (a single 👋 on a greeting). Never as data icons or
  decorative filler. Prefer real line icons.
- **Microcopy examples:** empty cart → "Tu carrito está vacío · Sumá prendas de la feria…";
  favourites → "Todavía no tenés favoritos · Tocá el corazón…"; success → "¡Pago confirmado!".

---

## VISUAL FOUNDATIONS

- **Colour vibe:** warm and earthy. Backgrounds are off-white/cream (`--bg-page` taupe-50,
  `--bg-canvas` #fffdf9) over which white cards sit. Sage is the single action colour; mint is a
  gentle secondary used for "envío gratis", info and secondary buttons; terracotta (`--error-500`)
  is the warm red. Never cold blues or purple gradients.
- **Type:** Marcellus display (single elegant weight, used large with tight tracking, never for body),
  Mulish for everything functional (400 body, 600 labels, 700–800 prices/CTAs). Parisienne script is
  decorative only.
- **Spacing:** 4px base scale. Mobile screens use 16px side gutters; cards use 10–18px padding.
- **Backgrounds:** mostly flat warm neutrals. Heroes use *soft, low-saturation* two-stop gradients
  drawn from the palette (mint-200 → sage-200, or taupe-100 → taupe-300 for image placeholders). No
  photography is bundled — product imagery uses a taupe placeholder until real photos are supplied.
- **Corner radii:** soft and friendly — cards `--radius-lg` (16), sheets/heros `--radius-xl` (22),
  chips/buttons trend toward pill. Nothing sharp.
- **Cards:** white surface, 1px `--border-subtle` hairline, `--shadow-sm`; lift to `--shadow-md` and
  `translateY(-2px)` on hover. No coloured left-border accents.
- **Shadows:** warm, taupe-tinted (`rgba(50,44,36,…)`), never pure black. Five steps + a sage-tinted
  `--shadow-brand` reserved for the primary CTA.
- **Borders:** hairline `--border-subtle` (ink-200) for dividers/cards; `--border-default` (ink-300)
  for inputs; ink fill for selected chips/size pickers.
- **Animation:** quick and gentle. `--dur-fast` 140ms for press, `--dur-base` 220ms for transitions,
  a single `--ease-spring` for the switch thumb and toast pop. No infinite/looping decoration.
- **Hover:** cards lift + deepen shadow; buttons keep colour. **Press:** scale down (buttons 0.97,
  icon buttons 0.9) — a tactile, mobile-feeling squish rather than colour change.
- **Transparency/blur:** minimal. Over-image controls use a solid white "soft" chip with a shadow
  rather than glassy blur, so they stay legible on any photo.
- **Bottom navigation** is the backbone of the mobile app: 5 items max, sage active state, a raised
  sage "Vender" action in the centre.

---

## ICONOGRAPHY

- **System:** [Lucide](https://lucide.dev) — clean, rounded, 1.9–2px stroke line icons. Their friendly,
  even weight matches the warm humanist Mulish UI. In the kits they're inlined as small SVGs (same
  Lucide paths) to stay offline-safe; in production, use `lucide-react`.
- **Style rules:** outline (not filled) by default at 1.9–2px stroke; round caps/joins. The heart fills
  solid + turns terracotta only in its active/favourited state. The rating star is the one consistently
  *filled* glyph, in amber (`--rating-star`).
- **Sizes:** 18px inline, 22px nav/toolbar, 30–44px for empty-state and confirmation marks.
- **No emoji as icons** and no hand-drawn one-off SVGs for UI — only the brand badge (`assets/logo.jpg`)
  and Lucide. A lone 👋 is permitted in a greeting headline.
- **Logo:** the circular badge is the only bespoke mark. Keep its clear space; don't recolour or stretch;
  on dark surfaces keep it inside its light circle.

---

## INDEX / MANIFEST

**Foundations (root)**
- `styles.css` — the single entry point consumers link (`@import` list only).
- `tokens/` — `fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `base.css`.
- `assets/logo.jpg` — brand badge.

**Foundation cards** — `guidelines/*.card.html` (Colors, Type, Spacing, Brand groups in the DS tab).

**Components** — `window.LaPerchaShowroomDesignSystem_72de99.<Name>`
- `components/forms/` — **Button, IconButton, Input, Switch, QuantityStepper**
- `components/feedback/` — **Badge, FilterChip, StatusPill, Rating, EmptyState**
- `components/commerce/` — **PriceTag, ProductCard**
- `components/navigation/` — **BottomNav, Tabs**

**UI kits**
- `ui_kits/shopper-app/` — App Cliente: mobile buyer flow (Home → producto → carrito → Mercado Pago → confirmación, favoritos). The seller views (mis publicaciones, mis ventas, ganancias) will be added to this app for authorized users.
- `ui_kits/seller-dashboard/` — Reference desktop layout for seller features (ventas, ganancias, publicaciones, retiro de fondos). In the two-app architecture, these screens move into the App Cliente for authorized sellers.
- `ui_kits/admin/` — App Admin: desktop panel (Tienda Oficial, moderación, gestión de vendedores, pedidos, finanzas).

**Other**
- `SKILL.md` — Agent Skill manifest for using this system in Claude Code.

---

## CAVEATS

- **Fonts are substitutes** loaded from Google Fonts (Marcellus, Mulish, Parisienne, JetBrains Mono).
  If La Percha has licensed brand fonts, send them and we'll self-host via `@font-face`.
- **No product photography** is bundled — ProductCard and detail views use a taupe placeholder. Supply
  real photos to drop in.
- Colours, type and components were derived from the **logo + brief only** (no codebase/Figma). Treat
  this as v1 and tell us what to refine.
