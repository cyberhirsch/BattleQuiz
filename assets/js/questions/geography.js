/* BattleQuiz - Geography.
 * Each entry carries both languages; `c` is the index of the correct option
 * in BOTH arrays, and `d` is the difficulty level 1-8.
 */
window.BANK = window.BANK || [];
window.BANK.push(
  { id:"geo001", t:"geography", d:1, c:0, en:{q:"What is a very large area of salt water called?",a:["An ocean","A desert","A forest","A hill"]}, tr:{q:"Çok büyük tuzlu su alanına ne ad verilir?",a:["Okyanus","Çöl","Orman","Tepe"]} },
  { id:"geo002", t:"geography", d:1, c:0, en:{q:"What is very hot, very dry and full of sand?",a:["A desert","A lake","A glacier","A swamp"]}, tr:{q:"Çok sıcak, çok kuru ve kumla dolu olan yer neresidir?",a:["Çöl","Göl","Buzul","Bataklık"]} },
  { id:"geo003", t:"geography", d:2, c:0, en:{q:"What is the capital of Türkiye?",a:["Ankara","Istanbul","Izmir","Bursa"]}, tr:{q:"Türkiye'nin başkenti neresidir?",a:["Ankara","İstanbul","İzmir","Bursa"]} },
  { id:"geo004", t:"geography", d:2, c:0, en:{q:"How many continents are there?",a:["Seven","Five","Six","Eight"]}, tr:{q:"Dünyada kaç kıta vardır?",a:["Yedi","Beş","Altı","Sekiz"]} },
  { id:"geo005", t:"geography", d:3, c:0, en:{q:"Which is the largest ocean on Earth?",a:["The Pacific","The Atlantic","The Indian","The Arctic"]}, tr:{q:"Dünyanın en büyük okyanusu hangisidir?",a:["Büyük Okyanus","Atlas Okyanusu","Hint Okyanusu","Arktik Okyanusu"]} },
  { id:"geo006", t:"geography", d:3, c:0, en:{q:"On how many continents does Türkiye have territory?",a:["Two","One","Three","Four"]}, tr:{q:"Türkiye kaç kıtada birden toprağa sahiptir?",a:["İki","Bir","Üç","Dört"]} },
  { id:"geo007", t:"geography", d:3, c:0, en:{q:"Which is the highest mountain in Türkiye?",a:["Mount Ağrı","Mount Erciyes","Uludağ","Kaçkar"]}, tr:{q:"Türkiye'nin en yüksek dağı hangisidir?",a:["Ağrı Dağı","Erciyes Dağı","Uludağ","Kaçkar Dağı"]} },
  { id:"geo008", t:"geography", d:4, c:0, en:{q:"Which is the longest river in Africa?",a:["The Nile","The Congo","The Niger","The Zambezi"]}, tr:{q:"Afrika'nın en uzun nehri hangisidir?",a:["Nil","Kongo","Nijer","Zambezi"]} },
  { id:"geo009", t:"geography", d:4, c:0, en:{q:"Which continent is the Amazon rainforest on?",a:["South America","Africa","Asia","Australia"]}, tr:{q:"Amazon Ormanları hangi kıtadadır?",a:["Güney Amerika","Afrika","Asya","Avustralya"]} },
  { id:"geo010", t:"geography", d:4, c:0, en:{q:"Which is the largest lake in Türkiye?",a:["Lake Van","Lake Tuz","Lake Beyşehir","Lake Eğirdir"]}, tr:{q:"Türkiye'nin en büyük gölü hangisidir?",a:["Van Gölü","Tuz Gölü","Beyşehir Gölü","Eğirdir Gölü"]} },
  { id:"geo011", t:"geography", d:5, c:0, en:{q:"What is the largest hot desert in the world?",a:["The Sahara","The Gobi","The Kalahari","The Arabian"]}, tr:{q:"Dünyanın en büyük sıcak çölü hangisidir?",a:["Sahra","Gobi","Kalahari","Arabistan Çölü"]} },
  { id:"geo012", t:"geography", d:5, c:0, en:{q:"Which country is the largest in the world by land area?",a:["Russia","Canada","China","The United States"]}, tr:{q:"Yüzölçümü bakımından dünyanın en büyük ülkesi hangisidir?",a:["Rusya","Kanada","Çin","ABD"]} },
  { id:"geo013", t:"geography", d:5, c:0, en:{q:"Which country is famous for its fjords?",a:["Norway","Finland","Denmark","Iceland"]}, tr:{q:"Hangi ülke fiyortlarıyla ünlüdür?",a:["Norveç","Finlandiya","Danimarka","İzlanda"]} },
  { id:"geo014", t:"geography", d:6, c:0, en:{q:"What is the capital of Australia?",a:["Canberra","Sydney","Melbourne","Perth"]}, tr:{q:"Avustralya'nın başkenti neresidir?",a:["Canberra","Sidney","Melbourne","Perth"]} },
  { id:"geo015", t:"geography", d:6, c:0, en:{q:"What is the world's largest island?",a:["Greenland","New Guinea","Borneo","Madagascar"]}, tr:{q:"Dünyanın en büyük adası hangisidir?",a:["Grönland","Yeni Gine","Borneo","Madagaskar"]} },
  { id:"geo016", t:"geography", d:6, c:0, en:{q:"What is the capital of Canada?",a:["Ottawa","Toronto","Vancouver","Montreal"]}, tr:{q:"Kanada'nın başkenti neresidir?",a:["Ottawa","Toronto","Vancouver","Montreal"]} },
  { id:"geo017", t:"geography", d:7, c:0, en:{q:"Which mountain range is traditionally taken as the border between Europe and Asia?",a:["The Urals","The Caucasus","The Alps","The Carpathians"]}, tr:{q:"Avrupa ile Asya arasındaki sınır geleneksel olarak hangi sıradağlar kabul edilir?",a:["Ural Dağları","Kafkas Dağları","Alpler","Karpatlar"]} },
  { id:"geo018", t:"geography", d:7, c:0, en:{q:"Which body of water sits at the lowest land elevation on Earth?",a:["The Dead Sea","The Caspian Sea","Lake Assal","The Salton Sea"]}, tr:{q:"Yeryüzünün en alçak noktasındaki su kütlesi hangisidir?",a:["Ölü Deniz","Hazar Denizi","Assal Gölü","Salton Gölü"]} },
  { id:"geo019", t:"geography", d:8, c:0, en:{q:"Which strait separates the Arabian Peninsula from the Horn of Africa?",a:["Bab-el-Mandeb","The Bosphorus","The Strait of Hormuz","The Strait of Malacca"]}, tr:{q:"Arap Yarımadası'nı Afrika Boynuzu'ndan ayıran boğaz hangisidir?",a:["Bab-ül Mendep","İstanbul Boğazı","Hürmüz Boğazı","Malakka Boğazı"]} },
  { id:"geo020", t:"geography", d:8, c:0, en:{q:"Which is the only country to border both the Atlantic Ocean and the Indian Ocean along the African mainland?",a:["South Africa","Egypt","Morocco","Somalia"]}, tr:{q:"Afrika anakarasında hem Atlas hem Hint Okyanusu'na kıyısı olan tek ülke hangisidir?",a:["Güney Afrika","Mısır","Fas","Somali"]} }
);
