const rng = Math.random;
const startId = 140 + Math.floor(rng() * 100);
const orders = Array.from({ length: 4 + Math.round(rng() * 4) }, (_, index) => {
  return { id: `KOT-${startId + index}` };
});
console.log(orders.map(o => o.id));
