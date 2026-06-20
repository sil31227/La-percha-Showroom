The core marketplace tile, for both Tienda Oficial products and Feria de Ropa listings. Built for a 2-up mobile grid.

```jsx
<ProductCard title="Vestido lino natural" price={18900} original={24000}
  rating={4.5} reviews={32} freeShipping seller="Caro Indumentaria"
  favorite={fav} onToggleFavorite={toggle} onClick={open} />
<ProductCard title="Set de mates artesanales" price={12500} official rating={5} reviews={8} />
```

Composes Badge, Rating, PriceTag and a favorite IconButton. Pass `official` for Tienda Oficial, `seller` for feria listings. Omit `image` to get the taupe placeholder.
