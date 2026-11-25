import React, { useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { tl, sayi } from '../lib/format.js';

const ALAN_ADI = { ad: 'ad', kategori: 'kategori', birim: 'birim', fiyat: 'fiyat', kdv: 'KDV', stok: 'stok', aktif: 'vitrin', aciklama: 'açıklama', resimler: 'resim' };
const tarihEki = () => new Date().toISOString().slice(0, 10);

export default function Excel({ urunler, ayarlar, yenile, bildir }) {
  const [onizleme, setOnizleme] = useState(null);
  const [hata, setHata] = useState('');
  const [ustunde, setUstunde] = useState(false);
  const [bekliyor, setBekliyor] = useState(false);
  const [sonuc, setSonuc] = useState(null);
  const dosyaRef = useRef(null);

  const excelModul = () => import('../lib/excel.js');

  const aktar = async () => {
    try {
      const { urunleriAktar, indir } = await excelModul();
      indir(await urunleriAktar(urunler || [], ayarlar.dukkan_adi), `urunler-${tarihEki()}.xlsx`);
      bildir('Excel dosyası indirildi');
    } catch (e) { bildir(`İndirilemedi: ${e.message}`); }
  };

  const sablonIndir = async () => {
    try {
      const { sablon, indir } = await excelModul();
      indir(await sablon(), 'urun-sablonu.xlsx');
    } catch (e) { bildir(e.message); }
  };

  const oku = async (dosya) => {
    if (!dosya) return;
    setHata(''); setSonuc(null); setOnizleme(null);
    try {
      const { excelOku } = await excelModul();
      const s = await excelOku(dosya, urunler || []);
      if (!s.satirlar.length && !s.hatalar.length) throw new Error('Dosyada ürün satırı bulunamadı.');
      setOnizleme({ ...s, dosya: dosya.name });
    } catch (e) {
      setHata(e.message);
    }
  };

  const iceAktar = async () => {
    const gonder = onizleme.satirlar.filter((s) => s.yeni || s.degisen.length).map((s) => s.veri);
    if (!gonder.length) { bildir('Değişen ürün yok'); return; }
    setBekliyor(true);
    try {
      const r = await api.topluKaydet(gonder);
      setSonuc(r);
      setOnizleme(null);
      await yenile();
    } catch (e) {
      setHata(e.message);
    } finally {
      setBekliyor(false);
    }
  };

  const yeniSay = onizleme?.satirlar.filter((s) => s.yeni).length || 0;
  const guncelSay = onizleme?.satirlar.filter((s) => !s.yeni && s.degisen.length).length || 0;
  const ayniSay = onizleme?.satirlar.filter((s) => !s.yeni && !s.degisen.length).length || 0;

  return (
    <>
      <section className="kutu">
        <div className="kutu-bas">
          <div>
            <h2>Excel'de görüntüle</h2>
            <p>Bütün ürünlerinizi Excel dosyası olarak indirin; fiyat, stok, KDV ve resim linkleriyle birlikte.</p>
          </div>
          <div className="arac">
            <button className="btn btn-ana" onClick={aktar} disabled={!urunler}>Ürünleri Excel'e indir ({sayi(urunler?.length)})</button>
            <button className="btn" onClick={sablonIndir}>Boş şablon indir</button>
          </div>
        </div>
      </section>

      <section className="kutu">
        <h2>Excel'den içeri aktar</h2>
        <ol className="adimlar" style={{ margin: '6px 0 16px' }}>
          <li>Yukarıdan ürün listesini veya boş şablonu indirin.</li>
          <li>Excel'de yeni satır ekleyin ya da fiyat/stok değiştirin, kaydedin.</li>
          <li>Dosyayı aşağıya sürükleyin. Önizlemeyi kontrol edip <b>İçeri aktar</b>'a basın.</li>
        </ol>
        <p className="not" style={{ marginBottom: 14 }}>
          Eşleştirme <b>Kod</b> sütununa göre: kod sitede varsa ürün güncellenir, yoksa yeni ürün eklenir. Boş bıraktığınız hücreler mevcut bilgiyi silmez.
        </p>

        <label
          className={`surukle ${ustunde ? 'ustunde' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setUstunde(true); }}
          onDragLeave={() => setUstunde(false)}
          onDrop={(e) => { e.preventDefault(); setUstunde(false); oku(e.dataTransfer.files[0]); }}
        >
          <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#1a8f4c" strokeWidth="1.8" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8l4 6M12 8l-4 6M14 9h3M14 13h3M8 17h9" /></svg>
          <b>Excel dosyasını buraya sürükleyin</b>
          <span className="not">ya da tıklayıp seçin (.xlsx)</span>
          <input ref={dosyaRef} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(e) => { oku(e.target.files[0]); e.target.value = ''; }} />
        </label>

        {hata && <div className="hata" style={{ marginTop: 14 }}>{hata}</div>}
        {sonuc && <div className="basari" style={{ marginTop: 14 }}>Tamamlandı: {sonuc.eklenen} yeni ürün eklendi, {sonuc.guncellenen} ürün güncellendi.</div>}

        {onizleme && (
          <div style={{ marginTop: 18, display: 'grid', gap: 12 }}>
            <div className="kutu-bas" style={{ margin: 0 }}>
              <div>
                <h3 style={{ margin: 0 }}>Önizleme: {onizleme.dosya}</h3>
                <p>
                  <span className="yeni">{yeniSay} yeni</span> · <span className="guncel">{guncelSay} güncellenecek</span> · {ayniSay} değişmemiş
                  {onizleme.hatalar.length > 0 && <> · <span style={{ color: 'var(--kirmizi)', fontWeight: 700 }}>{onizleme.hatalar.length} hatalı satır atlanacak</span></>}
                </p>
              </div>
              <div className="arac">
                <button className="btn" onClick={() => setOnizleme(null)}>Vazgeç</button>
                <button className="btn btn-al" onClick={iceAktar} disabled={bekliyor || !(yeniSay + guncelSay)}>
                  {bekliyor ? 'Aktarılıyor…' : `İçeri aktar (${yeniSay + guncelSay})`}
                </button>
              </div>
            </div>

            {onizleme.hatalar.length > 0 && (
              <div className="hata">
                {onizleme.hatalar.slice(0, 8).map((h, i) => <div key={i}>Satır {h.satir}{h.kod ? ` (${h.kod})` : ''}: {h.mesaj}</div>)}
                {onizleme.hatalar.length > 8 && <div>… ve {onizleme.hatalar.length - 8} hata daha</div>}
              </div>
            )}

            <div className="tablo-kap" style={{ maxHeight: 420, overflowY: 'auto' }}>
              <table className="stack">
                <thead><tr><th>Durum</th><th>Kod</th><th>Ürün</th><th className="sag">Fiyat</th><th className="sag">Stok</th><th>Değişen</th></tr></thead>
                <tbody>
                  {onizleme.satirlar.filter((s) => s.yeni || s.degisen.length).map((s) => (
                    <tr key={s.veri.kod}>
                      <td data-l="Durum">{s.yeni ? <span className="yeni">Yeni</span> : <span className="guncel">Güncelle</span>}</td>
                      <td data-l="Kod"><span className="kod">{s.veri.kod}</span></td>
                      <td data-l="Ürün">{s.veri.ad || s.eski?.ad}</td>
                      <td data-l="Fiyat" className="sag">
                        {s.eski && s.degisen.includes('fiyat') && <s style={{ color: 'var(--soluk)', marginRight: 6 }}>{tl(s.eski.fiyat)}</s>}
                        {tl(s.veri.fiyat ?? s.eski?.fiyat)}
                      </td>
                      <td data-l="Stok" className="sag">
                        {s.eski && s.degisen.includes('stok') && <s style={{ color: 'var(--soluk)', marginRight: 6 }}>{sayi(s.eski.stok)}</s>}
                        {sayi(s.veri.stok ?? s.eski?.stok)}
                      </td>
                      <td data-l="Değişen">{s.yeni ? '—' : s.degisen.map((k) => ALAN_ADI[k] || k).join(', ')}</td>
                    </tr>
                  ))}
                  {yeniSay + guncelSay === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--soluk)' }}>Dosyadaki ürünler sitedekiyle aynı, değişiklik yok.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
