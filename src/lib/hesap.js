// Ham olay ve satış kayıtlarından aylık istatistik çıkarır.
// Supabase tarafında aynı işi SQL'deki ay_istatistik() fonksiyonu yapar; demo modu bunu kullanır.
import { kdvDahil } from './format.js';

const ayIcinde = (zaman, yil, ay) => {
  const d = new Date(zaman);
  return d.getFullYear() === yil && d.getMonth() + 1 === ay;
};

function ozetCikar(olaylar, satislar) {
  const ziyaretciler = new Set(olaylar.map((o) => o.ziyaretci));
  return {
    ziyaretci: ziyaretciler.size,
    goruntuleme: olaylar.filter((o) => o.tur === 'goruntuleme').length,
    al_tik: olaylar.filter((o) => o.tur === 'al_tik').length,
    satis_adet: satislar.reduce((t, s) => t + Number(s.adet), 0),
    satis_sayisi: satislar.length,
    ciro: satislar.reduce((t, s) => t + kdvDahil(s.birim_fiyat * s.adet, s.kdv), 0),
  };
}

export function ayIstatistik({ urunler, olaylar, satislar }, yil, ay) {
  const o = olaylar.filter((x) => ayIcinde(x.zaman, yil, ay));
  const s = satislar.filter((x) => ayIcinde(x.zaman, yil, ay));
  const oncekiYil = ay === 1 ? yil - 1 : yil;
  const oncekiAy = ay === 1 ? 12 : ay - 1;
  const oo = olaylar.filter((x) => ayIcinde(x.zaman, oncekiYil, oncekiAy));
  const os = satislar.filter((x) => ayIcinde(x.zaman, oncekiYil, oncekiAy));

  const gunSayisi = new Date(yil, ay, 0).getDate();
  const gunluk = Array.from({ length: gunSayisi }, (_, i) => {
    const gun = i + 1;
    const go = o.filter((x) => new Date(x.zaman).getDate() === gun);
    const gs = s.filter((x) => new Date(x.zaman).getDate() === gun);
    const oz = ozetCikar(go, gs);
    return { gun, ziyaretci: oz.ziyaretci, goruntuleme: oz.goruntuleme, al_tik: oz.al_tik, satis_adet: oz.satis_adet, ciro: oz.ciro };
  });

  const urunTablo = urunler
    .map((u) => {
      const uo = o.filter((x) => x.urun_id === u.id);
      const us = s.filter((x) => x.urun_id === u.id);
      return {
        urun_id: u.id, ad: u.ad, kod: u.kod, kategori: u.kategori,
        goruntuleme: uo.filter((x) => x.tur === 'goruntuleme').length,
        al_tik: uo.filter((x) => x.tur === 'al_tik').length,
        satis_adet: us.reduce((t, x) => t + Number(x.adet), 0),
        ciro: us.reduce((t, x) => t + kdvDahil(x.birim_fiyat * x.adet, x.kdv), 0),
      };
    })
    .filter((r) => r.goruntuleme || r.al_tik || r.satis_adet);

  return { gunluk, urunler: urunTablo, ozet: ozetCikar(o, s), onceki: ozetCikar(oo, os) };
}

export function vitrinIstatistik({ urunler, olaylar }) {
  const bugun = new Date();
  const ayni = (a, b) => a.toDateString() === b.toDateString();
  const otuzGun = Date.now() - 30 * 864e5;
  const say = (liste) => new Set(liste.map((x) => x.ziyaretci)).size;
  const ziyaretler = olaylar.filter((x) => x.tur === 'ziyaret');
  const tik = {};
  olaylar
    .filter((x) => x.tur === 'goruntuleme' && new Date(x.zaman) >= otuzGun)
    .forEach((x) => { tik[x.urun_id] = (tik[x.urun_id] || 0) + 1; });
  const aktif = new Map(urunler.filter((u) => u.aktif).map((u) => [u.id, u]));
  const en_cok = Object.entries(tik)
    .map(([id, sayi]) => ({ id: Number(id), sayi, ad: aktif.get(Number(id))?.ad }))
    .filter((x) => x.ad)
    .sort((a, b) => b.sayi - a.sayi)
    .slice(0, 5);
  return {
    bugun: say(ziyaretler.filter((x) => ayni(new Date(x.zaman), bugun))),
    bu_ay: say(ziyaretler.filter((x) => {
      const d = new Date(x.zaman);
      return d.getMonth() === bugun.getMonth() && d.getFullYear() === bugun.getFullYear();
    })),
    toplam: say(ziyaretler),
    en_cok,
  };
}

export function cokSatanlar({ urunler, satislar }, n = 8) {
  const sinir = Date.now() - 90 * 864e5;
  const adet = {};
  satislar
    .filter((s) => new Date(s.zaman) >= sinir)
    .forEach((s) => { adet[s.urun_id] = (adet[s.urun_id] || 0) + Number(s.adet); });
  return urunler
    .filter((u) => u.aktif && adet[u.id])
    .map((u) => ({ ...u, satilan: adet[u.id] }))
    .sort((a, b) => b.satilan - a.satilan)
    .slice(0, n);
}
