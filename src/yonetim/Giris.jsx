import React, { useState } from 'react';
import { api } from '../lib/api.js';
import { DEMO, DEMO_GIRIS } from '../lib/config.js';

export default function Giris() {
  const [eposta, setEposta] = useState('');
  const [sifre, setSifre] = useState('');
  const [hata, setHata] = useState('');
  const [bekliyor, setBekliyor] = useState(false);

  const gonder = async (e) => {
    e.preventDefault();
    setHata(''); setBekliyor(true);
    try { await api.giris(eposta, sifre); }
    catch (err) { setHata(err.message); }
    finally { setBekliyor(false); }
  };

  return (
    <div className="giris">
      <form className="giris-kart" onSubmit={gonder}>
        <h1>Yönetim girişi</h1>
        <p>Bu bölüm sadece dükkan sahibine özeldir.</p>
        {DEMO && (
          <div className="bilgi">
            Demo giriş: <b>{DEMO_GIRIS.eposta}</b> / <b>{DEMO_GIRIS.sifre}</b>{' '}
            <button type="button" className="btn btn-kucuk" style={{ marginTop: 6 }} onClick={() => { setEposta(DEMO_GIRIS.eposta); setSifre(DEMO_GIRIS.sifre); }}>Doldur</button>
          </div>
        )}
        <label className="alan">
          <span>E-posta</span>
          <input type="email" autoComplete="username" value={eposta} onChange={(e) => setEposta(e.target.value)} required />
        </label>
        <label className="alan">
          <span>Şifre</span>
          <input type="password" autoComplete="current-password" value={sifre} onChange={(e) => setSifre(e.target.value)} required />
        </label>
        {hata && <div className="hata">{hata}</div>}
        <button className="btn btn-ana" disabled={bekliyor} style={{ minHeight: 50 }}>{bekliyor ? 'Giriş yapılıyor…' : 'Giriş yap'}</button>
        <a href="#" style={{ fontSize: 14, color: 'var(--soluk)', textAlign: 'center' }}>← Vitrine dön</a>
      </form>
    </div>
  );
}
