import React, { useMemo, useState } from 'react';
import { api } from '../lib/api.js';
import { tl, sayi, stokDurum, trKucuk, KRITIK_STOK } from '../lib/format.js';
import { resimKaynak } from '../lib/gorseller.js';
import UrunForm from './UrunForm.jsx';

const FILTRELER = [
  ['hepsi', 'Tümü'],
  ['az', `Az kalan (≤${KRITIK_STOK})`],
  ['yok', 'Tükenen'],
  ['pasif', 'Vitrinde gizli'],
];

export default function Urunler({ urunler, yenile, bildir }) {
  const [arama, setArama] = useState('');
  const [filtre, setFiltre] = useState('hepsi');
  const [duzenle, setDuzenle] = useState(null); // null kapalı, {} yeni, ürün = düzenle

  const kategoriler = useMemo(() => [...new Set((urunler || []).map((u) => u.kategori).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'tr')), [urunler]);

  const sayac = useMemo(() => {
    const l = urunler || [];
    return {
      hepsi: l.length,
      az: l.filter((u) => u.stok > 0 && u.stok <= KRITIK_STOK).length,
      yok: l.filter((u) => u.stok <= 0).length,
      pasif: l.filter((u) => !u.aktif).length,
    };
  }, [urunler]);

  const liste = useMemo(() => {
    const q = trKucuk(arama).trim();
    return (urunler || [])
      .filter((u) => filtre === 'hepsi'
        || (filtre === 'az' && u.stok > 0 && u.stok <= KRITIK_STOK)
        || (filtre === 'yok' && u.stok <= 0)
        || (filtre === 'pasif' && !u.aktif))
      .filter((u) => !q || trKucuk(`${u.ad} ${u.kod} ${u.kategori}`).includes(q));
  }, [urunler, arama, filtre]);

  const stokDegerToplam = useMemo(() => (urunler || []).reduce((a, u) => a + Math.max(0, u.stok) * Number(u.fiyat), 0), [urunler]);

  const hizliStok = async (u, fark) => {
    try {
      await api.urunKaydet({ ...u, stok: Math.max(0, Number(u.stok) + fark) });
      await yenile();
    } catch (e) { bildir(e.message); }
  };

  return (
    <section className="kutu">
      <div className="kutu-bas">
        <div>
          <h2>Ürünler</h2>
          <p>{sayi(sayac.hepsi)} ürün · stok değeri (KDV hariç) {tl(stokDegerToplam)}</p>
        </div>
        <div className="arac">
          <a className="btn" href="#yonetim-excel">Excel ile toplu ekle</a>
          <button className="btn btn-turuncu" onClick={() => setDuzenle({})}>+ Yeni ürün</button>
        </div>
      </div>

      <div className="filtre" style={{ marginTop: 0 }}>
        <div className="cipler" role="group" aria-label="Filtre">
          {FILTRELER.map(([k, ad]) => (
            <button key={k} className="cip" aria-pressed={filtre === k} onClick={() => setFiltre(k)}>{ad}<small>{sayac[k]}</small></button>
          ))}
        </div>
        <label className="alan" style={{ minWidth: 'min(100%, 280px)' }}>
          <span className="gizli">Ürün ara</span>
          <input type="search" placeholder="Ad, kod veya kategori ara…" value={arama} onChange={(e) => setArama(e.target.value)} />
        </label>
      </div>

      <div className="tablo-kap">
        <table className="stack">
          <thead>
            <tr>
              <th style={{ width: 56 }}></th>
              <th>Ürün</th>
              <th className="sag">Fiyat</th>
              <th className="sag">KDV</th>
              <th className="sag">Stok</th>
              <th>Durum</th>
            </tr>
          </thead>
          <tbody>
            {!urunler && <tr><td colSpan={6}>Yükleniyor…</td></tr>}
            {urunler && liste.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--soluk)', padding: 30 }}>Ürün bulunamadı.</td></tr>}
            {liste.map((u) => {
              const d = stokDurum(u.stok);
              return (
                <tr key={u.id} className={`tikla ${u.aktif ? '' : 'pasif'}`} onClick={() => setDuzenle(u)}>
                  <td><img className="mini-resim" src={resimKaynak(u.resimler?.[0])} alt="" loading="lazy" /></td>
                  <td data-l="Ürün"><b>{u.ad}</b><br /><small style={{ color: 'var(--soluk)' }}><span className="kod">{u.kod}</span> {u.kategori}</small></td>
                  <td data-l="Fiyat" className="sag">{tl(u.fiyat)}</td>
                  <td data-l="KDV" className="sag">%{u.kdv}</td>
                  <td data-l="Stok" className="sag" onClick={(e) => e.stopPropagation()}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <button className="btn btn-kucuk btn-ikon" style={{ width: 32, minHeight: 32 }} onClick={() => hizliStok(u, -1)} aria-label="Stok azalt">−</button>
                      <b style={{ minWidth: 40, textAlign: 'center' }}>{sayi(u.stok)}</b>
                      <button className="btn btn-kucuk btn-ikon" style={{ width: 32, minHeight: 32 }} onClick={() => hizliStok(u, 1)} aria-label="Stok artır">+</button>
                    </span>
                  </td>
                  <td data-l="Durum">
                    <span className={`rozet ${d.tur}`}>{d.etiket}</span>
                    {!u.aktif && <span className="rozet" style={{ color: 'var(--soluk)', background: '#eef1f4', marginLeft: 6 }}>Gizli</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {duzenle && (
        <UrunForm
          urun={duzenle.id ? duzenle : null}
          kategoriler={kategoriler}
          kapat={() => setDuzenle(null)}
          kaydedildi={async () => { setDuzenle(null); await yenile(); }}
          bildir={bildir}
        />
      )}
    </section>
  );
}
