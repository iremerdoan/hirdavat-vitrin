import { gunAnahtari } from './format.js';

// Her tarayıcıya rastgele, isimsiz bir kimlik verilir. Kişisel bilgi / IP tutulmaz.
let bellek = {};

function oku(k) {
  try { return localStorage.getItem(k); } catch { return bellek[k] ?? null; }
}
function yaz(k, v) {
  try { localStorage.setItem(k, v); } catch { bellek[k] = v; }
}

export function ziyaretciId() {
  let id = oku('hv_zid');
  if (!id) {
    id = (crypto.randomUUID && crypto.randomUUID()) || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    yaz('hv_zid', id);
  }
  return id;
}

// Aynı kişi gün içinde 10 kere girse de 1 ziyaret sayılır
export function bugunIlkZiyaretMi() {
  const bugun = gunAnahtari();
  if (oku('hv_zgun') === bugun) return false;
  yaz('hv_zgun', bugun);
  return true;
}
