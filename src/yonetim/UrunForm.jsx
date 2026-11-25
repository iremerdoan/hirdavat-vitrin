import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { tl, kdvDahil } from '../lib/format.js';
import { resimKaynak } from '../lib/gorseller.js';
import { resimKucult } from '../lib/resim.js';

const BIRIMLER = ['Adet', 'Paket', 'Kutu', 'Takım', 'Kg', 'Metre', 'Makara', 'Rulo', 'Kova', 'Litre', 'Koli'];
const BOS = { kod: '', ad: '', kategori: '', birim: 'Adet', fiyat: '', kdv: 20, stok: 0, aktif: true, aciklama: '', resimler: [] };

export default function UrunForm({ urun, kategoriler, kapat, kaydedildi, bildir }) {
  const [f, setF] = useState(() => ({ ...BOS, ...(urun || {}) }));
  const [hata, setHata] = useState('');
  const [bekliyor, setBekliyor] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(0);
  const [silOnay, setSilOnay] = useState(false);
  const yeni = !urun?.id;

  useEffect(() => {
    const tus = (e) => e.key === 'Escape' && kapat();
    document.addEventListener('keydown', tus);
    return () => document.removeEventListener('keydown', tus);
  }, [kapat]);

  const degis = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const resimSec = async (e) => {
    const dosyalar = [...e.target.files];
    e.target.value = '';
    setYukleniyor(dosyalar.length);
    for (const d of dosyalar) {
      try {
        const url = await api.resimYukle(await resimKucult(d));
        setF((x) => ({ ...x, resimler: [...x.resimler, url] }));
      } catch (err) {
        bildir(`Fotoğraf yüklenemedi: ${err.message}`);
      }
      setYukleniyor((n) => n - 1);
    }
  };

  const kapakYap = (i) => setF((x) => {
    const r = [...x.resimler];
    const [s] = r.splice(i, 1);
    return { ...x, resimler: [s, ...r] };
  });

  const kaydet = async (e) => {
    e.preventDefault();
    setHata('');
    const fiyat = Number(String(f.fiyat).replace(',', '.'));
    if (!f.ad.trim()) return setHata('Ürün adı boş olamaz.');
    if (Number.isNaN(fiyat) || fiyat < 0) return setHata('Fiyat geçerli bir sayı olmalı.');
    setBekliyor(true);
    try {
      await api.urunKaydet({
        ...f, ad: f.ad.trim(), kategori: f.kategori.trim() || 'Genel', fiyat,
        kdv: Number(f.kdv), stok: Math.round(Number(f.stok) || 0),
      });
      bildir(yeni ? 'Ürün eklendi' : 'Ürün güncellendi');
      kaydedildi();
    } catch (err) {
      setHata(err.message);
    } finally {
      setBekliyor(false);
    }
  };

  const sil = async () => {
    if (!silOnay) return setSilOnay(true);
    try {
      await api.urunSil(urun.id);
      bildir('Ürün silindi');
      kaydedildi();
    } catch (err) { setHata(err.message); }
  };

  const fiyatSayi = Number(String(f.fiyat).replace(',', '.')) || 0;

  return (
    <div className="cekmece-perde" onClick={kapat}>
      <form className="cekmece" onClick={(e) => e.stopPropagation()} onSubmit={kaydet} role="dialog" aria-modal="true" aria-label={yeni ? 'Yeni ürün' : 'Ürünü düzenle'}>
        <div className="cekmece-bas">
          <h2>{yeni ? 'Yeni ürün' : 'Ürünü düzenle'}</h2>
          <button type="button" className="btn btn-ikon" onClick={kapat} aria-label="Kapat">×</button>
        </div>

        <div className="alan">
          <span>Fotoğraflar <small>(ilki vitrinde görünür, kapak yapmak için tıklayın)</small></span>
          <div className="resimler">
            {f.resimler.map((r, i) => (
              <div className="resim-kutu" key={r + i}>
                <img src={resimKaynak(r)} alt="" onClick={() => kapakYap(i)} style={{ cursor: 'pointer', outline: i === 0 ? '3px solid var(--turuncu)' : 'none' }} />
                <button type="button" aria-label="Fotoğrafı kaldır" onClick={() => setF((x) => ({ ...x, resimler: x.resimler.filter((_, j) => j !== i) }))}>×</button>
              </div>
            ))}
            <label className="resim-ekle">
              {yukleniyor > 0 ? `Yükleniyor… (${yukleniyor})` : '+ Fotoğraf ekle'}
              <input type="file" accept="image/*" multiple onChange={resimSec} />
            </label>
          </div>
        </div>

        <div className="form-iki">
          <label className="alan"><span>Ürün kodu *</span><input value={f.kod} onChange={degis('kod')} required placeholder="örn. VD-0440" /></label>
          <label className="alan">
            <span>Kategori</span>
            <input value={f.kategori} onChange={degis('kategori')} list="kategori-listesi" placeholder="örn. Vida & Dübel" />
            <datalist id="kategori-listesi">{kategoriler.map((k) => <option key={k} value={k} />)}</datalist>
          </label>
        </div>
        <label className="alan"><span>Ürün adı *</span><input value={f.ad} onChange={degis('ad')} required /></label>

        <div className="form-iki">
          <label className="alan"><span>Fiyat (KDV hariç, ₺) *</span><input inputMode="decimal" value={f.fiyat} onChange={degis('fiyat')} required /></label>
          <label className="alan">
            <span>KDV oranı</span>
            <select value={f.kdv} onChange={degis('kdv')}>{[0, 1, 10, 20].map((k) => <option key={k} value={k}>%{k}</option>)}</select>
          </label>
        </div>
        <div className="bilgi">KDV dahil fiyat: <b>{tl(kdvDahil(fiyatSayi, f.kdv))}</b></div>

        <div className="form-iki">
          <label className="alan"><span>Stok</span><input type="number" inputMode="numeric" value={f.stok} onChange={degis('stok')} /></label>
          <label className="alan">
            <span>Birim</span>
            <select value={f.birim} onChange={degis('birim')}>
              {[...new Set([...BIRIMLER, f.birim])].map((b) => <option key={b}>{b}</option>)}
            </select>
          </label>
        </div>

        <label className="alan"><span>Açıklama</span><textarea value={f.aciklama || ''} onChange={degis('aciklama')} placeholder="Ölçü, malzeme, marka, paket içeriği…" /></label>

        <label className="anahtar">
          <input type="checkbox" checked={f.aktif} onChange={degis('aktif')} />
          Vitrinde göster
        </label>

        {hata && <div className="hata">{hata}</div>}

        <div className="cekmece-alt">
          {!yeni ? (
            <button type="button" className="btn btn-tehlike" onClick={sil} onBlur={() => setSilOnay(false)}>
              {silOnay ? 'Emin misiniz? Tekrar basın' : 'Ürünü sil'}
            </button>
          ) : <span />}
          <div className="arac">
            <button type="button" className="btn" onClick={kapat}>Vazgeç</button>
            <button className="btn btn-ana" disabled={bekliyor || yukleniyor > 0}>{bekliyor ? 'Kaydediliyor…' : 'Kaydet'}</button>
          </div>
        </div>
      </form>
    </div>
  );
}
