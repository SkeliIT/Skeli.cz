-- "Solo" (2016, clip AMEQfe9hWlg): Czech lyrics as written down by Skeli. The song itself comes from V54.
INSERT INTO `lyrics` (`song_id`, `lang`, `words`, `score`)
SELECT s.`id`, 'cs', 'Solo, chci být s tebou solo,
ty a já, jen my dva, celou noc a kolem nás jen tma.
Solo, chci být s tebou solo.

Mizíme pryč, v očích chtíč, nečekej kýč, jsem top dříč, seš top, víš,
chci tě svlíct, chci tě mít, k sobě domů si tě vzít.
Je to šílený, jak jsi víc a víc, už jsme blíž a blíž, mířím níž a níž, stoupám výš a výš,
holka výstavní, všude kérky, piercing, šperky, ne jak ty herky, totálně sexy,
jenom teď nechci, chci ti dát lekci do tvýho života,
dělat to líp, dělat to dýl než ty, co to dělali dřív,
stačí pohled a už vím, co dělat s tím tělem perfektním,
návyková jak pervitin, ve vzduchu cítím endorfin.

Solo, chci být s tebou solo,
ty a já, jen my dva, celou noc a kolem nás jen tma.
Solo, chci být s tebou solo, jedem druhý kolo s grácií jak Zorro,
zvrácenej, a skoro na tebe řvu „toro“, to je holka ono, poslušná na slovo,
dělá to pro svý dobro, piští jako flétna, hraje si s mojí kobrou, pusť mě mezi stehna,
chci si hrát s tou tvou pipkou, a to dlouho, ukázat jí, co proto, chci sex, moje moto,
už od dob, co to došlo do fáze, kdy mi došlo, že dobro ve mně pošlo,
proslov pošli poštou.

Teď jsi solo, chci být s tebou solo,
ty a já, jen my dva, celou noc a kolem nás jen tma.
Solo, chci být s tebou solo,
ty a já, jen my dva, celou noc a kolem nás jen tma.

Solo, chci být s tebou solo, ve vaně vodní pólo,
potopa, ale no co, nemůžu si pomoct, chuť na hlubokej ponor,
bitva Medal of Honor, promovanej doktor,
vím tvý slabý místa: uši, bříško, třísla,
nepřestávej se hýbat, baví mě se na to dívat,
jsem ztracenej případ, postel musí skřípat,
peří bude lítat, šampus musí stříkat,
nemůže si pomoct, musí kousat, škrábat, vzdychat,
nemůžu přestat, jen si to představ, ty její gesta,
pornohvězda číslo jedna, co chce ztrestat, jediná ze sta,
señora ze snů, třída Lexus, tak nás neruš, já si beru dovolenou a tuhle ženu.

Teď jsi solo, chci být s tebou solo,
ty a já, jen my dva, celou noc, ale oba pořád solo stav.', 0
FROM `songs` s
WHERE s.`name` LIKE '%Solo%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'cs')
ORDER BY s.`id`
LIMIT 1;
