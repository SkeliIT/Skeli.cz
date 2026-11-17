# Premiéry na Skeli.cz: vývojový plán

Verze 1, 17. 11. 2026. Plán ke schválení, nic z etap E1–E10 se zatím neprogramuje.
Podklady:
- technická analýza `Skeli.cz-podklady/plany/premiera/analyza-premiera-2026-11-17.md`,
- rozhodnutí Skeliho (níže),
- dosavadní konverzace se Skelim a ChatGPT.

Hotové už je (na testu, ne na www):
- ochrana neveřejného videa a jeho samo-zveřejnění v čas premiéry (`45924a3`, V143, `PremiereIT`),
- oprava barev a kontrastu (`5f583d4`).

---

## 0. Cíl a rozhodnutí

**Cíl:** naučit fanoušky, že skeli.cz je první místo, kam chodit za novou tvorbou. Odtud pokračují na YouTube, Spotify a další platformy.
Premiéra má působit jako událost, ne jako stránka s vloženým videem. Systém je opakovaně použitelný pro každou další premiéru
a připravený na další interprety SKELO SQUAD.

| Oblast | Rozhodnutí |
|---|---|
| Sledování | veřejné, bez registrace |
| Psaní do chatu | přihlášení + ověřený e-mail (dnešní pravidlo webu) |
| Zprávy smazaného účtu | zůstanou jako „Smazaný účet“, bez vazby na profil (pravidla v 5.6) |
| Kapacita | navrhnout pro růst, ověřit zátěžovým testem |
| Doručování chatu | polling každé 2 s, pokud projde zátěžovým testem; WebSocket až později |
| Reklamy na videu | vypnout, pokud to YouTube umožní |
| Termín | až po úspěšné zkušební premiéře (ne dřív) |
| Skeliho zprávy | vizuálně odlišené (odznak interpreta) |
| Další interpreti | architektura připravená na SKELO SQUAD |
| Video po premiéře | zůstává přehratelné na skeli.cz napořád |

**Zásady pro celý projekt:**
- Bezpečnost a soukromí návštěvníků jsou na prvním místě. Server nikdy nevěří prohlížeči a čas premiéry hlídá server.
- Nejdřív telefon, oba režimy (tmavý výchozí), 5 jazyků, slabé telefony (`html.low-fx`), omezení pohybu.
- Malé ověřené kroky. Každá etapa končí kontrolním bodem a commitem na test. Na www jen na pokyn Skeliho.
- Nouzový režim má přednost před efekty: když něco selže, video jde dál sledovat a stránka řekne srozumitelně, co se děje.

---

## 1. Fáze premiéry (společný slovník)

Fázi vždy počítá **server** z časů v databázi, prohlížeč ji jen zobrazuje (a pro odpočet zná čas serveru).

| Fáze | Kdy | Úvod skeli.cz | Stránka písně |
|---|---|---|---|
| `ANNOUNCED` | od ohlášení (`announce_at`, výchozí = uložení v adminu) do čekárny | malá karta: plakát, název, „Za N dní / Zítra / Dnes v 19:00“ (skutečný čas) | odpočet nad plakátem |
| `WAITING` | 30 min před startem (nastavitelné) | **úvod se přestaví:** velká čekárna nahoře, velký odpočet, „čeká N lidí“, chat otevřený | odkaz „Premiéra právě probíhá na úvodu“ |
| `LIVE` | od startu do konce videa (+ krátká rezerva) | video všem naráz + živý chat | odkaz na úvod |
| `REPLAY_HOME` | 24 h po konci | velký záznam s chatem (zprávy podle času videa) | video + přepínač „Premiéra se záznamem chatu“ |
| `ARCHIVE` | potom napořád | běžné rozložení (video je v Novinkách) | video + přepínač záznamu |
| `CANCELLED` / `POSTPONED` | admin zrušil nebo posunul | karta zmizí / nový čas | – |

Délku videa admin zadá, nebo ji web zjistí z YouTube. Je potřeba pro konec fáze `LIVE`.

---

## 2. Etapy

Každá etapa má cíl, výstup, testy a kontrolní bod. Etapy E1 a E2 můžou běžet souběžně, ostatní navazují.

```
E0 ──► E1 ──► E3 ──► E4 ──► E5 ──► E6 ──► E8 ──► E9 ──► E10
        │      ▲             ▲              ▲
E2 ─────┴──────┘ (kreativa)  └── E7 (znělka)┘
```

### E0: Infrastruktura a vydání dnešního testu na www (předpoklad všeho)

Proč: www je o ~150 commitů pozadu (migrace V117–V143). Premiéru nejde nasadit samostatně: Flyway pouští migrace jen v pořadí
a kód premiéry sahá do souborů, které se na `main` změnily (viz analýza, kap. 7).

**Úkoly:**
1. Od bratra zjistit parametry serveru (jádra, RAM, disk, co dalšího běží) a jestli je v Apachi limit spojení. **Bez hesel.**
2. **Zkouška obnovy zálohy a zkouška migrací naostro:**
   - Záloha www se obnoví do **dočasné** databáze na serveru, která není testovací ani produkční.
   - Na ní proběhnou migrace V117–V143 a ověří se, že projdou.
   - Pak se dočasná databáze smaže.

   Testovací databáze se na produkci nikdy nekopíruje. Produkční data se nikdy nekopírují do testu.
3. `SiteAuditIT` (celý web) a seznam z `Skeli.cz-podklady/plany/vydani-www.md`:
   - `DATA_KEY` na www je,
   - statistiky se nenulují,
   - texty podmínek a zásad s datem účinnosti.
4. Nasazení `main` na www (push dělá Skeli), smoke test, 2–3 dny sledování.
5. Rozhodnutí: zůstat u `mvn jetty:run` na www, nebo přejít na sestavený balík (Jetty 11.0.26+).
   Doporučení: **pro premiéru neměnit**, změnit až po ní (jedno riziko naráz).

**Kontrolní bod E0:** www běží na stavu testu bez chyb aspoň 2 dny, obnova zálohy ověřená, parametry serveru známé.

### E1: Datový model, administrace, oprávnění

**Databáze** (nové migrace, nasazené se nemění):
- `premieres`:
  - `id`, `song_id`, `artist_user_id` (interpret pro odznak v chatu; výchozí Skeli, později kdokoli ze SKELO SQUAD),
  - `kind` (`clip`/`song`), `announce_at`, `starts_at`, `waiting_min` (30), `duration_s`,
  - `video_id` (neveřejné, jen admin), `video_done`, `poster_file` (náhodný název), `chat_on`, `slow_mode`,
  - `status` (`planned`/`cancelled`), `created_by`, `created_at`.

  Převezme dnešní `songs.release_at`, `release_kind`, `premiere_video_id`, `premiere_video_done`. Datová migrace je přenese.
  Staré sloupce zůstanou a přestanou se používat.
- `premiere_messages`:
  - `id`, `premiere_id`, `user_id` (NULL po smazání účtu), `text`, `t_ms` (čas ve videu, **počítá server**),
  - `created_at`, `deleted_at`, `deleted_by` (`self`/`admin`), `by_artist`.
- `premiere_reports`: nahlášení zprávy, se stejnými pravidly jako komentáře.
- `premiere_attendance` (pro budoucí odznak „Byl jsem u premiéry“): `premiere_id`, `user_id`, `first_seen_live`.
  Jen přihlášení, jen naživo. Odznak je volitelný až v E6+.

**Interpreti SKELO SQUAD:**
- Dnes je interpret = účet s `users.is_artist`.
- Plán: premiéra nese `artist_user_id` a odznak v chatu dostane ten, kdo je interpretem dané premiéry.
- Samostatná tabulka interpretů a jejich stránek přijde až s prvním dalším interpretem. Teď ji nestavět, jen na ni nezavřít dveře.

**Admin (Admin → píseň → Premiéra, později samostatná stránka Premiéry):**
- Nastaví ohlášení, start, délku čekárny, délku videa (předvyplní se), neveřejné video (náhled jen pro admina), plakát (nahrání fotky).
- Za běhu nouzové přepínače: **posunout**, **zrušit**, **vypnout chat**, **pomalý režim chatu**.
- Spravovat premiéry smí jen ADMIN. Později možná role „interpret“ jen pro vlastní premiéry, se serverovou kontrolou.

**API:**
- `GET /api/premiere?song=` (už existuje) se rozšíří o fázi, `waiting_from`, `starts_at`, `ends_at`, `now`.
- Video vrací až od `LIVE`. No-store.

**Plakát:**
- Nahraná fotka přes `service/ProfileImages`-podobnou cestu: náhodné jméno, převod bez metadat, max. velikost.
- **Nikdy náhled z YouTube** (jeho adresa obsahuje ID videa).

**Testy E1:**
- unit testy výpočtu fáze (hranice ±1 ms, posun, zrušení, letní čas Europe/Prague),
- `PremiereIT` rozšířený o novou tabulku, nahrání plakátu a oprávnění (USER nesmí nic z adminu, 403),
- `PersonalDataCoverageTest` pro nové tabulky.

**Kontrolní bod E1:** admin nastaví premiéru, API vrací správné fáze, nic neuniká (test přes všechny veřejné adresy).

### E2: Kreativní návrhy (ke schválení dřív, než se cokoli staví)

Statické náhledy mimo web (`Skeli.cz-podklady/navrhy/premiera/`), stejně jako u menu:
1. **Úvodní znělka SKELO SQUAD** (orientačně 5–7 s): 3–4 varianty, například:
   - logo se vypálí laserem,
   - obličeje loga se rozsvítí do rytmu,
   - kouř se rozestoupí a odhalí logo,
   - zlatý záblesk přes logo.

   Každá v tmavém i světlém režimu a ve verzi pro omezení pohybu (jen prolnutí loga). Zvuk jen jako možnost: bez ťuknutí ho prohlížeč nepustí.
2. **Všechny fáze** s přepínačem času:
   - malá karta, přechod do čekárny, čekárna s odpočtem,
   - start (3–2–1), živě s chatem, konec, záznam, archiv u písně,
   - telefon (na výšku i na šířku) a PC, oba režimy, barvy podle plakátu.
3. **Chat:** vzhled zprávy, odznak interpreta, smazaná zpráva, „Smazaný účet“, pomalý režim, nouzová hláška.

**Kontrolní bod E2:** Skeli vybere znělku a schválí vzhled fází. Bez toho E3, E4 a E7 nezačínají.

### E3: Upoutávka, přestavění úvodu, stránka písně, sdílení (bez videa a chatu)

- `index.jsp` podle fáze ze serveru:
  - `ANNOUNCED` = malá karta,
  - `WAITING`, `LIVE` a `REPLAY_HOME` = velká scéna nahoře, zbytek úvodu pod ní.
- **Přechod v otevřené stránce:** při začátku čekárny se malá karta plynule zvětší do velké.
  View Transitions API, fallback prolnutí, v `low-fx` a při omezení pohybu bez animace.
- Texty podle skutečného času v 5 jazycích, s plurály („Za 6 dní / 2 dny / Zítra / Dnes v 19:00“).
  Po premiéře podle času: „Premiéra právě odstartovala!“ (první hodiny), „Nový videoklip je venku“.
  **Nikdy** „Byl jsi u toho první“ pro pozdní návštěvníky.
- Odpočet podle **času serveru** (`now` z API), přepočet po probuzení telefonu a návratu sítě (`visibilitychange`, `online`).
- **Během čekárny a premiéry klidný úvod:** vypnout kouř, světlušky a vypalovaný citát. Kevin mlčí. Bublina chatu nepřekrývá.
- PJAX: skript premiéry se při odchodu uklidí (časovače, polling, přehrávač) a nespustí se dvakrát.
- **Open Graph ze serveru:**
  - obrázek 1200×630 z plakátu, `og:title` = název písně, popis s datem,
  - odkaz vždy na stránku na **www.skeli.cz** (`APP_BASE_URL`), nikdy na YouTube.
  - Počítat s mezipamětí Facebooku: po premiéře obnovit v Sharing Debuggeru (návod pro Skeliho).
- **Tlačítka sdílení:** Facebook, X, WhatsApp, Telegram, Kopírovat odkaz, na telefonu nabídka sdílení (Instagram Stories).
- Testy: IT fází na úvodu (simulovaný čas přes admin), OG metadata, žádný únik videa, `HeaderFitIT` a `SiteAuditIT` rychlá verze.

**Kontrolní bod E3:** na testu jde nastavit premiéru za 10 minut a projít všechny fáze bez videa a chatu.

### E4: Přehrávač a synchronizace

- **„Připojit se“ v čekárně:** jedno ťuknutí = souhlas s přehrávačem (cookie lišta) + odemknutí zvuku.
  Bez ťuknutí se v čas startu video spustí ztlumené s výrazným „🔊 Zapnout zvuk“.
- **Společný start:**
  - Živá pozice = `now(server) − starts_at`.
  - Kdo přijde pozdě, naskočí do živé pozice se štítkem **🔴 ŽIVĚ**.
  - Tolerance: kontrola každých ~5 s, srovnání při odchylce > 3 s.
- **Pauza a přetočení** = „Nesleduješ živě · Zpět na živo“. Chat dál běží živě. „Pustit od začátku“ = osobní záznam.
- Skrytá záložka nebo zamčený telefon: po návratu znovu srovnat (nebo nabídnout „Zpět na živo“).
- **Reklamy a omezení YouTube:**
  - Reklamy na videu vypnout ve Studiu.
  - Když přehrávač čas neposouvá (reklama, načítání), ukázat „Načítám…“ a po obnovení srovnat.
- **Nouzový režim přehrávače:** když se YouTube nenačte do ~15 s, nebo hlásí chybu (vkládání zakázané, síť):
  - zpráva „Video se nepodařilo načíst“ + Zkusit znovu + od začátku premiéry odkaz na YouTube,
  - nikdy nekonečné načítání,
  - chat a čekárna jedou dál.
- Ovládání přes stávající `js/yt-clock.js` (bez knihovny IFrame API).
- Testy: `KaraokeClockIT`-podobný falešný přehrávač (pozdní příchod, pauza, přetočení, zpět na živo, chyba přehrávače),
  ruční zkouška iPhone + Android.

**Kontrolní bod E4:** dva prohlížeče na různých zařízeních ukazují stejné místo videa (±3 s) a chyby přehrávače mají srozumitelné hlášky.

### E5: Živý chat

- **Čtení veřejné**, psaní: přihlášený + ověřený e-mail.
  - Nepřihlášenému „Přihlas se a piš“ → `login.jsp?next=` zpět na premiéru, kde naskočí do živé pozice.
  - Neověřenému „Potvrď e-mail“ + Poslat znovu.
- Před **první zprávou** jednou věta: „Zprávy z premiéry zůstanou v jejím záznamu. Svou zprávu můžeš kdykoli smazat.“
- `GET /api/premiere/{id}/messages?after=` každé 2 s:
  - Odpověď z **mezipaměti v paměti** (obnova 1×/s pro všechny diváky), ne dotaz do DB za každého.
  - Ve skryté záložce pomaleji.
- `POST` zprávy:
  - CSRF, text jen jako text (nikdy HTML), max ~300 znaků,
  - limit (např. 1 zpráva / 3 s, 10 / min, víc v pomalém režimu),
  - serverový filtr sprostých a nenávistných slov (seznam v souboru, rozšiřitelný),
  - `t_ms` dopočítá server z `starts_at`.
- **Odznak interpreta** u zpráv `artist_user_id` (Skeli) a jiný vzhled zprávy. Admin/interpret může zprávu připnout (volitelné).
- **Moderování:**
  - autor maže svou zprávu, admin maže kteroukoli (zmizí všem do 2 s a nikdy se neukáže v záznamu),
  - nahlášení,
  - tiché blokování (`BlockDao`): zprávy blokujícího se nezobrazí,
  - zablokovaný účet nepíše,
  - nouzové **vypnutí chatu** a **pomalý režim** v adminu.
- **Nouzový režim chatu:** když API nejde, hláška „Chat se na chvíli odmlčel“, postupně delší pauzy mezi pokusy. **Video jede dál.**
- Počet diváků („sleduje N“): z pollingu (unikátní relace za posledních ~10 s), v paměti, bez osobních údajů.

### E5.6: Soukromí a smazání účtu (součást E5)

- **Smazání účtu:**
  - zprávy zůstanou s `user_id = NULL` a zobrazí se jako „Smazaný účet“, bez fotky, jména a odkazu na profil,
  - nahlášení a důkazy zůstávají (pravidla webu).
- Uživatel může **kdykoli smazat všechny své zprávy z premiér** (Nastavení → Účet a data). Na formuláři smazání účtu bude upozornění
  a odkaz na tuhle možnost, protože text zprávy může obsahovat osobní údaje.
- Export dat obsahuje jeho zprávy z premiér. Zásady ochrany osobních údajů a podmínky doplněné v 5 jazycích (nové datum účinnosti).
- `AccountDeletion`, `ProfileExportServlet`, `PersonalDataCoverageTest` doplněné.
- Nezletilí: platí stávající komunitní pravidla, moderace a nahlášení. Bez soukromých zpráv v premiérovém chatu.

**Kontrolní bod E5:** chat funguje se 2–3 lidmi na testu, moderace, mazání, limity a nouzové hlášky ověřené IT testy.

### E6: Záznam premiéry

- `REPLAY_HOME` (24 h na úvodu) a `ARCHIVE` (u písně napořád):
  - video od začátku a zprávy naskakují podle `t_ms` při přehrávání, přetočení se přepočítá,
  - chat jde skrýt.
- Záznam čte jen nesmazané zprávy z `premiere_messages`, **žádná kopie**. Co bylo smazáno, se nikdy neobnoví.
- Volitelně (po schválení): odznak „Byl jsem u premiéry“ jen pro přihlášené, kteří byli naživo.
- Testy: pořadí zpráv podle času videa, přetočení, smazaná zpráva se neukáže, smazaný účet.

### E7: Úvodní znělka (podle varianty schválené v E2)

- Přehraje se při **prvním vstupu do konkrétní premiéry** (zapamatováno v prohlížeči podle id premiéry) a potom ukáže aktuální fázi.
- Vždy jde přeskočit (tlačítko + Esc).
- **Nikdy nezdrží živé video:** když přijde návštěvník během `LIVE`, znělka je zkrácená, nebo se přeskočí a video běží od živé pozice.
- `prefers-reduced-motion` a `low-fx` = jen krátké prolnutí loga. Odpočet a čas se počítají dál.
- Lehká: CSS animace a malé obrázky, žádné velké video.

### E8: Zátěžový test

- Nástroj zdarma (např. k6 nebo jednoduchý vlastní skript) proti **test.skeli.cz**, nikdy proti www.
- Scénáře:
  - 100 / 300 / 500 virtuálních diváků s pollingem 2 s,
  - 20–50 pisatelů,
  - špička „všichni přijdou v 18:59“.
- Měřit: odezvu API (cíl < 300 ms), chyby, CPU a RAM serveru (s bratrem), spojení do DB.
- Když neprojde: zvětšit mezipaměť nebo interval, upravit pool, případně WebSocket (`/ws/` v Apachi je).
- Výsledek zapsat sem a do analýzy.

**Kontrolní bod E8:** zvolená kapacita projde bez chyb s rezervou.

### E9: Zkušební premiéra s kamarády

- Na **test.skeli.cz**, s **cizím veřejným** testovacím videem (nikdy ne se skutečným klipem), start za ~40 minut.
- Aspoň 5–10 lidí: iPhone, Android, PC; přihlášení, nepřihlášení, admin; tmavý i světlý režim; různé jazyky.
- Projít:
  - znělku, čekárnu, přechod karty, „Připojit se“,
  - start všem naráz, pozdní příchod, pauzu, zpět na živo, zamčený telefon,
  - chat (psaní, mazání, nahlášení, pomalý režim, vypnutí), záznam,
  - nouzové stavy (vypnutý chat, simulovaná chyba přehrávače).
- Seznam chyb → opravy → případně druhá zkouška.

### E10: Ostrá premiéra

**Podmínky go / no-go (všechny musí platit):**
- [ ] E0–E9 hotové a kontrolní body splněné
- [ ] premiéra je na www nasazená **aspoň 2 dny předem** (žádné nasazení v den premiéry)
- [ ] `SiteAuditIT` bez chyb, `PremiereIT` a testy chatu zelené
- [ ] zátěžový test prošel pro očekávaný počet diváků s rezervou
- [ ] na YouTube: Neveřejné, Povolit vkládání, reklamy vypnuté, náhled nastavený
- [ ] v adminu: čas, délka videa, plakát a neveřejné video vložené, OG náhled zkontrolovaný (Facebook Sharing Debugger)
- [ ] záloha DB těsně před premiérou
- [ ] Skeli a admin vědí, kde jsou nouzové přepínače (posunout, vypnout chat, pomalý režim)

**Během premiéry:**
- admin panel „živě“: diváci, zpráv za minutu, chyby API,
- moderátor (admin) sleduje chat.

**Po premiéře:**
- vyhodnocení (diváci, zprávy, chyby), obnova OG náhledu, ruční zveřejnění na YouTube podle plánu,
- zápis do tohoto plánu, co zlepšit.

---

## 3. Nouzový režim (shrnutí)

| Co selže | Co uvidí návštěvník | Co se děje dál |
|---|---|---|
| chat API | „Chat se na chvíli odmlčel“ | video jede, chat zkouší znovu s delšími pauzami |
| YouTube přehrávač | „Video se nepodařilo načíst“ + Zkusit znovu + odkaz na YouTube | chat a čekárna jedou |
| autoplay se zvukem | video ztlumené + „🔊 Zapnout zvuk“ | synchronizace platí |
| server krátce nedostupný | „Spojení se ztratilo, zkouším znovu“ | po návratu srovnání času a pozice |
| restart serveru přesně v čas startu | nic (zpoždění pár vteřin) | `PremiereJob` zveřejní video hned po startu |
| reklama nebo načítání | „Načítám…“ | po obnovení srovnání na živou pozici |
| admin musí zasáhnout | posunutá / zrušená premiéra, chat vypnutý | klienti to převezmou z API do pár vteřin |

---

## 4. Rizika

1. **Kapacita serveru neznámá** → E0 (parametry) + E8 (zátěž) dřív, než se určí datum.
2. **Velké nasazení na www** (150 commitů) → E0 s předstihem, zkouška migrací na kopii, sledování.
3. **iOS:** autoplay, skryté záložky → „Připojit se“, ztlumený start, srovnání po návratu, zkouška na iPhonu.
4. **Únik videa** → video mimo tabulku `videos` do startu (hotové), plakát nahraný, test všech veřejných adres.
5. **Spam a nevhodný obsah** → ověřený e-mail, limity, filtr, moderace, nouzové vypnutí.
6. **Soukromí v trvalém záznamu** → upozornění před první zprávou, mazání, anonymizace, zásady.
7. **Výkon úvodu** → klidný režim během premiéry, `low-fx`.
8. **PJAX** → úklid a ochrana před dvojím spuštěním, testy.

## 5. Co potřebujeme od Skeliho (mimo kód)

- Parametry serveru od bratra (E0).
- Fotku plakátu (stejnou jako náhled na YouTube).
- Video nahrané jako Neveřejné + Povolit vkládání + bez reklam.
- Výběr znělky a schválení vzhledu (E2).
- 5–10 kamarádů na zkušební premiéru (E9).
- Datum premiéry až po E8 a E9.

## 6. Stav etap

| Etapa | Stav |
|---|---|
| předběžná ochrana videa (V143) | hotovo na testu |
| E0 | nezačato |
| E1 | nezačato |
| E2 | nezačato |
| E3–E10 | nezačato |
