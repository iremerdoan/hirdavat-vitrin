import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';
import { AYLAR, tl, sayi, kdvDahil, tarihSaat } from '../lib/format.js';

// Satışlar WhatsApp'ta konuşulup kesinleşiyor; dükkan sahibi buraya girer,
// stok otomatik düşer ve aylık istatistiklere yansır.
export default function Satislar({ urunler, yenile, bildir }) {
  const bugun = new Date();
  const [yil, setYil] = useState(bugun.getFullYear());
  const [ay, setAy] = useState(bugun.getMonth() + 1);
  const [liste, setListe] = useState(null);
  const [urunMetin, setUrunMetin] = useState('');
  const [adet, setAdet] = useState(1);
  const [fiyat, setFiyat] = useState('');
  const [musteri, setMusteri] = useState('');
  const [stokDus, setStokDus] = useState(true);
  const [hata, setHata] = useState('');
  const [silinecek, setSilinecek] = useState(null);

  const yukle = () => api.satislar(yil, ay).then(setListe).catch((e) => bildir(e.message));
  useEffect(() => { setListe(null); yukle(); }, [yil, ay]);

  const secenekler = useMemo(() => (urunler || []).map((u) => ({ u, etiket: `${u.kod} — ${u.ad}` })), [urunler]);
  const secili = secenekler.find((s) => s.etiket === urunMetin)?.u;
  const musteriler = useMemo(() => [...new Set((liste || []).map((s) => s.musteri).filter(Boolean))], [liste]);

  useEffect(() => { if (secili) setFiyat(String(secili.fiyat)); }, [secili?.id]);

  const fiyatSayi = Number(String(fiyat).replace(',', '.')) || 0;
  const satirToplam = secili ? kdvDahil(fiyatSayi * (Number(adet) || 0), secili.kdv) : 0;

  const ekle = async (e) => {
    e.preventDefault();
    setHata('');
    if (!secili) return setHata('Listeden bir ürün seçin (kod veya ad yazmaya başlayın).');
    if (!(Number(adet) > 0)) return setHata('Adet 1 veya daha fazla olmalı.');
    try {
      await api.satisEkle({ urun_id: secili.id, adet: Number(adet), birim_fiyat: fiyatSayi, musteri: musteri.trim(), stoktan_dus: stokDus });
      bildir(`Satış kaydedildi: ${adet} × ${secili.ad}`);
      setUrunMetin(''); setAdet(1); setFiyat('');
      setYil(bugun.getFullYear()); setAy(bugun.getMonth() + 1);
      await Promise.all([yukle(), yenile()]);
    } catch (err) { setHata(err.message); }
  };

  const sil = async (s) => {
    if (silinecek !== s.id) return setSilinecek(s.id);
    try {
      await api.satisSil(s.id, true);
      bildir('Satış silindi, stok geri eklendi');
      setSilinecek(null);
      await Promise.all([yukle(), yenile()]);
    } catch (err) { bildir(err.message); }
  };

  const excel = async () => {
    try {
      const { satisListesi, indir } = await import('../lib/excel.js');
      indir(await satisListesi(liste, `${AYLAR[ay - 1]} ${yil}`), `satislar-${yil}-${String(ay).padStart(2, '0')}.xlsx`);
    } catch (e) { bildir(e.message); }
  };

  const toplam = (liste || []).reduce((a, s) => a + kdvDahil(s.birim_fiyat * s.adet, s.kdv), 0);

  return (
    <>
      <section className="kutu">
        <h2>Satış gir</h2>
        <p style={{ margin: '0 0 14px', color: 'var(--soluk)' }}>WhatsApp'ta kesinleşen siparişi buraya yazın. Stok düşer, satış istatistiklere ve "en çok satanlar"a yansır.</p>
        <form className="form" onSubmit={ekle}>
          <label className="alan">
            <span>Ürün</span>
            <input list="satis-urunleri" value={urunMetin} onChange={(e) => setUrunMetin(e.target.value)} placeholder="Kod veya ürün adı yazın…" />
            <datalist id="satis-urunleri">{secenekler.map((s) => <option key={s.u.id} value={s.etiket} />)}</datalist>
            {secili && <small>Stokta {sayi(secili.stok)} {secili.birim} · KDV %{secili.kdv}</small>}
          </label>
          <div className="form-iki">
            <label className="alan"><span>Adet</span><input type="number" min="1" inputMode="numeric" value={adet} onChange={(e) => setAdet(e.target.value)} /></label>
            <label className="alan"><span>Birim fiyat (KDV hariç)</span><input inputMode="decimal" value={fiyat} onChange={(e) => setFiyat(e.target.value)} placeholder="Ürün seçince dolar" /></label>
            <label className="alan">
              <span>Müşteri (dükkan adı)</span>
              <input list="musteri-listesi" value={musteri} onChange={(e) => setMusteri(e.target.value)} placeholder="İsteğe bağlı" />
              <datalist id="musteri-listesi">{musteriler.map((m) => <option key={m} value={m} />)}</datalist>
            </label>
          </div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <label className="anahtar"><input type="checkbox" checked={stokDus} onChange={(e) => setStokDus(e.target.checked)} /> Stoktan düş</label>
            <div className="arac">
              {secili && <span>Toplam (KDV dahil): <b>{tl(satirToplam)}</b></span>}
              <button className="btn btn-ana">Satışı kaydet</button>
            </div>
          </div>
          {hata && <div className="hata">{hata}</div>}
        </form>
      </section>

      <section className="kutu">
        <div className="kutu-bas">
          <div>
            <h2>{AYLAR[ay - 1]} {yil} satışları</h2>
            <p>{liste ? `${liste.length} satış · ${tl(toplam)} (KDV dahil)` : 'Yükleniyor…'}</p>
          </div>
          <div className="arac">
            <select className="secim" style={{ minHeight: 44 }} value={`${yil}-${ay}`} onChange={(e) => { const [y, a] = e.target.value.split('-').map(Number); setYil(y); setAy(a); }} aria-label="Ay seç">
              {Array.from({ length: 24 }, (_, i) => new Date(bugun.getFullYear(), bugun.getMonth() - i, 1)).map((d) => (
                <option key={d.toISOString()} value={`${d.getFullYear()}-${d.getMonth() + 1}`}>{AYLAR[d.getMonth()]} {d.getFullYear()}</option>
              ))}
            </select>
            <button className="btn" onClick={excel} disabled={!liste?.length}>Excel'e indir</button>
          </div>
        </div>
        <div className="tablo-kap" style={{ maxHeight: 560, overflowY: 'auto' }}>
          <table className="stack">
            <thead>
              <tr><th>Tarih</th><th>Ürün</th><th>Müşteri</th><th className="sag">Adet</th><th className="sag">Toplam</th><th></th></tr>
            </thead>
            <tbody>
              {liste?.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--soluk)', padding: 30 }}>Bu ay satış girilmemiş.</td></tr>}
              {(liste || []).map((s) => (
                <tr key={s.id}>
                  <td data-l="Tarih" style={{ whiteSpace: 'nowrap' }}>{tarihSaat(s.zaman)}</td>
                  <td data-l="Ürün">{s.urun?.ad || <i>silinmiş ürün</i>}<br /><small style={{ color: 'var(--soluk)' }}>{s.urun?.kod} · {tl(s.birim_fiyat)} + KDV</small></td>
                  <td data-l="Müşteri">{s.musteri}</td>
                  <td data-l="Adet" className="sag">{sayi(s.adet)}</td>
                  <td data-l="Toplam" className="sag">{tl(kdvDahil(s.birim_fiyat * s.adet, s.kdv))}</td>
                  <td className="sag">
                    <button className="btn btn-kucuk btn-tehlike" onClick={() => sil(s)} onBlur={() => setSilinecek(null)}>
                      {silinecek === s.id ? 'Emin misiniz?' : 'Sil'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
