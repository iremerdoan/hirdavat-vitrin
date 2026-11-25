// DEMO veri katmanı: her şey bu tarayıcıda (localStorage) tutulur.
// Gerçek kullanımda supabaseApi.js devreye girer; fonksiyon adları birebir aynıdır.
import { DEMO_GIRIS } from './config.js';
import { ayIstatistik, vitrinIstatistik, cokSatanlar } from './hesap.js';
import { ziyaretciId } from './ziyaretci.js';

const ANAHTAR = 'hv_demo_v1';

const URUNLER = [
  ['VD-0440', 'Sunta Vidası 4x40 (1000\'li kutu)', 'Vida & Dübel', 'Kutu', 185, 140, 'vida', 'Yıldız başlı, sarı galvaniz kaplama. Mobilya ve sunta montajı için.'],
  ['VD-0660', 'Sunta Vidası 6x60 (500\'lü kutu)', 'Vida & Dübel', 'Kutu', 240, 64, 'vida', 'Yıldız başlı, sarı galvaniz. Kalın levha ve ahşap bağlantı için.'],
  ['DB-0008', 'Plastik Dübel 8 mm (100\'lü paket)', 'Vida & Dübel', 'Paket', 42, 320, 'dubel', 'Beton ve tuğla duvar için genel amaçlı naylon dübel.'],
  ['EA-1201', 'Çekiç 500 g Fiberglas Saplı', 'El Aletleri', 'Adet', 265, 38, 'cekic', 'Dövme çelik baş, kaymaz saplı fiberglas gövde.'],
  ['EA-1310', 'Kombine Pense 180 mm', 'El Aletleri', 'Adet', 310, 4, 'pense', 'Krom vanadyum çelik, izoleli sap.'],
  ['EA-1422', 'Kurbağacık Anahtar 10"', 'El Aletleri', 'Adet', 395, 22, 'anahtar', 'Ağız açıklığı 30 mm, krom kaplama.'],
  ['EA-1550', 'Şerit Metre 5 m', 'El Aletleri', 'Adet', 120, 75, 'metre', 'Manyetik uçlu, kilit düğmeli, kauçuk kaplı gövde.'],
  ['EA-1610', 'Demir Testeresi Kollu', 'El Aletleri', 'Adet', 285, 0, 'testere', 'Ayarlanabilir gergili, 300 mm bıçak dahil.'],
  ['EL-2105', 'Darbeli Matkap 750 W', 'Elektrikli Aletler', 'Adet', 1850, 12, 'matkap', '13 mm mandren, devir ayarlı, sağ-sol dönüş.'],
  ['EL-2210', 'Akülü Vidalama 18 V Çift Akülü', 'Elektrikli Aletler', 'Adet', 3450, 3, 'matkap', '2 adet 2,0 Ah akü, şarj cihazı ve taşıma çantası.'],
  ['BY-3101', 'İç Cephe Silikonlu Boya 15 L Beyaz', 'Boya & Kimyasal', 'Kova', 1650, 30, 'boya', 'Silinebilir, mat görünüm. Yaklaşık 120 m² tek kat.'],
  ['BY-3220', 'Şeffaf Silikon 280 ml', 'Boya & Kimyasal', 'Adet', 78, 210, 'silikon', 'Banyo ve mutfak için küf önleyici.'],
  ['EK-4016', 'NYA Kablo 2,5 mm² (100 m)', 'Elektrik', 'Makara', 1120, 26, 'kablo', 'Bakır iletken, TSE belgeli. Kırmızı.'],
  ['EK-4120', 'Topraklı Sıva Altı Priz Beyaz', 'Elektrik', 'Adet', 64, 400, 'priz', 'Çocuk korumalı, vidalı montaj.'],
  ['EK-4230', 'LED Ampul 12 W E27 (10\'lu paket)', 'Elektrik', 'Paket', 390, 48, 'ampul', 'Günışığı 6500 K, 1150 lümen.'],
  ['TS-5012', 'Lavabo Bataryası Krom', 'Tesisat', 'Adet', 1240, 9, 'musluk', 'Seramik kartuşlu, esnek bağlantı hortumları dahil.'],
  ['TS-5110', 'Mutfak Bataryası Spiralli', 'Tesisat', 'Adet', 1890, 5, 'musluk', 'Çekilebilir spiral başlık, iki fonksiyonlu duş.'],
];

const MUSTERILER = ['Yıldız Hırdavat', 'Kardeşler Yapı Market', 'Ege Nalbur', 'Usta Hırdavat', 'Doğan Elektrik', 'Çınar Yapı'];

// Tekrarlanabilir rastgele sayı (demo her açılışta aynı görünsün)
function rastgele(tohum) {
  let s = tohum;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

function tohumla() {
  const r = rastgele(42);
  const simdi = Date.now();
  const urunler = URUNLER.map(([kod, ad, kategori, birim, fiyat, stok, resim, aciklama], i) => ({
    id: i + 1, kod, ad, kategori, birim, fiyat, kdv: 20, stok, aktif: true, aciklama,
    resimler: [`demo:${resim}`], olusturma: new Date(simdi - 120 * 864e5).toISOString(),
  }));
  // Popülerlik ağırlıkları
  const agirlik = urunler.map((_, i) => [6, 4, 7, 3, 3, 2, 5, 1, 4, 2, 3, 6, 3, 5, 4, 2, 1][i]);
  const toplamA = agirlik.reduce((a, b) => a + b, 0);
  const sec = () => {
    let x = r() * toplamA;
    for (let i = 0; i < agirlik.length; i++) { x -= agirlik[i]; if (x <= 0) return urunler[i]; }
    return urunler[0];
  };
  const olaylar = [];
  const satislar = [];
  let sid = 1;
  const ziyaretHavuzu = Array.from({ length: 140 }, (_, i) => `demo-${i}`);
  for (let g = 100; g >= 0; g--) {
    const gun = new Date(simdi - g * 864e5);
    const haftasonu = gun.getDay() === 0;
    const kisi = haftasonu ? 2 + Math.floor(r() * 4) : 6 + Math.floor(r() * 12);
    for (let k = 0; k < kisi; k++) {
      const z = ziyaretHavuzu[Math.floor(r() * ziyaretHavuzu.length)];
      const t = new Date(gun); t.setHours(8 + Math.floor(r() * 11), Math.floor(r() * 60));
      if (t.getTime() > simdi) continue;
      olaylar.push({ tur: 'ziyaret', urun_id: null, ziyaretci: z, zaman: t.toISOString() });
      const bakis = 1 + Math.floor(r() * 4);
      for (let b = 0; b < bakis; b++) {
        const u = sec();
        olaylar.push({ tur: 'goruntuleme', urun_id: u.id, ziyaretci: z, zaman: t.toISOString() });
        if (r() < 0.28) olaylar.push({ tur: 'al_tik', urun_id: u.id, ziyaretci: z, zaman: t.toISOString() });
      }
    }
    const satisSay = haftasonu ? 0 : 1 + Math.floor(r() * 4);
    for (let k = 0; k < satisSay; k++) {
      const u = sec();
      const t = new Date(gun); t.setHours(9 + Math.floor(r() * 9), Math.floor(r() * 60));
      if (t.getTime() > simdi) continue;
      const adet = u.fiyat > 1000 ? 1 + Math.floor(r() * 3) : 2 + Math.floor(r() * 18);
      satislar.push({
        id: sid++, urun_id: u.id, adet, birim_fiyat: u.fiyat, kdv: u.kdv,
        musteri: MUSTERILER[Math.floor(r() * MUSTERILER.length)], zaman: t.toISOString(),
      });
    }
  }
  return {
    v: 1,
    ayarlar: { dukkan_adi: 'Demir Hırdavat', slogan: 'Esnafa toptan hırdavat · Günlük stok', whatsapp: '0532 000 00 00', adres: 'Sanayi Sitesi 4. Blok No:12', calisma_saatleri: 'Hafta içi 08:30–19:00, Cumartesi 09:00–17:00' },
    urunler, olaylar, satislar, sonUrunId: urunler.length, sonSatisId: sid,
  };
}

let veri;
let bellek = null;
function db() {
  if (veri) return veri;
  try { veri = JSON.parse(localStorage.getItem(ANAHTAR)); } catch { veri = bellek; }
  if (!veri || veri.v !== 1) { veri = tohumla(); kaydet(); }
  return veri;
}
function kaydet() {
  try { localStorage.setItem(ANAHTAR, JSON.stringify(veri)); } catch { bellek = veri; }
}
const kopya = (x) => JSON.parse(JSON.stringify(x));
const bekle = () => new Promise((r) => setTimeout(r, 120));

function oturumOku() {
  try { return JSON.parse(sessionStorage.getItem('hv_demo_oturum')); } catch { return window.__hvOturum || null; }
}
function oturumYaz(o) {
  try { o ? sessionStorage.setItem('hv_demo_oturum', JSON.stringify(o)) : sessionStorage.removeItem('hv_demo_oturum'); } catch { window.__hvOturum = o; }
}
const dinleyiciler = new Set();

function yetkiKontrol() {
  if (!oturumOku()) throw new Error('Bu işlem için giriş yapmalısınız.');
}

export default {
  demo: true,

  async ayarlar() { return kopya(db().ayarlar); },
  async ayarKaydet(a) { yetkiKontrol(); db().ayarlar = { ...db().ayarlar, ...a }; kaydet(); },

  async urunler({ hepsi = false } = {}) {
    await bekle();
    const l = db().urunler.filter((u) => hepsi || u.aktif);
    return kopya(l).sort((a, b) => a.ad.localeCompare(b.ad, 'tr'));
  },

  async urunKaydet(u) {
    yetkiKontrol();
    const d = db();
    const kod = String(u.kod || '').trim();
    if (!kod) throw new Error('Ürün kodu boş olamaz.');
    if (d.urunler.some((x) => x.kod === kod && x.id !== u.id)) throw new Error(`"${kod}" kodu başka bir üründe kullanılıyor.`);
    if (u.id) {
      const i = d.urunler.findIndex((x) => x.id === u.id);
      d.urunler[i] = { ...d.urunler[i], ...u, kod };
      kaydet();
      return kopya(d.urunler[i]);
    }
    const yeni = { aktif: true, kdv: 20, stok: 0, birim: 'Adet', resimler: [], ...u, kod, id: ++d.sonUrunId, olusturma: new Date().toISOString() };
    d.urunler.push(yeni);
    kaydet();
    return kopya(yeni);
  },

  async urunSil(id) {
    yetkiKontrol();
    const d = db();
    d.urunler = d.urunler.filter((u) => u.id !== id);
    kaydet();
  },

  // Excel'den gelen satırlar: koda göre varsa günceller, yoksa ekler
  async topluKaydet(satirlar) {
    yetkiKontrol();
    const d = db();
    let eklenen = 0, guncellenen = 0;
    for (const s of satirlar) {
      const mevcut = d.urunler.find((u) => u.kod === s.kod);
      if (mevcut) { Object.assign(mevcut, s); guncellenen++; }
      else {
        d.urunler.push({ aktif: true, kdv: 20, stok: 0, birim: 'Adet', resimler: [], ...s, id: ++d.sonUrunId, olusturma: new Date().toISOString() });
        eklenen++;
      }
    }
    kaydet();
    return { eklenen, guncellenen };
  },

  async resimYukle(blob) {
    yetkiKontrol();
    return await new Promise((ok, hata) => {
      const fr = new FileReader();
      fr.onload = () => ok(fr.result);
      fr.onerror = hata;
      fr.readAsDataURL(blob);
    });
  },

  async olay(tur, urunId = null) {
    db().olaylar.push({ tur, urun_id: urunId, ziyaretci: ziyaretciId(), zaman: new Date().toISOString() });
    kaydet();
  },

  async vitrinIstatistik() { return vitrinIstatistik(db()); },
  async cokSatanlar(n = 8) { return kopya(cokSatanlar(db(), n)); },

  async satislar(yil, ay) {
    yetkiKontrol();
    const d = db();
    const harita = new Map(d.urunler.map((u) => [u.id, u]));
    return d.satislar
      .filter((s) => { const t = new Date(s.zaman); return t.getFullYear() === yil && t.getMonth() + 1 === ay; })
      .map((s) => ({ ...s, urun: harita.get(s.urun_id) ? { ad: harita.get(s.urun_id).ad, kod: harita.get(s.urun_id).kod } : null }))
      .sort((a, b) => new Date(b.zaman) - new Date(a.zaman));
  },

  async satisEkle({ urun_id, adet, birim_fiyat, musteri, stoktan_dus = true }) {
    yetkiKontrol();
    const d = db();
    const u = d.urunler.find((x) => x.id === urun_id);
    if (!u) throw new Error('Ürün bulunamadı.');
    d.satislar.push({ id: d.sonSatisId++, urun_id, adet: Number(adet), birim_fiyat: Number(birim_fiyat), kdv: u.kdv, musteri: musteri || '', zaman: new Date().toISOString() });
    if (stoktan_dus) u.stok = Math.max(0, Number(u.stok) - Number(adet));
    kaydet();
  },

  async satisSil(id, stokIade = true) {
    yetkiKontrol();
    const d = db();
    const s = d.satislar.find((x) => x.id === id);
    if (!s) return;
    if (stokIade) { const u = d.urunler.find((x) => x.id === s.urun_id); if (u) u.stok = Number(u.stok) + Number(s.adet); }
    d.satislar = d.satislar.filter((x) => x.id !== id);
    kaydet();
  },

  async ayIstatistik(yil, ay) { yetkiKontrol(); await bekle(); return ayIstatistik(db(), yil, ay); },

  async oturum() { return oturumOku(); },
  async giris(eposta, sifre) {
    await bekle();
    if (eposta.trim().toLowerCase() !== DEMO_GIRIS.eposta || sifre !== DEMO_GIRIS.sifre) throw new Error('E-posta veya şifre hatalı.');
    const o = { user: { email: DEMO_GIRIS.eposta } };
    oturumYaz(o);
    dinleyiciler.forEach((f) => f(o));
    return o;
  },
  async cikis() { oturumYaz(null); dinleyiciler.forEach((f) => f(null)); },
  async oturumDinle(f) { dinleyiciler.add(f); return () => dinleyiciler.delete(f); },

  async demoSifirla() { veri = tohumla(); kaydet(); },
};
