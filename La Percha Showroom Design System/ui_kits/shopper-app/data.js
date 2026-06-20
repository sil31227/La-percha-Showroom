// La Percha Showroom — mock data for the shopper UI kit
window.LP_DATA = {
  categories: ['Todo', 'Vestidos', 'Jeans', 'Camperas', 'Calzado', 'Deportiva', 'Infantil'],
  official: [
    { id: 'o1', title: 'Set de mates artesanales pintados a mano', price: 12500, rating: 5, reviews: 8, official: true, cat: 'Bazar' },
    { id: 'o2', title: 'Vela de soja aroma vainilla & cedro', price: 6800, original: 8500, rating: 4.5, reviews: 21, official: true, freeShipping: true, cat: 'Decoración' },
    { id: 'o3', title: 'Crema corporal natural karité', price: 9200, rating: 4.5, reviews: 14, official: true, cat: 'Cosmética' },
    { id: 'o4', title: 'Juego de bowls de cerámica esmaltada', price: 18900, rating: 5, reviews: 5, official: true, cat: 'Bazar' },
  ],
  feria: [
    { id: 'f1', title: 'Vestido de lino natural manga corta', price: 18900, original: 24000, rating: 4.5, reviews: 32, freeShipping: true, seller: 'Caro Indumentaria', cat: 'Vestidos' },
    { id: 'f2', title: 'Campera de jean oversize tiro alto', price: 26500, rating: 4, reviews: 17, seller: 'Vintage Bahía', cat: 'Camperas' },
    { id: 'f3', title: 'Zapatillas urbanas de cuero blancas', price: 32000, original: 39000, rating: 5, reviews: 44, seller: 'Pasos Store', cat: 'Calzado' },
    { id: 'f4', title: 'Jean mom fit celeste claro', price: 21500, rating: 4.5, reviews: 28, freeShipping: true, seller: 'Denim Club', cat: 'Jeans' },
    { id: 'f5', title: 'Buzo deportivo algodón frisado', price: 16800, rating: 4, reviews: 11, seller: 'Activa', cat: 'Deportiva' },
    { id: 'f6', title: 'Vestido infantil floreado', price: 11900, rating: 5, reviews: 9, seller: 'Pequeños', cat: 'Infantil' },
  ],
  get all() { return [...this.official, ...this.feria]; },
  fmt(n) { return '$' + Number(n).toLocaleString('es-AR'); },
};
