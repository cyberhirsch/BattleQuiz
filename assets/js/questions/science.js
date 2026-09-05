/* BattleQuiz - Science & Space.
 * Every question carries both languages; `c` is the index of the correct
 * option in BOTH arrays, and `d` is the difficulty level 1-8.
 */
window.BANK = window.BANK || [];
window.BANK.push(
{ id:"sci01", t:"science", d:1, c:0, en:{q:"What do we call water when it freezes?",a:["Ice","Steam","Sand","Smoke"]}, tr:{q:"Su donunca ona ne denir?",a:["Buz","Buhar","Kum","Duman"]} },
{ id:"sci02", t:"science", d:1, c:0, en:{q:"What colour is the sky on a clear day?",a:["Blue","Green","Red","Brown"]}, tr:{q:"Açık bir günde gökyüzü ne renktir?",a:["Mavi","Yeşil","Kırmızı","Kahverengi"]} },
{ id:"sci03", t:"science", d:2, c:0, en:{q:"Which of these is a liquid?",a:["Water","Stone","Wood","Iron"]}, tr:{q:"Bunlardan hangisi sıvıdır?",a:["Su","Taş","Tahta","Demir"]} },
{ id:"sci04", t:"science", d:2, c:0, en:{q:"What do plants need from the Sun in order to grow?",a:["Light","Sound","Wind","Snow"]}, tr:{q:"Bitkiler büyümek için Güneş'ten neye ihtiyaç duyar?",a:["Işık","Ses","Rüzgâr","Kar"]} },
{ id:"sci05", t:"science", d:3, c:0, en:{q:"What is the chemical formula for water?",a:["H₂O","CO₂","O₂","NaCl"]}, tr:{q:"Suyun kimyasal formülü nedir?",a:["H₂O","CO₂","O₂","NaCl"]} },
{ id:"sci06", t:"science", d:3, c:0, en:{q:"Which planet is known as the Red Planet?",a:["Mars","Venus","Mercury","Jupiter"]}, tr:{q:"Hangi gezegen Kızıl Gezegen olarak bilinir?",a:["Mars","Venüs","Merkür","Jüpiter"]} },
{ id:"sci07", t:"science", d:3, c:0, en:{q:"At what temperature does water boil at sea level?",a:["100 °C","50 °C","120 °C","90 °C"]}, tr:{q:"Deniz seviyesinde su kaç derecede kaynar?",a:["100 °C","50 °C","120 °C","90 °C"]} },
{ id:"sci08", t:"science", d:4, c:0, en:{q:"Which gas do plants take in during photosynthesis?",a:["Carbon dioxide","Oxygen","Nitrogen","Hydrogen"]}, tr:{q:"Bitkiler fotosentez sırasında hangi gazı alır?",a:["Karbondioksit","Oksijen","Azot","Hidrojen"]} },
{ id:"sci09", t:"science", d:4, c:0, en:{q:"Which force pulls objects towards the Earth?",a:["Gravity","Friction","Magnetism","Pressure"]}, tr:{q:"Cisimleri Dünya'ya doğru çeken kuvvet hangisidir?",a:["Yer çekimi","Sürtünme","Manyetizma","Basınç"]} },
{ id:"sci10", t:"science", d:4, c:0, en:{q:"Which part of the blood carries oxygen around the body?",a:["Red blood cells","White blood cells","Platelets","Plasma"]}, tr:{q:"Kanın hangi bölümü vücutta oksijen taşır?",a:["Alyuvarlar","Akyuvarlar","Trombositler","Plazma"]} },
{ id:"sci11", t:"science", d:5, c:0, en:{q:"What is the chemical symbol for gold?",a:["Au","Ag","Go","Gd"]}, tr:{q:"Altının kimyasal sembolü nedir?",a:["Au","Ag","Go","Gd"]} },
{ id:"sci12", t:"science", d:5, c:0, en:{q:"Which gas makes up roughly 78% of Earth's atmosphere?",a:["Nitrogen","Oxygen","Carbon dioxide","Argon"]}, tr:{q:"Dünya atmosferinin yaklaşık %78'ini hangi gaz oluşturur?",a:["Azot","Oksijen","Karbondioksit","Argon"]} },
{ id:"sci13", t:"science", d:5, c:0, en:{q:"How many chambers does the human heart have?",a:["Four","Two","Three","Six"]}, tr:{q:"İnsan kalbinin kaç odacığı vardır?",a:["Dört","İki","Üç","Altı"]} },
{ id:"sci14", t:"science", d:6, c:0, en:{q:"Who developed the general theory of relativity?",a:["Albert Einstein","Niels Bohr","Max Planck","Werner Heisenberg"]}, tr:{q:"Genel görelilik kuramını kim geliştirdi?",a:["Albert Einstein","Niels Bohr","Max Planck","Werner Heisenberg"]} },
{ id:"sci15", t:"science", d:6, c:0, en:{q:"What is the SI unit of force?",a:["Newton","Joule","Watt","Pascal"]}, tr:{q:"Kuvvetin SI birimi nedir?",a:["Newton","Joule","Watt","Pascal"]} },
{ id:"sci16", t:"science", d:6, c:0, en:{q:"Which metal is liquid at room temperature?",a:["Mercury","Lead","Sodium","Tin"]}, tr:{q:"Oda sıcaklığında sıvı hâlde bulunan metal hangisidir?",a:["Cıva","Kurşun","Sodyum","Kalay"]} },
{ id:"sci17", t:"science", d:7, c:0, en:{q:"What is the freezing point of water on the Kelvin scale?",a:["273.15 K","0 K","100 K","373.15 K"]}, tr:{q:"Suyun donma noktası Kelvin ölçeğinde kaçtır?",a:["273,15 K","0 K","100 K","373,15 K"]} },
{ id:"sci18", t:"science", d:7, c:0, en:{q:"Which subatomic particle carries no electric charge?",a:["Neutron","Proton","Electron","Positron"]}, tr:{q:"Hangi atom altı parçacık elektrik yükü taşımaz?",a:["Nötron","Proton","Elektron","Pozitron"]} },
{ id:"sci19", t:"science", d:8, c:0, en:{q:"Which enzyme unwinds the DNA double helix during replication?",a:["Helicase","Ligase","Polymerase","Primase"]}, tr:{q:"DNA çift sarmalını eşlenme sırasında hangi enzim açar?",a:["Helikaz","Ligaz","Polimeraz","Primaz"]} },
{ id:"sci20", t:"science", d:8, c:0, en:{q:"Heisenberg's uncertainty principle limits simultaneous knowledge of which pair?",a:["Position and momentum","Mass and charge","Energy and charge","Spin and mass"]}, tr:{q:"Heisenberg belirsizlik ilkesi hangi ikilinin aynı anda bilinmesini sınırlar?",a:["Konum ve momentum","Kütle ve yük","Enerji ve yük","Spin ve kütle"]} }
);
