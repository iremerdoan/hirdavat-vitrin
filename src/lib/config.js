export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Supabase bilgileri girilmemişse site demo modunda açılır
export const DEMO = !SUPABASE_URL || !SUPABASE_ANON_KEY;

export const DEMO_GIRIS = { eposta: 'sahip@demo.com', sifre: '123456' };
