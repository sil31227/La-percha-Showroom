Underline tabs for switching in-page sections (product Descripción/Reseñas, seller Ventas/Ganancias).

```jsx
<Tabs active={tab} onChange={setTab}
  tabs={[{key:'desc',label:'Descripción'},{key:'rev',label:'Reseñas',count:32}]} />
```
Scrolls horizontally when tabs overflow on mobile.
