import React from 'react';
import { tl, kdvDahil, stokDurum, sayi } from '../lib/format.js';
import { resimKaynak } from '../lib/gorseller.js';
import { WhatsappIkon } from '../ikonlar.jsx';
import { alLinki } from './whatsapp.js';
import { api } from '../lib/api.js';

// Katalog satırı: solda fotoğraf, sağda kod/ad/fiyat/KDV/stok ve "Al" butonu
export default function UrunSatir({ urun, telefon, ac }) {
  const durum = stokDurum(urun.stok);
  const tukendi = durum.tur === 'yok';

  return (
    <article className="urun" onClick={() => ac(urun.id)} onKeyDown={(e) => e.key === 'Enter' && ac(urun.id)} tabIndex={0} aria-label={`${urun.ad} detayları`}>
      <img className="urun-resim" src={resimKaynak(urun.resimler?.[0])} alt="" loading="lazy" />
      <div className="urun-bilgi">
        <div className="urun-ust">
          <span className="kod">{urun.kod}</span>
          <span>{urun.kategori}</span>
        </div>
        <h3>{urun.ad}</h3>
        <div className="fiyat-blok">
          <span className="fiyat-ana">{tl(urun.fiyat)}<small>+ KDV</small></span>
          <span className="fiyat-kdv">KDV %{urun.kdv} dahil {tl(kdvDahil(urun.fiyat, urun.kdv))} / {urun.birim || 'Adet'}</span>
          <span style={{ marginTop: 6 }}>
            <span className={`rozet ${durum.tur}`}>
              {durum.etiket}{!tukendi && ` · ${sayi(urun.stok)} ${urun.birim || 'adet'}`}
            </span>
          </span>
        </div>
        <div className="urun-alt">
          <a
            className={`btn ${tukendi ? '' : 'btn-al'}`}
            href={alLinki(telefon, urun, 1)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => { e.stopPropagation(); api.olay('al_tik', urun.id); }}
          >
            <WhatsappIkon /> {tukendi ? 'Sor' : 'Al'}
          </a>
        </div>
      </div>
    </article>
  );
}
