import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { DEMO } from '../lib/config.js';
import { tl, trKucuk, whatsappLink } from '../lib/format.js';
import { resimKaynak } from '../lib/gorseller.js';
import { bugunIlkZiyaretMi } from '../lib/ziyaretci.js';
import { AraIkon, Logo, Ok, WhatsappIkon } from '../ikonlar.jsx';
import UrunSatir from './UrunSatir.jsx';
import UrunDetay from './UrunDetay.jsx';
import AltBilgi from './AltBilgi.jsx';

const SAYFA = 40;

const SIRALAMALAR = {
  onerilen: { ad: 'Önerilen', f: (a, b) => (b.stok > 0) - (a.stok > 0) || a.ad.localeCompare(b.ad, 'tr') },
  ad: { ad: 'Ada göre (A-Z)', f: (a, b) => a.ad.localeCompare(b.ad, 'tr') },
  ucuz: { ad: 'Fiyat: düşükten yükseğe', f: (a, b) => a.fiyat - b.fiyat },
  pahali: { ad: 'Fiyat: yüksekten düşüğe', f: (a, b) => b.fiyat - a.fiyat },
  stok: { ad: 'Stok: çoktan aza', f: (a, b) => b.stok - a.stok },
};

export default function Vitrin({ hash }) {
  const [ayarlar, setAyarlar] = useState(null);
  const [urunler, setUrunler] = useState(null);
  const [cokSatan, setCokSatan] = useState([]);
  const [ist, setIst] = useState(null);
  const [hata, setHata] = useState('');
  const [arama, setArama] = useState('');
  const [kategori, setKategori] = useState('Tümü');
  const [sirala, setSirala] = useState('onerilen');
  const [stoktakiler, setStoktakiler] = useState(false);
  const [goster, setGoster] = useState(SAYFA);
  const seritRef = useRef(null);
  const katalogRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        if (bugunIlkZiyaretMi()) await api.olay('ziyaret');
        const [a, u, c, i] = await Promise.all([api.ayarlar(), api.urunler(), api.cokSatanlar(10), api.vitrinIstatistik()]);
        setAyarlar(a); setUrunler(u); setCokSatan(c); setIst(i);
        if (a?.dukkan_adi) document.title = `${a.dukkan_adi} · Toptan Vitrin`;
      } catch (e) {
        setHata(e.message || 'Bağlantı hatası');
      }
    })();
    // Alt bilgideki sayaç dakikada bir yenilenir
    const t = setInterval(() => api.vitrinIstatistik().then(setIst).catch(() => {}), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => setGoster(SAYFA), [arama, kategori, sirala, stoktakiler]);

  const kategoriler = useMemo(() => {
    const say = {};
    (urunler || []).forEach((u) => { say[u.kategori || 'Genel'] = (say[u.kategori || 'Genel'] || 0) + 1; });
    return [['Tümü', urunler?.length || 0], ...Object.entries(say).sort((a, b) => a[0].localeCompare(b[0], 'tr'))];
  }, [urunler]);

  const liste = useMemo(() => {
    if (!urunler) return [];
    const q = trKucuk(arama).trim().split(/\s+/).filter(Boolean);
    return urunler
      .filter((u) => kategori === 'Tümü' || (u.kategori || 'Genel') === kategori)
      .filter((u) => !stoktakiler || u.stok > 0)
      .filter((u) => {
        if (!q.length) return true;
        const metin = trKucuk(`${u.ad} ${u.kod} ${u.kategori} ${u.aciklama}`);
        return q.every((k) => metin.includes(k));
      })
      .sort(SIRALAMALAR[sirala].f);
  }, [urunler, arama, kategori, sirala, stoktakiler]);

  const ac = useCallback((id) => { window.location.hash = `urun-${id}`; }, []);
  const kapat = useCallback(() => {
    if (window.history.state?.vitrinIci) window.history.back();
    else window.location.hash = '';
  }, []);

  const acikId = hash.startsWith('urun-') ? Number(hash.slice(5)) : null;
  const acikUrun = acikId ? urunler?.find((u) => u.id === acikId) || cokSatan.find((u) => u.id === acikId) : null;
  const telefon = ayarlar?.whatsapp || '';

  const seritKaydir = (yon) => seritRef.current?.scrollBy({ left: yon * seritRef.current.clientWidth * 0.8, behavior: 'smooth' });

  if (hata) {
    return (
      <div className="yukleniyor">
        <div className="bos"><strong>Vitrin şu an açılamadı</strong>{hata}<br /><button className="btn" style={{ marginTop: 14 }} onClick={() => window.location.reload()}>Tekrar dene</button></div>
      </div>
    );
  }

  return (
    <>
      {DEMO && (
        <div className="demo-serit">
          Demo modu: örnek ürün ve istatistikler. Yönetim paneline <a href="#yonetim">buradan</a> girebilirsiniz.
        </div>
      )}

      <header className="ust">
        <div className="kapsa ust-ic">
          <div className="marka">
            <div className="logo"><Logo /></div>
            <div>
              <h1>{ayarlar?.dukkan_adi || ' '}</h1>
              <p>{ayarlar?.slogan || 'Toptan ürün vitrini'}</p>
            </div>
          </div>
          {telefon && (
            <div className="ust-iletisim">
              <a className="btn" href={whatsappLink(telefon, 'Merhaba, sitenizden yazıyorum.')} target="_blank" rel="noopener noreferrer">
                <WhatsappIkon /> {telefon}
              </a>
            </div>
          )}
          <form className="arama" role="search" onSubmit={(e) => { e.preventDefault(); katalogRef.current?.scrollIntoView({ behavior: 'smooth' }); }}>
            <AraIkon />
            <label className="gizli" htmlFor="ara">Ürün ara</label>
            <input id="ara" type="search" placeholder="Ürün adı, kod veya kategori ara… (örn: vida 4x40)" value={arama} onChange={(e) => setArama(e.target.value)} autoComplete="off" />
            {arama && <button type="button" onClick={() => setArama('')}>Temizle</button>}
          </form>
        </div>
      </header>

      <main className="kapsa">
        {!arama && cokSatan.length > 0 && (
          <section className="bolum" aria-labelledby="cok-satan-baslik">
            <div className="bolum-bas">
              <h2 id="cok-satan-baslik">En çok satanlar</h2>
              <span>Son 90 gün</span>
            </div>
            <div className="serit-kap">
              <button className="serit-ok sol" onClick={() => seritKaydir(-1)} aria-label="Önceki"><Ok yon="sol" /></button>
              <div className="serit" ref={seritRef}>
                {cokSatan.map((u, i) => (
                  <button key={u.id} className="vitrin-kart" onClick={() => ac(u.id)}>
                    <span className="sira">{i + 1}</span>
                    <img src={resimKaynak(u.resimler?.[0])} alt="" loading="lazy" />
                    <span className="ic">
                      <span className="ad">{u.ad}</span>
                      <span className="fiyat">{tl(u.fiyat)} <small style={{ fontSize: 13, color: 'var(--soluk)', fontFamily: 'var(--govde)', fontWeight: 600 }}>+ KDV</small></span>
                    </span>
                  </button>
                ))}
              </div>
              <button className="serit-ok sag" onClick={() => seritKaydir(1)} aria-label="Sonraki"><Ok /></button>
            </div>
          </section>
        )}

        <section className="bolum" ref={katalogRef} aria-labelledby="katalog-baslik">
          <div className="bolum-bas">
            <h2 id="katalog-baslik">{arama ? `"${arama}" için sonuçlar` : 'Tüm ürünler'}</h2>
            <span>{urunler ? `${liste.length} ürün` : ''}</span>
          </div>

          <div className="filtre">
            <div className="cipler" role="group" aria-label="Kategoriler">
              {kategoriler.map(([k, n]) => (
                <button key={k} className="cip" aria-pressed={kategori === k} onClick={() => setKategori(k)}>
                  {k}<small>{n}</small>
                </button>
              ))}
            </div>
            <div className="filtre-sag">
              <label className="anahtar">
                <input type="checkbox" checked={stoktakiler} onChange={(e) => setStoktakiler(e.target.checked)} />
                Sadece stoktakiler
              </label>
              <label className="gizli" htmlFor="sirala">Sırala</label>
              <select id="sirala" className="secim" value={sirala} onChange={(e) => setSirala(e.target.value)}>
                {Object.entries(SIRALAMALAR).map(([k, v]) => <option key={k} value={k}>{v.ad}</option>)}
              </select>
            </div>
          </div>

          <div className="katalog">
            {!urunler && Array.from({ length: 6 }, (_, i) => <div key={i} className="iskelet" style={{ height: 140 }} />)}
            {urunler && liste.length === 0 && (
              <div className="bos">
                <strong>Aradığınız ürün bulunamadı</strong>
                Farklı bir kelime deneyin ya da bize WhatsApp'tan yazın, temin edelim.
              </div>
            )}
            {liste.slice(0, goster).map((u) => <UrunSatir key={u.id} urun={u} telefon={telefon} ac={ac} />)}
          </div>
          {liste.length > goster && (
            <div style={{ textAlign: 'center', paddingBottom: 40 }}>
              <button className="btn" onClick={() => setGoster((g) => g + SAYFA)}>
                Daha fazla göster ({liste.length - goster} ürün daha)
              </button>
            </div>
          )}
        </section>
      </main>

      {ayarlar && <AltBilgi ayarlar={ayarlar} ist={ist} ac={ac} />}

      {acikUrun && <UrunDetay urun={acikUrun} telefon={telefon} kapat={kapat} />}
    </>
  );
}
