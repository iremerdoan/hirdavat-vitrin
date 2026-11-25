import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { DEMO } from '../lib/config.js';
import Giris from './Giris.jsx';
import Istatistik from './Istatistik.jsx';
import Urunler from './Urunler.jsx';
import Satislar from './Satislar.jsx';
import Excel from './Excel.jsx';
import Ayarlar from './Ayarlar.jsx';

const SEKMELER = [
  ['istatistik', 'İstatistik'],
  ['urunler', 'Ürünler'],
  ['satislar', 'Satışlar'],
  ['excel', 'Excel'],
  ['ayarlar', 'Ayarlar'],
];

const sekmeOku = () => {
  const h = window.location.hash.slice(1);
  const s = h.startsWith('yonetim-') ? h.slice(8) : 'istatistik';
  return SEKMELER.some(([k]) => k === s) ? s : 'istatistik';
};

export default function Yonetim() {
  const [oturum, setOturum] = useState(undefined); // undefined = kontrol ediliyor
  const [sekme, setSekme] = useState(sekmeOku);
  const [urunler, setUrunler] = useState(null);
  const [ayarlar, setAyarlar] = useState({});
  const [mesaj, setMesaj] = useState('');

  useEffect(() => {
    let birak = () => {};
    api.oturum().then(setOturum);
    api.oturumDinle(setOturum).then((f) => { birak = f; });
    const f = () => setSekme(sekmeOku());
    window.addEventListener('hashchange', f);
    return () => { birak(); window.removeEventListener('hashchange', f); };
  }, []);

  const yenile = useCallback(async () => {
    const [u, a] = await Promise.all([api.urunler({ hepsi: true }), api.ayarlar()]);
    setUrunler(u); setAyarlar(a);
  }, []);

  useEffect(() => { if (oturum) yenile().catch((e) => bildir(e.message)); }, [oturum, yenile]);

  const bildir = useCallback((m) => {
    setMesaj(m);
    clearTimeout(bildir.t);
    bildir.t = setTimeout(() => setMesaj(''), 3500);
  }, []);

  useEffect(() => { document.title = 'Yönetim paneli'; }, []);

  if (oturum === undefined) return <div className="yukleniyor">Kontrol ediliyor…</div>;
  if (!oturum) return <Giris />;

  const sekmeSec = (k) => { window.location.hash = `yonetim-${k}`; };

  return (
    <div className="y-govde">
      <header className="y-ust">
        <div className="kapsa y-ust-ic">
          <h1>{ayarlar.dukkan_adi || 'Yönetim'}<small>Yönetim paneli{DEMO ? ' · demo' : ''}</small></h1>
          <a className="btn btn-kucuk" href="#">Vitrini gör</a>
          <button className="btn btn-kucuk" onClick={() => api.cikis()}>Çıkış</button>
        </div>
      </header>
      <nav className="sekmeler" aria-label="Bölümler">
        <div className="kapsa" role="tablist">
          {SEKMELER.map(([k, ad]) => (
            <button key={k} role="tab" className="sekme" aria-selected={sekme === k} onClick={() => sekmeSec(k)}>{ad}</button>
          ))}
        </div>
      </nav>

      <main className="kapsa y-icerik">
        {sekme === 'istatistik' && <Istatistik ayarlar={ayarlar} bildir={bildir} />}
        {sekme === 'urunler' && <Urunler urunler={urunler} yenile={yenile} bildir={bildir} />}
        {sekme === 'satislar' && <Satislar urunler={urunler} yenile={yenile} bildir={bildir} />}
        {sekme === 'excel' && <Excel urunler={urunler} ayarlar={ayarlar} yenile={yenile} bildir={bildir} />}
        {sekme === 'ayarlar' && <Ayarlar ayarlar={ayarlar} yenile={yenile} bildir={bildir} />}
      </main>

      {mesaj && <div className="toast" role="status">{mesaj}</div>}
    </div>
  );
}
