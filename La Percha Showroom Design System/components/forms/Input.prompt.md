Labeled text input for forms, search and checkout. 48px tall with 16px text to prevent iOS zoom-on-focus.

```jsx
<Input label="Email" type="email" placeholder="vos@email.com"
       iconLeft={<Mail size={16} />} helper="Te enviaremos el seguimiento acá" />
<Input label="Cupón" error="Código inválido" defaultValue="VERANO" />
```

Pass `error` to show the terracotta invalid state. `iconLeft` and `suffix` are optional slots.
