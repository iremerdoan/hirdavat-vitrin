# Hırdavat Toptan Vitrin

Çevredeki hırdavatçıların ürünleri görüp WhatsApp'tan sipariş verdiği vitrin sitesi ve dükkan sahibinin yönetim paneli. Telefonda ve bilgisayarda çalışır.

## Neler var?

**Vitrin (müşteriler, şifresiz)**
- Ürün listesi: solda fotoğraf, sağda kod, ad, fiyat (+KDV), KDV dahil fiyat, stok durumu
- Ürüne tıklayınca detay: fotoğraf galerisi, açıklama, adet seçimi, KDV dökümü
- **Al** butonu → WhatsApp'ta hazır sipariş mesajı açılır (ürün, kod, adet, fiyat)
- Ana sayfada **en çok satanlar** (son 90 gün)
- Arama, kategori, sıralama, "sadece stoktakiler"
- Alt bilgide **bugün / bu ay / toplam ziyaretçi** ve **en çok bakılan ürünler**

**Yönetim paneli (sadece dükkan sahibi, e-posta + şifre)** — adres: `siteadi.com/#yonetim`
- **İstatistik:** aylık ciro, satılan adet, ziyaretçi, tıklanma, "Al" oranı; önceki ayla kıyas; 4 grafik; ürün bazında tablo; raporu Excel'e indirme
- **Ürünler:** ekle / düzenle / sil, fotoğraf yükleme, hızlı stok +/−, az kalan ve tükenen filtresi
- **Satışlar:** WhatsApp'ta kesinleşen satışı gir → stok otomatik düşer, istatistiğe yansır; aylık satış listesi Excel'e
- **Excel:** tüm ürünleri Excel'e indir, Excel'de düzenle, geri yükle (koda göre: varsa günceller, yoksa ekler; önce önizleme gösterir)
- **Ayarlar:** dükkan adı, WhatsApp numarası, adres, çalışma saatleri

## Teknoloji

| Parça | Ne işe yarıyor | Ücret |
|---|---|---|
| **React + Vite** | Sitenin kendisi (`src/` klasörü) | Ücretsiz |
| **Supabase** | Veritabanı, giriş/şifre, fotoğraf deposu | Ücretsiz plan yeterli (500 MB veri, 1 GB fotoğraf) |
| **Vercel** | Siteyi internette yayınlama | Ücretsiz |
| **GitHub** | Kodun durduğu yer; her `push`ta Vercel siteyi günceller | Ücretsiz |
| Alan adı (isteğe bağlı) | `demirhirdavat.com` gibi | Yılda ~300–600 ₺ |

Supabase bilgileri girilmezse site **demo modunda** açılır: örnek ürünler, veriler sadece o tarayıcıda tutulur. Demo yönetim girişi: `sahip@demo.com` / `123456`.

## Bilgisayarda çalıştırma

1. [Node.js](https://nodejs.org) LTS sürümünü kur.
2. Bu klasörde terminal aç (VS Code > Terminal):
   ```bash
   npm install
   npm run dev
   ```
3. Tarayıcıda `http://localhost:5173` aç. Yönetim: `http://localhost:5173/#yonetim`

## Gerçek veritabanına bağlama (Supabase)

1. [supabase.com](https://supabase.com) → GitHub ile giriş → **New project**. Bölge: **Central EU (Frankfurt)**. Veritabanı şifresini bir yere not et.
2. Sol menü **SQL Editor** → **New query** → `supabase/schema.sql` dosyasının tamamını yapıştır.
   En alttaki `BURAYA-SAHIBIN-EPOSTASI@ornek.com` yerine dükkan sahibinin e-postasını yaz → **Run**.
3. **Authentication → Users → Add user → Create new user**: aynı e-posta ve güçlü bir şifre, "Auto confirm user" işaretli.
4. **Authentication → Sign In / Providers → Email**: "Allow new users to sign up" seçeneğini **kapat** (başkası hesap açamasın).
5. **Project Settings → API**: `Project URL` ve `anon public` anahtarını kopyala.
6. Proje klasöründe `.env.example` dosyasını kopyalayıp adını `.env` yap, iki değeri yapıştır:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
7. `npm run dev` ile tekrar aç. Demo şeridi kaybolur; ürünleri artık panelden (ya da Excel'den) ekleyebilirsin.

> `anon` anahtarının sitede görünmesi normaldir; güvenliği veritabanındaki kurallar (RLS) sağlar. **service_role** anahtarını asla siteye koyma.

## İnternette yayınlama (Vercel)

1. GitHub'da yeni bir repo aç (örn. `hirdavat-vitrin`) ve kodu gönder:
   ```bash
   git init
   git add .
   git commit -m "İlk sürüm"
   git branch -M main
   git remote add origin https://github.com/iremerdoan/hirdavat-vitrin.git
   git push -u origin main
   ```
   (`.env` dosyası `.gitignore`'da olduğu için GitHub'a gitmez.)
2. [vercel.com](https://vercel.com) → GitHub ile giriş → **Add New → Project** → repoyu seç.
   Framework: **Vite** (kendisi bulur).
3. **Environment Variables** kısmına `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` ekle → **Deploy**.
4. Birkaç dakika sonra `hirdavat-vitrin.vercel.app` gibi bir adres verir. Bundan sonra her `git push` siteyi otomatik günceller.
5. Alan adı alırsan: Vercel → Project → **Settings → Domains** → alan adını ekle, verdiği DNS kayıtlarını alan adını aldığın firmaya gir.

Alternatif: Netlify veya Cloudflare Pages da aynı şekilde çalışır (build komutu `npm run build`, klasör `dist`).

## Excel ile çalışma

- **Excel'e indir:** Panel → Excel → "Ürünleri Excel'e indir". Dosya filtreli ve biçimlidir.
- **Excel'den yükle:** Dosyayı düzenle (yeni satır ekle, fiyat/stok değiştir) → kaydet → panele sürükle → önizlemeyi kontrol et → İçeri aktar.
- Eşleştirme **Kod** sütunuyla yapılır. Boş bırakılan hücre mevcut bilgiyi silmez. "Vitrinde" sütununa `Hayır` yazmak ürünü gizler.
- Resim eklemek için "Resim Linkleri" sütununa `https://...` linkleri yazılabilir; en kolayı fotoğrafları panelden yüklemektir.

## Klasör yapısı

```
src/
  App.jsx                 Vitrin / yönetim arasında geçiş (#yonetim)
  styles.css              Bütün tasarım
  vitrin/                 Müşteri tarafı (liste, detay, alt bilgi, WhatsApp mesajı)
  yonetim/                Panel (giriş, istatistik, ürünler, satışlar, excel, ayarlar)
  lib/
    api.js                Tek giriş noktası: Supabase varsa onu, yoksa demoyu kullanır
    supabaseApi.js        Gerçek veritabanı işlemleri
    demoApi.js            Demo verileri (tarayıcıda)
    excel.js              Excel okuma/yazma
    hesap.js              Demo için istatistik hesapları
    format.js             TL, KDV, tarih, WhatsApp linki yardımcıları
supabase/schema.sql       Tablolar, güvenlik kuralları, istatistik fonksiyonları
```

## Bilinmesi gerekenler

- **Satış sayıları dükkan sahibinin girdiği satışlardan gelir.** Sipariş WhatsApp'ta konuşulduğu için site satışın kesinleştiğini kendisi bilemez; "Al" tıklamaları ayrıca sayılır.
- Ziyaretçi sayacı her tarayıcıya isimsiz bir kimlik verir; kişisel bilgi veya IP tutulmaz. Aynı kişi gün içinde birkaç kez girse 1 sayılır.
- Kritik stok sınırı `src/lib/format.js` içindeki `KRITIK_STOK` (varsayılan 5).
- Supabase ücretsiz planında proje 1 hafta hiç kullanılmazsa uykuya geçer; panelden tek tıkla uyanır. Düzenli kullanılan bir sitede sorun olmaz.
