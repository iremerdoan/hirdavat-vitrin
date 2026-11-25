import React, { Suspense, lazy, useEffect, useState } from 'react';
import Vitrin from './vitrin/Vitrin.jsx';

// Yönetim paneli ayrı yüklenir; vitrine gelen müşteri bu kodu hiç indirmez.
const Yonetim = lazy(() => import('./yonetim/Yonetim.jsx'));

const hashOku = () => decodeURIComponent(window.location.hash.slice(1));

export default function App() {
  const [hash, setHash] = useState(hashOku);

  useEffect(() => {
    const f = () => setHash(hashOku());
    window.addEventListener('hashchange', f);
    return () => window.removeEventListener('hashchange', f);
  }, []);

  if (hash === 'yonetim' || hash.startsWith('yonetim-')) {
    return (
      <Suspense fallback={<div className="yukleniyor">Yönetim paneli yükleniyor…</div>}>
        <Yonetim />
      </Suspense>
    );
  }
  return <Vitrin hash={hash} />;
}
