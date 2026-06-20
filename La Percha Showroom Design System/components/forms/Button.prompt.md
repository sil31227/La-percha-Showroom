Primary action button — use the sage `primary` for the single main CTA on a screen; `outline`/`ghost` for secondary actions, `danger` for destructive flows.

```jsx
<Button variant="primary" size="lg" full>Comprar ahora</Button>
<Button variant="outline" iconLeft={<Heart size={16} />}>Favorito</Button>
```

Variants: `primary` (sage) · `secondary` (mint) · `outline` · `ghost` · `danger`. Sizes: `sm` (36) · `md` (44) · `lg` (52). Props: `full`, `disabled`, `iconLeft`, `iconRight`. Min touch target is 44px (size md+).
