// Upozornění před odesláním zprávy, která vypadá jako nabídka drog, zbraní nebo nahých fotek.
// Běží jen v prohlížeči toho, kdo píše: nikam se nic neposílá, nikde se to neukládá a nikdo se to nedozví.
// Hlídá dvojici „prodám / sháním“ + věc, ne samotná slova: o trávě se tu rapuje a o tom si lidi psát můžou.
(function () {
  function clean(text) {
    return String(text).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ');
  }
  // bez háčků a čárek; vietnamština zvlášť, protože bez znamének by se slova pletla (bán = prodat, bạn = přítel)
  var OFFER = '(?:prodam|prodavam|na prodej|koupim|kupim|shanim|seženu|sezenu|nabizim|dodam|sell|selling|for sale|buy|verkaufe|kaufe|biete|продам|продаю|куплю)';
  var SEND = '(?:posli|poslu|posilam|send|schick)';
  // „ganja“ schválně chybí: je to název písně, „prodám ganju“ se chytí
  var GOODS ='(?:trav[auky]{0,2}|weed|ganj[eu]|marihuan\\w*|hul[au]|kokain\\w*|cocaine|koks|pernik|piko|pervitin|meth|mdma|extaz\\w*|ecstasy|heroin\\w*|lsd|houby|fentanyl|amfetamin\\w*|drog[yu]|drugs?|gras|наркотик\\w*|марихуан\\w*|кокаин\\w*|кокаїн\\w*|'
    + 'zbran\\w*|pistol\\w*|guns?|weapons?|waffen?|зброю|зброя|пистолет\\w*|'
    + 'porn\\w*|порно)';
  var NUDES = '(?:nah[eay] fotk\\w*|nahotink\\w*|nudes?|nacktbild\\w*|голі фото)';
  var B = '(?:^|[^\\p{L}\\p{N}])';
  var E = '(?=$|[^\\p{L}\\p{N}])';
  var RULES = [
    new RegExp(B + OFFER + E + '.{0,60}?' + B + '(?:' + GOODS + '|' + NUDES + ')' + E, 'u'),
    new RegExp(B + '(?:' + GOODS + '|' + NUDES + ')' + E + '.{0,60}?' + B + OFFER + E, 'u'),
    new RegExp(B + SEND + E + '.{0,30}?' + B + NUDES + E, 'u')
  ];
  var VI = /(?:^|\s)(?:bán|mua)\s.{0,60}?(?:ma túy|cần sa|súng|khiêu dâm)/u;

  window.chatWarn = function (text) {
    var c = clean(text);
    return RULES.some(function (r) { return r.test(c); }) || VI.test(String(text).toLowerCase());
  };
})();
