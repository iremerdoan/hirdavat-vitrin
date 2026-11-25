// GERÇEK veri katmanı: Supabase (veritabanı + giriş + fotoğraf depolama).
// Tablolar ve fonksiyonlar supabase/schema.sql dosyasında.
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { ziyaretciId } from './ziyaretci.js';

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const BUCKET = 'urun-resimleri';

function kontrol({ data, error }) {
  if (error) {
    if (error.code === '23505') throw new Error('Bu ürün kodu zaten kullanılıyor.');
    throw new Error(error.message);
  }
  return data;
}

const URUN_ALANLARI = ['kod', 'ad', 'kategori', 'birim', 'fiyat', 'kdv', 'stok', 'aktif', 'aciklama', 'resimler'];
const temizle = (u) => Object.fromEntries(Object.entries(u).filter(([k]) => URUN_ALANLARI.includes(k)));

const ayAraligi = (yil, ay) => [
  new Date(yil, ay - 1, 1).toISOString(),
  new Date(yil, ay, 1).toISOString(),
];

export default {
  demo: false,

  async ayarlar() {
    return kontrol(await sb.from('ayarlar').select('*').eq('id', 1).maybeSingle()) || {};
  },
  async ayarKaydet(a) {
    const { id, ...geri } = a;
    kontrol(await sb.from('ayarlar').upsert({ ...geri, id: 1 }));
  },

  async urunler({ hepsi = false } = {}) {
    let q = sb.from('urunler').select('*').order('ad');
    if (!hepsi) q = q.eq('aktif', true);
    return kontrol(await q);
  },

  async urunKaydet(u) {
    const satir = temizle({ ...u, kod: String(u.kod || '').trim() });
    if (!satir.kod) throw new Error('Ürün kodu boş olamaz.');
    if (u.id) return kontrol(await sb.from('urunler').update(satir).eq('id', u.id).select().single());
    return kontrol(await sb.from('urunler').insert(satir).select().single());
  },

  async urunSil(id) {
    kontrol(await sb.from('urunler').delete().eq('id', id));
  },

  async topluKaydet(satirlar) {
    const kodlar = satirlar.map((s) => s.kod);
    const mevcut = kontrol(await sb.from('urunler').select('kod').in('kod', kodlar)) || [];
    const varolan = new Set(mevcut.map((m) => m.kod));
    // Aynı sütunlara sahip satırları birlikte gönder (boş bırakılan sütun mevcut değeri silmesin),
    // her grubu da 500'erli parçalara böl
    const gruplar = {};
    satirlar.map(temizle).forEach((s) => {
      const anahtar = Object.keys(s).sort().join(',');
      (gruplar[anahtar] ||= []).push(s);
    });
    for (const grup of Object.values(gruplar)) {
      for (let i = 0; i < grup.length; i += 500) {
        kontrol(await sb.from('urunler').upsert(grup.slice(i, i + 500), { onConflict: 'kod', defaultToNull: false }));
      }
    }
    const guncellenen = satirlar.filter((s) => varolan.has(s.kod)).length;
    return { eklenen: satirlar.length - guncellenen, guncellenen };
  },

  async resimYukle(blob) {
    const ad = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    kontrol(await sb.storage.from(BUCKET).upload(ad, blob, { contentType: 'image/jpeg', cacheControl: '31536000' }));
    return sb.storage.from(BUCKET).getPublicUrl(ad).data.publicUrl;
  },

  async olay(tur, urunId = null) {
    // Ziyaretçi takibi hata verirse vitrini bozmasın
    try { await sb.from('olaylar').insert({ tur, urun_id: urunId, ziyaretci: ziyaretciId() }); } catch { /* yok say */ }
  },

  async vitrinIstatistik() {
    return kontrol(await sb.rpc('vitrin_istatistik'));
  },
  async cokSatanlar(n = 8) {
    return kontrol(await sb.rpc('cok_satanlar', { n })) || [];
  },

  async satislar(yil, ay) {
    const [bas, son] = ayAraligi(yil, ay);
    return kontrol(await sb.from('satislar').select('*, urun:urunler(ad, kod)').gte('zaman', bas).lt('zaman', son).order('zaman', { ascending: false }));
  },
  async satisEkle({ urun_id, adet, birim_fiyat, musteri, stoktan_dus = true }) {
    kontrol(await sb.rpc('satis_ekle', { p_urun_id: urun_id, p_adet: Number(adet), p_birim_fiyat: Number(birim_fiyat), p_musteri: musteri || '', p_stoktan_dus: stoktan_dus }));
  },
  async satisSil(id, stokIade = true) {
    kontrol(await sb.rpc('satis_sil', { p_id: id, p_stok_iade: stokIade }));
  },

  async ayIstatistik(yil, ay) {
    return kontrol(await sb.rpc('ay_istatistik', { p_yil: yil, p_ay: ay }));
  },

  async oturum() { return (await sb.auth.getSession()).data.session; },
  async giris(eposta, sifre) {
    const { data, error } = await sb.auth.signInWithPassword({ email: eposta.trim(), password: sifre });
    if (error) throw new Error(error.message === 'Invalid login credentials' ? 'E-posta veya şifre hatalı.' : error.message);
    return data.session;
  },
  async cikis() { await sb.auth.signOut(); },
  async oturumDinle(f) {
    const { data } = sb.auth.onAuthStateChange((_e, s) => f(s));
    return () => data.subscription.unsubscribe();
  },

  async demoSifirla() {},
};
