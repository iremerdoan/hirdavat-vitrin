// Telefondan çekilen büyük fotoğrafları yüklemeden önce küçültür (hızlı açılır, depoda az yer kaplar)
export async function resimKucult(dosya, enBuyuk = 1200, kalite = 0.82) {
  const url = URL.createObjectURL(dosya);
  try {
    const img = await new Promise((ok, hata) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => hata(new Error('Fotoğraf okunamadı'));
      i.src = url;
    });
    const oran = Math.min(1, enBuyuk / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * oran);
    c.height = Math.round(img.height * oran);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return await new Promise((ok) => c.toBlob(ok, 'image/jpeg', kalite));
  } finally {
    URL.revokeObjectURL(url);
  }
}
