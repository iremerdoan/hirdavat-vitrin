import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { DEMO } from '../lib/config.js';
import { telefonTemizle, whatsappLink } from '../lib/format.js';

const ALANLAR = [
  ['dukkan_adi', 'Dükkan adı', 'Sitenin en üstünde büyük yazar'],
  ['slogan', 'Kısa tanıtım', 'örn. Esnafa toptan hırdavat · Günlük stok'],
  ['whatsapp', 'WhatsApp numarası', '"Al" butonları bu numaraya yönlenir. örn. 0532 123 45 67'],
  ['adres', 'Adres', 'Alt bilgide görünür'],
  ['calisma_saatleri', 'Çalışma saatleri', 'örn. Hafta içi 08:30–19:00'],
];

export default function Ayarlar({ ayarlar, yenile, bildir }) {
  const [f, setF] = useState(ayarlar);
  useEffect(() => setF(ayarlar), [ayarlar]);
  const [bekliyor, setBekliyor] = useState(false);
  const [sifirOnay, setSifirOnay] = useState(false);
  const numara = telefonTemizle(f.whatsapp);
  const numaraGecerli = /^90\d{10}$/.test(numara);

  const kaydet = async (e) => {
    e.preventDefault();
    setBekliyor(true);
    try {
      await api.ayarKaydet(f);
      await yenile();
      bildir('Ayarlar kaydedildi');
    } catch (err) { bildir(err.message); }
    finally { setBekliyor(false); }
  };

  return (
    <>
      <section className="kutu">
        <h2>Dükkan bilgileri</h2>
        <form className="form" onSubmit={kaydet} style={{ marginTop: 12, maxWidth: 640 }}>
          {ALANLAR.map(([k, ad, ipucu]) => (
            <label className="alan" key={k}>
              <span>{ad}</span>
              <input value={f[k] || ''} onChange={(e) => setF((x) => ({ ...x, [k]: e.target.value }))} />
              <small>{ipucu}</small>
            </label>
          ))}
          {f.whatsapp && (
            <div className={numaraGecerli ? 'bilgi' : 'hata'}>
              {numaraGecerli
                ? <>WhatsApp numarası: +{numara}. <a href={whatsappLink(f.whatsapp, 'Deneme mesajı')} target="_blank" rel="noopener noreferrer">Deneme mesajı aç</a></>
                : 'Numara Türkiye cep numarası gibi görünmüyor (0 5xx xxx xx xx).'}
            </div>
          )}
          <div><button className="btn btn-ana" disabled={bekliyor}>{bekliyor ? 'Kaydediliyor…' : 'Kaydet'}</button></div>
        </form>
      </section>

      {DEMO && (
        <section className="kutu">
          <h3>Demo verileri</h3>
          <p className="not" style={{ marginBottom: 12 }}>Demo modunda her şey bu tarayıcıda tutulur. Örnek verilere dönmek için sıfırlayın.</p>
          <button
            className="btn btn-tehlike"
            onBlur={() => setSifirOnay(false)}
            onClick={async () => {
              if (!sifirOnay) return setSifirOnay(true);
              await api.demoSifirla();
              window.location.reload();
            }}
          >
            {sifirOnay ? 'Emin misiniz? Tekrar basın' : 'Demo verilerini sıfırla'}
          </button>
        </section>
      )}
    </>
  );
}
