const canvas = document.getElementById('dalgaCanvas');
const ctx = canvas.getContext('2d');
const kure = document.getElementById('asistanKure');
const durumMetni = document.getElementById('durumMetni');
const btnAc = document.getElementById('btnAc');
const btnKapat = document.getElementById('btnKapat');
const konsolEkran = document.getElementById('konsolEkran');
const mesajFormu = document.getElementById('mesajFormu');
const metinGirdisi = document.getElementById('metinGirdisi');

canvas.width = 200;
canvas.height = 200;

let animasyonIstegi;
let dalgaAcisi = 0;
let sistemAktif = false;
let suAnKonusuyor = false;

let asistanAdi = localStorage.getItem('ai_asistan_adi') || "İsimsiz";
let kullaniciAdi = localStorage.getItem('ai_kullanici_adi') || "Kullanıcı";

let audioContext = null;
let analyser = null;
let mikrofonAkisi = null;
let veriDizisi = null;

function konsolaYaz(mesaj, tip = 'sistem') {
  const p = document.createElement('p');
  p.className = tip === 'sistem' ? 'sistem-mesaj' : 'kullanici-mesaj';
  p.textContent = mesaj;
  
  konsolEkran.appendChild(p);
  konsolEkran.scrollTop = konsolEkran.scrollHeight;
}

async function sesAnaliziniBaslat() {
  try {
    mikrofonAkisi = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const kaynak = audioContext.createMediaStreamSource(mikrofonAkisi);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    kaynak.connect(analyser);
    veriDizisi = new Uint8Array(analyser.frequencyBinCount);
  } catch (e) {
  }
}

function sesAnaliziniDurdur() {
  if (mikrofonAkisi) {
    mikrofonAkisi.getTracks().forEach(track => track.stop());
    mikrofonAkisi = null;
  }
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
  analyser = null;
}

function anlikSesSeviyesiAl() {
  if (!analyser || !veriDizisi) return 0;
  analyser.getByteFrequencyData(veriDizisi);
  let toplam = 0;
  for (let i = 0; i < veriDizisi.length; i++) {
    toplam += veriDizisi.at(i);
  }
  return toplam / veriDizisi.length;
}

function dalgaAnimasyonuCiz(mod) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = mod === 'konusuyor' ? '#00f3ff' : '#00ff88';
  
  ctx.beginPath();

  const merkezX = canvas.width / 2;
  const merkezY = canvas.height / 2;
  const temelYaricap = 55; 
  
  dalgaAcisi += 0.1;

  const canliSes = mod === 'dinliyor' ? anlikSesSeviyesiAl() : 0;
  const sesCarpani = mod === 'konusuyor' ? 14 : Math.max(4, canliSes * 0.45);

  if (mod === 'dinliyor' && canliSes > 10) {
    const olcek = 1.05 + (canliSes / 400);
    kure.style.transform = "scale(" + olcek + ")";
  } else if (mod === 'konusuyor') {
    kure.style.transform = "scale(" + (1.05 + Math.sin(dalgaAcisi) * 0.05) + ")";
  } else {
    kure.style.transform = '';
  }

  for (let i = 0; i < 360; i += 5) {
    const radyan = (i * Math.PI) / 180;
    const dalgaSiddeti = Math.sin(i * 0.08 + dalgaAcisi) * sesCarpani;
    
    const r = temelYaricap + dalgaSiddeti;
    const x = merkezX + r * Math.cos(radyan);
    const y = merkezY + r * Math.sin(radyan);
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  
  ctx.closePath();
  ctx.stroke();
  animasyonIstegi = requestAnimationFrame(() => dalgaAnimasyonuCiz(mod));
}

function animasyonuDurdur() {
  cancelAnimationFrame(animasyonIstegi);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  kure.style.transform = '';
}

function guvenliHesapla(islem) {
  try {
    const temizIslem = islem.replace(/[^0-9+\-*/().]/g, '');
    return Function('"use strict"; return (' + temizIslem + ')')();
  } catch (e) {
    return null;
  }
}

async function havaDurumuGetir() {
  try {
    const lat = 37.0662;
    const lon = 37.3833;
    const url = "https://open-meteo.com" + lat + "&longitude=" + lon + "&current_weather=true";
    const res = await fetch(url);
    const veri = await res.json();
    const sicaklik = veri.current_weather.temperature;
    const ruzgar = veri.current_weather.windspeed;

    return "Dış sensörler senkronize edildi. Şu an hava sıcaklığı " + sicaklik + " santigrat derece, rüzgar hızı saatte " + ruzgar + " kilometre.";
  } catch (e) {
    return "Atmosferik sensör ağına şu an ulaşılamıyor. İnternet bağlantınızı kontrol edin.";
  }
}

const komutHaritasi = [
  {
    anahtarlar: ["youtube aç", "youtube'u aç"],
    islem: () => {
      window.open("https://youtube.com", "_blank");
      return "Siber ağ geçidi açılıyor. YouTube protokolleri başlatıldı.";
    }
  },
  {
    anahtarlar: ["google aç", "google'ı aç"],
    islem: () => {
      window.open("https://google.com", "_blank");
      return "Ana arama motoru veri tabanı yeni sekmede yükleniyor.";
    }
  },
  {
    anahtarlar: ["github aç", "github'ı aç"],
    islem: () => {
      window.open("https://github.com", "_blank");
      return "Geliştirici ana üssü GitHub'a bağlantı kuruluyor.";
    }
  },
  {
    anahtarlar: ["hava", "hava durumu", "sıcaklık"],
    islem: async () => await havaDurumuGetir()
  },
  {
    anahtarlar: ["saat", "zaman"],
    islem: () => {
      const simdi = new Date();
      return "Sistem saatine göre şu an zaman dilimi: " + simdi.getHours() + " saat " + simdi.getMinutes() + " dakika.";
    }
  },
  {
    anahtarlar: ["tarih", "hangi gün", "bugün ayın kaçı"],
    islem: () => {
      const simdi = new Date();
      const aylar = new Array("Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık");
      return "Sistem verilerine göre bugün " + simdi.getDate() + " " + aylar.at(simdi.getMonth()) + " günüdür.";
    }
  },
  {
    anahtarlar: ["merhaba", "selam", "hey", "hello"],
    islem: () => "Merhaba " + kullaniciAdi + ". Ben " + asistanAdi + ". Sistemleriniz güvende, komutlarınızı bekliyorum."
  },
  {
    anahtarlar: ["kimsin", "adın ne", "ismin ne"],
    islem: () => "Benim adım " + asistanAdi + ". Size yardım etmek için tasarlanmış yapay zekayım."
  },
  {
    anahtarlar: ["nasılsın", "durum ne", "sistem nasıl"],
    islem: () => "Tüm siber kalkanlar yüzde yüz kapasitede, çekirdek sıcaklığım optimize durumda. Harikayım " + kullaniciAdi + "!"
  },
  {
    anahtarlar: ["hack", "saldırı", "güvenlik"],
    islem: () => "Güvenlik duvarı tüm portları kilitledi. Herhangi bir sızma girişimi veya tehlike tespit edilmedi."
  },
  {
    anahtarlar: ["yardım", "ne yapabilirsin", "komutlar"],
    islem: () => "Matematik işlemleri yapabilir, canlı hava durumunu söyleyebilir, bana yeni bir isim verebilir veya Google araması yapabilirim."
  }
];

function asistanKonus(metin) {
  window.speechSynthesis.cancel();

  const mesajUtterance = new SpeechSynthesisUtterance(metin);
  mesajUtterance.lang = "tr-TR";
  mesajUtterance.pitch = 1.1;
  mesajUtterance.rate = 1.0;

  mesajUtterance.onstart = () => {
    suAnKonusuyor = true;
    if (recognition) {
      try { recognition.stop(); } catch (e) {}
    }
    kure.classList.add('aktif');
    durumMetni.textContent = asistanAdi + " Konuşuyor...";
    animasyonuDurdur();
    dalgaAnimasyonuCiz('konusuyor');
  };

  mesajUtterance.onend = () => {
    suAnKonusuyor = false;
    animasyonuDurdur();
    if (sistemAktif) {
      durumMetni.textContent = "Dinleme Aktif...";
      dalgaAnimasyonuCiz('dinliyor');
      if (recognition) {
        try { recognition.start(); } catch (e) {}
      }
    } else {
      kure.classList.remove('aktif');
      durumMetni.textContent = "Sistem Hazır";
    }
  };

  window.speechSynthesis.speak(mesajUtterance);
}

async function zekiYapayZekaMotoru(kullaniciMetni) {
  let metin = kullaniciMetni.toLowerCase().trim()
    .replace(/artı|topla/g, "+")
    .replace(/eksi|çıkar/g, "-")
    .replace(/çarpı|çarp/g, "*")
    .replace(/bölü|böl/g, "/")
    .replace(/ile/g, "");

  if (metin.startsWith("adın ") || metin.startsWith("ismin ")) {
    const yeniAd = kullaniciMetni.split(" ").slice(1).join(" ").replace(/olsun/gi, "").trim();
    if (yeniAd.length > 0) {
      asistanAdi = yeniAd.charAt(0).toUpperCase() + yeniAd.slice(1);
      localStorage.setItem('ai_asistan_adi', asistanAdi);
      return "Kimlik protokolü güncellendi. Artık bana " + asistanAdi + " diyebilirsiniz.";
    }
  }

  if (metin.startsWith("benim adım ") || metin.startsWith("adım ")) {
    const yeniKullanici = kullaniciMetni.replace(/benim adım|adım/gi, "").trim();
    if (yeniKullanici.length > 0) {
      kullaniciAdi = yeniKullanici.charAt(0).toUpperCase() + yeniKullanici.slice(1);
      localStorage.setItem('ai_kullanici_adi', kullaniciAdi);
      return "Biyometrik kayıt tamamlandı. Hoş geldiniz " + kullaniciAdi + ".";
    }
  }

  for (const komut of komutHaritasi) {
    if (komut.anahtarlar.some(kelime => metin.includes(kelime))) {
      return await komut.islem(metin);
    }
  }

  if (metin.includes("ara") || metin.includes("sorgula") || metin.includes("kimdir") || metin.includes("nedir")) {
    let aramaTerimi = metin
      .replace(/siber uzayda|ara|sorgula|nedir/g, "")
      .trim();

    if (aramaTerimi.length > 0) {
      const guvenliURL = "https://google.com/search?q=" + encodeURIComponent(aramaTerimi);
      window.open(guvenliURL, "_blank");
return aramaTerimi + " verisi siber uzay ağında taranıyor. Sonuçlar yeni sekmede listelendi.";
}
}

const matematikReg = new RegExp("[0-9\\s+*/()-]+", "g");
const eslesenMatematik = metin.match(matematikReg);
const ilkEslesme = eslesenMatematik ? eslesenMatematik.at(0) : null;
if (ilkEslesme && ilkEslesme.replace(/\s/g, "").length >= 3) {
const temizMetin = ilkEslesme.replace(/\s/g, "");
if (!isNaN(temizMetin.charAt(0))) {
const sonuc = guvenliHesapla(temizMetin);
if (sonuc !== null && !isNaN(sonuc) && isFinite(sonuc)) {
return "Kuantum işlemcilerim hesaplamayı tamamladı. " + temizMetin + " işleminin sonucu: " + sonuc + ".";
}
}
}

const jenerikCevaplar = new Array(
kullaniciMetni + " verisini ana bellek havuzumda taradım. Güvenlik protokolleri gereği işleniyor.",
"Anlaşıldı " + kullaniciAdi + ". Analiz motorlarım bu konu üzerinde çalışıyor, siber ağ akışı stabil.",
"Söylediğin kelimeleri kuantum veri tabanımda eşleştirdim. Her şey kontrol altında " + kullaniciAdi + "."
);
const rastgeleIndex = Math.floor(Math.random() * jenerikCevaplar.length);
return jenerikCevaplar.at(rastgeleIndex);
}
async function komutuIsle(hamMetin) {
if (!hamMetin) return;
konsolaYaz("[" + kullaniciAdi + "] " + hamMetin, 'kullanici');
const cevap = await zekiYapayZekaMotoru(hamMetin);
konsolaYaz("[" + asistanAdi + "] " + cevap, 'sistem');
asistanKonus(cevap);
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
if (!SpeechRecognition) {
konsolaYaz("[Bilgi] Ses tanıma desteklenmiyor. Aşağıdaki metin kutusunu kullanabilirsiniz.");
btnAc.disabled = true;
} else {
recognition = new SpeechRecognition();
recognition.lang = 'tr-TR';
recognition.continuous = true;
recognition.interimResults = false;
recognition.onresult = async (event) => {
if (suAnKonusuyor) return;
const sonIndex = event.results.length - 1;
const sonucSatiri = event.results.item(sonIndex);
const alternatif = sonucSatiri ? sonucSatiri.item(0) : null;
const kullaniciMetni = alternatif ? alternatif.transcript.trim() : "";
await komutuIsle(kullaniciMetni);
};
recognition.onend = () => {
if (sistemAktif && !suAnKonusuyor) {
try { recognition.start(); } catch (e) {}
}
};
recognition.onerror = (event) => {
if (event.error === 'not-allowed') {
konsolaYaz("[Uyarı] Mikrofon izni kapalı. Aşağıdaki kutudan yazarak komut verebilirsiniz.");
}
};
}
mesajFormu.addEventListener('submit', async (e) => {
e.preventDefault();
const girilenYazi = metinGirdisi.value.trim();
if (!girilenYazi) return;
metinGirdisi.value = "";
await komutuIsle(girilenYazi);
});
btnAc.addEventListener('click', async () => {
if (!recognition) return;
try {
sistemAktif = true;
await sesAnaliziniBaslat();
recognition.start();
durumMetni.textContent = "Dinleme Aktif...";
kure.classList.add('aktif');
animasyonuDurdur();
dalgaAnimasyonuCiz('dinliyor');
konsolaYaz("[" + asistanAdi + "] Sizi dinliyorum...");
} catch (hata) {
konsolaYaz("[Hata] Mikrofon zaten aktif veya erişim reddedildi.");
}
});
btnKapat.addEventListener('click', () => {
sistemAktif = false;
suAnKonusuyor = false;
sesAnaliziniDurdur();
if (recognition) {
try { recognition.stop(); } catch (e) {}
}
window.speechSynthesis.cancel();
animasyonuDurdur();
kure.classList.remove('aktif');
durumMetni.textContent = "Sistem Uykuda";
konsolaYaz("[" + asistanAdi + "] Tüm protokoller kapatıldı.");
});