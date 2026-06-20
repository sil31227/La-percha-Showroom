Fixed mobile bottom navigation — the primary nav for the shopper app. Use the `accent` item for the raised central "Vender" action.

```jsx
<BottomNav active={tab} onChange={setTab} items={[
  { key:'home', label:'Inicio', icon:<Home size={22}/> },
  { key:'search', label:'Buscar', icon:<Search size={22}/> },
  { key:'sell', label:'Vender', icon:<Plus size={22}/>, accent:true },
  { key:'fav', label:'Favoritos', icon:<Heart size={22}/>, badge:3 },
  { key:'me', label:'Perfil', icon:<User size={22}/> },
]} />
```
Keep to 5 items max. Sage marks the active tab.
