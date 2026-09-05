/* BattleQuiz - Animals & Nature.
 * Each entry carries both languages; `c` is the index of the correct option
 * in BOTH arrays, and `d` is the difficulty level 1-8.
 */
window.BANK = window.BANK || [];
window.BANK.push(
  { id:"nat001", t:"nature", d:1, c:0, en:{q:"Which animal says \"moo\"?",a:["Cow","Dog","Cat","Duck"]}, tr:{q:"Hangi hayvan \"mö\" diye ses çıkarır?",a:["İnek","Köpek","Kedi","Ördek"]} },
  { id:"nat002", t:"nature", d:1, c:0, en:{q:"How many legs does a spider have?",a:["Eight","Six","Four","Ten"]}, tr:{q:"Bir örümceğin kaç bacağı vardır?",a:["Sekiz","Altı","Dört","On"]} },
  { id:"nat003", t:"nature", d:2, c:0, en:{q:"Which animal is famous for its very long neck?",a:["Giraffe","Camel","Horse","Deer"]}, tr:{q:"Hangi hayvan çok uzun boynuyla ünlüdür?",a:["Zürafa","Deve","At","Geyik"]} },
  { id:"nat004", t:"nature", d:2, c:0, en:{q:"What do bees make in their hive?",a:["Honey","Milk","Silk","Butter"]}, tr:{q:"Arılar kovanlarında ne üretir?",a:["Bal","Süt","İpek","Tereyağı"]} },
  { id:"nat005", t:"nature", d:3, c:0, en:{q:"Which of these animals is a mammal?",a:["Dolphin","Shark","Crocodile","Eagle"]}, tr:{q:"Bu hayvanlardan hangisi memelidir?",a:["Yunus","Köpekbalığı","Timsah","Kartal"]} },
  { id:"nat006", t:"nature", d:3, c:0, en:{q:"Which stage does a caterpillar pass through before becoming a butterfly?",a:["Pupa","Egg","Larva","Nymph"]}, tr:{q:"Tırtıl kelebeğe dönüşmeden önce hangi evreden geçer?",a:["Pupa (koza)","Yumurta","Larva","Nimf"]} },
  { id:"nat007", t:"nature", d:3, c:0, en:{q:"Which is the largest animal living on land?",a:["African elephant","Giraffe","Rhinoceros","Hippopotamus"]}, tr:{q:"Karada yaşayan en büyük hayvan hangisidir?",a:["Afrika fili","Zürafa","Gergedan","Su aygırı"]} },
  { id:"nat008", t:"nature", d:4, c:0, en:{q:"Which is the fastest land animal?",a:["Cheetah","Lion","Horse","Gazelle"]}, tr:{q:"En hızlı kara hayvanı hangisidir?",a:["Çita","Aslan","At","Ceylan"]} },
  { id:"nat009", t:"nature", d:4, c:0, en:{q:"Where do polar bears live in the wild?",a:["The Arctic","Antarctica","The Sahara","The Amazon"]}, tr:{q:"Kutup ayıları doğada nerede yaşar?",a:["Kuzey Kutbu","Antarktika","Sahra Çölü","Amazon"]} },
  { id:"nat010", t:"nature", d:4, c:0, en:{q:"Which of these is a reptile?",a:["Tortoise","Frog","Whale","Penguin"]}, tr:{q:"Bunlardan hangisi sürüngendir?",a:["Kaplumbağa","Kurbağa","Balina","Penguen"]} },
  { id:"nat011", t:"nature", d:5, c:0, en:{q:"Which mammal lays eggs?",a:["Platypus","Bat","Mole","Squirrel"]}, tr:{q:"Hangi memeli yumurtlar?",a:["Ornitorenk","Yarasa","Köstebek","Sincap"]} },
  { id:"nat012", t:"nature", d:5, c:0, en:{q:"Which sea creature has three hearts?",a:["Octopus","Jellyfish","Starfish","Sea turtle"]}, tr:{q:"Hangi deniz canlısının üç kalbi vardır?",a:["Ahtapot","Denizanası","Denizyıldızı","Deniz kaplumbağası"]} },
  { id:"nat013", t:"nature", d:5, c:0, en:{q:"What is a group of lions called?",a:["A pride","A pack","A herd","A flock"]}, tr:{q:"Aslan topluluğuna ne ad verilir?",a:["Sürü (pride)","Kürek","Kervan","Küme"]} },
  { id:"nat014", t:"nature", d:6, c:0, en:{q:"Which tree species is the tallest in the world?",a:["Coast redwood","Douglas fir","Eucalyptus","Sitka spruce"]}, tr:{q:"Dünyanın en uzun ağaç türü hangisidir?",a:["Sahil sekoyası","Douglas göknarı","Okaliptüs","Sitka ladini"]} },
  { id:"nat015", t:"nature", d:6, c:0, en:{q:"Which mammal is thought to have the longest lifespan?",a:["Bowhead whale","African elephant","Blue whale","Human"]}, tr:{q:"En uzun yaşadığı düşünülen memeli hangisidir?",a:["Grönland balinası","Afrika fili","Mavi balina","İnsan"]} },
  { id:"nat016", t:"nature", d:6, c:0, en:{q:"What is the process by which a caterpillar becomes a butterfly called?",a:["Metamorphosis","Mitosis","Migration","Mutation"]}, tr:{q:"Tırtılın kelebeğe dönüşme sürecine ne ad verilir?",a:["Başkalaşım (metamorfoz)","Mitoz","Göç","Mutasyon"]} },
  { id:"nat017", t:"nature", d:7, c:0, en:{q:"Which bird makes the longest annual migration?",a:["Arctic tern","Albatross","Swift","Barn swallow"]}, tr:{q:"Hangi kuş yılda en uzun göçü yapar?",a:["Kuzey sumrusu","Albatros","Ebabil","Kır kırlangıcı"]} },
  { id:"nat018", t:"nature", d:7, c:0, en:{q:"What is the name for an animal that is active mainly at dawn and dusk?",a:["Crepuscular","Nocturnal","Diurnal","Sedentary"]}, tr:{q:"Ağırlıklı olarak şafak ve alacakaranlıkta faal olan hayvanlara ne denir?",a:["Krepüsküler","Noktürnal","Diürnal","Sedanter"]} },
  { id:"nat019", t:"nature", d:8, c:0, en:{q:"Which symbiotic pairing forms a lichen?",a:["A fungus and an alga","Two fungi","A moss and a fern","A bacterium and a moss"]}, tr:{q:"Bir liken hangi ortak yaşam ikilisinden oluşur?",a:["Bir mantar ve bir alg","İki mantar","Bir yosun ve bir eğrelti","Bir bakteri ve bir yosun"]} },
  { id:"nat020", t:"nature", d:8, c:0, en:{q:"Which animal group does the phylum Echinodermata contain?",a:["Starfish and sea urchins","Crabs and lobsters","Snails and clams","Corals and jellyfish"]}, tr:{q:"Derisidikenliler (Echinodermata) şubesi hangi hayvanları kapsar?",a:["Denizyıldızı ve deniz kestanesi","Yengeç ve ıstakoz","Salyangoz ve midye","Mercan ve denizanası"]} }
);
