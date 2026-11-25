import { tl, kdvDahil, whatsappLink } from '../lib/format.js';

// "Al" butonuna basınca WhatsApp'ta hazır açılan mesaj
export function alMesaji(urun, adet = 1) {
  if (Number(urun.stok) <= 0) {
    return [
      'Merhaba, sitenizden yazıyorum.',
      `"${urun.ad}" (Kod: ${urun.kod}) şu an stokta görünmüyor.`,
      `${adet} ${urun.birim || 'adet'} lazım, ne zaman gelir?`,
    ].join('\n');
  }
  return [
    'Merhaba, sitenizden sipariş vermek istiyorum.',
    `Ürün: ${urun.ad}`,
    `Kod: ${urun.kod}`,
    `Adet: ${adet} ${urun.birim || 'Adet'}`,
    `Birim fiyat: ${tl(urun.fiyat)} + KDV (%${urun.kdv})`,
    `Toplam (KDV dahil): ${tl(kdvDahil(urun.fiyat * adet, urun.kdv))}`,
  ].join('\n');
}

export const alLinki = (telefon, urun, adet) => whatsappLink(telefon, alMesaji(urun, adet));
