// Demo ürünleri için çizim görseller (gerçek sitede ürün fotoğrafları yüklenir).
const C = { celik: '#5b6b7c', koyu: '#1f2a36', turuncu: '#f26a1b', sari: '#f5b301', mavi: '#12355b', acik: '#c9d3dd', kirmizi: '#d33b2c', yesil: '#2f8f5b', bakir: '#c4703b' };

const sekiller = {
  vida: `<ellipse cx="100" cy="52" rx="34" ry="12" fill="${C.celik}"/><rect x="66" y="40" width="68" height="12" fill="${C.celik}"/><ellipse cx="100" cy="40" rx="34" ry="12" fill="${C.acik}"/><path d="M92 40h16M100 32v16" stroke="${C.koyu}" stroke-width="5"/><path d="M86 52h28v86l-14 26-14-26z" fill="${C.celik}"/>${[64, 80, 96, 112, 128].map((y) => `<path d="M84 ${y}l32 8" stroke="${C.acik}" stroke-width="4"/>`).join('')}`,
  matkap: `<rect x="40" y="58" width="96" height="42" rx="14" fill="${C.turuncu}"/><rect x="74" y="96" width="30" height="62" rx="8" fill="${C.koyu}"/><rect x="66" y="150" width="50" height="22" rx="6" fill="${C.turuncu}"/><rect x="136" y="68" width="18" height="22" rx="3" fill="${C.koyu}"/><rect x="154" y="75" width="30" height="8" fill="${C.celik}"/><rect x="50" y="66" width="22" height="26" rx="4" fill="${C.koyu}" opacity=".35"/>`,
  cekic: `<rect x="92" y="62" width="18" height="110" rx="6" fill="${C.bakir}"/><rect x="92" y="130" width="18" height="42" rx="6" fill="${C.koyu}"/><path d="M50 40h80l24 10v18l-24 6H50z" fill="${C.celik}"/><path d="M50 40h80v10H50z" fill="${C.acik}"/><path d="M50 40c-14 6-18 22-14 34l14-4z" fill="${C.celik}"/>`,
  boya: `<path d="M56 62h88v96c0 8-20 14-44 14s-44-6-44-14z" fill="${C.acik}"/><ellipse cx="100" cy="62" rx="44" ry="12" fill="${C.celik}"/><ellipse cx="100" cy="62" rx="36" ry="8" fill="${C.mavi}"/><rect x="56" y="92" width="88" height="44" fill="${C.mavi}"/><path d="M60 62c0-34 80-34 80 0" stroke="${C.koyu}" stroke-width="4" fill="none"/><path d="M84 106h32" stroke="#fff" stroke-width="6" stroke-linecap="round"/>`,
  kablo: `<circle cx="100" cy="100" r="60" fill="${C.koyu}"/><circle cx="100" cy="100" r="50" fill="${C.kirmizi}"/>${[42, 34, 26].map((r) => `<circle cx="100" cy="100" r="${r}" fill="none" stroke="#8e2219" stroke-width="3"/>`).join('')}<circle cx="100" cy="100" r="14" fill="${C.acik}"/><path d="M150 120c20 10 24 30 14 46" stroke="${C.kirmizi}" stroke-width="7" fill="none" stroke-linecap="round"/>`,
  musluk: `<rect x="40" y="120" width="120" height="16" rx="4" fill="${C.celik}"/><rect x="84" y="70" width="26" height="54" rx="6" fill="${C.acik}"/><path d="M110 82h30c12 0 18 8 18 18v14h-20v-12h-28z" fill="${C.acik}"/><rect x="70" y="56" width="54" height="14" rx="7" fill="${C.koyu}"/><path d="M148 122c0 10-6 18-6 22a6 6 0 0012 0c0-4-6-12-6-22" fill="#5aa9e6"/>`,
  metre: `<rect x="42" y="52" width="96" height="96" rx="22" fill="${C.sari}"/><circle cx="90" cy="100" r="26" fill="${C.koyu}"/><circle cx="90" cy="100" r="10" fill="${C.sari}"/><rect x="136" y="128" width="40" height="16" fill="#ffe37a"/>${[142, 150, 158, 166].map((x) => `<path d="M${x} 128v7" stroke="${C.koyu}" stroke-width="2"/>`).join('')}<rect x="176" y="124" width="6" height="24" fill="${C.celik}"/>`,
  pense: `<path d="M86 30l14 70 14-70z" fill="${C.celik}"/><circle cx="100" cy="98" r="10" fill="${C.koyu}"/><path d="M94 104L62 176h18l20-62z" fill="${C.turuncu}"/><path d="M106 104l32 72h-18l-20-62z" fill="${C.kirmizi}"/>`,
  ampul: `<path d="M100 36c-28 0-46 20-46 44 0 22 18 30 22 50h48c4-20 22-28 22-50 0-24-18-44-46-44z" fill="#ffe37a"/><path d="M88 120l6-30h12l6 30" stroke="${C.bakir}" stroke-width="3" fill="none"/><rect x="76" y="132" width="48" height="10" rx="3" fill="${C.celik}"/><rect x="78" y="144" width="44" height="10" rx="3" fill="${C.acik}"/><rect x="84" y="156" width="32" height="12" rx="5" fill="${C.koyu}"/>`,
  priz: `<rect x="44" y="44" width="112" height="112" rx="20" fill="#fff" stroke="${C.acik}" stroke-width="4"/><circle cx="100" cy="100" r="38" fill="#eef1f4"/><circle cx="84" cy="100" r="7" fill="${C.koyu}"/><circle cx="116" cy="100" r="7" fill="${C.koyu}"/><rect x="94" y="64" width="12" height="8" rx="2" fill="${C.celik}"/><rect x="94" y="128" width="12" height="8" rx="2" fill="${C.celik}"/>`,
  anahtar: `<path d="M60 140l60-60" stroke="${C.celik}" stroke-width="22" stroke-linecap="round"/><path d="M118 52a30 30 0 1042 42l-18-6-6-18z" fill="${C.celik}"/><path d="M48 128a22 22 0 1024 24" stroke="${C.celik}" stroke-width="14" fill="none"/><path d="M70 130l50-50" stroke="${C.acik}" stroke-width="4"/>`,
  silikon: `<rect x="58" y="62" width="70" height="96" rx="8" fill="#fff" stroke="${C.acik}" stroke-width="4"/><rect x="58" y="86" width="70" height="44" fill="${C.yesil}"/><path d="M128 100h20l30-6v12l-30-6" fill="${C.acik}"/><rect x="48" y="66" width="10" height="88" rx="3" fill="${C.celik}"/>`,
  dubel: `<path d="M70 70h70l10 15-10 15H70z" fill="${C.sari}"/>${[84, 98, 112, 126].map((x) => `<path d="M${x} 70v30" stroke="#d99a00" stroke-width="4"/>`).join('')}<path d="M60 120h70l10 15-10 15H60z" fill="#e7e2d6"/>${[74, 88, 102, 116].map((x) => `<path d="M${x} 120v30" stroke="#bdb6a6" stroke-width="4"/>`).join('')}`,
  testere: `<path d="M40 70h118v40l-6 6H40z" fill="${C.acik}"/>${Array.from({ length: 12 }, (_, i) => `<path d="M${40 + i * 10} 116l5 8 5-8" fill="${C.acik}"/>`).join('')}<path d="M150 58h20c8 0 12 6 12 12v44c0 6-4 12-12 12h-20z" fill="${C.turuncu}"/><rect x="158" y="74" width="12" height="36" rx="6" fill="#fff"/>`,
};

const zeminler = { vida: '#e8edf2', matkap: '#fdeee4', cekic: '#eef0ec', boya: '#e5edf7', kablo: '#f9e9e7', musluk: '#e7f1f8', metre: '#fdf4dc', pense: '#f6ece6', ampul: '#fdf8e2', priz: '#eceff2', anahtar: '#e8edf2', silikon: '#e7f3ec', dubel: '#f7f3e8', testere: '#f1ede9' };

const onbellek = {};
export function cizim(tur) {
  if (!sekiller[tur]) tur = 'vida';
  if (!onbellek[tur]) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="${zeminler[tur]}"/>${sekiller[tur]}</svg>`;
    onbellek[tur] = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }
  return onbellek[tur];
}

// Resmi olmayan ürünler için boş görsel
export const BOS_GORSEL = `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#eef1f4"/><path d="M70 80h60v50H70z" fill="none" stroke="#a9b6c3" stroke-width="5" stroke-linejoin="round"/><circle cx="88" cy="96" r="7" fill="#a9b6c3"/><path d="M74 126l20-18 14 12 10-8 12 14" fill="none" stroke="#a9b6c3" stroke-width="5" stroke-linejoin="round"/></svg>')}`;

// Ürün resim kaynağı: "demo:matkap" gibi değerler çizime, diğerleri olduğu gibi URL'e döner
export function resimKaynak(r) {
  if (!r) return BOS_GORSEL;
  if (String(r).startsWith('demo:')) return cizim(String(r).slice(5));
  return r;
}
