/* BattleQuiz - Everyday Life.
 * Each entry carries both languages; `c` is the index of the correct option
 * in BOTH arrays, and `d` is the difficulty level 1-8.
 */
window.BANK = window.BANK || [];
window.BANK.push(
  { id:"lif001", t:"life", d:1, c:0, en:{q:"How many days are there in a week?",a:["Seven","Five","Six","Eight"]}, tr:{q:"Bir haftada kaç gün vardır?",a:["Yedi","Beş","Altı","Sekiz"]} },
  { id:"lif002", t:"life", d:1, c:0, en:{q:"Which meal do people usually eat in the morning?",a:["Breakfast","Dinner","Supper","Snack"]}, tr:{q:"İnsanlar genellikle sabah hangi öğünü yer?",a:["Kahvaltı","Akşam yemeği","Gece öğünü","Atıştırmalık"]} },
  { id:"lif003", t:"life", d:2, c:0, en:{q:"How many minutes are there in one hour?",a:["60","100","30","90"]}, tr:{q:"Bir saat kaç dakikadır?",a:["60","100","30","90"]} },
  { id:"lif004", t:"life", d:2, c:0, en:{q:"How many seasons are there in a year?",a:["Four","Two","Three","Six"]}, tr:{q:"Bir yılda kaç mevsim vardır?",a:["Dört","İki","Üç","Altı"]} },
  { id:"lif005", t:"life", d:3, c:0, en:{q:"Which month has 28 or 29 days?",a:["February","April","June","November"]}, tr:{q:"Hangi ay 28 ya da 29 gün çeker?",a:["Şubat","Nisan","Haziran","Kasım"]} },
  { id:"lif006", t:"life", d:3, c:0, en:{q:"How many items are in a dozen?",a:["12","10","6","20"]}, tr:{q:"Bir düzine kaç tanedir?",a:["12","10","6","20"]} },
  { id:"lif007", t:"life", d:3, c:0, en:{q:"What is the currency of Türkiye?",a:["Turkish lira","Euro","Dollar","Dinar"]}, tr:{q:"Türkiye'nin para birimi nedir?",a:["Türk lirası","Euro","Dolar","Dinar"]} },
  { id:"lif008", t:"life", d:4, c:0, en:{q:"Which fruit is the main ingredient of guacamole?",a:["Avocado","Courgette","Broad bean","Green pepper"]}, tr:{q:"Guakamolenin ana malzemesi hangi meyvedir?",a:["Avokado","Kabak","Bakla","Yeşil biber"]} },
  { id:"lif009", t:"life", d:4, c:0, en:{q:"Which vitamin does your skin make when exposed to sunlight?",a:["Vitamin D","Vitamin C","Vitamin A","Vitamin B12"]}, tr:{q:"Cildin güneş ışığında hangi vitamini üretir?",a:["D vitamini","C vitamini","A vitamini","B12 vitamini"]} },
  { id:"lif010", t:"life", d:4, c:0, en:{q:"What is the currency of Japan?",a:["The yen","The won","The yuan","The ringgit"]}, tr:{q:"Japonya'nın para birimi nedir?",a:["Yen","Won","Yuan","Ringgit"]} },
  { id:"lif011", t:"life", d:5, c:0, en:{q:"Which spice, by weight, is the most expensive in the world?",a:["Saffron","Vanilla","Cardamom","Black pepper"]}, tr:{q:"Ağırlık başına dünyanın en pahalı baharatı hangisidir?",a:["Safran","Vanilya","Kakule","Karabiber"]} },
  { id:"lif012", t:"life", d:5, c:0, en:{q:"What is the traditional main ingredient of Turkish menemen?",a:["Eggs","Rice","Lentils","Chickpeas"]}, tr:{q:"Menemenin geleneksel ana malzemesi nedir?",a:["Yumurta","Pirinç","Mercimek","Nohut"]} },
  { id:"lif013", t:"life", d:5, c:0, en:{q:"Roughly how many bones are there in an adult human body?",a:["206","150","300","412"]}, tr:{q:"Yetişkin bir insan vücudunda yaklaşık kaç kemik vardır?",a:["206","150","300","412"]} },
  { id:"lif014", t:"life", d:6, c:0, en:{q:"Which blood type is known as the universal red-cell donor?",a:["O negative","AB positive","A positive","B negative"]}, tr:{q:"Alyuvar bağışında evrensel verici sayılan kan grubu hangisidir?",a:["0 Rh negatif","AB Rh pozitif","A Rh pozitif","B Rh negatif"]} },
  { id:"lif015", t:"life", d:6, c:0, en:{q:"Which organ produces insulin?",a:["The pancreas","The liver","The kidney","The thyroid"]}, tr:{q:"İnsülini hangi organ üretir?",a:["Pankreas","Karaciğer","Böbrek","Tiroit"]} },
  { id:"lif016", t:"life", d:6, c:0, en:{q:"Which country has the most UNESCO World Heritage Sites?",a:["Italy","France","Spain","China"]}, tr:{q:"En fazla UNESCO Dünya Mirası alanına sahip ülke hangisidir?",a:["İtalya","Fransa","İspanya","Çin"]} },
  { id:"lif017", t:"life", d:7, c:0, en:{q:"Which acid is the main component of stomach acid?",a:["Hydrochloric acid","Sulfuric acid","Acetic acid","Citric acid"]}, tr:{q:"Mide asidinin ana bileşeni hangi asittir?",a:["Hidroklorik asit","Sülfürik asit","Asetik asit","Sitrik asit"]} },
  { id:"lif018", t:"life", d:7, c:0, en:{q:"Which language has the most native speakers worldwide?",a:["Mandarin Chinese","English","Spanish","Hindi"]}, tr:{q:"Dünyada en çok ana dili konuşuru olan dil hangisidir?",a:["Mandarin Çincesi","İngilizce","İspanyolca","Hintçe"]} },
  { id:"lif019", t:"life", d:8, c:0, en:{q:"What does the Maillard reaction produce in cooking?",a:["Browning and savoury flavour","Rising dough","Curdled milk","Caramelised sugar only"]}, tr:{q:"Yemekte Maillard tepkimesi neye yol açar?",a:["Kızarma ve lezzetli aroma","Hamurun kabarması","Sütün kesilmesi","Yalnızca şekerin karamelleşmesi"]} },
  { id:"lif020", t:"life", d:8, c:0, en:{q:"On the Scoville scale, what is being measured?",a:["Pungency of chilli peppers","Acidity of vinegar","Sweetness of fruit","Salt content"]}, tr:{q:"Scoville ölçeği neyi ölçer?",a:["Acı biberin acılığını","Sirkenin asitliğini","Meyvenin tatlılığını","Tuz oranını"]} }
);
