import React, { useEffect, useRef, useState } from 'react';
import { tl, kdvDahil, stokDurum, sayi } from '../lib/format.js';
import { resimKaynak } from '../lib/gorseller.js';
import { WhatsappIkon } from '../ikonlar.jsx';
import { alLinki } from './whatsapp.js';
import { api } from '../lib/api.js';

export default function UrunDetay({ urun, telefon, kapat }) {
  const [adet, setAdet] = useState(1);
  const [aktifResim, setAktifResim] = useState(0);
  const seritRef = useRef(null);
  const kapatRef = useRef(null);
  const durum = stokDurum(urun.stok);
  const tukendi = durum.tur === 'yok';
  const resimler = urun.resimler?.length ? urun.resimler : [null];

  // Ürün her açıldığında 1 görüntüleme say
  useEffect(() => { api.olay('goruntuleme', urun.id); }, [urun.id]);

  useEffect(() => {
    kapatRef.current?.focus();
    const tus = (e) => e.key === 'Escape' && kapat();
    document.addEventListener('keydown', tus);
    const eski = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', tus); document.body.style.overflow = eski; };
  }, [kapat]);

  const kaydir = (i) => {
    const s = seritRef.current;
    if (s) s.scrollTo({ left: s.clientWidth * i, behavior: 'smooth' });
  };

  const adetDegis = (v) => setAdet(Math.max(1, Math.min(9999, Number(v) || 1)));
  const araToplam = urun.fiyat * adet;
  const kdvTutar = kdvDahil(araToplam, urun.kdv) - araToplam;

  return (
    <div className="perde" onClick={kapat} role="presentation">
      <div className="pencere" role="dialog" aria-modal="true" aria-label={urun.ad} onClick={(e) => e.stopPropagation()}>
        <button ref={kapatRef} className="kapat" onClick={kapat} aria-label="Kapat">×</button>
        <div className="detay">
          <div className="galeri">
            <div
              className="galeri-serit"
              ref={seritRef}
              onScroll={(e) => setAktifResim(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
            >
              {resimler.map((r, i) => <img key={i} src={resimKaynak(r)} alt={`${urun.ad} fotoğraf ${i + 1}`} />)}
            </div>
            {resimler.length > 1 && (
              <div className="galeri-nokta">
                {resimler.map((_, i) => (
                  <button key={i} aria-label={`Fotoğraf ${i + 1}`} aria-current={i === aktifResim} onClick={() => kaydir(i)} />
                ))}
              </div>
            )}
          </div>

          <div className="detay-ic">
            <div className="detay-meta">
              <span className="kod">{urun.kod}</span>
              <span>{urun.kategori}</span>
              <span>·</span>
              <span>Birim: {urun.birim || 'Adet'}</span>
            </div>
            <h2>{urun.ad}</h2>
            <div>
              <span className={`rozet ${durum.tur}`}>
                {durum.etiket}{!tukendi && ` · ${sayi(urun.stok)} ${urun.birim || 'adet'} mevcut`}
              </span>
            </div>
            {urun.aciklama && <p className="aciklama">{urun.aciklama}</p>}

            <div className="adet-satir">
              <span style={{ fontWeight: 600 }}>Adet</span>
              <div className="sayac">
                <button onClick={() => adetDegis(adet - 1)} aria-label="Azalt">−</button>
                <input inputMode="numeric" value={adet} onChange={(e) => adetDegis(e.target.value)} aria-label="Adet" />
                <button onClick={() => adetDegis(adet + 1)} aria-label="Artır">+</button>
              </div>
              {!tukendi && adet > urun.stok && <span className="not">Stokta {sayi(urun.stok)} var, fazlası için sorun.</span>}
            </div>

            <div className="fiyat-tablo">
              <div><span>Birim fiyat (KDV hariç)</span><span>{tl(urun.fiyat)}</span></div>
              <div><span>{adet} × {tl(urun.fiyat)}</span><span>{tl(araToplam)}</span></div>
              <div><span>KDV (%{urun.kdv})</span><span>{tl(kdvTutar)}</span></div>
              <div className="toplam"><span>Toplam (KDV dahil)</span><span>{tl(araToplam + kdvTutar)}</span></div>
            </div>

            <div className="detay-al">
              <a
                className={`btn ${tukendi ? 'btn-ana' : 'btn-al'}`}
                href={alLinki(telefon, urun, adet)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => api.olay('al_tik', urun.id)}
              >
                <WhatsappIkon /> {tukendi ? 'Stok sor (WhatsApp)' : `${adet} ${urun.birim || 'adet'} al · WhatsApp`}
              </a>
              <p className="not">Siparişiniz WhatsApp'ta hazır mesaj olarak açılır, gönder'e basmanız yeterli.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
