// Excel'e aktarma ve Excel'den okuma (ExcelJS). Sadece yönetim panelinde yüklenir.
import ExcelJS from 'exceljs';
import { AYLAR, kdvDahil } from './format.js';

const BASLIK_STIL = {
  font: { bold: true, color: { argb: 'FFFFFFFF' } },
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF12355B' } },
  alignment: { vertical: 'middle' },
};
const TL = '#,##0.00 "₺"';

// Excel sütunları (içe aktarırken başlık adları esnek okunur)
export const SUTUNLAR = [
  { anahtar: 'kod', baslik: 'Kod', genislik: 14, esler: ['kod', 'urun kodu', 'stok kodu', 'barkod'] },
  { anahtar: 'ad', baslik: 'Ürün Adı', genislik: 42, esler: ['urun adi', 'ad', 'urun', 'isim', 'aciklama adi'] },
  { anahtar: 'kategori', baslik: 'Kategori', genislik: 20, esler: ['kategori', 'grup', 'urun grubu'] },
  { anahtar: 'birim', baslik: 'Birim', genislik: 10, esler: ['birim'] },
  { anahtar: 'fiyat', baslik: 'Fiyat (KDV Hariç)', genislik: 18, esler: ['fiyat (kdv haric)', 'fiyat', 'birim fiyat', 'satis fiyati', 'kdv haric fiyat'] },
  { anahtar: 'kdv', baslik: 'KDV %', genislik: 8, esler: ['kdv %', 'kdv', 'kdv orani', 'kdv (%)'] },
  { anahtar: '_kdvDahil', baslik: 'KDV Dahil Fiyat', genislik: 17, esler: ['kdv dahil fiyat', 'kdv dahil'] },
  { anahtar: 'stok', baslik: 'Stok', genislik: 9, esler: ['stok', 'stok adedi', 'miktar', 'adet'] },
  { anahtar: 'aktif', baslik: 'Vitrinde', genislik: 10, esler: ['vitrinde', 'aktif', 'yayinda', 'durum'] },
  { anahtar: 'aciklama', baslik: 'Açıklama', genislik: 40, esler: ['aciklama', 'detay', 'ozellik'] },
  { anahtar: 'resimler', baslik: 'Resim Linkleri', genislik: 40, esler: ['resim linkleri', 'resim', 'resimler', 'foto', 'fotograf'] },
];

const normal = (s) => String(s ?? '').toLocaleLowerCase('tr-TR')
  .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
  .replace(/\s+/g, ' ').trim();

export function indir(blob, dosyaAdi) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = dosyaAdi;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

async function blobYap(wb) {
  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

function basliklariBicimle(ws) {
  ws.getRow(1).eachCell((c) => Object.assign(c, { style: { ...c.style, ...BASLIK_STIL } }));
  ws.getRow(1).height = 24;
  ws.views = [{ state: 'frozen', ySplit: 1 }];
}

function urunSayfasi(wb, urunler) {
  const ws = wb.addWorksheet('Ürünler');
  ws.columns = SUTUNLAR.map((s) => ({ header: s.baslik, key: s.anahtar, width: s.genislik }));
  urunler.forEach((u, i) => {
    const r = i + 2;
    ws.addRow({
      kod: u.kod, ad: u.ad, kategori: u.kategori, birim: u.birim,
      fiyat: Number(u.fiyat), kdv: Number(u.kdv),
      _kdvDahil: { formula: `E${r}*(1+F${r}/100)`, result: kdvDahil(u.fiyat, u.kdv) },
      stok: Number(u.stok), aktif: u.aktif === false ? 'Hayır' : 'Evet',
      aciklama: u.aciklama || '',
      resimler: (u.resimler || []).filter((x) => !String(x).startsWith('demo:') && !String(x).startsWith('data:')).join(' , '),
    });
  });
  ws.getColumn('fiyat').numFmt = TL;
  ws.getColumn('_kdvDahil').numFmt = TL;
  ws.getColumn('_kdvDahil').font = { color: { argb: 'FF5B6878' } };
  basliklariBicimle(ws);
  ws.autoFilter = { from: 'A1', to: `K${Math.max(1, urunler.length + 1)}` };
  return ws;
}

export async function urunleriAktar(urunler, dukkan = 'Hırdavat') {
  const wb = new ExcelJS.Workbook();
  wb.creator = dukkan;
  urunSayfasi(wb, urunler);
  const bilgi = wb.addWorksheet('Nasıl kullanılır');
  [
    ['Bu dosyayı düzenleyip yönetim panelindeki "Excel" sekmesinden geri yükleyebilirsiniz.'],
    ['Eşleştirme "Kod" sütununa göre yapılır: kod varsa ürün güncellenir, yoksa yeni ürün eklenir.'],
    ['"KDV Dahil Fiyat" sütunu sadece bilgi içindir, yüklerken dikkate alınmaz.'],
    ['"Vitrinde" sütununa Hayır yazarsanız ürün vitrinde gizlenir (silinmez).'],
    ['Silmek istediğiniz ürünleri panelden silin; Excel\'den satır silmek ürünü silmez.'],
  ].forEach((r) => bilgi.addRow(r));
  bilgi.getColumn(1).width = 100;
  return blobYap(wb);
}

export async function sablon() {
  const wb = new ExcelJS.Workbook();
  urunSayfasi(wb, [
    { kod: 'VD-0001', ad: 'Örnek: Sunta Vidası 4x40 (1000\'li)', kategori: 'Vida & Dübel', birim: 'Kutu', fiyat: 185, kdv: 20, stok: 100, aktif: true, aciklama: 'Yıldız başlı, sarı galvaniz.' },
    { kod: 'EA-0001', ad: 'Örnek: Çekiç 500 g', kategori: 'El Aletleri', birim: 'Adet', fiyat: 265, kdv: 20, stok: 25, aktif: true, aciklama: '' },
  ]);
  return blobYap(wb);
}

function hucre(v) {
  if (v == null) return '';
  if (v instanceof Date) return v;
  if (typeof v === 'object') {
    if ('result' in v) return hucre(v.result);
    if (v.richText) return v.richText.map((p) => p.text).join('');
    if ('text' in v) return hucre(v.text);
    if (v.hyperlink) return v.hyperlink;
    return '';
  }
  return v;
}

function sayiyaCevir(v) {
  if (typeof v === 'number') return v;
  let s = String(v ?? '').replace(/[₺\s]|TL/gi, '').replace('%', '');
  if (!s) return NaN;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  return Number(s);
}

function evetMi(v) {
  const s = normal(v);
  if (!s) return true;
  return !['hayir', 'h', 'no', 'false', '0', 'pasif', 'gizli', 'yok'].includes(s);
}

// Excel dosyasını okur → { satirlar, hatalar, sutunlar }
export async function excelOku(dosya, mevcutUrunler = []) {
  const wb = new ExcelJS.Workbook();
  const ad = dosya.name.toLowerCase();
  if (ad.endsWith('.csv')) {
    throw new Error('CSV yerine .xlsx dosyası yükleyin (Excel > Farklı Kaydet > Excel Çalışma Kitabı).');
  }
  await wb.xlsx.load(await dosya.arrayBuffer());
  const ws = wb.worksheets.find((w) => normal(w.name) === 'urunler') || wb.worksheets[0];
  if (!ws) throw new Error('Dosyada sayfa bulunamadı.');

  // Başlık satırı: ilk 5 satırda "kod" geçen satır
  let baslikSatir = 1;
  for (let r = 1; r <= Math.min(5, ws.rowCount); r++) {
    const degerler = ws.getRow(r).values.map((v) => normal(hucre(v)));
    if (degerler.some((d) => d === 'kod' || d.includes('urun kodu') || d === 'stok kodu')) { baslikSatir = r; break; }
  }
  const harita = {};
  ws.getRow(baslikSatir).eachCell((c, col) => {
    const b = normal(hucre(c.value));
    const s = SUTUNLAR.find((x) => x.esler.includes(b));
    if (s && !(s.anahtar in harita)) harita[s.anahtar] = col;
  });
  if (!harita.kod) throw new Error('"Kod" sütunu bulunamadı. Lütfen şablonu indirip onun başlıklarını kullanın.');

  const mevcut = new Map(mevcutUrunler.map((u) => [u.kod, u]));
  const sutunlar = Object.keys(harita).filter((k) => !k.startsWith('_'));
  const satirlar = [];
  const hatalar = [];
  const gorulen = new Set();

  for (let r = baslikSatir + 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const al = (k) => (harita[k] ? hucre(row.getCell(harita[k]).value) : undefined);
    const kod = String(al('kod') ?? '').trim();
    const bosMu = sutunlar.every((k) => String(al(k) ?? '').trim() === '');
    if (bosMu) continue;
    if (!kod) { hatalar.push({ satir: r, mesaj: 'Kod boş' }); continue; }
    if (gorulen.has(kod)) { hatalar.push({ satir: r, kod, mesaj: 'Bu kod dosyada iki kez var' }); continue; }
    gorulen.add(kod);

    const u = { kod };
    if (harita.ad) { const v = String(al('ad') ?? '').trim(); if (v) u.ad = v; }
    if (harita.kategori) { const v = String(al('kategori') ?? '').trim(); if (v) u.kategori = v; }
    if (harita.birim) { const v = String(al('birim') ?? '').trim(); if (v) u.birim = v; }
    if (harita.aciklama) u.aciklama = String(al('aciklama') ?? '').trim();
    if (harita.aktif) u.aktif = evetMi(al('aktif'));
    for (const k of ['fiyat', 'kdv', 'stok']) {
      if (!harita[k]) continue;
      const ham = al(k);
      if (String(ham ?? '').trim() === '') continue;
      const n = sayiyaCevir(ham);
      if (Number.isNaN(n) || n < 0) { hatalar.push({ satir: r, kod, mesaj: `${k === 'fiyat' ? 'Fiyat' : k === 'kdv' ? 'KDV' : 'Stok'} sayı değil: "${ham}"` }); u._hata = true; break; }
      u[k] = k === 'fiyat' ? Math.round(n * 100) / 100 : Math.round(n);
    }
    if (u._hata) continue;
    if (harita.resimler) {
      const linkler = String(al('resimler') ?? '').split(/[\s,;]+/).filter((x) => /^https?:\/\//i.test(x));
      if (linkler.length) u.resimler = linkler;
    }

    const eski = mevcut.get(kod);
    if (!eski && !u.ad) { hatalar.push({ satir: r, kod, mesaj: 'Yeni ürün ama "Ürün Adı" boş' }); continue; }
    const degisen = eski
      ? Object.keys(u).filter((k) => k !== 'kod' && JSON.stringify(u[k] ?? '') !== JSON.stringify((k === 'fiyat' ? Number(eski[k]) : eski[k]) ?? ''))
      : [];
    satirlar.push({ veri: u, satir: r, yeni: !eski, degisen, eski });
  }
  return { satirlar, hatalar, sutunlar };
}

export async function ayRaporu({ ist, yil, ay, dukkan }) {
  const wb = new ExcelJS.Workbook();
  wb.creator = dukkan;
  const ad = `${AYLAR[ay - 1]} ${yil}`;

  const oz = wb.addWorksheet('Özet');
  oz.columns = [{ header: `${dukkan} · ${ad} raporu`, key: 'a', width: 34 }, { header: '', key: 'b', width: 20 }, { header: 'Önceki ay', key: 'c', width: 16 }];
  const o = ist.ozet, p = ist.onceki;
  [
    ['Tekil ziyaretçi', o.ziyaretci, p.ziyaretci],
    ['Ürün görüntüleme', o.goruntuleme, p.goruntuleme],
    ['"Al" tıklaması', o.al_tik, p.al_tik],
    ['Al oranı (Al / görüntüleme)', o.goruntuleme ? o.al_tik / o.goruntuleme : 0, p.goruntuleme ? p.al_tik / p.goruntuleme : 0],
    ['Satış sayısı', o.satis_sayisi, p.satis_sayisi],
    ['Satılan adet', o.satis_adet, p.satis_adet],
    ['Ciro (KDV dahil)', Number(o.ciro), Number(p.ciro)],
  ].forEach((r) => oz.addRow(r));
  oz.getCell('B5').numFmt = '0.0%'; oz.getCell('C5').numFmt = '0.0%';
  oz.getCell('B8').numFmt = TL; oz.getCell('C8').numFmt = TL;
  basliklariBicimle(oz);

  const g = wb.addWorksheet('Günlük');
  g.columns = [
    { header: 'Gün', key: 'gun', width: 12 }, { header: 'Ziyaretçi', key: 'ziyaretci', width: 12 },
    { header: 'Görüntüleme', key: 'goruntuleme', width: 13 }, { header: 'Al tık', key: 'al_tik', width: 10 },
    { header: 'Satılan adet', key: 'satis_adet', width: 13 }, { header: 'Ciro (KDV dahil)', key: 'ciro', width: 18 },
  ];
  ist.gunluk.forEach((d) => g.addRow({ ...d, gun: `${d.gun} ${AYLAR[ay - 1]}`, ciro: Number(d.ciro) }));
  g.getColumn('ciro').numFmt = TL;
  basliklariBicimle(g);

  const u = wb.addWorksheet('Ürünler');
  u.columns = [
    { header: 'Kod', key: 'kod', width: 12 }, { header: 'Ürün', key: 'ad', width: 40 }, { header: 'Kategori', key: 'kategori', width: 18 },
    { header: 'Görüntüleme', key: 'goruntuleme', width: 13 }, { header: 'Al tık', key: 'al_tik', width: 10 },
    { header: 'Al oranı', key: 'oran', width: 10 }, { header: 'Satılan adet', key: 'satis_adet', width: 13 },
    { header: 'Ciro (KDV dahil)', key: 'ciro', width: 18 },
  ];
  [...ist.urunler].sort((a, b) => b.ciro - a.ciro || b.goruntuleme - a.goruntuleme)
    .forEach((r) => u.addRow({ ...r, ciro: Number(r.ciro), oran: r.goruntuleme ? r.al_tik / r.goruntuleme : 0 }));
  u.getColumn('oran').numFmt = '0.0%';
  u.getColumn('ciro').numFmt = TL;
  basliklariBicimle(u);

  return blobYap(wb);
}

export async function satisListesi(satislar, baslik) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Satışlar');
  ws.columns = [
    { header: 'Tarih', key: 'zaman', width: 18 }, { header: 'Kod', key: 'kod', width: 12 }, { header: 'Ürün', key: 'ad', width: 40 },
    { header: 'Müşteri', key: 'musteri', width: 24 }, { header: 'Adet', key: 'adet', width: 8 },
    { header: 'Birim fiyat (KDV hariç)', key: 'birim_fiyat', width: 20 }, { header: 'KDV %', key: 'kdv', width: 8 },
    { header: 'Toplam (KDV dahil)', key: 'toplam', width: 18 },
  ];
  satislar.forEach((s) => ws.addRow({
    zaman: new Date(s.zaman), kod: s.urun?.kod || '', ad: s.urun?.ad || '(silinmiş ürün)', musteri: s.musteri,
    adet: s.adet, birim_fiyat: Number(s.birim_fiyat), kdv: s.kdv, toplam: kdvDahil(s.birim_fiyat * s.adet, s.kdv),
  }));
  ws.getColumn('zaman').numFmt = 'dd.mm.yyyy hh:mm';
  ws.getColumn('birim_fiyat').numFmt = TL;
  ws.getColumn('toplam').numFmt = TL;
  basliklariBicimle(ws);
  ws.addRow({});
  const t = ws.addRow({ ad: baslik ? `${baslik} toplamı` : 'Toplam', adet: satislar.reduce((a, s) => a + s.adet, 0), toplam: satislar.reduce((a, s) => a + kdvDahil(s.birim_fiyat * s.adet, s.kdv), 0) });
  t.font = { bold: true };
  return blobYap(wb);
}
