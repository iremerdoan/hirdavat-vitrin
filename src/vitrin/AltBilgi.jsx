import React from 'react';
import { sayi } from '../lib/format.js';
import { WhatsappIkon } from '../ikonlar.jsx';

export default function AltBilgi({ ayarlar, ist, ac }) {
  return (
    <footer className="alt">
      <div className="kapsa alt-ic">
        <div>
          <h4>{ayarlar.dukkan_adi}</h4>
          {ayarlar.adres && <p>{ayarlar.adres}</p>}
          {ayarlar.calisma_saatleri && <p>{ayarlar.calisma_saatleri}</p>}
          {ayarlar.whatsapp && (
            <p style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <WhatsappIkon /> {ayarlar.whatsapp}
            </p>
          )}
        </div>

        <div>
          <h4>Vitrin ziyaretçileri</h4>
          <div className="canli">Canlı sayaç</div>
          <div className="sayilar">
            <div><b>{ist ? sayi(ist.bugun) : '–'}</b><span>Bugün</span></div>
            <div><b>{ist ? sayi(ist.bu_ay) : '–'}</b><span>Bu ay</span></div>
            <div><b>{ist ? sayi(ist.toplam) : '–'}</b><span>Toplam</span></div>
          </div>
        </div>

        <div>
          <h4>En çok bakılanlar</h4>
          {ist?.en_cok?.length ? (
            <ol className="en-cok">
              {ist.en_cok.map((u, i) => (
                <li key={u.id}>
                  <button onClick={() => ac(u.id)}>
                    <span>{i + 1}. {u.ad}</span>
                    <span>{sayi(u.sayi)} tık</span>
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <p style={{ color: '#8fa6bf' }}>Henüz veri yok.</p>
          )}
          <p style={{ fontSize: 13, color: '#8fa6bf', marginTop: 8 }}>Son 30 gün</p>
        </div>
      </div>
      <div className="kapsa alt-son">
        <span>© {new Date().getFullYear()} {ayarlar.dukkan_adi} · Fiyatlara KDV dahil değildir, KDV oranı ürün yanında yazar.</span>
        <a href="#yonetim">Yönetim girişi</a>
      </div>
    </footer>
  );
}
