// Para, sayı, tarih ve stok yardımcıları

export const KRITIK_STOK = 5; // bu sayı ve altı "Az kaldı" görünür

const paraBicim = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' });
const sayiBicim = new Intl.NumberFormat('tr-TR');

export const tl = (n) => paraBicim.format(Number(n) || 0);
export const sayi = (n) => sayiBicim.format(Number(n) || 0);
export const yuzde = (n) => `%${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(Number(n) || 0)}`;

export const kdvDahil = (fiyat, kdv) =>
  Math.round((Number(fiyat) || 0) * (1 + (Number(kdv) || 0) / 100) * 100) / 100;

export function stokDurum(stok) {
  const s = Number(stok) || 0;
  if (s <= 0) return { etiket: 'Tükendi', tur: 'yok' };
  if (s <= KRITIK_STOK) return { etiket: 'Az kaldı', tur: 'az' };
  return { etiket: 'Stokta', tur: 'var' };
}

export const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

// Yerel (Türkiye) tarihe göre YYYY-MM-DD
export const gunAnahtari = (d = new Date()) => {
  const t = new Date(d);
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
};

export const tarihSaat = (d) =>
  new Date(d).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

// "05321234567", "+90 532 123 45 67" → "905321234567"
export function telefonTemizle(no) {
  let d = String(no || '').replace(/\D/g, '');
  if (d.startsWith('0')) d = '9' + d;
  if (d.length === 10) d = '90' + d;
  return d;
}

export function whatsappLink(no, mesaj) {
  return `https://wa.me/${telefonTemizle(no)}?text=${encodeURIComponent(mesaj)}`;
}

export function trKucuk(s) {
  return String(s || '').toLocaleLowerCase('tr-TR');
}
