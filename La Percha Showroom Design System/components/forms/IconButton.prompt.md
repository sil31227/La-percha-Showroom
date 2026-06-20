Round icon-only control for favorite, share, close, cart and toolbar actions. Always pass `ariaLabel`.

```jsx
<IconButton variant="soft" ariaLabel="Agregar a favoritos" active={fav} onClick={toggle}>
  <Heart size={18} />
</IconButton>
```

Variants: `ghost` · `soft` (white chip + shadow, for over-image) · `brand`. `active` flips to the terracotta favorited look.
