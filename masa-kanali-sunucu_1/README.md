# Masa Kanalı

Çok oyunculu 3D kanal oyunu. Herkes yuvarlak masanın etrafında bir motoru yönetir. Masayı kapanlara değdirmeden bitişe birlikte götürürsünüz. Oyuncuların hesap açması ya da giriş yapması gerekmez: linki açan oynar.

## İçindekiler

- `server.js`: sayfayı sunar ve aynı oda kodundaki oyuncular arasında mesajları aktarır (WebSocket).
- `public/index.html`: oyunun kendisi.
- `render.yaml`: Render.com için hazır ayar.

## Bilgisayarında denemek

Node.js 18 veya üstü gerekir.

```
npm install
npm start
```

Sonra tarayıcıda `http://localhost:3000` adresini aç. Aynı ağdaki biri `http://<bilgisayarının-IP-adresi>:3000` ile katılabilir.

## İnternette yayınlamak (Render.com, ücretsiz)

1. Bu klasörü bir GitHub deposuna yükle (`node_modules` klasörü olmadan).
2. https://render.com adresinde ücretsiz hesap aç ve GitHub hesabını bağla.
3. **New → Blueprint** seç ve depoyu göster. Render `render.yaml` dosyasını okuyup her şeyi kendisi kurar.
   Blueprint yerine **New → Web Service** seçersen şunları gir:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance Type: Free
4. Birkaç dakika sonra `https://masa-kanali-xxxx.onrender.com` gibi bir adres verir. Bu linki arkadaşlarına gönder.

Not: Render'ın ücretsiz planında sunucu 15 dakika kimse girmezse uyur. İlk giren kişi için sayfanın açılması 30 ila 60 saniye sürebilir, sonrası normal hızdadır.

Railway, Fly.io ya da kendi sunucun da olur: `npm install` ve `npm start` yeterli. Sunucu `PORT` ortam değişkenindeki portu dinler.

## Nasıl oynanır

1. Adını yaz, karakterini seç: ten, saç modeli ve rengi, göz rengi, vücut tipi, tişört, pantolon, aksesuar.
2. Biri **Oda kur** desin. Lobide **Davet linkini kopyala** ile linki diğerlerine gönderin. Diğerleri **Açık odalar** listesinden de girebilir.
3. Kaptan (odayı kuran) bölümü seçip başlatır.
4. **W/S** motor gücü, **A/D** motoru çevirir. Telefonda ekrandaki düğmeler çıkar.

Oyunun hesaplaması kaptanın tarayıcısında döner. Kaptan çıkarsa sıradaki oyuncu kaldığı yerden devralır. Bir odada en fazla 8 kişi olabilir.
