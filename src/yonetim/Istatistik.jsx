import React, { useEffect, useMemo, useState } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler,
  LineController, BarController, DoughnutController,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { api } from '../lib/api.js';
import { AYLAR, sayi, tl, yuzde } from '../lib/format.js';
import { Ok } from '../ikonlar.jsx';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler, LineController, BarController, DoughnutController);
ChartJS.defaults.font.family = "'Barlow', system-ui, sans-serif";
ChartJS.defaults.font.size = 13;
ChartJS.defaults.color = '#5b6878';

const RENK = { mavi: '#12355b', acikMavi: '#4f86c6', turuncu: '#f26a1b', yesil: '#1a8f4c', gri: '#c9d3dd' };
const KATEGORI_RENK = ['#12355b', '#f26a1b', '#4f86c6', '#1a8f4c', '#b77900', '#8a5cc2', '#c8372a', '#5b6878'];

function Degisim({ simdi, once, para }) {
  if (!once && !simdi) return <em className="notr">Değişim yok</em>;
  if (!once) return <em className="artis">Yeni</em>;
  const d = ((simdi - once) / once) * 100;
  const cls = d > 0.5 ? 'artis' : d < -0.5 ? 'azalis' : 'notr';
  return <em className={cls}>{d > 0 ? '▲' : d < 0 ? '▼' : '•'} {yuzde(Math.abs(d))} <span className="notr">önceki ay {para ? tl(once) : sayi(once)}</span></em>;
}

const ortakSecenek = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } } },
};

export default function Istatistik({ ayarlar, bildir }) {
  const bugun = new Date();
  const [yil, setYil] = useState(bugun.getFullYear());
  const [ay, setAy] = useState(bugun.getMonth() + 1);
  const [ist, setIst] = useState(null);
  const [sirala, setSirala] = useState('ciro');

  useEffect(() => {
    setIst(null);
    api.ayIstatistik(yil, ay).then(setIst).catch((e) => bildir(e.message));
  }, [yil, ay, bildir]);

  const ayDegis = (n) => {
    const d = new Date(yil, ay - 1 + n, 1);
    if (d > bugun) return;
    setYil(d.getFullYear()); setAy(d.getMonth() + 1);
  };
  const buAy = yil === bugun.getFullYear() && ay === bugun.getMonth() + 1;

  const etiketler = ist?.gunluk.map((g) => String(g.gun)) || [];

  const trafik = useMemo(() => ist && ({
    labels: etiketler,
    datasets: [
      { label: 'Ziyaretçi', data: ist.gunluk.map((g) => g.ziyaretci), borderColor: RENK.mavi, backgroundColor: 'rgba(18,53,91,.08)', fill: true, tension: .3, pointRadius: 0, borderWidth: 2.5 },
      { label: 'Ürün görüntüleme', data: ist.gunluk.map((g) => g.goruntuleme), borderColor: RENK.acikMavi, tension: .3, pointRadius: 0, borderWidth: 2 },
      { label: '"Al" tıklaması', data: ist.gunluk.map((g) => g.al_tik), borderColor: RENK.turuncu, tension: .3, pointRadius: 0, borderWidth: 2 },
    ],
  }), [ist]);

  const satis = useMemo(() => ist && ({
    labels: etiketler,
    datasets: [
      { type: 'bar', label: 'Satılan adet', data: ist.gunluk.map((g) => g.satis_adet), backgroundColor: RENK.mavi, borderRadius: 4, yAxisID: 'y' },
      { type: 'line', label: 'Ciro (KDV dahil)', data: ist.gunluk.map((g) => Number(g.ciro)), borderColor: RENK.turuncu, backgroundColor: RENK.turuncu, tension: .3, pointRadius: 2, borderWidth: 2, yAxisID: 'y1' },
    ],
  }), [ist]);

  const enCok = useMemo(() => {
    if (!ist) return null;
    const ilk = [...ist.urunler].sort((a, b) => b.goruntuleme - a.goruntuleme).slice(0, 8);
    const kisa = (s) => (s.length > 26 ? `${s.slice(0, 25)}…` : s);
    return {
      labels: ilk.map((u) => kisa(u.ad)),
      datasets: [
        { label: 'Görüntüleme', data: ilk.map((u) => u.goruntuleme), backgroundColor: RENK.acikMavi, borderRadius: 4 },
        { label: '"Al" tıklaması', data: ilk.map((u) => u.al_tik), backgroundColor: RENK.turuncu, borderRadius: 4 },
      ],
    };
  }, [ist]);

  const kategori = useMemo(() => {
    if (!ist) return null;
    const t = {};
    ist.urunler.forEach((u) => { if (u.ciro > 0) t[u.kategori || 'Genel'] = (t[u.kategori || 'Genel'] || 0) + Number(u.ciro); });
    const e = Object.entries(t).sort((a, b) => b[1] - a[1]);
    return { labels: e.map((x) => x[0]), datasets: [{ data: e.map((x) => Math.round(x[1])), backgroundColor: KATEGORI_RENK, borderWidth: 2, borderColor: '#fff' }] };
  }, [ist]);

  const tablo = useMemo(() => {
    if (!ist) return [];
    const toplamCiro = ist.urunler.reduce((a, u) => a + Number(u.ciro), 0) || 1;
    return ist.urunler
      .map((u) => ({ ...u, oran: u.goruntuleme ? (u.al_tik / u.goruntuleme) * 100 : 0, pay: (Number(u.ciro) / toplamCiro) * 100 }))
      .sort((a, b) => (b[sirala] - a[sirala]) || (b.goruntuleme - a.goruntuleme));
  }, [ist, sirala]);

  const raporIndir = async () => {
    try {
      const { ayRaporu, indir } = await import('../lib/excel.js');
      indir(await ayRaporu({ ist, yil, ay, dukkan: ayarlar.dukkan_adi || 'Hırdavat' }), `rapor-${yil}-${String(ay).padStart(2, '0')}.xlsx`);
    } catch (e) { bildir(`Rapor oluşturulamadı: ${e.message}`); }
  };

  const o = ist?.ozet, p = ist?.onceki;
  const oran = (x) => (x?.goruntuleme ? (x.al_tik / x.goruntuleme) * 100 : 0);
  const Baslik = ({ k, children }) => (
    <th className="sag" style={{ cursor: 'pointer' }} onClick={() => setSirala(k)} aria-sort={sirala === k ? 'descending' : undefined}>
      {children}{sirala === k ? ' ▼' : ''}
    </th>
  );

  return (
    <>
      <div className="kutu-bas" style={{ marginBottom: 0 }}>
        <div>
          <h2 style={{ margin: 0, font: '700 32px/1.05 var(--baslik)' }}>{AYLAR[ay - 1]} {yil}</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--soluk)' }}>{buAy ? 'Bu ay, bugüne kadar' : 'Aylık özet'} · önceki ayla kıyaslı</p>
        </div>
        <div className="arac">
          <button className="btn btn-ikon" onClick={() => ayDegis(-1)} aria-label="Önceki ay"><Ok yon="sol" /></button>
          <select className="secim" style={{ minHeight: 44 }} value={`${yil}-${ay}`} onChange={(e) => { const [y, a] = e.target.value.split('-').map(Number); setYil(y); setAy(a); }} aria-label="Ay seç">
            {Array.from({ length: 24 }, (_, i) => new Date(bugun.getFullYear(), bugun.getMonth() - i, 1)).map((d) => (
              <option key={d.toISOString()} value={`${d.getFullYear()}-${d.getMonth() + 1}`}>{AYLAR[d.getMonth()]} {d.getFullYear()}</option>
            ))}
          </select>
          <button className="btn btn-ikon" onClick={() => ayDegis(1)} disabled={buAy} aria-label="Sonraki ay"><Ok /></button>
          <button className="btn" onClick={raporIndir} disabled={!ist}>Raporu Excel'e indir</button>
        </div>
      </div>

      {!ist ? (
        <div className="kpi">{Array.from({ length: 6 }, (_, i) => <div key={i} className="iskelet" style={{ height: 100 }} />)}</div>
      ) : (
        <>
          <div className="kpi">
            <div><span>Ciro (KDV dahil)</span><b>{tl(o.ciro)}</b><Degisim simdi={Number(o.ciro)} once={Number(p.ciro)} para /></div>
            <div><span>Satılan ürün adedi</span><b>{sayi(o.satis_adet)}</b><Degisim simdi={o.satis_adet} once={p.satis_adet} /></div>
            <div><span>Satış sayısı</span><b>{sayi(o.satis_sayisi)}</b><Degisim simdi={o.satis_sayisi} once={p.satis_sayisi} /></div>
            <div><span>Tekil ziyaretçi</span><b>{sayi(o.ziyaretci)}</b><Degisim simdi={o.ziyaretci} once={p.ziyaretci} /></div>
            <div><span>Ürün tıklanma</span><b>{sayi(o.goruntuleme)}</b><Degisim simdi={o.goruntuleme} once={p.goruntuleme} /></div>
            <div><span>"Al" oranı</span><b>{yuzde(oran(o))}</b><em className="notr">{sayi(o.al_tik)} Al tıklaması · önceki ay {yuzde(oran(p))}</em></div>
          </div>

          <div className="grafikler">
            <section className="kutu">
              <h3>Günlük ziyaret ve tıklamalar</h3>
              <div className="grafik"><Line data={trafik} options={{ ...ortakSecenek, scales: { x: { grid: { display: false } }, y: { beginAtZero: true, ticks: { precision: 0 } } } }} /></div>
            </section>
            <section className="kutu">
              <h3>Günlük satış</h3>
              <div className="grafik">
                <Bar data={satis} options={{
                  ...ortakSecenek,
                  plugins: { ...ortakSecenek.plugins, tooltip: { callbacks: { label: (c) => (c.dataset.yAxisID === 'y1' ? `Ciro: ${tl(c.raw)}` : `Adet: ${sayi(c.raw)}`) } } },
                  scales: {
                    x: { grid: { display: false } },
                    y: { beginAtZero: true, ticks: { precision: 0 }, title: { display: true, text: 'Adet' } },
                    y1: { beginAtZero: true, position: 'right', grid: { display: false }, ticks: { callback: (v) => `${sayi(v / 1000)} bin ₺` } },
                  },
                }} />
              </div>
            </section>
            <section className="kutu">
              <h3>En çok tıklanan ürünler</h3>
              <div className="grafik">
                {enCok.labels.length
                  ? <Bar data={enCok} options={{ ...ortakSecenek, indexAxis: 'y', interaction: { mode: 'index', intersect: false, axis: 'y' }, scales: { x: { beginAtZero: true, ticks: { precision: 0 } }, y: { grid: { display: false } } } }} />
                  : <div className="bos">Bu ay tıklama yok.</div>}
              </div>
            </section>
            <section className="kutu">
              <h3>Kategoriye göre ciro</h3>
              <div className="grafik">
                {kategori.labels.length
                  ? <Doughnut data={kategori} options={{ responsive: true, maintainAspectRatio: false, cutout: '62%', plugins: { legend: { position: 'right', labels: { usePointStyle: true, boxWidth: 8 } }, tooltip: { callbacks: { label: (c) => ` ${c.label}: ${tl(c.raw)} (${yuzde((c.raw / c.dataset.data.reduce((a, b) => a + b, 0)) * 100)})` } } } }} />
                  : <div className="bos">Bu ay satış girilmemiş.</div>}
              </div>
            </section>
          </div>

          <section className="kutu">
            <div className="kutu-bas">
              <div>
                <h3 style={{ margin: 0 }}>Ürün bazında performans</h3>
                <p>"Al oranı": ürüne bakanların yüzde kaçı "Al" butonuna bastı. Başlığa tıklayıp sıralayın.</p>
              </div>
            </div>
            <div className="tablo-kap">
              <table className="stack">
                <thead>
                  <tr>
                    <th>Ürün</th>
                    <Baslik k="goruntuleme">Görüntüleme</Baslik>
                    <Baslik k="al_tik">Al tık</Baslik>
                    <Baslik k="oran">Al oranı</Baslik>
                    <Baslik k="satis_adet">Satılan</Baslik>
                    <Baslik k="ciro">Ciro</Baslik>
                    <Baslik k="pay">Ciro payı</Baslik>
                  </tr>
                </thead>
                <tbody>
                  {tablo.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--soluk)' }}>Bu ay için veri yok.</td></tr>}
                  {tablo.map((u) => (
                    <tr key={u.urun_id}>
                      <td data-l="Ürün"><b>{u.ad}</b><br /><small style={{ color: 'var(--soluk)' }}>{u.kod} · {u.kategori}</small></td>
                      <td data-l="Görüntüleme" className="sag">{sayi(u.goruntuleme)}</td>
                      <td data-l="Al tık" className="sag">{sayi(u.al_tik)}</td>
                      <td data-l="Al oranı" className="sag">{yuzde(u.oran)}</td>
                      <td data-l="Satılan" className="sag">{sayi(u.satis_adet)}</td>
                      <td data-l="Ciro" className="sag">{tl(u.ciro)}</td>
                      <td data-l="Ciro payı" className="sag">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                          <div className="oran-cubuk" style={{ width: 70 }}><i style={{ width: `${Math.min(100, u.pay)}%` }} /></div>
                          {yuzde(u.pay)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  );
}
