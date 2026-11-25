// Tek giriş noktası: Supabase bilgisi varsa gerçek veritabanı, yoksa demo (tarayıcı içi) kullanılır.
// Bütün bileşenler sadece buradaki `api` nesnesini çağırır.
import { DEMO } from './config.js';

let impl;
async function yukle() {
  if (!impl) {
    impl = DEMO ? (await import('./demoApi.js')).default : (await import('./supabaseApi.js')).default;
  }
  return impl;
}

export const api = new Proxy({}, {
  get: (_, ad) => async (...args) => (await yukle())[ad](...args),
});
