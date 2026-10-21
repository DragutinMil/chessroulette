import { ChessColor, ChessFEN } from '@xmatter/util-kit';

/**
 * 'teach' - korisnik igra vise uzastopnih poteza svojom bojom (bez protivnika).
 * 'puzzle' - klasican puzzle, solution ide naizmenicno korisnik/protivnik.
 * 'quiz' - nije potez na tabli uopste - pitanje sa ponudjenim odgovorima
 * (quizOptions/quizCorrectIndex/quizExplanation), korisnik bira dugme umesto
 * da pomeri figuru. Bez `quizOptions` postaje cista "watch & learn"
 * demonstracija (vidi beginStep) - nema pitanje, samo prikaz + objasnjenje.
 * `fen`/`orientation`/`solution` i dalje postoje (solution je uvek jednoclan
 * placeholder niz, npr. ['quiz']) da bi se ponovo iskoristio isti
 * progress/isStepComplete mehanizam kao za sve druge korake.
 * 'markSquares' - korisnik OBELEZAVA polja na tabli (desni klik na desktopu,
 * tap-and-hold na mobilnom - NE prevlacenje figure), ne pomera nista.
 * `solution` ovde sadrzi OCEKIVANA polja (npr. ['d4','d5','e4','e5']) -
 * tacno kad se obelezeni skup polja poklapa sa njim. Pri prvom netacnom
 * pokusaju korisnik bira "Try Again" (ocisti izbor, pokusaj ponovo) ili
 * "Hint" (otkrije tacna polja + objasnjenje, zavrsava korak).
 */
export type LessonStepKind =
  | 'teach'
  | 'puzzle'
  | 'quiz'
  | 'markSquares'
  | 'freePlay';

/** Protivnicki odgovor koji nije skriptovan - engine bira bilo koji legalan potez. */
export const ANY_LEGAL_REPLY = '*';

/** Koliko puta korisnik moze da trazi hint po koraku, pre nego sto se dugme ugasi. */
export const MAX_HINTS_PER_STEP = 2;

export type LessonStep = {
  id: string;
  kind: LessonStepKind;
  fen: ChessFEN;
  /** Boja kojom korisnik igra (i orijentacija table). */
  orientation: ChessColor;
  /**
   * UCI potezi.
   * teach: svi potezi su korisnikovi.
   * puzzle: naizmenicno korisnik/protivnik (protivnikov moze biti ANY_LEGAL_REPLY).
   * freePlay: NIJE skriptovano - ignorise se (ostaje []). Svaki legalan
   * potez se prihvata, protivnik je Pawny (Stockfish bot), kraj koraka je
   * bilo koji sahovski zavrsni ishod (mat/pat/remi), ne solution.length.
   * Obicno pocinje korisnikov potez (indeks 0), ali ako prvi potez pripada
   * boji koja NIJE `orientation`, engine ga sam odigra cim se korak ucita -
   * npr. "crni je vec odigrao, sad je belo na potezu".
   */
  solution: string[];
  /**
   * Samo kind:'freePlay' - pool poruka koje "protivnik" (Pawny) salje u chat
   * balonce na svakih 5 poteza (oba igraca zajedno), nasumicno, bez
   * ponavljanja iste u istoj partiji. Kad se pool istroši, vise nema poruka
   * do kraja partije (ne resetuje se, ne kruzi ispocetka).
   */
  freePlayMessages?: string[];
  /**
   * Samo kind:'freePlay' - pool kratkih motivacionih recenica koje TRENER
   * (Outposty, ne Pawny) salje posle KORISNIKOVOG poteza (ne Pawny-jevog).
   * Ucestalost opada kroz partiju: prvih 5 korisnikovih poteza - svaki put;
   * sledecih (do 15.) - na svaki 3.; posle 15. - na svaki 5. Nasumicno, bez
   * ponavljanja iste u istoj partiji (isto pravilo kao freePlayMessages).
   */
  motivationMessages?: string[];
  /**
   * Samo kind:'freePlay' - koliko cesto Pawny (PawnyEngine.tsx) igra cisto
   * NASUMICAN legalan potez umesto Stockfish-ovog predloga (0..1, podrazumevano
   * 0.8 - vecinom nasumican, "deca ovo pobede"). Nize = Pawny malo jaci (npr.
   * Day 18 "Game 2" - "malo ostriji" protivnik nego Day 14). NIJE verifikovana
   * tacna rtg kalibracija (nema formule rtg<->ovaj broj) - samo relativno
   * podesavanje "jace/slabije" od Day 14 podrazumevanog.
   */
  pawnyRandomMoveChance?: number;
  /**
   * Samo kind:'freePlay' - protivnik (crni) igra PUNU snagu Stockfish-a
   * (nema Skill Level ogranicenja, nema nasumicnog poteza) umesto Pawny-jevog
   * namerno slabog engine-a (npr. Day 20 "Deliver Mate" - crni kralj se
   * brani najboljom odbranom, ovo JESTE poenta vezbe). Koristi
   * MateDefenseEngine.tsx umesto PawnyEngine.tsx za render.
   */
  strongOpponent?: boolean;
  /**
   * Samo kind:'freePlay' - Hint dugme NIJE iskljuceno (standardno ponasanje
   * za freePlay, nema skriptovano resenje da se otkrije) - umesto toga,
   * svaki klik trazi od Stockfish-a predlog SLEDECEG poteza za trenutnu
   * poziciju, pa od AI modela (uzivo, ne unapred pripremljen tekst) kratko
   * objasnjenje TOG KONKRETNOG poteza, u Outpost tonu. Nije ograniceno
   * MAX_HINTS_PER_STEP brojacem (dostupno u svakom trenutku). Npr. Day 20
   * "Deliver Mate" Phase 2 - slobodno matiranje, hint mora da bude uzivo jer
   * nema fiksnog "sledeceg poteza" da se unapred napise.
   */
  liveHint?: boolean;
  /**
   * Samo uz `liveHint` - umesto sirovog Stockfish "najboljeg" poteza, Hint
   * predlaze potez po FIKSNOJ pedagoskoj tehnici (checkmateTechnique.ts),
   * cak i kad bi engine nasao brzi mat drugim putem. 'queenBoxMethod' (Day 20
   * "Deliver Mate" Phase 2 - jedina trenutno postojeca tehnika): dama SAMA
   * suzava prostor kralja do jednog reda/kolone, TEK onda sopstveni kralj
   * prilazi u pomoc, pa "kiss of death" mat. Bez ovog polja (samo `liveHint`),
   * pada nazad na sirov engine predlog (requestBestMoveUci).
   */
  hintTechnique?: 'queenBoxMethod';
  /**
   * Samo kind:'freePlay' - korak se NE zavrsava na bilo kakav kraj partije
   * (chess.isGameOver), nego SAMO na stvaran sah-mat. Pat (ili bilo koji
   * drugi zavrsetak bez mata) umesto toga VRACA poslednji (korisnikov) potez
   * (takeback) i salje `stalemateText`, korak ostaje otvoren za ponovni
   * pokusaj. Npr. Day 20 "Deliver Mate" - cilj vezbe je bas mat, ne bilo koji
   * kraj partije (klasicna pocetnicka greska je pat pri matiranju damom).
   */
  requireCheckmate?: boolean;
  /** Samo uz `requireCheckmate` - poruka na pat (vidi requireCheckmate). */
  stalemateText?: string;
  /**
   * Samo kind:'freePlay' - pool kratkih saveta o TEHNICI (ne o toku partije
   * kao freePlayMessages/motivationMessages) koji se prikazuje POSLE SVAKOG
   * korisnikovog poteza, bez izuzetka (nema opadajuce ucestalosti kao
   * motivationMessages). Nasumicno, bez ponavljanja iste dva puta zaredom,
   * ali se pool RECIKLIRA kad se potrosi (partija moze trajati duze od broja
   * saveta u pool-u) - za razliku od freePlayMessages/motivationMessages koji
   * samo cute kad se potrose. Npr. Day 20 "Deliver Mate" Phase 2.
   */
  techniqueTips?: string[];
  /** Naslov iznad table. */
  prompt: string;
  /** Poruka trenera kad korak pocne. */
  introText: string;
  /** Poruka trenera posle svakog tacnog poteza koji nije poslednji. */
  successText?: string;
  /**
   * Ako je true, `successText` se salje TACNO kako je napisan, bez mesanja
   * sa generickim frazama ("Keep it up!" i sl.) - koristi kad poruka nosi
   * bitnu uputu za sledeci potez (npr. "sad zagrizi sa druge strane"), ne
   * samo dekorativnu pohvalu. Default (false/nedefinisano) zadrzava postojece
   * ponasanje - nasumicna varijacija radi generickih pohvala.
   */
  successTextAlways?: boolean;
  /**
   * Samo za multi-move puzzle korake (npr. Day 17 "Two Rooks Checkmate" -
   * jedan korak, 5 belih poteza, svaki sa SOPSTVENIM objasnjenjem umesto
   * ponovljenog `successText`). Kljuc je indeks KORISNIKOVOG poteza u
   * `solution` (0, 2, 4... za naizmenicne puzzle korake - protivnikovi
   * potezi su neparni indeksi), vrednost tekst koji se salje UMESTO
   * `successText` na tom mestu, uvek tacno kako je napisan (bez variranja).
   * Ne vazi za POSLEDNJI potez koraka - taj i dalje koristi `doneText`.
   * Generican mehanizam, nije Day17-specifican.
   */
  moveExplanations?: Record<number, string>;
  /**
   * Isto kao `moveExplanations`, ali board highlight (isti arrows/squares
   * oblik kao `quizBoardHighlight`) umesto teksta - primenjuje se ZAJEDNO sa
   * odgovarajucim `moveExplanations[indeks]`, po istom indeksu.
   */
  moveHighlights?: Record<
    number,
    {
      arrows?: { from: string; to: string; color: string }[];
      squares?: { square: string; color: string }[];
    }
  >;
  /** Poruka trenera kad je korak zavrsen. */
  doneText: string;
  /**
   * Alternativna "gotovo" poruka ako je POSLEDNJI potez koraka bila promocija
   * u NEDAMU (top/lovac/skakac) - i dalje ispravno zavrsava korak, samo drugi
   * ton poruke (blago upozorenje umesto pune pohvale). Generican mehanizam za
   * bilo koji korak sa promocijom, ne samo Pawn lekciju.
   */
  nonQueenPromotionText?: string;
  /**
   * Suprotno od `nonQueenPromotionText` - kad je true, promocija u BILO ŠTA
   * osim dame se tretira kao POGREŠAN potez (standardan takeback + hintText),
   * ne kao "tačno, samo drugi ton" (npr. Day 19 "Pawn Promotion" trke - u
   * trci je top/lovac/skakac stvarno pogrešan izbor, ne alternativa). Default
   * (false/nedefinisano) zadržava postojeće ponašanje - bilo koja promocija
   * je tačna. Generičan mehanizam, ne Day19-specifičan.
   */
  requireExactPromotion?: boolean;
  /** Poruka trenera na pogresan potez. */
  hintText: string;
  /**
   * Ako je true, `hintText` se salje TACNO kako je napisan na SVAKI pogresan
   * potez, bez mesanja sa generickim variranim frazama (vidi
   * pickVariedWrongMoveMessage) - koristi kad lekcija namerno trazi IDENTICAN
   * flow na svaki promasaj, bez eskalacije (npr. Day 17 "Two Rooks" - isti
   * fiksan tekst svaki put). Default (false/nedefinisano) zadrzava postojece
   * ponasanje - nasumicna varijacija. Isti princip kao `successTextAlways`.
   */
  hintTextAlways?: boolean;
  /** Pun celebration overlay sa konfetima na kraju koraka. */
  celebrate?: boolean;
  /**
   * 'teach' korak u kom su vise od jedne mete istovremeno na dohvat iste
   * figure sa trenutne pozicije (npr. kralj koji moze da uzme bilo koji od 2
   * susedna pesaka prvo) - korisnik moze da pokupi mete SVOJIM redosledom,
   * dokle god je svaki potez pojedinacno legalan sa trenutne pozicije.
   * Legalnost (ukljucujuci "ovo polje je jos branjeno" slucajeve) proverava
   * chess.js uzivo, ne rucno nabrojan redosled u `solution`.
   */
  unorderedTargets?: boolean;
  /**
   * Opcioni popup PRE ovog koraka (npr. "vreme je da naucimo rokadu") - jedan
   * generican mehanizam za bilo koju lekciju koja treba da uvede novu pod-temu
   * usred lekcije, ne samo King/rokada. Kad postoji, korak ceka klik na dugme
   * pre nego sto se prikaze tabla/posalje introText.
   */
  preStepIntro?: {
    title: string;
    text: string;
    bullets?: string[];
    buttonText?: string;
    /** Opciona mini-animacija iznad teksta - trenutno samo rokada, generisi po smeru. */
    diagram?: 'castle-kingside' | 'castle-queenside';
  };
  /**
   * Skakac koji preskace figuru - poljace "izmedju" from/to (racunato
   * geometrijski, ne stvarno postoji na tabli za druge figure) kratko
   * zasvetli zlatno ako je zauzeto, posle tacnog poteza. Generican mehanizam
   * (LessonStep.jumpGlow), ne hardkodovan za Knight lekciju.
   */
  jumpGlow?: boolean;
  /**
   * Alternativni tacni potezi za odredjeni indeks u `solution` (npr. "sa
   * pocetne pozicije prihvatamo i jedno i dva polja - e2e3 ILI e2e4"). Kljuc
   * je indeks u `solution` nizu, vrednost niz dodatnih UCI poteza koji se
   * TAKODJE prihvataju na tom mestu, pored `solution[index]` samog. Generican
   * mehanizam, nije Pawn-specific - bilo koji korak moze da ga koristi kad
   * vise razlicitih poteza validno zavrsava taj deo zadatka.
   */
  altMoves?: Record<number, string[]>;
  /** Kviz odgovori (samo kind:'quiz') - obicno 4 teksta (Yes/No kviz moze imati 2), prikazuju se kao dugmad. */
  quizOptions?: string[];
  /** Indeks tacnog odgovora u quizOptions (0-3), samo kind:'quiz'. */
  quizCorrectIndex?: number;
  /**
   * Kratko objasnjenje/prica koje se salje kao trenerova poruka ODMAH posle
   * izbora odgovora - kviz je "jedan pokusaj", ne trazi ponovni pokusaj kao
   * potezi na tabli. Koristi se za TACAN odgovor (i za oba ishoda ako
   * `quizExplanationWrong` nije zadato). Samo kind:'quiz'.
   */
  quizExplanation?: string;
  /**
   * Alternativno objasnjenje za NETACAN odgovor, ako treba drugaciji ton od
   * tacnog (npr. "Close! Actually..." umesto "Correct!..."). Ako nije
   * zadato, pada nazad na `quizExplanation` za oba ishoda.
   */
  quizExplanationWrong?: string;
  /**
   * Netacan odgovor NE zavrsava korak (Day 15 Position 6 "Yes/No" trik) -
   * posalje se `quizExplanationWrong` kao kratak nagovestaj, pa se dugmad
   * ponovo otkljucaju da korisnik proba opet. Korak se zavrsava tek na TACAN
   * odgovor. Bez ovoga (default), netacan odgovor zavrsava korak kao obicno.
   */
  quizRetryOnWrong?: boolean;
  /**
   * UCI potez koji se automatski odigra na tabli posle TACNOG odgovora (pre
   * `quizExplanation` poruke) - npr. Day 15 Position 6: "Yes" je tacno, pa
   * tabla sama odigra rokadu da pokaze da je stvarno legalna. Dispatchuje se
   * kao obican potez (ChessFENBoard sam prepoznaje kralj-dva-polja kao
   * rokadu i pomeri i top).
   */
  quizAutoPlayMove?: string;
  /**
   * Posle tacnog poteza, animirano (kvadrat po kvadrat) otkrij celu liniju
   * (red/kolona/dijagonala) izmedju `move.from` i `move.to`, koristeci isti
   * vizuelni "hint" mehanizam (tackice na poljima) kao svuda drugde u lekciji
   * - ne izmisljena nova komponenta. Generican, ne History-specific.
   */
  revealPath?: boolean;
  /**
   * Zatamni tablu dok je ovaj kviz korak aktivan (samo kind:'quiz'). Default
   * false - tabla ostaje vidljiva. Postavi na true kad je sadrzaj table
   * nebitan za pitanje (npr. History kviz) i zelimo fokus na chat; ostavi
   * false/izostavljeno kad odgovor zavisi od necega sto se vidi na tabli
   * (npr. Piece Values - korisnik cita figuru/poziciju sa table).
   */
  quizDimBoard?: boolean;
  /**
   * Umesto poredjenja odigranog poteza sa fiksnim "tacnim kvadratom"
   * (solution[progress]), potez se proglasava tacnim ako REZULTUJUCA
   * pozicija posle odigranog poteza zadovoljava ovaj uslov (chess.js
   * isCheckmate()/isStalemate() na poziciji POSLE poteza). Prihvata svaki
   * legalan potez koji dovede do trazenog ishoda, ne samo jedan unapred
   * zamisljen - generican mehanizam za "nadji mat/pat u jednom", ne
   * Day9-specifican. Samo kind:'puzzle', solution i dalje ostaje jednoclan
   * placeholder (npr. ['goal']) da progress/isStepComplete rade nepromenjeno.
   */
  /**
   * 'denyCastleKingside'/'denyCastleQueenside' (Day 15 "Stop the Castle!") -
   * potez se stvarno odigra kroz chess.js i proverava se da li PROTIVNIKOVA
   * rokada na tu stranu postaje nelegalna u rezultujucoj poziciji (bilo koji
   * potez koji to postigne je tacan, ne samo jedan unapred zamisljen).
   */
  goalCondition?:
    | 'checkmate'
    | 'stalemate'
    | 'denyCastleKingside'
    | 'denyCastleQueenside';
  /**
   * Hint poruka - za kind:'quiz' korake (nema figure/poteza na tabli uopste)
   * ovo je CELOKUPAN hint, jedan klik, cisto tekstualan. Za kind:'puzzle'
   * korake ovo je tekst koji prati standardni dvostepeni hint (1. hint oznaci
   * figuru, 2. hint doda strelicu) umesto generickog variranog teksta - radi
   * i sa `goalCondition`/`hintMove` i sa obicnim fiksnim `solution` nizom
   * (Day 16 "Secret hint" po puzzli). Generican, ne Day9-specifican.
   */
  extraHintText?: string;
  /**
   * Samo za kind:'puzzle' korake sa `goalCondition`: UCI potez koji Hint
   * dugme crta (1. klik oznaci pocetno polje, 2./poslednji klik doda i
   * strelicu do mete) - isti dvostepeni sistem kao kod ostalih koraka, da
   * korisnik uvek zna sta Hint radi. NIJE jedino prihvatljivo resenje - sama
   * validacija poteza (onMove) i dalje proverava `goalCondition` na
   * rezultujucoj poziciji i prihvata bilo koji potez koji ga zadovoljava;
   * ovo je samo JEDAN tacan potez, za prikaz.
   */
  hintMove?: string;
  /**
   * Samo uz `hintMove` - Hint dugme NIKAD (ni na poslednjem kliku) ne crta
   * strelicu do `hintMove`, ostaje cisto tekstualan trag (Day 15 Part 2 -
   * "Hint ne otkriva direktno resenje"). Umesto toga, strelica/polja se
   * automatski pokazu na PRVI POGRESAN POTEZ - vidi `wrongMoveHighlight`.
   */
  hintNeverRevealsArrow?: boolean;
  /**
   * Scenski board highlight koji se automatski prikazuje na PRVI pogresan
   * potez (kind:'puzzle' sa `goalCondition`) - za korake gde Hint namerno NE
   * otkriva resenje (vidi `hintNeverRevealsArrow`), ali gresan pokusaj ipak
   * zasluzuje vizuelno objasnjenje. Isti arrows/squares oblik kao
   * `quizBoardHighlight`, potpuno nezavisan mehanizam.
   */
  wrongMoveHighlight?: {
    arrows?: { from: string; to: string; color: string }[];
    squares?: { square: string; color: string }[];
  };
  /**
   * Scenski board highlight. Za kind:'quiz' SA quizOptions: prikazuje se
   * POSLE odgovora, uvek, bez obzira na tacnost (korisnik ne sme da prodje
   * kroz pitanje a da ne vidi obrazlozenje nacrtano na tabli). Za kind:'quiz'
   * BEZ quizOptions ("watch & learn" demonstracija): prikazuje se ODMAH pri
   * ucitavanju koraka. Za kind:'puzzle' sa `goalCondition`: prikazuje se
   * posle TACNOG poteza. Generican mehanizam za "oznaci sah liniju / pokrivena
   * polja / blokirana polja odjednom, razlicitim bojama" - ne izmisljena nova
   * komponenta, samo parametrizovan isti squareRenderer/arrowsMap sistem.
   */
  quizBoardHighlight?: {
    arrows?: { from: string; to: string; color: string }[];
    squares?: { square: string; color: string }[];
  };
  /**
   * Samo za kind:'puzzle' sa `goalCondition` koji ima VISE ispravnih poteza
   * (npr. 4 razlicita mata u istoj poziciji). `hintMove`/`doneText`/
   * `quizBoardHighlight` ostaju PODRAZUMEVANI (ono sto Hint dugme pokazuje),
   * ali ako korisnik odigra neki DRUGI potez koji TAKODJE zadovoljava
   * goalCondition, a nalazi se ovde (po UCI), njegov doneText/
   * quizBoardHighlight imaju prednost - objasnjenje mora da opisuje stvarno
   * odigran potez, ne uvek isti hardkodovan. Generican, ne Day10-specifican.
   */
  altSolutions?: {
    uci: string;
    doneText: string;
    quizBoardHighlight?: {
      arrows?: { from: string; to: string; color: string }[];
      squares?: { square: string; color: string }[];
    };
    /**
     * Ovaj potez TEHNICKI zadovoljava goalCondition (npr. i jeste sah-mat),
     * ali lekcija uci TACNO ODREDJEN obrazac (npr. Day 12 "Kiss of Death" -
     * dama ispred kralja) - ne zelimo da ovaj alternativni mat zavrsi korak.
     * Kad je true, potez se NE primenjuje na tabli (kao pogresan potez),
     * salje se `retryMessage` umesto standardne "pogresno" poruke, i korak
     * ostaje otvoren dok korisnik ne odigra bas trazen potez.
     */
    requireRetry?: boolean;
    /** Poruka za requireRetry potez - ohrabrujuca, ne "pogresno" (igrac JESTE nasao mat, samo ne taj koji ucimo). */
    retryMessage?: string;
  }[];
  /**
   * Samo kind:'quiz' SA quizOptions: prikazuje quizBoardHighlight ODMAH pri
   * ucitavanju koraka (pre odgovora), ne tek posle - za slucaj kad je linija/
   * oznaka na tabli SAM PREDMET pitanja (npr. "sta je ovo nacrtano?"), ne
   * objasnjenje-posle-odgovora. Default false (postojece ponasanje, Day9/10
   * nepromenjeno - highlight bi tu odao odgovor unapred).
   */
  quizBoardHighlightUpfront?: boolean;
  /**
   * Tekst dugmeta kojim se korak zavrsava (dole, pored Hint-a). Default
   * 'Next' (nepromenjeno ponasanje za sve postojece lekcije). Postavi na
   * 'Got it!' za demonstracione korake unutar iste tematske celine.
   */
  nextButtonText?: string;
  /**
   * Dodatna trenerova poruka koja se salje POSLE standardnog zavrsetka
   * koraka (watch-step auto-complete, ili markSquares tacan/hint ishod) -
   * za oznacavanje prelaza izmedju vecih tematskih celina lekcije (npr.
   * "Bravo! Let's move on to the next one."). Kad je zadato, podrazumevani
   * `nextButtonText` postaje 'Next' ako nije eksplicitno drugacije zadat.
   */
  transitionText?: string;
  /**
   * Board highlight koji ide UZ `transitionText`, za kind:'teach'/'puzzle'
   * (ne markSquares/quiz - ti imaju sopstvene mehanizme) - npr. Day 17 "Two
   * Rooks" Step 2 "roles-swap illustration": strelice se PRECRTAJU da
   * pokazu koja bi tura sledeca cuvala liniju a koja sahirala, uz prateci
   * tekst. Primenjuje se posle `quizBoardHighlight`/`doneText`, pre
   * `transitionText` poruke. Generican, ne Day17-specifican.
   */
  transitionHighlight?: {
    arrows?: { from: string; to: string; color: string }[];
    squares?: { square: string; color: string }[];
  };
  /**
   * Samo kind:'teach' - umesto (pored) rucnog prevlacenja figure, AI chat
   * prikazuje KLIKABILNO dugme sa potezom (SAN tekst za prikaz) odmah ispod
   * task oblacica, isti princip kao quizOptions dugmad. Klik izvrsava TACNO
   * taj potez kroz isti put kao rucno odigran tacan potez (poziva onMove),
   * nije posebna validaciona grana - rucno prevlacenje i dalje radi normalno
   * pored njega. `uci` mora da se poklapa sa `solution[progress]` u tom
   * trenutku. Koristi za polu-interaktivne demo korake (npr. Day 17 "Two
   * Rooks" Koraci 1-3) gde korisnik klikom "igra" potez umesto prevlacenja.
   */
  suggestedMove?: { uci: string; label: string };
  /**
   * Samo kind:'markSquares': zavrsno objasnjenje kad je JEDINI pokusaj
   * netacan (isto "jedan pokusaj" pravilo kao kviz pitanje - cim korisnik
   * obelezi ocekivani broj polja, korak je gotov, tacno ili ne). Pada nazad
   * na `doneText` ako nije zadato. `quizBoardHighlight` se u oba slucaja
   * prikazuje, `extraHintText` ostaje rezervisan za standardno Hint dugme
   * PRE pokusaja (vidi onHint/onToggleMarkSquare u DailyLessonActivity.tsx).
   */
  retryPromptText?: string;
  /**
   * Samo kind:'teach'/'puzzle': strelica do resenja (step.solution[progress])
   * se crta ODMAH pri ucitavanju koraka, pre bilo kog pokusaja - za korake
   * gde je vodjenje namerno "ovde tacno igras" (npr. Day 12 "Bring It On!"
   * Move 1/2), ne cekajuci Hint klik. Generican, ne Day12-specifican.
   */
  showSolutionArrowUpfront?: boolean;
  /**
   * Samo kind:'teach'/'puzzle': na PRVI netacan pokusaj, pored standardnog
   * X-a i zelenih tacaka (legalna polja za figuru), ODMAH se nacrta i
   * strelica do tacnog resenja - bez cekanja da korisnik klikne Hint. Za
   * korake gde se vodjenje namerno otkriva tek POSLE prvog promasaja (npr.
   * Day 12 Move 3), umesto od samog pocetka (vidi showSolutionArrowUpfront).
   */
  revealArrowOnWrongMove?: boolean;
  /**
   * Iskljucuje ovaj ZAVRSEN korak iz standardnog "Next spreman" ponasanja
   * (6s auto-advance fill, pun-ekran zatamnjenje, pulsiranje dole) - isto
   * poprilicno kao "watch & learn"/markSquares koraci, ali opt-in PO KORAKU,
   * ne po `kind`. Koristi kad je upravo zavrsena pozicija pedagoski bitna i
   * korisnik treba neograniceno vreme da je prouci pre nego sto klikne dalje
   * (npr. Day 12 Move 1 - "kralju ostaje TACNO jedno polje, ne nula").
   */
  noAutoAdvance?: boolean;
  /**
   * Samo kind:'teach'/'puzzle' (npr. Day 17 "Two Rooks Checkmate") - posle
   * SVAKOG tacnog poteza (ne samo poslednjeg), CEO red (rank) na kom stoji
   * svaki top korisnikove boje se oboji automatski (racuna se iz stvarne
   * pozicije, ne rucno autorovano po koraku). Top koji je BAS TIM potezom
   * dao sah dobija drugu boju od onog koji samo drzi liniju, da korisnik
   * vidi "ko sece, ko sahira" na prvi pogled. Nezavisan kanal od
   * `quizBoardHighlight`/`moveHighlights` (te dve ostaju za strelice/ostale
   * oznake) - ne gasi ih, ne gasi se njima. Generican, ne Day17-specifican.
   */
  highlightRookRanks?: boolean;
  /**
   * Samo kind:'teach'/'puzzle', prikazuje se ODMAH pri ucitavanju koraka, pre
   * bilo kog pokusaja (npr. Day 17 Step 3 - "zasto ne mozes da sahiras
   * odavde"). Vizuelno objasnjava ZASTO neki ocigledan potez NE radi: roze
   * strelica(e) (ista boja kao pogresan potez) + crveni X na odredisnom
   * polju - isti vizuelni jezik kao kad korisnik STVARNO odigra pogresno,
   * samo prikazan unapred kao upozorenje, ne kao posledica pokusaja. Ostaje
   * na tabli kroz ceo korak (ne gasi se na pogresan potez). Generican, ne
   * Day17-specifican.
   */
  wrongPathPreview?: {
    arrows: { from: string; to: string }[];
    squares: string[];
  };
};

export type Lesson = {
  id: string;
  level: 1 | 2 | 3;
  day: number;
  title: string;
  intro: { title: string; text: string };
  /** Figura koju lekcija uci - pokrece uvodnu animaciju i generisane poruke. */
  piece: {
    name: string; // 'rook', 'bishop', ... - koristi se u tekstu ("mastered the {name}")
    glyph: string; // unicode figura za mini-animaciju uvoda
    movement:
      | 'straight'
      | 'diagonal'
      | 'king'
      | 'knight'
      | 'queen'
      | 'pawn'
      | 'static'
      | 'numbers'
      | 'mascot';
    /** Samo za movement:'static' - tekst na uvodnoj kartici (npr. "Chess History Time!"). */
    /** movement:'mascot' (Day 14) - prava Pawny slika umesto glifa, isti bannerText slot. */
    bannerText?: string;
    /** Samo za movement:'mascot' - manji podnaslov ispod bannerText (npr. "Rated 100-300"). */
    subBannerText?: string;
  };
  steps: LessonStep[];
  /**
   * Opcioni ocenjeni rezime na kraju lekcije (npr. "6/6 correct!") - racuna
   * se SAMO od koraka navedenih u `stepIds` (npr. samo Faza 1 kviz pitanja u
   * Piece Values, ne i Faza 2), ne svih koraka lekcije. `tiers` poredjati
   * OPADAJUCE po `min` - prvi ciji je `min <= brojTacnih` pobedjuje. Generican
   * mehanizam, koristi ga bilo koja lekcija sa kviz delom koji zasluzuje
   * sopstvenu ocenu na kraju.
   */
  scoreSummary?: {
    stepIds: string[];
    tiers: { min: number; title: string; text: string }[];
  };
  /**
   * Visestepeni uvodni popup (npr. Next -> Got it -> Start) umesto
   * standardnog jednog ekrana. Kad je zadat, `intro.title` ostaje isti kroz
   * sve ekrane (samo tekst/dugme se menjaju); `intro.text` ostaje kao
   * fallback (jednak prvom koraku) za bilo koji kod koji eventualno cita
   * samo `intro.text` direktno. Klik na dugme POSLEDNJEG koraka otvara
   * tablu (isto kao standardni "Let's start"). Generican, ne
   * lekcija-specifican.
   */
  introSteps?: { text: string; buttonText: string }[];
  /**
   * Default: trailing niz kind:'puzzle' koraka na KRAJU lekcije (npr. 5
   * "vezbaj" puzli posle Rook primera) grupise se u JEDAN segment na progress
   * traci koji se puni razlomljeno - ima smisla kad su to ponovljene vezbe
   * istog tipa. Postavi na true da OTKAZES to grupisanje: svaki korak
   * (ukljucujuci puzzle) dobija SVOJ segment, obojen zeleno/roze nezavisno od
   * ostalih. Koristi kad su puzzle koraci tematski razliciti, pojedinacno
   * imenovani primeri (npr. Day 10 "Find the checkmate" - Queen/Rook/Knight/
   * Bishop/Pawn/Bonus) - jedna greska ne sme da oboji SVE njih.
   */
  flatProgressSegments?: boolean;
  /**
   * Zamenjuje standardni "Next Lesson / Repeat / Done" End Screen (npr. Day
   * 13 "Opening Test" / "Play from this position" / "Done!"). action:
   * 'placeholder' je dugme sa tekstom/mestom vec dogovorenim ali ponasanje
   * JOS NIJE odredjeno - prikazuje se disabled sa tooltip-om, pravo ponasanje
   * dolazi kroz poseban task. Kad ovo polje nije zadato, ponasanje je
   * nepromenjeno (postojece 3 dugmeta za sve ostale lekcije).
   */
  endScreenButtons?: {
    label: string;
    /**
     * 'review' (Day 14) - otvara postojecu Game Review aktivnost sa PGN-om
     * ove partije, u novoj sobi. 'play' (Day 16) - vodi na Play (matchmaking)
     * stranicu glavne web-app (app.outpostchess.com/intsearch), isti princip
     * kao postojece "Home"/"Free Play" dugme u Puzzle aktivnosti.
     */
    action: 'repeat' | 'done' | 'review' | 'play' | 'placeholder';
    /** Samo za action:'placeholder' - objasnjava zasto je dugme neaktivno. */
    tooltip?: string;
  }[];
  /**
   * Zamenjuje standardni naslov "Lesson complete! 🎉" na zavrsnom popup-u
   * (npr. Day 14 "Your first game is complete!" - to JESTE partija, ne
   * lekcija). Kad nije zadato, ostaje podrazumevani naslov.
   */
  endScreenTitle?: string;
  /**
   * Zamenjuje podrazumevani Pawny avatar (`/pawny/pawny.png`) u AI chat-u
   * (Conversation.tsx) kroz CELU lekciju - npr. Day 18 "Game 2" dobija novi,
   * "sigurniji" vizuel ("Pawny 2.0") umesto Day 14-ovog originala. Path pod
   * `public/`, isti format kao postojeci. Kad nije zadato, ostaje original.
   */
  pawnyAvatar?: string;
};

const DAY_1_ROOK: Lesson = {
  id: 'l1-d1-rook',
  level: 1,
  day: 1,
  title: 'Rook — How the Rook Moves',
  piece: { name: 'rook', glyph: '♜', movement: 'straight' },
  intro: {
    title: 'Rook — How the Rook Moves',
    text: 'The rook moves in straight lines — **left**, **right**, **up** and **down**. As far as it likes — but it can **never jump** over another piece!',
  },
  steps: [
    {
      id: 'teach-horizontal',
      kind: 'teach',
      fen: '7k/8/8/8/Rp1p2p1/8/8/7K w - - 0 1',
      orientation: 'w',
      solution: ['a4b4', 'b4d4', 'd4g4'],
      prompt: 'Capture all three pawns',
      introText:
        'Your rook is on a4. Slide it sideways and capture every pawn on the row.',
      successText: 'Nice — keep going!',
      doneText: 'Excellent! The rook collected all the pawns!',
      hintText:
        'The rook only moves straight — left, right, up or down. Try again!',
    },
    {
      id: 'teach-vertical',
      kind: 'teach',
      fen: '7k/3p4/3p4/8/8/8/8/3R3K w - - 0 1',
      orientation: 'w',
      solution: ['d1d6', 'd6d7'],
      prompt: 'Now capture going up the board',
      introText:
        'Same rook, new direction. Climb the d-file and take both pawns.',
      successText: "That's it!",
      doneText: 'Great! The rook goes up and down too!',
      hintText:
        "The rook can't jump over pieces — capture the closest pawn first!",
    },
    {
      id: 'teach-mixed',
      kind: 'teach',
      fen: '7k/8/1p2p3/8/8/4p1p1/8/1R5K w - - 0 1',
      orientation: 'w',
      solution: ['b1b6', 'b6e6', 'e6e3', 'e3g3'],
      prompt: 'Mix it up — sideways and up and down',
      introText:
        'Four pawns this time. Use both directions to collect them all.',
      successText: 'Good one!',
      doneText: 'Bravo — you are a Rook Master now!',
      hintText:
        "Straight lines only. Look for a pawn on the rook's row or column.",
    },
    {
      id: 'teach-mate',
      kind: 'teach',
      fen: '6k1/5ppp/8/8/8/8/5PPP/2R3K1 w - - 0 1',
      orientation: 'w',
      solution: ['c1c8'],
      prompt: "One move — and it's checkmate! Can you find it?",
      introText:
        'The black king is trapped behind its own pawns. One rook move ends the game.',
      doneText: "CHECKMATE! 🎉 You've learned how the rook moves. Great start!",
      hintText:
        "The king can't breathe behind its own pawns — take the back rank!",
      celebrate: true,
    },
    {
      id: 'puzzle-1',
      kind: 'puzzle',
      fen: 'r1b3k1/5ppb/pn5p/1p6/5N2/P5P1/1PP3BP/2KR4 w - - 0 1',
      orientation: 'w',
      solution: ['d1d8'],
      prompt: 'White to play — mate in 1',
      introText: 'Same idea as before. The back rank is wide open.',
      doneText: 'Checkmate! One down.',
      hintText: 'Look at the open d-file and the black back rank.',
    },
    {
      id: 'puzzle-2',
      kind: 'puzzle',
      fen: 'r5k1/pp3p1p/2r3pB/5n2/8/P2R3P/1P3PP1/3R2K1 w - - 0 1',
      orientation: 'w',
      solution: ['d3d8', 'a8d8', 'd1d8'],
      prompt: 'White to play — mate in 2',
      introText:
        'You have two rooks on the d-file. Give the first one away to open the door.',
      successText: 'Keep going — finish it!',
      doneText: 'Beautiful! A rook sacrifice into mate.',
      hintText: 'Sacrifice on d8 first — the second rook delivers the mate.',
    },
    {
      id: 'puzzle-3',
      kind: 'puzzle',
      fen: '4r1k1/pb3pp1/1pn1r2p/8/8/2B3P1/PP2NP1P/R3R1K1 b - - 0 1',
      orientation: 'b',
      solution: ['e6e2', 'e1e2', 'e8e2'],
      prompt: 'Black to play — win a piece',
      introText:
        'You are Black now. Both your rooks look down the e-file — count the attackers.',
      successText: 'Good — take it back!',
      doneText: 'A whole knight up. Well played!',
      hintText: 'Stack your rooks on the e-file and take on e2 twice.',
    },
    {
      id: 'puzzle-4',
      kind: 'puzzle',
      fen: 'r7/5pk1/8/1bR5/1P4p1/1BP3Pp/5P1P/6K1 b - - 0 1',
      orientation: 'b',
      solution: ['a8a1', 'b3d1', 'a1d1'],
      prompt: 'Black to play — mate in 2',
      introText:
        'The white king is stuck on the back rank and your pawn on h3 covers g2.',
      successText: 'He blocked — now take it!',
      doneText: 'Checkmate! The back rank strikes again.',
      hintText: 'Bring your rook to the first rank with check.',
    },
    {
      id: 'puzzle-5',
      kind: 'puzzle',
      fen: '8/6k1/R7/8/5K2/8/8/1R6 w - - 0 1',
      orientation: 'w',
      solution: ['b1b7', ANY_LEGAL_REPLY, 'a6a8'],
      prompt: 'White to play — mate in 2',
      introText:
        'Two rooks, no king needed. Push the black king up one rank at a time.',
      successText: 'Now the other rook finishes it.',
      doneText:
        "Ladder mate! That's five puzzles — you mastered the rook today!",
      hintText:
        'Check with one rook to push the king up, then mate with the other.',
      celebrate: true,
    },
  ],
};

const DAY_2_BISHOP: Lesson = {
  id: 'l1-d2-bishop',
  level: 1,
  day: 2,
  title: 'Bishop — How the Bishop Moves',
  piece: { name: 'bishop', glyph: '♝', movement: 'diagonal' },
  intro: {
    title: 'Bishop — How the Bishop Moves',
    text: 'The bishop moves **diagonally** — in all four corner directions. As far as it likes — but it can never jump over another piece!',
  },
  steps: [
    {
      id: 'teach-diagonal-up-right',
      kind: 'teach',
      fen: '6k1/8/5p2/8/3p4/8/1p6/B6K w - - 0 1',
      orientation: 'w',
      solution: ['a1b2', 'b2d4', 'd4f6'],
      prompt: 'Capture all three pawns',
      introText:
        'Your bishop is on a1. Slide it along the diagonal and capture every pawn in its path.',
      successText: 'Nice — keep going!',
      doneText: 'Excellent! The bishop collected all the pawns!',
      hintText:
        'The bishop only moves diagonally — like a slanted line. Try again!',
    },
    {
      id: 'teach-diagonal-up-left',
      kind: 'teach',
      fen: 'k7/8/2p5/8/8/5p2/8/K6B w - - 0 1',
      orientation: 'w',
      solution: ['h1f3', 'f3c6'],
      prompt: 'Now capture along the other diagonal',
      introText:
        'Same bishop, opposite corner. Climb the diagonal from h1 and take both pawns.',
      successText: "That's it!",
      doneText: 'Great! The bishop goes diagonally in every direction!',
      hintText:
        "The bishop can't jump over pieces — capture the closest pawn first!",
    },
    {
      id: 'teach-mixed',
      kind: 'teach',
      fen: 'k7/8/4p3/8/8/1p5p/8/3B3K w - - 0 1',
      orientation: 'w',
      solution: ['d1b3', 'b3e6', 'e6h3'],
      prompt: 'Mix it up — zigzag across the diagonals',
      introText:
        'Three pawns this time, in different directions. Zigzag across the board to collect them all.',
      successText: 'Good one!',
      doneText: 'Bravo — you are a Bishop Master now!',
      hintText: 'Diagonals only. Look for a pawn on one of the four rays.',
    },
    {
      id: 'teach-mate',
      kind: 'teach',
      fen: 'k7/ppK5/8/3B4/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['d5b7'],
      prompt: "One move — and it's checkmate! Can you find it?",
      introText:
        'The black king is trapped in the corner by its own pawns, with your king cutting off the escape. One bishop move ends the game.',
      doneText:
        "CHECKMATE! 🎉 You've learned how the bishop moves. Great start!",
      hintText: "The king can't breathe in the corner — take the pawn!",
      celebrate: true,
    },
    {
      id: 'puzzle-1',
      kind: 'puzzle',
      fen: '6bk/p6p/1p6/8/3nB3/8/P6P/6BK w - - 0 1',
      orientation: 'w',
      solution: ['g1d4'],
      prompt: 'White to play — mate in 1',
      introText: 'Same idea as before. Look for the diagonal into the knight.',
      doneText: 'Checkmate! One down.',
      hintText: 'Look at both bishops - one of them reaches d4 with mate.',
    },
    {
      id: 'puzzle-2',
      kind: 'puzzle',
      fen: '6k1/6B1/6K1/8/8/7B/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['h3e6'],
      prompt: 'White to play — mate in 1',
      introText: 'Two bishops, one king with nowhere to go.',
      doneText: 'Checkmate! Two down.',
      hintText: 'The king on g8 is boxed in - find the check that ends it.',
    },
    {
      id: 'puzzle-3',
      kind: 'puzzle',
      fen: 'r1bk2r1/2pp4/8/8/1PK5/P6P/1B4P1/4R3 w - - 0 1',
      orientation: 'w',
      solution: ['b2f6'],
      prompt: 'White to play — mate in 1',
      introText: 'The bishop has a long, clear diagonal into the black camp.',
      doneText:
        "Checkmate! That's three puzzles — you mastered the bishop today!",
      hintText: 'Follow the long diagonal all the way to f6.',
      celebrate: true,
    },
  ],
};

const DAY_3_KING: Lesson = {
  id: 'l1-d3-king',
  level: 1,
  day: 3,
  title: 'King — How the King Moves',
  piece: { name: 'king', glyph: '♚', movement: 'king' },
  intro: {
    title: 'King — How the King Moves',
    text: 'The King moves **ONE square** at a time — in any direction. Up, down, left, right, or diagonal. But it can never move into danger!',
  },
  steps: [
    {
      id: 'teach-horizontal',
      kind: 'teach',
      fen: '7k/8/8/8/3Kppp1/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['d4e4', 'e4f4', 'f4g4'],
      prompt: 'Collect the pawns',
      introText:
        'Your King is on d4. Step one square at a time to capture the pawns to the right.',
      successText: 'Nice — keep going!',
      doneText: 'Great! The King collected all the pawns — one step at a time!',
      hintText: 'The King moves only ONE square at a time. Look at the arrows and try again!',
    },
    {
      id: 'teach-vertical-horizontal',
      kind: 'teach',
      fen: '7k/8/8/2pp4/3K4/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['d4d5', 'd5c5'],
      unorderedTargets: true,
      prompt: 'Up and sideways',
      introText:
        'Same King, new directions. Step forward, then sideways, to collect both pawns — either one first.',
      doneText: 'The King walks forward AND sideways. It moves one square in any direction!',
      hintText: 'The King moves only ONE square at a time. Look at the arrows and try again!',
    },
    {
      id: 'teach-mixed',
      kind: 'teach',
      fen: '7k/8/8/3pp3/4Kp2/8/8/8 w - - 0 1',
      orientation: 'w',
      // NIJE unorderedTargets: iako su d5 i e5 oba legalna prva poteza sa e4,
      // e5-first vodi u cor-de-sac (posle e5 kralj ne moze legalno do f4 ni
      // do d5->f4 - nije susedno) - samo d5,e5,f4 redosled zaista zavrsava
      // primer. Provereno preko chess.js simulacije svih varijanti.
      solution: ['e4d5', 'd5e5', 'e5f4'],
      prompt: 'Mix — all 8 directions',
      introText:
        "Now let's mix it up — diagonal, horizontal, and vertical. How will you grab all the pawns fastest, now that you know how the King moves?",
      successText: 'Good one!',
      doneText:
        'King Master! You moved in three different directions. The King goes anywhere — one step at a time!',
      hintText: 'The King moves only ONE square at a time. Look at the arrows and try again!',
    },
    {
      id: 'king-hunts-pawn',
      kind: 'puzzle',
      fen: '7k/8/8/3K4/7p/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['d5e4', 'h4h3', 'e4f3'],
      prompt: 'Stop the pawn!',
      introText:
        "That pawn is about to promote — stop it with your King! Two moves. You can do this!",
      doneText: 'Bravo! Your King catches up to the pawn.',
      hintText: 'Chase the pawn — move your King one square closer to catch it!',
    },
    {
      id: 'castle-kingside',
      kind: 'teach',
      fen: '4k3/8/8/8/8/8/8/4K2R w K - 0 1',
      orientation: 'w',
      solution: ['e1g1'],
      prompt: 'Castle king-side',
      introText:
        "Small castling is a special chess move called the king's move 👑. The king moves 2 squares toward the rook, then the rook jumps next to the king.",
      doneText:
        'Bravo! It helps keep the king safe and brings the rook into the game faster. This is called king-side castling or small castling.',
      hintText: "Move your King two squares toward the rook — that's castling!",
      preStepIntro: {
        title: "Let's learn castling",
        text: "It's time to learn **castling** — the king's favorite move ;)",
        bullets: [
          'Castling helps keep your **king safe**',
          'It **connects your rooks** and improves your position',
          'It is one of the **most important moves** in chess opening strategy',
        ],
        buttonText: "Let's go!",
        diagram: 'castle-kingside',
      },
    },
    {
      id: 'castle-queenside',
      kind: 'teach',
      fen: '4k3/8/8/8/8/8/8/R3K3 w Q - 0 1',
      orientation: 'w',
      solution: ['e1c1'],
      prompt: 'Castle queen-side',
      introText:
        'Big castling works the same way, but on the other side of the board. It\'s the king\'s move, so you **"hold onto the king" and move it two squares toward the rook**, then place the rook on the other side, right next to the king. The king starts on e1, the rook starts on a1 — the king moves to c1, the rook moves to d1. This is called queen-side castling or big castling.',
      doneText: "King Master! You're done for today — see you tomorrow!",
      hintText: 'Move your King two squares toward the a1 rook.',
      celebrate: true,
      preStepIntro: {
        title: "Let's learn queen-side castling",
        text: "This is **big castling** — same idea, other side of the board.",
        bullets: [
          'The king still moves just **two squares**',
          'This time it moves toward the **a1 rook**',
          'The rook lands right next to the king, on **d1**',
        ],
        buttonText: "Let's go!",
        diagram: 'castle-queenside',
      },
    },
  ],
};

const DAY_4_KNIGHT: Lesson = {
  id: 'l1-d4-knight',
  level: 1,
  day: 4,
  title: 'Knight — How the Knight Moves',
  piece: { name: 'knight', glyph: '♞', movement: 'knight' },
  intro: {
    title: 'Knight — How the Knight Moves',
    text: "The Knight moves in an **L-shape** — 2 squares in one direction, then 1 square to the side. And here's the magic: it's the **only piece that can jump over other pieces**!",
  },
  steps: [
    {
      id: 'teach-l-shape-all-directions',
      kind: 'teach',
      fen: '7k/4p3/2p5/5p2/1p1N4/8/8/7K w - - 0 1',
      orientation: 'w',
      solution: ['d4f5', 'f5e7', 'e7c6', 'c6b4'],
      prompt: 'Collect the pawns',
      introText:
        'Your Knight is on d4. Jump to each pawn — the L-shape can face any of 8 directions.',
      successText: "That's it! Two squares, then one to the side.",
      doneText:
        "Nice! Did you notice the L-shape each time? Two squares, then one — that's the Knight's signature move!",
      hintText:
        'The Knight moves in an L-shape — two squares, then one to the side. Look at the arrows and try again!',
    },
    {
      id: 'teach-jump-over',
      kind: 'teach',
      fen: '6k1/8/8/p2p4/1p2p3/3p4/1pp5/N5K1 w - - 0 1',
      orientation: 'w',
      solution: ['a1b3'],
      prompt: 'Find the safe square',
      introText:
        'Can the Knight escape and find a safe square? Every square around it looks blocked...',
      doneText:
        "The Knight doesn't care about traffic — it jumps over everything! No other piece can do that.",
      hintText:
        'The Knight moves in an L-shape — two squares, then one to the side. Look at the arrows and try again!',
      jumpGlow: true,
    },
    {
      id: 'teach-zigzag',
      kind: 'teach',
      fen: 'k5N1/4p3/8/5p2/3p4/1p6/8/7K w - - 0 1',
      orientation: 'w',
      solution: ['g8e7', 'e7f5', 'f5d4', 'd4b3'],
      prompt: 'Zigzag across the board',
      introText:
        'Now the Knight zigzags — every capture faces a completely different direction.',
      successText: 'So that\'s how it\'s done — a totally different direction!',
      doneText:
        'The Knight zigzags like no other piece. That L-shape works in 8 different directions!',
      hintText:
        'The Knight moves in an L-shape — two squares, then one to the side. Look at the arrows and try again!',
    },
    {
      id: 'teach-knights-march',
      kind: 'teach',
      fen: '7k/3p4/5p2/2p5/8/1p6/8/N6K w - - 0 1',
      orientation: 'w',
      solution: ['a1b3', 'b3c5', 'c5d7', 'd7f6'],
      prompt: "The Knight's march",
      introText:
        "The Knight starts in the corner. Can you guide it all the way across the board? Four captures — let's go!",
      successText: 'Onward! The Knight keeps marching.',
      doneText:
        "THE KNIGHT HAS CONQUERED THE BOARD! 🐴♞ From corner to corner — that's the power of the Knight. You've mastered the L-shape!",
      hintText:
        'Follow the L! Two squares then one — or one then two. Look at the arrows.',
    },
    {
      id: 'puzzle-warmup',
      kind: 'puzzle',
      fen: '7k/8/8/6p1/8/5N2/8/7K w - - 0 1',
      orientation: 'w',
      solution: ['f3g5'],
      prompt: 'Single capture — warm up',
      introText:
        'Time to test your Knight skills! Find the right moves — take all the pawns.',
      doneText: 'Got it!',
      hintText:
        "That's not an L-shape. Look at the arrows — where can the Knight land from here?",
    },
    {
      // Dva uzastopna korisnikova poteza bez protivnika - strukturno je
      // 'teach' (forsira potez nazad na belog), iako je u tiketu opisan kao
      // "puzzle" - kind ovde opisuje MEHANIKU poteza, ne UI kategoriju.
      id: 'puzzle-two-captures',
      kind: 'teach',
      fen: '7k/8/8/8/4p3/2p5/8/KN6 w - - 0 1',
      orientation: 'w',
      solution: ['b1c3', 'c3e4'],
      prompt: 'Two captures in sequence',
      introText: 'Two pawns this time — plan your route.',
      successText: 'One more to go!',
      doneText: 'Well played!',
      hintText:
        "That's not an L-shape. Look at the arrows — where can the Knight land from here?",
    },
    {
      id: 'puzzle-fork',
      kind: 'puzzle',
      fen: '8/8/3K1R2/8/8/2n5/8/7k b - - 0 1',
      orientation: 'b',
      solution: ['c3e4'],
      prompt: 'Find the fork',
      introText: 'One move — can you find the Knight fork?',
      doneText:
        "Knight Master! 🐴 You've completed the Knight lesson, see you tomorrow!",
      hintText:
        "That's not an L-shape. Look at the arrows — where can the Knight land from here?",
      celebrate: true,
    },
  ],
};

const DAY_5_QUEEN: Lesson = {
  id: 'l1-d5-queen',
  level: 1,
  day: 5,
  title: 'Queen — How the Queen Moves',
  piece: { name: 'queen', glyph: '♛', movement: 'queen' },
  intro: {
    title: 'Queen — How the Queen Moves',
    text: "The Queen is the **most powerful piece** on the board! She moves straight and diagonally — in all 8 directions, as many squares as she likes. She's the **Rook and Bishop combined**!",
  },
  steps: [
    {
      id: 'teach-straight',
      kind: 'teach',
      fen: 'k7/3p2p1/8/8/3Q4/1p4p1/8/7K w - - 0 1',
      orientation: 'w',
      solution: ['d4d7', 'd7g7', 'g7g3', 'g3b3'],
      prompt: 'Collect the pawns',
      introText:
        'You need to move your Queen so that every next move captures a pawn. Plan the route ahead 😉',
      successText: 'Straight line — nice!',
      doneText:
        "Great! The Queen moves straight — left, right, up, down. Just like a Rook, but she's so much more!",
      hintText:
        'The Queen moves straight or diagonally. Look at the highlighted squares and try again! Remember — every move needs to capture a pawn, plan ahead.',
    },
    {
      id: 'teach-diagonal',
      kind: 'teach',
      fen: 'k7/5p2/6p1/3p4/4Q3/1p6/8/7K w - - 0 1',
      orientation: 'w',
      solution: ['e4d5', 'd5b3', 'b3f7', 'f7g6'],
      prompt: 'Collect the pawns diagonally',
      introText:
        'You need to move your Queen so that every next move captures a pawn. Plan the route ahead 😉',
      successText: 'Diagonal power!',
      doneText:
        "Excellent! The Queen also moves diagonally — just like a Bishop! Remember: Queen = Rook + Bishop combined.",
      hintText:
        'The Queen moves straight or diagonally. Look at the highlighted squares and try again!',
    },
    {
      id: 'teach-mix',
      kind: 'teach',
      fen: 'k7/3p4/8/5p2/3Q4/1p3p2/8/7K w - - 0 1',
      orientation: 'w',
      solution: ['d4d7', 'd7f5', 'f5f3', 'f3b3'],
      prompt: 'Mix — every direction',
      introText:
        'You need to move your Queen so that every next move captures a pawn. Plan the route ahead 😉',
      successText: "Any direction — that's the Queen!",
      doneText:
        "Masterful! The Queen uses every direction — straight and diagonal. No piece can do more than her!",
      hintText:
        'The Queen moves straight or diagonally. Look at the highlighted squares and try again!',
    },
    {
      id: 'teach-queens-reign',
      kind: 'teach',
      fen: 'k7/8/2p2p2/7p/8/5p2/2Q5/7K w - - 0 1',
      orientation: 'w',
      solution: ['c2c6', 'c6f6', 'f6f3', 'f3h5'],
      prompt: "The Queen's reign",
      introText:
        "The Queen stands in the corner. Can you guide her all the way across the board? Let's go! You need to move your Queen so that every next move captures a pawn. Plan the route ahead 😉",
      successText: 'Onward, Your Majesty!',
      doneText:
        "THE QUEEN RULES THE BOARD! 👑♛ Up, down, left, right, diagonal — the Queen can do it all. You've mastered the most powerful piece!",
      hintText:
        'Follow the direction! The Queen moves straight or diagonally. Look at the arrows.',
    },
    {
      id: 'puzzle-warmup',
      kind: 'puzzle',
      fen: '6k1/5ppp/7q/8/6Q1/6P1/5P1P/6K1 w - - 0 1',
      orientation: 'w',
      solution: ['g4c8'],
      prompt: 'Checkmate in one',
      introText:
        "Time to test your Queen skills! Find the right moves and capture every pawn. Let's see how the Queen performs in a real game — white to play and checkmate!",
      doneText: 'Checkmate! Well spotted.',
      hintText:
        "That's not a Queen move. Look at the arrows — where can she go from here?",
    },
    {
      id: 'puzzle-find-the-mate',
      kind: 'puzzle',
      fen: '6k1/5pp1/8/q7/5Q1p/8/5PPP/6K1 b - - 0 1',
      orientation: 'b',
      solution: ['a5e1'],
      prompt: 'Find the checkmate',
      introText: 'Black to move — find the mate in one with the Queen.',
      doneText: 'Checkmate! The Queen delivers.',
      hintText:
        "That's not a Queen move. Look at the arrows — where can she go from here?",
    },
    {
      id: 'puzzle-queens-triumph',
      kind: 'puzzle',
      fen: '5rk1/1bp2pp1/1p2q2p/p2p4/P2Q4/1P6/2P2PPP/B4RK1 w - - 0 1',
      orientation: 'w',
      solution: ['d4g7'],
      prompt: "The Queen's triumph",
      introText:
        "This is what it looks like in a real game. White to play and deliver checkmate in one — yes, really. Find the move!",
      doneText:
        "Queen Master! 👑 You've completed the Queen lesson — see you tomorrow!",
      hintText:
        "That's not a Queen move. Look at the arrows — where can she go from here?",
      celebrate: true,
    },
  ],
};

const DAY_6_PAWN: Lesson = {
  id: 'l1-d6-pawn',
  level: 1,
  day: 6,
  title: 'Pawn: Small but Mighty',
  piece: { name: 'pawn', glyph: '♟', movement: 'pawn' },
  intro: {
    title: 'Pawn: Small but Mighty',
    text: "The Pawn is the **only piece that can never move backward**. But it has some secret rules that make it special — let's learn them all!",
  },
  steps: [
    {
      id: 'move-one-square',
      kind: 'teach',
      fen: '7k/8/8/8/3P4/8/8/7K w - - 0 1',
      orientation: 'w',
      solution: ['d4d5'],
      prompt: 'Move the pawn forward',
      introText: "This pawn isn't on its starting square. Move it forward!",
      doneText:
        "Correct! One square forward — that's the pawn's normal, everyday move.",
      hintText:
        "Only one square! This pawn isn't on its starting square, so the two-square bonus is already used.",
      preStepIntro: {
        title: 'Pawn Movement',
        text: 'The Pawn moves straight ahead — but there\'s a twist depending on where it stands.',
        bullets: [
          'Normally, it moves just **one square** forward',
          "From its **starting square**, it gets a bonus — **one or two squares**, just this once",
          "After that first move, it's **always one square** forever",
        ],
        buttonText: "Got it, let's go!",
      },
    },
    {
      id: 'move-two-squares',
      kind: 'teach',
      fen: '7k/8/8/8/8/8/3P4/7K w - - 0 1',
      orientation: 'w',
      solution: ['d2d4'],
      prompt: 'Use the bonus — jump two!',
      introText:
        "This pawn hasn't moved yet! Jump it forward TWO squares right away!",
      doneText:
        'Excellent! Two squares at once — the pawn used its special power. But only once!',
      hintText:
        'Try jumping two squares — this pawn is still on its starting square!',
    },
    {
      id: 'find-free-pawn',
      kind: 'teach',
      fen: '7k/8/8/8/p1p3p1/P1P3P1/4P3/7K w - - 0 1',
      orientation: 'w',
      solution: ['e2e3'],
      altMoves: { 0: ['e2e4'] },
      prompt: 'Find the pawn that can move',
      introText:
        "Three pawns are stuck — they can't move at all! Which pawn is free? Find it and move it!",
      doneText:
        'Nice! Whether one square or two — you found the free pawn and moved it forward!',
      hintText:
        'This pawn is blocked — an enemy piece stands right in front of it! Try a different pawn.',
    },
    {
      id: 'diagonal-capture',
      kind: 'teach',
      fen: '7k/8/2p5/3p4/2P5/8/8/7K w - - 0 1',
      orientation: 'w',
      solution: ['c4d5', 'd5c6'],
      prompt: 'Capture both pawns',
      introText: 'Capture the pawn diagonally right, then diagonally left.',
      successText:
        'Great! Now play again, but capture diagonally to the other side.',
      successTextAlways: true,
      doneText:
        "Great! Left and right diagonally — that's the pawn's only way to attack!",
      hintText:
        "The Pawn can't capture straight ahead! It has to be diagonal. Look at the highlighted squares.",
      preStepIntro: {
        title: 'How the Pawn Captures',
        text: 'The Pawn is special — it moves straight, but captures diagonally.',
        bullets: [
          'It can capture **one square diagonally forward** — left or right',
          'It can **never** capture straight ahead',
          'No target, no move — it can only step diagonally onto an enemy piece',
        ],
        buttonText: 'Show me!',
      },
    },
    {
      id: 'en-passant',
      kind: 'puzzle',
      fen: '7k/7p/p1p1p1p1/P1P1P1P1/8/8/5K2/8 b - - 0 1',
      orientation: 'w',
      solution: ['h7h5', 'g5h6'],
      prompt: 'Find the en passant capture',
      introText:
        "A black pawn just jumped from h7 to h5! Now or never — only one of your pawns can capture it en passant. Which one?",
      doneText:
        "BRAVO! g5×h6 — the black pawn on h5 is captured, and your pawn lands on h6. That's en passant — the most special move in chess!",
      hintText:
        "This pawn is blocked and can't even move. En passant only works for the pawn standing right BESIDE the black pawn that just jumped.",
      preStepIntro: {
        title: 'En Passant — the Secret Capture',
        text: "This is the pawn's most special rule — a capture that almost nobody expects.",
        bullets: [
          'If an enemy pawn jumps **two squares** and lands right beside yours, you can capture it **as if it only moved one**',
          'You can only do this **immediately**, on your very next move',
          'Wait even one move — and the chance is **gone forever**',
        ],
        buttonText: 'Got it!',
      },
    },
    {
      id: 'promotion',
      kind: 'teach',
      fen: '7k/4P3/8/8/8/8/8/5K2 w - - 0 1',
      orientation: 'w',
      solution: ['e7e8q'],
      prompt: 'Promote to a Queen!',
      introText:
        "The pawn is one step from transforming! Move it to the last rank and choose a Queen!",
      doneText:
        "PAWN BECAME A QUEEN! ♟️→♛ From the weakest piece to the strongest, all in one move. You've mastered the Pawn!",
      nonQueenPromotionText:
        'That works! But remember — in almost every situation, the Queen is the strongest choice.',
      hintText:
        'The Pawn can only move forward! Move it to the last rank — that\'s your goal.',
      preStepIntro: {
        title: "Promotion — The Pawn's Transformation",
        text: 'When a pawn reaches the last rank, it transforms into a new piece!',
        bullets: [
          'You can choose: **Queen**, Rook, Bishop, or Knight',
          "⭐ Almost always choose the **Queen** — she's the most powerful",
          'This is how the weakest piece becomes the strongest, in a single move',
        ],
        buttonText: "Let's try it!",
      },
    },
    {
      id: 'puzzle-movement',
      kind: 'puzzle',
      fen: '7k/8/8/8/4P3/8/8/5K2 w - - 0 1',
      orientation: 'w',
      solution: ['e4e5'],
      prompt: 'How far can it go?',
      introText:
        "Time for the test! Every puzzle checks one of the rules you just learned. This pawn isn't on e2 — how far can it go?",
      doneText: 'Nice — one square, exactly right!',
      hintText:
        "This pawn is NOT on its starting square! The two-square bonus only works from e2 or e7. From here — just one square forward!",
    },
    {
      id: 'puzzle-capture',
      kind: 'puzzle',
      fen: '7k/8/8/8/3pp3/4P3/8/5K2 w - - 0 1',
      orientation: 'w',
      solution: ['e3d4'],
      prompt: 'Find the capture',
      introText:
        'This pawn is blocked straight ahead — but it can still capture diagonally.',
      doneText: 'Exactly! Diagonal capture — the only way a pawn attacks.',
      hintText:
        "The Pawn can't capture straight ahead! Capturing is always diagonal. Look to the side...",
    },
    {
      id: 'puzzle-en-passant',
      kind: 'puzzle',
      fen: '7k/4p3/3p4/3P4/8/8/5K2/8 b - - 0 1',
      orientation: 'w',
      solution: ['e7e5', 'd5e6'],
      prompt: 'En passant — now or never',
      introText:
        'The black pawn just jumped from e7 to e5. Your pawn on d5 is blocked straight ahead — en passant is the only option!',
      doneText:
        'En passant! d5×e6 — the black pawn disappears, yours lands behind it. You caught it in the act!',
      hintText:
        "d6 is blocked by a black pawn — you can't go there. But look at the black pawn on e5... it just jumped two squares. Sound familiar?",
    },
    {
      id: 'puzzle-promotion',
      kind: 'puzzle',
      fen: '7k/3P4/8/8/8/8/8/5K2 w - - 0 1',
      orientation: 'w',
      solution: ['d7d8q'],
      prompt: 'One step from transformation',
      introText: "The pawn is on d7 — one step away from becoming a Queen!",
      doneText:
        "Pawn Master! ♟️ You've mastered the most specific piece in chess — see you tomorrow!",
      nonQueenPromotionText:
        'That works! But the Queen is almost always the strongest choice.',
      hintText:
        'The Pawn can only move forward! Move it to the last rank and choose your piece.',
      celebrate: true,
    },
  ],
};

const STARTING_FEN =
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1';

// Prazna tabla sa jednom damom na a1 - "univerzalni markr" za red/kolonu/
// dijagonalu zadatak (dama moze da klizi u sva tri pravca, geometrijski
// tacno, iako legalnost ovde uopste nije relevantna - ChessFENBoard ne
// proverava sahovska pravila, poredimo samo string potez sa `solution`).
const LINE_TASK_FEN = '8/8/3k4/8/8/4K3/8/Q7 w - - 0 1';

const DAY_8_PIECE_VALUES: Lesson = {
  id: 'l1-d8-piece-values',
  level: 1,
  day: 8,
  title: 'Piece Values',
  piece: {
    name: 'piece values',
    glyph: '🧮',
    movement: 'numbers',
  },
  intro: {
    title: 'Piece Values',
    text: "Did you know chess has a little bit of math in it? 😄 Don't worry — it's simple! Every piece has a **point value**, like a score. And just like in math, we just add them up! This helps us make smart decisions — like deciding if a trade is a good deal. Let's find out how much each piece is worth. You tell me what you think — and I'll tell you if you're right! 🎯",
  },
  scoreSummary: {
    // Rezime se racuna na osnovu Phase 2 (9 "mixed position" potpitanja,
    // brojanje materijala, koja dolaze posle sredisnjeg popup-a) - to su
    // "pravi" primeri, ne Phase 1 recall kviz o pojedinacnim figurama.
    stepIds: [
      'mixed1-white',
      'mixed1-black',
      'mixed1-verdict',
      'mixed2-black',
      'mixed2-white',
      'mixed2-verdict',
      'mixed3-white',
      'mixed3-black',
      'mixed3-verdict',
    ],
    tiers: [
      {
        min: 9,
        title: 'Chess mathematician!',
        text: 'Nothing gets past you!',
      },
      {
        min: 7,
        title: 'Great job!',
        text: "Just a little more practice and it'll be perfect.",
      },
      {
        min: 4,
        title: 'Good start!',
        text: 'Check the table one more time and try again.',
      },
      {
        min: 0,
        title: 'No worries!',
        text: 'Piece values are easy to learn — give it another shot!',
      },
    ],
  },
  steps: [
    {
      id: 'value-pawn',
      kind: 'quiz',
      fen: '7k/8/8/8/8/8/4P3/7K w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'How much is a Pawn worth?',
      introText:
        "Let's start with the humblest piece on the board — the pawn! ♟️ How much do you think one pawn is worth?",
      quizOptions: ['1 point', '2 points', '3 points', '5 points'],
      quizCorrectIndex: 0,
      quizExplanation:
        'Correct! A pawn is worth 1 point. Small, but there are 8 of them — and every point counts! And when a pawn reaches the other end of the board... it becomes a queen! 👑',
      quizExplanationWrong:
        "Close! The pawn is actually the weakest piece — worth only 1 point. But don't underestimate it! You have 8 of them, and they can become queens! 👑",
      doneText:
        'A pawn is worth 1 point. Small, but there are 8 of them — and every point counts!',
      hintText: '',
    },
    {
      id: 'value-knight',
      kind: 'quiz',
      fen: '7k/8/8/8/8/8/4N3/7K w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'How much is a Knight worth?',
      introText:
        'What about the knight? 🐴 It jumps in an L-shape and can leap over other pieces... How much is it worth?',
      quizOptions: ['1 point', '2 points', '3 points', '5 points'],
      quizCorrectIndex: 2,
      quizExplanation:
        "Great! The knight is worth 3 points. It has one special ability — it's the only piece that can jump over others! That makes it special, even if it \"only\" scores 3.",
      quizExplanationWrong:
        "The knight is worth 3 points. Not as weak as a pawn, but not as powerful as a rook or queen. It's the only piece that can jump over others — that's its secret weapon! 🐴",
      doneText:
        "The knight is worth 3 points — and it's the only piece that can jump over others!",
      hintText: '',
    },
    {
      id: 'value-bishop',
      kind: 'quiz',
      fen: '7k/8/8/8/8/8/4B3/7K w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'How much is a Bishop worth?',
      introText:
        'Now the bishop! ⚡ It slides along diagonals, fast and far... How much is it worth?',
      quizOptions: ['1 point', '3 points', '5 points', '7 points'],
      quizCorrectIndex: 1,
      quizExplanation:
        'Correct! The bishop is worth 3 points — same as the knight! Interesting, right? Same value, totally different style. The knight jumps, the bishop glides. Which one do you like more? 😄',
      quizExplanationWrong:
        'The bishop is worth 3 points — just like the knight! Knight and bishop are "value twins" — same score, but they move completely differently.',
      doneText:
        'The bishop is worth 3 points — same as the knight, the "value twins"!',
      hintText: '',
    },
    {
      id: 'value-rook',
      kind: 'quiz',
      fen: '7k/8/8/8/8/8/4R3/7K w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'How much is a Rook worth?',
      introText:
        'The rook! 🏰 Powerful, it controls entire rows and columns. How many points do you think it\'s worth?',
      quizOptions: ['3 points', '4 points', '5 points', '7 points'],
      quizCorrectIndex: 2,
      quizExplanation:
        'Perfect! The rook is worth 5 points! That means the rook is more valuable than a knight or bishop. So if we trade a knight for a rook — we\'ve won the "exchange"! ♜',
      quizExplanationWrong:
        'The rook is worth 5 points — more than a knight or bishop! It\'s almost always better to have a rook than a knight or bishop. Chess players call that winning the "exchange". ♜',
      doneText: 'The rook is worth 5 points — more than a knight or bishop!',
      hintText: '',
    },
    {
      id: 'value-king',
      kind: 'quiz',
      fen: '7k/8/8/8/8/8/8/4K3 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'How much is the King worth?',
      introText: 'What about the king? 👑 How much is it worth?',
      quizOptions: [
        '5 points',
        '9 points',
        '10 points',
        "No price — it's worth everything!",
      ],
      quizCorrectIndex: 3,
      quizExplanation:
        'Exactly! The king is priceless — worth infinity! ∞ Why? Because if you lose your king, you lose the GAME. The king can never be traded for anything — it never surrenders! 👑',
      quizExplanationWrong:
        'The king actually has no point value — it\'s worth ∞ infinity! Because when the king falls — the game is over. It\'s above the points system. It can fight, but it can never be traded! 👑',
      doneText:
        'The king is priceless — worth infinity. Lose it, and you lose the game!',
      hintText: '',
    },
    {
      id: 'value-queen',
      kind: 'quiz',
      fen: '7k/8/8/8/8/8/4Q3/7K w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'How much is the Queen worth?',
      introText:
        'And finally — our superstar! The queen! ⭐ She moves in any direction, any number of squares... How many points is this powerhouse worth?',
      quizOptions: ['5 points', '7 points', '9 points', '12 points'],
      quizCorrectIndex: 2,
      quizExplanation:
        "Yes yes yes! 🎉 The queen is worth 9 points! That's NINE pawns, almost two rooks, or three knights! Now you understand why everyone protects their queen so carefully? 😄",
      quizExplanationWrong:
        'The queen is worth 9 points — the highest of all pieces! That\'s why losing your queen hurts so much. You instantly lose 9 points! Guard her well. 🛡️',
      doneText:
        'The queen is worth 9 points — the highest of all pieces on the board!',
      hintText: '',
    },
    {
      id: 'mixed1-white',
      kind: 'quiz',
      fen: '7k/8/8/3n1n2/8/4B3/4R3/7K w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: "Mixed Position 1 — White's material",
      introText:
        "Let's look at this position! ♟️ White has: a rook and a bishop. Black has: two knights. How many points does white have?",
      quizOptions: ['6 points', '7 points', '8 points', '9 points'],
      quizCorrectIndex: 2,
      quizExplanation:
        'Correct! Rook (5) + Bishop (3) = 8 points for white. ✅ Now — how many points does black have?',
      quizExplanationWrong:
        "Let's try again — Rook = 5, Bishop = 3... together that's 8 points! Now, how many does black have?",
      doneText: 'White has 8 points: Rook (5) + Bishop (3).',
      hintText: '',
      preStepIntro: {
        title: 'Piece Values — Quick Recap',
        text: "Nice work! Let's see everything together one more time, then try the real challenge — adding it all up on the board! 🧮",
        bullets: [
          '♟️ **Pawn** — 1 point',
          '🐴 **Knight** — 3 points',
          '⚡ **Bishop** — 3 points',
          '🏰 **Rook** — 5 points',
          '⭐ **Queen** — 9 points',
          '👑 **King** — ∞ (never traded!)',
        ],
        buttonText: "Ready! Let's go!",
      },
    },
    {
      id: 'mixed1-black',
      kind: 'quiz',
      fen: '7k/8/8/3n1n2/8/4B3/4R3/7K w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: "Mixed Position 1 — Black's material",
      introText: 'Black has two knights. What\'s the total?',
      quizOptions: ['3 points', '5 points', '6 points', '8 points'],
      quizCorrectIndex: 2,
      quizExplanation:
        'Nice! Knight (3) + Knight (3) = 6 points for black. ✅ So: white has 8, black has 6. Who do you think is ahead?',
      quizExplanationWrong:
        "Knight + knight = 3 + 3 = 6 points for black. White has 8, black has 6. So who's winning?",
      doneText: 'Black has 6 points: Knight (3) + Knight (3).',
      hintText: '',
    },
    {
      id: 'mixed1-verdict',
      kind: 'quiz',
      fen: '7k/8/8/3n1n2/8/4B3/4R3/7K w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Mixed Position 1 — Who is ahead?',
      introText: 'White has 8, black has 6. Who is ahead?',
      quizOptions: ['White is winning', 'Black is winning', "It's equal"],
      quizCorrectIndex: 0,
      quizExplanation:
        'Perfect! 🎉 White has 8 points, black has 6 — white is 2 points ahead! In chess we say: white has a "material advantage". That gives them an edge! ♟️',
      quizExplanationWrong:
        'White has 8, black has 6 — so white is winning by 2 points! 8 > 6 = material advantage for white. Math works in chess! 🧮',
      doneText: 'White is ahead by 2 points — a material advantage!',
      hintText: '',
    },
    {
      id: 'mixed2-black',
      kind: 'quiz',
      fen: '7k/8/3r4/8/5b2/8/2Q5/7K w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: "Mixed Position 2 — Black's material",
      introText:
        "Next position! This one's a bit more interesting... 👀 White has: a queen. Black has: a rook and a bishop. How many points does black have?",
      quizOptions: ['6 points', '7 points', '8 points', '10 points'],
      quizCorrectIndex: 2,
      quizExplanation:
        'Correct! Rook (5) + Bishop (3) = 8 points for black. ✅ And white only has a queen — how much is that?',
      quizExplanationWrong:
        'Rook (5) + Bishop (3) = 8 points for black. And white only has a queen — how much is she worth?',
      doneText: 'Black has 8 points: Rook (5) + Bishop (3).',
      hintText: '',
    },
    {
      id: 'mixed2-white',
      kind: 'quiz',
      fen: '7k/8/3r4/8/5b2/8/2Q5/7K w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: "Mixed Position 2 — White's material",
      introText: 'White only has a queen. How much is that worth?',
      quizOptions: ['5 points', '7 points', '9 points', '12 points'],
      quizCorrectIndex: 2,
      quizExplanation:
        'Right! Queen = 9 points. ✅ White 9, black 8. It\'s close! Who\'s ahead?',
      quizExplanationWrong:
        "Queen = 9 points. White 9, black 8. It's close! Who's ahead?",
      doneText: "White has 9 points — it's just the queen.",
      hintText: '',
    },
    {
      id: 'mixed2-verdict',
      kind: 'quiz',
      fen: '7k/8/3r4/8/5b2/8/2Q5/7K w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Mixed Position 2 — Who is ahead?',
      introText: 'White has 9, black has 8. Who is ahead?',
      quizOptions: [
        'White is winning',
        'Black is winning',
        "It's almost equal",
      ],
      quizCorrectIndex: 0,
      quizExplanation:
        'Yes! White is ahead by just 1 point. Small difference — but it exists! This is an example where one queen beats a rook + bishop. Almost always true! 👑',
      quizExplanationWrong:
        'White has 9, black has 8 — white is winning, but barely! Queen (9) > Rook + Bishop (8). Just 1 point, but that\'s still an advantage!',
      doneText:
        'White is ahead by just 1 point — a queen edges out a rook + bishop!',
      hintText: '',
    },
    {
      id: 'mixed3-white',
      kind: 'quiz',
      fen: '7k/1p6/8/8/4R3/8/2PP4/7K w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: "Mixed Position 3 — White's material",
      introText:
        "Last position — and now there are pawns too! Pawns count as well! Each one is worth 1 point. 🎯 White has: a rook and two pawns. What's the total?",
      quizOptions: ['5 points', '6 points', '7 points', '8 points'],
      quizCorrectIndex: 2,
      quizExplanation:
        'Correct! Rook (5) + Pawn (1) + Pawn (1) = 7 points! ✅ And black only has one pawn — how much is that?',
      quizExplanationWrong:
        'Rook (5) + Pawn (1) + Pawn (1) = 7 points for white. And black only has one pawn — how much is that?',
      doneText: 'White has 7 points: Rook (5) + Pawn (1) + Pawn (1).',
      hintText: '',
    },
    {
      id: 'mixed3-black',
      kind: 'quiz',
      fen: '7k/1p6/8/8/4R3/8/2PP4/7K w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: "Mixed Position 3 — Black's material",
      introText: 'Black only has one pawn. How much is that worth?',
      quizOptions: ['0 points', '1 point', '2 points', '3 points'],
      quizCorrectIndex: 1,
      quizExplanation:
        'Of course! One pawn = 1 point. ✅ White has 7, black has 1. Who\'s winning?',
      quizExplanationWrong:
        "One pawn = 1 point. White has 7, black has 1. Who's winning?",
      doneText: 'Black has just 1 point — a single pawn.',
      hintText: '',
    },
    {
      id: 'mixed3-verdict',
      kind: 'quiz',
      fen: '7k/1p6/8/8/4R3/8/2PP4/7K w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Mixed Position 3 — Who is ahead?',
      introText: 'White has 7, black has 1. Who is ahead?',
      quizOptions: [
        'White is winning by a lot',
        'Black is winning',
        "It's equal",
      ],
      quizCorrectIndex: 0,
      quizExplanation:
        'Absolutely! 🏆 White has 6 more points — that\'s a huge advantage! In a real game, white would almost certainly win from here. See how the points tell us right away who is ahead? No guessing! 🧮',
      quizExplanationWrong:
        "White has 7, black has 1 — white is winning by a lot! 6 points ahead is a huge advantage. The points tell us right away who's ahead. 🧮",
      doneText:
        "⭐ Awesome! You've mastered piece values! Remember: Pawn = 1, Knight/Bishop = 3, Rook = 5, Queen = 9, King = ∞. Always count what you have and what your opponent has — whoever has more points has a material advantage. But chess isn't only math... position matters too! 😉",
      hintText: '',
      celebrate: true,
    },
  ],
};

const DAY_7_HISTORY: Lesson = {
  id: 'l1-d7-history',
  level: 1,
  day: 7,
  title: 'The History of Chess',
  piece: {
    name: 'history',
    glyph: '📜',
    movement: 'static',
    bannerText: 'Chess History Time!',
  },
  intro: {
    title: 'The History of Chess',
    text: "Before you learn the rules, let's meet the game itself. A few fun facts, then a quick board challenge!",
  },
  steps: [
    {
      id: 'quiz-origin',
      kind: 'quiz',
      quizDimBoard: true,
      fen: STARTING_FEN,
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Question 1 — Origin of Chess',
      introText: 'Where did chess originate?',
      quizOptions: ['China', 'Persia', 'India', 'Egypt'],
      quizCorrectIndex: 2,
      quizExplanation:
        'Chess traces back to India, where around the 6th century a game called Chaturanga appeared, during the Gupta Empire. From India, the game spread west toward Persia, and from there into the Arab world and Europe.',
      doneText:
        'Chess traces back to India, where around the 6th century a game called Chaturanga appeared, during the Gupta Empire.',
      hintText: '',
    },
    {
      id: 'quiz-original-name',
      kind: 'quiz',
      quizDimBoard: true,
      fen: STARTING_FEN,
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Question 2 — Original Name',
      introText: 'What was chess originally called?',
      quizOptions: ['Chaturanga', 'Vizier', 'Sultania', 'Shahinshah'],
      quizCorrectIndex: 0,
      quizExplanation:
        'The word "chaturanga" in Sanskrit means "four divisions of the army" – infantry, cavalry, elephants, and chariots, which were also the first four types of pieces in the game. When the game reached the Arabs through Persia, the name changed to "shatranj," because Arabic has no "ch" or "ng" sounds, so the name adapted to the pronunciation.',
      doneText:
        'The word "chaturanga" means "four divisions of the army" in Sanskrit.',
      hintText: '',
    },
    {
      id: 'quiz-checkmate',
      kind: 'quiz',
      quizDimBoard: true,
      fen: STARTING_FEN,
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Question 3 — What Checkmate Really Means',
      introText: 'What does "checkmate" actually mean?',
      quizOptions: [
        '"The king has escaped"',
        '"The king is trapped / has no way out"',
        '"The king is captured"',
        '"The king changes places"',
      ],
      quizCorrectIndex: 1,
      quizExplanation:
        'The term comes from the Persian "Shah Mat" – "shah" means king, and "mat" means "helpless, trapped, with no escape." Through Arabic and later European languages, the popular interpretation became "the king is dead," but the historically accurate meaning is that the king is in a hopeless position with no escape — which is also why in chess the king is never actually "captured"; the game simply ends the moment there\'s no way out.',
      doneText:
        '"Shah Mat" means the king is trapped, with no escape — that\'s checkmate.',
      hintText: '',
    },
    {
      id: 'quiz-squares',
      kind: 'quiz',
      quizDimBoard: true,
      fen: STARTING_FEN,
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Question 4 — Number of Squares',
      introText: 'How many squares does a chessboard have?',
      quizOptions: ['32', '100', '64', '81'],
      quizCorrectIndex: 2,
      quizExplanation:
        'The board has 8 rows and 8 columns, 8×8 = 64 squares, alternating light and dark.',
      doneText: 'The board has 8×8 = 64 squares, alternating light and dark.',
      hintText: '',
    },
    {
      id: 'quiz-pieces',
      kind: 'quiz',
      quizDimBoard: true,
      fen: STARTING_FEN,
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Question 5 — Number of Pieces',
      introText: 'How many pieces does each player start the game with?',
      quizOptions: ['8', '12', '16', '20'],
      quizCorrectIndex: 2,
      quizExplanation:
        'Each player starts with 8 pawns and 8 other pieces (2 rooks, 2 knights, 2 bishops, a queen, and a king) – 16 in total.',
      doneText: 'Each player starts with 16 pieces — 8 pawns and 8 others.',
      hintText: '',
    },
    {
      id: 'quiz-four-players',
      kind: 'quiz',
      quizDimBoard: true,
      fen: STARTING_FEN,
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Question 6 — Number of Players in the Earliest Version',
      introText: 'How many players took part when chess was first invented?',
      quizOptions: ['2', '3', '4', '6'],
      quizCorrectIndex: 2,
      quizExplanation:
        'The earliest known version in India was called Chaturaji ("four kings") and was played by four people, each controlling their own army, with moves decided by dice rolls. Only later did the game evolve into the two-player version we know today.',
      doneText:
        'The earliest version, Chaturaji ("four kings"), was played by four people at once.',
      hintText: '',
    },
    {
      id: 'quiz-setup',
      kind: 'quiz',
      quizDimBoard: true,
      fen: STARTING_FEN,
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Question 7 — Correctly Set Up Board',
      introText: 'The board is set up correctly when:',
      quizOptions: [
        "There's a light square in the bottom-left corner",
        "There's a dark square in the bottom-left corner",
        "It doesn't matter, any square works",
        'The queen is always on a dark square regardless of the corner',
      ],
      quizCorrectIndex: 1,
      quizExplanation:
        "Remember the rule: dark corner on the left. When you sit down at the board, the square in your bottom-left corner must be dark. It's a simple trick to avoid the most common beginner mistake - a board set up backwards.",
      doneText: 'Dark corner on the left — that\'s the rule to remember.',
      hintText: '',
    },
    {
      id: 'mark-a-row',
      kind: 'teach',
      fen: LINE_TASK_FEN,
      orientation: 'w',
      solution: ['a1h1'],
      revealPath: true,
      prompt: 'Mark one ROW',
      introText:
        'Drag the Queen straight across the board — same row number the whole way, from one side to the other. Try: all the way from a1 to h1.',
      doneText: "Perfect! That's a row — 8 squares running left to right.",
      hintText:
        'A row runs straight left-right, all on the same number. Look at the arrow!',
      preStepIntro: {
        title: 'Row, File, Diagonal',
        text: "Before you try it yourself, let's define the three basic lines on the board.",
        bullets: [
          '**Row (rank)** – 8 squares running left to right, numbered 1-8',
          '**File** – 8 squares running bottom to top, labeled a-h',
          '**Diagonal** – same-colored squares running corner to corner',
        ],
        buttonText: "Let's try it!",
      },
    },
    {
      id: 'mark-a-file',
      kind: 'teach',
      fen: LINE_TASK_FEN,
      orientation: 'w',
      solution: ['a1a8'],
      revealPath: true,
      prompt: 'Mark one FILE',
      introText:
        'Now drag the Queen straight up the board — same letter the whole way, all the way to the last row. Try: all the way from a1 to a8.',
      doneText:
        'Exactly! That\'s a file — 8 squares running bottom to top, same letter.',
      hintText:
        'A file runs straight up-down, all on the same letter. Look at the arrow!',
    },
    {
      id: 'mark-a-diagonal',
      kind: 'teach',
      fen: LINE_TASK_FEN,
      orientation: 'w',
      solution: ['a1h8'],
      revealPath: true,
      prompt: 'Mark one DIAGONAL',
      introText:
        'Last one! Drag the Queen along a diagonal — corner to corner, same-colored squares.',
      doneText:
        "You got it! That's a diagonal — same-colored squares, corner to corner.",
      hintText:
        'A diagonal cuts across the board, corner to corner. Look at the arrow!',
      celebrate: true,
    },
  ],
};

// Boje za Day 9 "Checkmate vs Stalemate" board highlight (quizBoardHighlight) -
// isti znacaj svuda u lekciji: roze = napad/pokriveno polje bez bekstva,
// cilibar/amber = blokirano sopstvenom figurom, plava = odbrana (figura brani figuru).
const CVS_ATTACK = '#f2358d';
const CVS_BLOCKED = '#f59e0b';
const CVS_PROTECT = '#11C6D1';

const DAY_9_CHECKMATE_VS_STALEMATE: Lesson = {
  id: 'l1-d9-checkmate-vs-stalemate',
  level: 1,
  day: 9,
  title: 'Checkmate vs Stalemate',
  piece: {
    name: 'checkmate vs stalemate',
    glyph: '♚',
    movement: 'static',
    bannerText: 'Checkmate or Stalemate?',
  },
  intro: {
    title: 'Checkmate vs Stalemate',
    text: "Every chess game ends somehow. Two of the most confusing endings for beginners are Checkmate and Stalemate — they look similar, but they mean completely different things. Let's break it down with real positions.",
  },
  steps: [
    // ---------- Part A - Learn & Recognize (4 positions) ----------
    {
      id: 'a1-backrank-mate',
      kind: 'quiz',
      fen: '3R2k1/5ppp/8/8/8/8/8/6K1 b - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Is this Checkmate, Stalemate, or Neither?',
      introText:
        "Look closely at Black's king on g8 — check every square it could possibly move to before you decide.",
      quizOptions: ['Checkmate', 'Stalemate', 'Neither'],
      quizCorrectIndex: 0,
      quizExplanation:
        "This is Checkmate. Black's king on g8 is in check from the rook on d8, and it has nowhere to go — f8 and h8 are covered by that same rook, and f7, g7, h7 are blocked by Black's own pawns. When the king can't escape, block, or capture the checking piece, the game is over: Checkmate.",
      extraHintText:
        "Look at the king's escape squares — are they all blocked or covered?",
      quizBoardHighlight: {
        arrows: [{ from: 'd8', to: 'g8', color: CVS_ATTACK }],
        squares: [
          { square: 'f8', color: CVS_ATTACK },
          { square: 'h8', color: CVS_ATTACK },
          { square: 'f7', color: CVS_BLOCKED },
          { square: 'g7', color: CVS_BLOCKED },
          { square: 'h7', color: CVS_BLOCKED },
        ],
      },
      doneText: 'This is Checkmate — the king had nowhere to go.',
      hintText: '',
    },
    {
      id: 'a2-kiss-of-death',
      kind: 'quiz',
      fen: '6k1/6Q1/6K1/8/8/8/8/8 b - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Is this Checkmate, Stalemate, or Neither?',
      introText:
        'The white queen just moved right next to the black king. Before you answer: can the king capture it, block it, or run?',
      quizOptions: ['Checkmate', 'Stalemate', 'Neither'],
      quizCorrectIndex: 0,
      quizExplanation:
        "This is Checkmate. The white queen on g7, protected by her own king, delivers check — and every square around the black king is either attacked by the queen or occupied. This pattern is nicknamed the 'Kiss of Death' because the queen sits right next to the king she's mating.",
      extraHintText:
        'Check every square around the black king — is even one of them safe?',
      quizBoardHighlight: {
        arrows: [
          { from: 'g7', to: 'g8', color: CVS_ATTACK },
          { from: 'g6', to: 'g7', color: CVS_PROTECT },
        ],
        squares: [
          { square: 'f8', color: CVS_ATTACK },
          { square: 'h8', color: CVS_ATTACK },
          { square: 'f7', color: CVS_ATTACK },
          { square: 'h7', color: CVS_ATTACK },
        ],
      },
      doneText: "This is Checkmate — the 'Kiss of Death' pattern.",
      hintText: '',
    },
    {
      id: 'a3-queen-stalemate',
      kind: 'quiz',
      fen: '7k/5K2/6Q1/8/8/8/8/8 b - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Is this Checkmate, Stalemate, or Neither?',
      introText:
        "Look very carefully — is Black's king actually in check right now? That's always the first thing to check.",
      quizOptions: ['Checkmate', 'Stalemate', 'Neither'],
      quizCorrectIndex: 1,
      quizExplanation:
        "This is Stalemate — and it's a draw, not a win! Black's king is NOT in check, but it has no legal move at all: g8, g7, and h7 are all covered by White's queen or king. If a player has no legal move and is not in check, the game ends immediately in a draw. This is the single most common way winning players accidentally throw away a win.",
      extraHintText:
        'First check — is the king actually in check? Then check if it has any legal square to move to.',
      quizBoardHighlight: {
        arrows: [
          { from: 'g6', to: 'g8', color: CVS_ATTACK },
          { from: 'g6', to: 'h7', color: CVS_ATTACK },
          { from: 'f7', to: 'g7', color: CVS_ATTACK },
        ],
        squares: [
          { square: 'g8', color: CVS_ATTACK },
          { square: 'g7', color: CVS_ATTACK },
          { square: 'h7', color: CVS_ATTACK },
        ],
      },
      doneText: "This is Stalemate — a draw, even though it's not check.",
      hintText: '',
    },
    {
      id: 'a4-pawn-stalemate',
      kind: 'quiz',
      fen: 'k7/p1K5/P7/8/8/8/8/8 b - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Is this Checkmate, Stalemate, or Neither?',
      introText:
        "Check both of Black's pieces here, not just the king — does either one have a legal move?",
      quizOptions: ['Checkmate', 'Stalemate', 'Neither'],
      quizCorrectIndex: 1,
      quizExplanation:
        "This is also Stalemate. Black's king on a8 can't move to b7 or b8 — both are covered by White's king — and it can't move to a7 either, because its own pawn is sitting there, blocked by White's pawn on a6. No checks, no legal moves: stalemate. This is exactly how it happens in real games — your own pawns can accidentally trap your own king.",
      extraHintText:
        'Look at every piece Black has — does the pawn have a move? Does the king?',
      quizBoardHighlight: {
        arrows: [
          { from: 'c7', to: 'b7', color: CVS_ATTACK },
          { from: 'c7', to: 'b8', color: CVS_ATTACK },
        ],
        squares: [
          { square: 'b7', color: CVS_ATTACK },
          { square: 'b8', color: CVS_ATTACK },
          { square: 'a7', color: CVS_BLOCKED },
          { square: 'a6', color: CVS_BLOCKED },
        ],
      },
      doneText: "This is Stalemate — the black pawn trapped its own king.",
      hintText: '',
    },
    // ---------- Part B - Play It (2 tasks) ----------
    {
      id: 'b1-find-checkmate',
      kind: 'puzzle',
      fen: 'r5k1/8/8/8/8/8/5PPP/6K1 b - - 0 1',
      orientation: 'b',
      solution: ['goal'],
      goalCondition: 'checkmate',
      hintMove: 'a8a1',
      preStepIntro: {
        title: 'Part B — Play It',
        text: "Now it's your turn. You'll be given a position and asked to find the move yourself.",
      },
      prompt: 'Find the checkmate',
      introText:
        "It's Black to move. Find the move that delivers checkmate in one.",
      doneText:
        "That's Checkmate! With the white king boxed in by its own pawns, your rook delivers mate along the back rank.",
      extraHintText:
        "Look at the white king's pawns on f2, g2, and h2 — they're not just protection, they're a trap. Which file is completely open for your rook?",
      hintText: "Not quite — that doesn't deliver checkmate yet. Try again!",
    },
    {
      id: 'b2-find-stalemate',
      kind: 'puzzle',
      fen: '7k/5K2/Q7/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['goal'],
      goalCondition: 'stalemate',
      hintMove: 'a6g6',
      prompt: 'Find the stalemate',
      introText:
        "Heads up: Stalemate is NOT a good result — it turns a winning position into a draw. This exercise exists so you learn to recognize and avoid it, not to aim for it. It's White to move, and you're way ahead in material. Find the exact queen move that would accidentally stalemate Black — a move to know and avoid.",
      doneText:
        "That's Stalemate. Quick reminder of what that means: the king is NOT in check, but has zero legal moves — so the game ends immediately in a draw. That's a bad result here, because White was completely winning and this move throws the win away. You just found the exact move to avoid in a real game — well spotted.",
      extraHintText:
        'Remember: stalemate = king has no legal moves AND is not in check. Move your queen next to the black king — but not onto a square where it gives check. Where does she cover g7, g8, and h7 all at once, protected by your king?',
      hintText: "Not quite a stalemate yet — try again!",
    },
    // ---------- Part C - Chat Quiz with the AI Coach (3 positions) ----------
    {
      id: 'c1-neither',
      kind: 'quiz',
      fen: '4k3/8/4K3/8/8/8/8/8 b - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Checkmate, Stalemate, or Neither?',
      introText:
        "Here's one. Black to move — Checkmate, Stalemate, or Neither?",
      quizOptions: ['Checkmate', 'Stalemate', 'Neither'],
      quizCorrectIndex: 2,
      quizExplanation:
        "Exactly! Black's king can hop to d8 — it's not stuck, and it's not in check either. Just a normal, ongoing position.",
      quizExplanationWrong:
        'Not quite — take another look. Is the black king actually in check? Does it have anywhere to go?',
      extraHintText: 'Check the d8 square.',
      doneText: "That's Neither — just a normal, ongoing position.",
      hintText: '',
    },
    {
      id: 'c2-ladder-mate',
      kind: 'quiz',
      fen: '1R5k/R7/8/8/8/8/8/6K1 b - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Checkmate, Stalemate, or Neither?',
      introText: "Next one. What's happening here?",
      quizOptions: ['Checkmate', 'Stalemate', 'Neither'],
      quizCorrectIndex: 0,
      quizExplanation:
        "Got it! This is called a 'ladder mate' — two rooks climbing the board together, cutting off every escape square, rank by rank.",
      quizExplanationWrong:
        'Look closely at both rooks — one covers the whole 7th rank, the other checks along the 8th. Any square left for the king?',
      extraHintText:
        "Count the squares next to the black king — who's covering each one?",
      doneText: "That's Checkmate — a ladder mate.",
      hintText: '',
    },
    {
      id: 'c3-rook-stalemate',
      kind: 'quiz',
      fen: '5K1k/R7/8/8/8/8/8/8 b - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Checkmate, Stalemate, or Neither?',
      introText: 'Last one — trickiest of the three.',
      quizOptions: ['Checkmate', 'Stalemate', 'Neither'],
      quizCorrectIndex: 1,
      quizExplanation:
        "Exactly right! Black's king isn't in check, but every square is covered by White's rook and king. A draw — even though White clearly has the stronger position.",
      quizExplanationWrong:
        'Careful — check if the king is actually in check first. If it\'s not, and it still has no moves... what does that mean?',
      extraHintText: 'Is the black king in check right now? Look very closely.',
      doneText:
        "You've got it — Checkmate ends the game with a win. Stalemate ends the game with a draw, even if one side has way more material. Knowing the difference will save you a lot of points down the road. See you in the next lesson!",
      hintText: '',
      celebrate: true,
    },
  ],
};

// Boje za Day 10 "Checkmate Patterns" board highlight (quizBoardHighlight) -
// isti semantika kao Day 9: roze = napad/pokriveno polje bez bekstva,
// cilibar/amber = blokirano sopstvenom figurom, plava = odbrana.
const CM_ATTACK = '#f2358d';
const CM_BLOCKED = '#f59e0b';
const CM_PROTECT = '#11C6D1';

const DAY_10_CHECKMATE_PATTERNS: Lesson = {
  id: 'l1-d10-checkmate-patterns',
  level: 1,
  day: 10,
  title: 'Checkmate Patterns',
  piece: {
    name: 'checkmate patterns',
    glyph: '♛',
    movement: 'static',
    bannerText: 'Checkmate Patterns',
  },
  intro: {
    title: 'Checkmate Patterns',
    text: 'Checkmate ends the game. It happens when the king is under attack (check) and has no way to escape, block, or capture the attacker.',
  },
  introSteps: [
    {
      text: 'Checkmate ends the game. It happens when the king is under attack (check) and has no way to escape, block, or capture the attacker.',
      buttonText: 'Next',
    },
    {
      text: "Fun fact: the king is never actually captured, the game ends the instant checkmate happens, right before that capture would occur.",
      buttonText: 'Got it',
    },
    {
      text: "Today you'll discover 5 different pieces that can deliver checkmate, even the smallest one on the board. Ready?",
      buttonText: 'Start',
    },
  ],
  // Svih 8 pozicija (Position 1-5 + Bonus 1-3) su tematski razlicite,
  // pojedinacno imenovane vezbe - svaka dobija SVOJ segment na progress
  // traci, da pogresan pokusaj na jednoj ne oboji ostale.
  flatProgressSegments: true,
  steps: [
    // ---------- Part 1 - Watch & Learn (2 static positions) ----------
    {
      id: 't1-queen-rook-mate',
      kind: 'quiz',
      fen: '4Q1k1/5ppp/8/8/8/8/8/4R1K1 b - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Example 1 — Queen & Rook',
      introText:
        "Let's start with what checkmate actually looks like. Black's king is trapped on g8. White's queen on e8 delivers check along the back rank, and White's rook right behind her means nothing can capture her safely. f8, h8 is covered by the queen too, and Black's own pawns block every other square. No escape - checkmate.",
      quizBoardHighlight: {
        arrows: [
          { from: 'e8', to: 'g8', color: CM_ATTACK },
          { from: 'e1', to: 'e8', color: CM_PROTECT },
        ],
        squares: [
          { square: 'f8', color: CM_ATTACK },
          { square: 'h8', color: CM_ATTACK },
          { square: 'f7', color: CM_BLOCKED },
          { square: 'g7', color: CM_BLOCKED },
          { square: 'h7', color: CM_BLOCKED },
        ],
      },
      doneText: "That's checkmate — no escape, no block, no capture.",
      hintText: '',
      nextButtonText: 'Got it!',
    },
    {
      id: 't2-ladder-mate',
      kind: 'quiz',
      fen: '6k1/8/8/8/8/8/r7/1r5K w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Example 2 — Ladder Mate',
      introText:
        "This time it's White's king in trouble. Black's rook on b1 checks along the back rank, and the second rook on a2 seals off the only square White's king might try to run to. Two rooks, working as a team. Checkmate.",
      quizBoardHighlight: {
        arrows: [
          { from: 'b1', to: 'h1', color: CM_ATTACK },
          { from: 'a2', to: 'h2', color: CM_ATTACK },
        ],
        squares: [
          { square: 'g1', color: CM_ATTACK },
          { square: 'g2', color: CM_ATTACK },
          { square: 'h2', color: CM_ATTACK },
        ],
      },
      doneText: 'Two rooks, ladder mate — textbook checkmate.',
      hintText: '',
      nextButtonText: 'Got it!',
    },
    // ---------- Part 2 - Find the Checkmate (5 interactive positions) ----------
    {
      id: 'position-1-queen-mate',
      kind: 'puzzle',
      fen: '6k1/1Q6/6K1/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['goal'],
      goalCondition: 'checkmate',
      hintMove: 'b7g7',
      prompt: 'Find the checkmate — Queen',
      introText:
        'Your queen and king can team up to trap the enemy king. Find the checkmate in one move.',
      extraHintText:
        'Move your queen right next to the black king — but only onto a square your own king protects too.',
      doneText:
        "That's it - Qg7#! Your king on g6 protects the queen, so Black can't capture her. Every square around the king is covered. This is the 'Kiss of Death' pattern — you'll see it a lot.",
      hintText:
        "That's not checkmate — try to give check in a way the king has no escape at all. (Psst, there's more than one mate here, so feel free to try a different square!)",
      quizBoardHighlight: {
        arrows: [
          { from: 'b7', to: 'g7', color: CM_ATTACK },
          { from: 'g6', to: 'g7', color: CM_PROTECT },
        ],
        squares: [
          { square: 'f8', color: CM_ATTACK },
          { square: 'g8', color: CM_ATTACK },
          { square: 'h8', color: CM_ATTACK },
          { square: 'h7', color: CM_ATTACK },
        ],
      },
      // Qg7# (hintMove) nije jedini mat ovde - dama moze i pravo na zadnji
      // red (a8/b8/c8), dok kralj na g6 pokriva sva polja oko crnog kralja.
      altSolutions: [
        {
          uci: 'b7a8',
          doneText:
            "That's it - Qa8#! Your queen checks straight down the back rank, and your king on g6 covers every square next to Black's king. A clean back-rank mate.",
          quizBoardHighlight: {
            arrows: [{ from: 'a8', to: 'g8', color: CM_ATTACK }],
            squares: [
              { square: 'f8', color: CM_ATTACK },
              { square: 'h8', color: CM_ATTACK },
              { square: 'f7', color: CM_ATTACK },
              { square: 'g7', color: CM_ATTACK },
              { square: 'h7', color: CM_ATTACK },
            ],
          },
        },
        {
          uci: 'b7b8',
          doneText:
            "That's it - Qb8#! Same idea, different square - your queen controls the whole back rank, and your king on g6 seals off everything else. Back-rank mate.",
          quizBoardHighlight: {
            arrows: [{ from: 'b8', to: 'g8', color: CM_ATTACK }],
            squares: [
              { square: 'f8', color: CM_ATTACK },
              { square: 'h8', color: CM_ATTACK },
              { square: 'f7', color: CM_ATTACK },
              { square: 'g7', color: CM_ATTACK },
              { square: 'h7', color: CM_ATTACK },
            ],
          },
        },
        {
          uci: 'b7c8',
          doneText:
            "That's it - Qc8#! Your queen slides onto the back rank for the check, and your king on g6 covers every square Black's king could run to. Back-rank mate.",
          quizBoardHighlight: {
            arrows: [{ from: 'c8', to: 'g8', color: CM_ATTACK }],
            squares: [
              { square: 'f8', color: CM_ATTACK },
              { square: 'h8', color: CM_ATTACK },
              { square: 'f7', color: CM_ATTACK },
              { square: 'g7', color: CM_ATTACK },
              { square: 'h7', color: CM_ATTACK },
            ],
          },
        },
      ],
    },
    {
      id: 'position-2-rook-mate',
      kind: 'puzzle',
      fen: '1r4k1/8/8/8/8/8/6PP/7K b - - 0 1',
      orientation: 'b',
      solution: ['goal'],
      goalCondition: 'checkmate',
      hintMove: 'b8b1',
      prompt: 'Find the checkmate — Rook',
      introText:
        'A rook alone can deliver checkmate too — if the enemy king has nowhere to hide. Find the checkmate in one move.',
      extraHintText:
        "White's pawns on g2 and h2 are trapping their own king. Which file is completely open for your rook to reach the back rank?",
      doneText:
        "Rb1#! White's own pawns on g2 and h2 look safe, but they're actually blocking the king's own escape. Your rook controls the whole back rank — this pattern is called a 'back-rank mate,' one of the most common in all of chess.",
      hintText: 'Not quite — try again!',
      quizBoardHighlight: {
        arrows: [
          { from: 'b8', to: 'b1', color: CM_ATTACK },
          { from: 'b1', to: 'h1', color: CM_ATTACK },
        ],
        squares: [
          { square: 'g2', color: CM_BLOCKED },
          { square: 'h2', color: CM_BLOCKED },
        ],
      },
    },
    {
      id: 'position-3-knight-mate',
      kind: 'puzzle',
      fen: '6RK/6PP/3n4/8/8/8/8/k7 b - - 0 1',
      orientation: 'b',
      solution: ['goal'],
      goalCondition: 'checkmate',
      hintMove: 'd6f7',
      prompt: 'Find the checkmate — Knight',
      introText:
        'Knights move in a way no other piece can — perfect for a sneaky checkmate. Find the checkmate in one move.',
      extraHintText:
        "Look at White's own pieces around the king — rook, pawn, pawn. Is there any square that king could actually move to? Now find a knight move that gives check.",
      doneText:
        "Nf7#! This is called a 'smothered mate' - White's own rook and pawns box the king in so completely that your knight alone finishes the job. Nobody can capture the knight, and there's nowhere left to go. One of the most satisfying checkmates in chess.",
      hintText: "That's not checkmate — try again!",
      quizBoardHighlight: {
        arrows: [{ from: 'd6', to: 'f7', color: CM_ATTACK }],
        squares: [
          { square: 'g8', color: CM_BLOCKED },
          { square: 'g7', color: CM_BLOCKED },
          { square: 'h7', color: CM_BLOCKED },
        ],
      },
    },
    {
      id: 'position-4-bishop-mate',
      kind: 'puzzle',
      fen: '7k/5Kpp/8/8/8/8/1B6/8 w - - 0 1',
      orientation: 'w',
      solution: ['goal'],
      goalCondition: 'checkmate',
      hintMove: 'b2g7',
      prompt: 'Find the checkmate — Bishop',
      introText:
        'Even a bishop, moving only on diagonals, can deliver checkmate. Find the checkmate in one move.',
      extraHintText:
        "Your bishop can capture one of Black's pawns and deliver check at the same time. Which pawn sits on your bishop's diagonal?",
      doneText:
        "Bxg7#! Your bishop captures the pawn and checks the king along the diagonal — your king on f7 protects it, so it can't be taken back, and h7 is blocked by Black's own pawn. Checkmate.",
      hintText: 'Not quite — try again!',
      quizBoardHighlight: {
        arrows: [
          { from: 'b2', to: 'g7', color: CM_ATTACK },
          { from: 'f7', to: 'g7', color: CM_PROTECT },
        ],
        squares: [
          { square: 'g8', color: CM_ATTACK },
          { square: 'h7', color: CM_BLOCKED },
        ],
      },
    },
    {
      id: 'position-5-pawn-mate',
      kind: 'puzzle',
      fen: 'k1K5/pp6/2P5/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['goal'],
      goalCondition: 'checkmate',
      hintMove: 'c6b7',
      prompt: 'Find the checkmate — Pawn',
      introText:
        'This one surprises almost everyone — yes, even a pawn can deliver checkmate. Find it.',
      extraHintText:
        'Your pawn can capture something right next to the black king. What happens to the king right after that capture?',
      doneText:
        "cxb7#! Your pawn captures and checks the king at the same time - your king on c8 protects it and covers b8, and Black's own pawn on a7 blocks the last square. The smallest piece on the board just delivered checkmate.",
      hintText: 'Not quite — try again!',
      quizBoardHighlight: {
        arrows: [
          { from: 'c6', to: 'b7', color: CM_ATTACK },
          { from: 'c8', to: 'b7', color: CM_PROTECT },
          { from: 'c8', to: 'b8', color: CM_ATTACK },
        ],
        squares: [
          { square: 'a7', color: CM_BLOCKED },
          { square: 'b8', color: CM_ATTACK },
        ],
      },
    },
    // ---------- Bonus Round - Check-mate Puzzles (3 extra, optional) ----------
    {
      id: 'bonus-1-queen-knight-mate',
      kind: 'puzzle',
      fen: '7k/Q6p/4N3/8/8/8/8/7K w - - 0 1',
      orientation: 'w',
      solution: ['goal'],
      goalCondition: 'checkmate',
      hintMove: 'a7g7',
      prompt: 'Bonus 1 — Queen & Knight',
      introText:
        'Your queen and knight can combine for a clean checkmate. Find it.',
      extraHintText:
        'Move your queen right next to the black king, onto a square your knight already defends.',
      doneText:
        "Qg7#! Your knight on e6 defends the queen, so the king can't capture her - and she covers every square around him. A classic queen-and-knight combination.",
      hintText:
        "That's not checkmate — try to give check in a way the king has no escape at all. (Psst, there's more than one mate here, so feel free to try a different square!)",
      quizBoardHighlight: {
        arrows: [
          { from: 'a7', to: 'g7', color: CM_ATTACK },
          { from: 'e6', to: 'g7', color: CM_PROTECT },
        ],
        squares: [
          { square: 'g8', color: CM_ATTACK },
          { square: 'h7', color: CM_BLOCKED },
        ],
      },
      // Qg7# (hintMove) nije jedini mat ovde - dama moze i pravo na zadnji
      // red (a8/b8), knight na e6 i dalje pokriva g7, a crni pesak na h7
      // blokira poslednje polje.
      altSolutions: [
        {
          uci: 'a7a8',
          doneText:
            "Qa8#! Your queen checks along the back rank, your knight on e6 covers g7, and Black's own pawn on h7 blocks the last square. Back-rank mate.",
          quizBoardHighlight: {
            arrows: [
              { from: 'a8', to: 'h8', color: CM_ATTACK },
              { from: 'e6', to: 'g7', color: CM_PROTECT },
            ],
            squares: [
              { square: 'g8', color: CM_ATTACK },
              { square: 'g7', color: CM_ATTACK },
              { square: 'h7', color: CM_BLOCKED },
            ],
          },
        },
        {
          uci: 'a7b8',
          doneText:
            "Qb8#! Same idea from a different square - your queen controls the back rank, your knight on e6 covers g7, and Black's own pawn on h7 blocks the rest. Back-rank mate.",
          quizBoardHighlight: {
            arrows: [
              { from: 'b8', to: 'h8', color: CM_ATTACK },
              { from: 'e6', to: 'g7', color: CM_PROTECT },
            ],
            squares: [
              { square: 'g8', color: CM_ATTACK },
              { square: 'g7', color: CM_ATTACK },
              { square: 'h7', color: CM_BLOCKED },
            ],
          },
        },
      ],
    },
    {
      id: 'bonus-2-rook-bishop-mate',
      kind: 'puzzle',
      fen: '7k/7p/7B/8/8/8/8/RK6 w - - 0 1',
      orientation: 'w',
      solution: ['goal'],
      goalCondition: 'checkmate',
      hintMove: 'a1a8',
      prompt: 'Bonus 2 — Rook & Bishop',
      introText:
        'This time your rook needs a little help from a bishop. Find the checkmate.',
      extraHintText: 'Move your rook all the way up its file to reach the back rank.',
      doneText:
        "Ra8#! Your rook checks along the back rank, and your bishop on h6 covers g7 so the king has nowhere to hide. Teamwork.",
      hintText: 'Not quite — try again!',
      quizBoardHighlight: {
        arrows: [
          { from: 'a1', to: 'a8', color: CM_ATTACK },
          { from: 'a8', to: 'h8', color: CM_ATTACK },
          { from: 'h6', to: 'g7', color: CM_ATTACK },
        ],
        squares: [
          { square: 'g7', color: CM_ATTACK },
          { square: 'h7', color: CM_BLOCKED },
        ],
      },
    },
    {
      id: 'bonus-3-epaulette-mate',
      kind: 'puzzle',
      fen: '3rkr2/8/8/8/8/8/Q7/7K w - - 0 1',
      orientation: 'w',
      solution: ['goal'],
      goalCondition: 'checkmate',
      hintMove: 'a2e6',
      prompt: 'Bonus 3 — Epaulette Mate',
      introText:
        "Watch closely - Black's own rooks are about to become part of the problem. Find the checkmate.",
      extraHintText:
        'Your queen can reach one square that checks the king along his file AND covers both diagonal squares next to him, all at once.',
      doneText:
        "Qe6#! This is called an 'epaulette mate' - Black's own rooks block every square to the side, like epaulettes on a uniform, and your queen alone covers everything else. A beautiful pattern to remember.",
      hintText: 'Not quite — try again!',
      celebrate: true,
      quizBoardHighlight: {
        arrows: [{ from: 'a2', to: 'e6', color: CM_ATTACK }],
        squares: [
          { square: 'd8', color: CM_BLOCKED },
          { square: 'f8', color: CM_BLOCKED },
          { square: 'd7', color: CM_ATTACK },
          { square: 'e7', color: CM_ATTACK },
          { square: 'f7', color: CM_ATTACK },
        ],
      },
    },
  ],
};

// Boje za Day 11 "Meet the Chess Board" - cisto informativne (nema
// napad/opasnost semantiku kao Day 9/10): plava = podrazumevana zona/linija/
// Hint-okvir, roze = Queenside (samo da se vizuelno razlikuje od Kingside-a
// kad su oba plava).
const D11_INFO = '#11C6D1';
const D11_QUEENSIDE = '#f2358d';

/** Sva polja na navedenim linijama (npr. ['e','f','g','h'] -> e1..h8, 32 polja). */
function filesZone(
  files: string[],
  color: string = D11_INFO
): { square: string; color: string }[] {
  const squares: { square: string; color: string }[] = [];
  for (const f of files) {
    for (let r = 1; r <= 8; r++) squares.push({ square: `${f}${r}`, color });
  }
  return squares;
}

const DAY_11_MEET_THE_BOARD: Lesson = {
  id: 'l1-d11-meet-the-board',
  level: 1,
  day: 11,
  title: 'Meet the Chess Board',
  piece: {
    name: 'the chess board',
    glyph: '♟',
    movement: 'static',
    bannerText: 'Meet the Board',
  },
  intro: {
    title: 'Meet the Chess Board',
    text: "Before the pieces, let's get to know the board itself - the Kingside, the Queenside, the center, and the lines every piece moves along.",
  },
  flatProgressSegments: true,
  steps: [
    // ---------- Section A - Kingside & Queenside (pure demo) ----------
    {
      id: 'a1-kingside',
      kind: 'quiz',
      fen: STARTING_FEN,
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'The Kingside',
      introText:
        "This half of the board — the e, f, g, and h files — is called the Kingside. It's where your king usually ends up after castling.",
      quizBoardHighlight: { squares: filesZone(['e', 'f', 'g', 'h']) },
      doneText: "That's the Kingside — e, f, g, h.",
      hintText: '',
      nextButtonText: 'Got it!',
    },
    {
      id: 'a2-queenside',
      kind: 'quiz',
      fen: STARTING_FEN,
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'The Queenside',
      introText:
        "And this half — a, b, c, d — is the Queenside. Castle here and it's called a long castle, because the king travels further. Castle on the Kingside instead, and it's a short castle — fewer squares to cross.",
      quizBoardHighlight: {
        squares: filesZone(['a', 'b', 'c', 'd'], D11_QUEENSIDE),
      },
      doneText: "That's the Queenside — a, b, c, d.",
      hintText: '',
      transitionText: "Bravo! Let's move on to the next one.",
    },
    // ---------- Section B - Center Basics (interactive, mark squares) ----------
    {
      id: 'b1-the-center',
      kind: 'markSquares',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['d4', 'd5', 'e4', 'e5'],
      prompt: 'Mark the Center',
      introText:
        "Now let's find the heart of the board. Which 4 squares do you think are the most important in the center? To mark a square, right-click it with your mouse on desktop — or tap it if you're on mobile. Go ahead and mark the center!",
      retryPromptText:
        'Not quite — the center is d4, d5, e4, and e5. Whoever controls these squares controls the whole board. Every strong opening fights for them.',
      extraHintText:
        'These four — d4, d5, e4, e5 - are the center. Whoever controls them controls the whole board.',
      doneText:
        'Exactly right — d4, d5, e4, and e5. Whoever controls these squares controls the whole board. Every strong opening fights for them.',
      hintText: '',
      quizBoardHighlight: {
        squares: ['d4', 'd5', 'e4', 'e5'].map((square) => ({
          square,
          color: D11_INFO,
        })),
      },
      nextButtonText: 'Got it!',
    },
    {
      id: 'b2-wide-center',
      kind: 'markSquares',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: [
        'c3', 'c4', 'c5', 'c6',
        'd3', 'd6',
        'e3', 'e6',
        'f3', 'f4', 'f5', 'f6',
      ],
      prompt: 'Mark the Wide Center',
      introText:
        "There's more space around the center that matters too — it's called the 'wide center.' Same as before: right-click a square with your mouse on desktop, or tap it on mobile, to mark it. Think you can mark the wide center?",
      retryPromptText:
        'Not quite — the wide center is this 16-square zone, from c3 to f6. Pieces here have more room to move and more targets to aim at.',
      extraHintText:
        'This whole zone — from c3 to f6 — is the wide center. More space, more options, more targets.',
      doneText:
        'Nice! Together with the center, this makes a 16-square zone — from c3 to f6. Pieces here have more room to move and more targets to aim at.',
      hintText: '',
      quizBoardHighlight: {
        squares: [
          'c3', 'c4', 'c5', 'c6',
          'd3', 'd6',
          'e3', 'e6',
          'f3', 'f4', 'f5', 'f6',
        ].map((square) => ({ square, color: D11_INFO })),
      },
      transitionText: "Bravo! Let's move on to the next one.",
    },
    // ---------- Section C - Rows, Diagonals & Files (recognition) ----------
    {
      id: 'c1-row',
      kind: 'quiz',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'What kind of line is this?',
      introText: "Take a look — what's drawn here?",
      quizOptions: ['A Row', 'A File', 'A Diagonal'],
      quizCorrectIndex: 0,
      quizBoardHighlightUpfront: true,
      quizBoardHighlight: {
        arrows: [{ from: 'a4', to: 'h4', color: D11_INFO }],
      },
      quizExplanation:
        "This is a Row - 8 squares running side to side, also called a 'rank.' Every row matters, but the back row is especially important: that's where castling happens, and it's exactly where checkmate patterns like the ones from Day 10 often strike.",
      doneText: "That's a Row (rank) — 8 squares side to side.",
      hintText: '',
      nextButtonText: 'Got it!',
    },
    {
      id: 'c2-diagonal',
      kind: 'quiz',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'What kind of line is this?',
      introText: 'How about this one?',
      quizOptions: ['A Row', 'A File', 'A Diagonal'],
      quizCorrectIndex: 2,
      quizBoardHighlightUpfront: true,
      quizBoardHighlight: {
        arrows: [{ from: 'a1', to: 'h8', color: D11_INFO }],
      },
      quizExplanation:
        'This is a Diagonal. Bishops live here - it\'s the only kind of line they can move on. The queen loves diagonals too, on top of rows and files.',
      doneText: "That's a Diagonal.",
      hintText: '',
      nextButtonText: 'Got it!',
    },
    {
      id: 'c3-file',
      kind: 'quiz',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'What kind of line is this?',
      introText: "Last one - what's this?",
      quizOptions: ['A Row', 'A File', 'A Diagonal'],
      quizCorrectIndex: 1,
      quizBoardHighlightUpfront: true,
      quizBoardHighlight: {
        arrows: [{ from: 'd1', to: 'd8', color: D11_INFO }],
      },
      quizExplanation:
        'This is a File. Rooks love files — especially open files, ones with no pawns blocking the way. An open file for your rook is a huge advantage.',
      doneText:
        "Bravo! You've met the whole board — Kingside, Queenside, the center, and every type of line on it.",
      hintText: '',
      celebrate: true,
    },
  ],
};

// Boje za Day 12 "Checkmate with Queen" - ista semantika kao Day 9/10:
// roze = napad/pokriveno polje bez bekstva, zelena = jedino slobodno
// (legalno) polje - namerno kontrast sa roze, da se vidi da kralj JOS UVEK
// ima gde da ide (nije pat).
const CWQ_ATTACK = '#f2358d';
const CWQ_SAFE = '#07DA63';

const DAY_12_CHECKMATE_WITH_QUEEN: Lesson = {
  id: 'l1-d12-checkmate-with-queen',
  level: 1,
  day: 12,
  title: 'Checkmate with Queen',
  piece: {
    name: 'checkmate with queen',
    glyph: '♛',
    movement: 'static',
    bannerText: 'King + Queen Checkmate',
  },
  intro: {
    title: 'Checkmate with Queen',
    text: "Your queen is the strongest piece on the board, but she can't checkmate the king by herself — she needs her own king's help. Today you'll learn exactly how they work together.",
  },
  introSteps: [
    {
      text: "Your queen is the strongest piece on the board, but she can't checkmate the king by herself — she needs her own king's help. Today you'll learn exactly how they work together.",
      buttonText: 'Got it!',
    },
  ],
  steps: [
    // ---------- Part 1 - How It's Done (no interaction) ----------
    {
      id: 't2-stalemate-reminder',
      kind: 'quiz',
      fen: '7k/5K2/6Q1/8/8/8/8/8 b - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Watch Out for Stalemate',
      introText:
        "Remember this one? This is Stalemate, not Checkmate — and it's the single most common way players mess up this exact ending. Keep it in mind as we go: the king must always have a legal move, until the very last one.",
      // Isti highlight kao Day 9 A3 (ista pozicija) - pokazuje zasto je kralj
      // u patu: g8/g7/h7 su sva pokrivena damom/kraljem, bez obzira sto
      // kralj nije u sahu.
      quizBoardHighlight: {
        arrows: [
          { from: 'g6', to: 'g8', color: CVS_ATTACK },
          { from: 'g6', to: 'h7', color: CVS_ATTACK },
          { from: 'f7', to: 'g7', color: CVS_ATTACK },
        ],
        squares: [
          { square: 'g8', color: CVS_ATTACK },
          { square: 'g7', color: CVS_ATTACK },
          { square: 'h7', color: CVS_ATTACK },
        ],
      },
      doneText: 'Stalemate — the king has no legal move, but is not in check.',
      hintText: '',
      nextButtonText: 'Got it!',
    },
    {
      id: 't3-the-plan',
      kind: 'quiz',
      fen: '6k1/8/4K3/8/8/8/8/Q7 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'The Plan',
      introText:
        "Here's the plan: use your queen to box the king in, a knight's-move away so she's never in danger — then walk your own king in close, and deliver the final blow together. Ready to try it?",
      doneText: "That's the plan — box the king in, then bring your king up.",
      hintText: '',
      nextButtonText: 'Ready!',
    },
    // ---------- Part 2 - Bring It On! (guided practice, real checkmate) ----------
    {
      id: 'move1-qf6',
      kind: 'puzzle',
      fen: '6k1/8/4K3/8/8/8/8/Q7 w - - 0 1',
      orientation: 'w',
      solution: ['a1f6', 'g8h7'],
      showSolutionArrowUpfront: true,
      preStepIntro: {
        title: 'Bring It On!',
        text: "Time to put it into practice. We'll guide you through every move - just follow along.",
        buttonText: 'Start',
      },
      prompt: 'Move 1 — Box the King In',
      introText:
        "The queen doesn't even need to give check. Right now she's fencing in squares around the king — not attacking him directly.",
      doneText:
        "The queen has now left the king with only one square to go to. **The king must always be left with at least one legal square, left or right — never zero. Zero means stalemate, not checkmate.**",
      hintText: "That's not the move — follow the arrow.",
      // Ova pozicija je pedagoski bitna (vidi noAutoAdvance ispod) - roze
      // polja su pokrivena (kralj NE SME tu), zeleno (h7) je jedino
      // preostalo slobodno polje - kontrast pokazuje da kralj JOS UVEK ima
      // kuda, nije pat.
      quizBoardHighlight: {
        arrows: [
          { from: 'f6', to: 'h8', color: CWQ_ATTACK },
          { from: 'f6', to: 'h6', color: CWQ_ATTACK },
        ],
        squares: [
          { square: 'g6', color: CWQ_ATTACK },
          { square: 'g7', color: CWQ_ATTACK },
          { square: 'h6', color: CWQ_ATTACK },
          { square: 'h8', color: CWQ_ATTACK },
          { square: 'h7', color: CWQ_SAFE },
        ],
      },
      // Ova pozicija je pedagoski presudna (kralj ostaje sa TACNO jednim
      // poljem, ne nula) - ostaje potpuno vidljiva/svetla, bez countdown-a
      // ili zatamnjenja, dok korisnik sam ne klikne Got it.
      noAutoAdvance: true,
      nextButtonText: 'Got it!',
    },
    {
      id: 'move2-qg5',
      kind: 'puzzle',
      fen: '8/7k/4KQ2/8/8/8/8/8 w - - 2 2',
      orientation: 'w',
      solution: ['f6g5', 'h7h8'],
      showSolutionArrowUpfront: true,
      prompt: 'Move 2 — Pack Him Into the Corner',
      introText:
        "Qg5!! Try to pack the enemy king into the corner so he can only move to one square. He's trapped there with nowhere else to go!",
      doneText:
        "Remember this position well — this is your goal! Whenever you bring the enemy king into a position like this, all that's left is to bring up your own king and help the queen deliver the famous Kiss of Death.",
      hintText: "That's not the move — follow the arrow.",
      // Dama na g5 drzi g7 i g8 (g-file) - kralj na h8 nema kud tamo. h7 je
      // jedino polje koje mu ostaje slobodno, dok mu ga beli kralj ne zatvori u Move 3.
      quizBoardHighlight: {
        squares: [
          { square: 'g7', color: CWQ_ATTACK },
          { square: 'g8', color: CWQ_ATTACK },
          { square: 'h7', color: CWQ_SAFE },
        ],
      },
      // Ovo JESTE ciljna slika korisnik treba da zapamti ("Remember this
      // position well") - ostaje potpuno vidljiva/svetla, bez countdown-a
      // ili zatamnjenja, dok korisnik sam ne klikne Got it.
      noAutoAdvance: true,
      nextButtonText: 'Got it!',
    },
    {
      id: 'move3-kf7',
      kind: 'puzzle',
      fen: '7k/8/4K3/6Q1/8/8/8/8 w - - 4 3',
      orientation: 'w',
      solution: ['e6f7', 'h8h7'],
      revealArrowOnWrongMove: true,
      prompt: 'Move 3 — Bring the King In',
      introText:
        'Your turn — help the queen deliver checkmate. The only piece that can help her now is your king!',
      doneText: 'Exactly right!',
      hintText: "Not quite — look where your king needs to go.",
    },
    {
      id: 'move4-checkmate',
      kind: 'puzzle',
      fen: '8/5K1k/8/6Q1/8/8/8/8 w - - 6 4',
      orientation: 'w',
      solution: ['goal'],
      goalCondition: 'checkmate',
      hintMove: 'g5g7',
      prompt: 'Find the Checkmate!',
      introText: 'Find the checkmate!',
      extraHintText:
        "This is the Kiss of Death — the queen kisses the king right in front of him, protected by your own king, and he has nowhere left to go. Checkmate!",
      doneText:
        "This is the Kiss of Death — the queen kisses the king right in front of him, protected by your own king, and he has nowhere left to go. Checkmate! You just delivered mate with king and queen — a skill you'll use in almost every single game.",
      hintText: 'Not quite — try again!',
      celebrate: true,
      // Qh5#/Qh4# JESU sah-mat (goalCondition je tehnicki zadovoljen), ali ova
      // lekcija uci bas Kiss of Death (dama ispred kralja) - requireRetry ih
      // vraca na ponovni pokusaj umesto da zavrse korak.
      altSolutions: [
        {
          uci: 'g5h5',
          requireRetry: true,
          retryMessage:
            "Bravo, that's checkmate! But that's not the Kiss of Death. Let's learn to deliver that exact queen mate — try again!",
          doneText:
            "Qh5#! A different square, same idea — your queen checks along the rank with nowhere for the king to run, protected by your own king. Checkmate! You just delivered mate with king and queen — a skill you'll use in almost every single game.",
        },
        {
          uci: 'g5h4',
          requireRetry: true,
          retryMessage:
            "Bravo, that's checkmate! But that's not the Kiss of Death. Let's learn to deliver that exact queen mate — try again!",
          doneText:
            "Qh4#! Your queen delivers check along the h-file with your king backing her up, and Black has no escape. Checkmate! You just delivered mate with king and queen — a skill you'll use in almost every single game.",
        },
      ],
    },
  ],
};

// Openings - cisto informativni highlight (nema "napad/opasnost" dihotomiju
// kao kod mat lekcija), jedna boja za sve - sve 5 principa su isti registar.
const D13_INFO = '#11C6D1';

const DAY_13_OPENINGS: Lesson = {
  id: 'l1-d13-openings',
  level: 1,
  day: 13,
  title: 'Openings — The Basics',
  piece: {
    name: 'opening',
    glyph: '♟',
    movement: 'static',
    bannerText: 'Openings 101',
  },
  intro: {
    title: 'Openings — The Basics',
    text: 'The opening is the very first part of a chess game, the first few moves where both players set up their pieces. A good opening gets your pieces ready to attack and defend before the real fight begins.',
  },
  // JEDINI punoekranski pop-up u celoj lekciji - svih 5 principa posle ovoga
  // ide kroz AI chat (watch-style 'quiz' koraci), ne kroz dodatne pop-up prozore.
  introSteps: [
    {
      text: 'The opening is the very first part of a chess game, the first few moves where both players set up their pieces. A good opening gets your pieces ready to attack and defend before the real fight begins.',
      buttonText: 'Next',
    },
  ],
  steps: [
    {
      id: 'p1-control-center',
      kind: 'quiz',
      fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Principle 1 of 5 — Control the Center',
      introText:
        'Control the center. The middle of the board (d4, d5, e4, e5) is the most valuable real estate. See how both sides are already fighting over it after move 1?',
      quizBoardHighlight: {
        arrows: [
          { from: 'e2', to: 'e4', color: D13_INFO },
          { from: 'e7', to: 'e5', color: D13_INFO },
        ],
        squares: [
          { square: 'd4', color: D13_INFO },
          { square: 'd5', color: D13_INFO },
          { square: 'e4', color: D13_INFO },
          { square: 'e5', color: D13_INFO },
        ],
      },
      doneText: 'Control the center - the fight for d4, d5, e4, e5.',
      hintText: '',
      nextButtonText: 'Got it!',
    },
    {
      id: 'p2-develop-pieces',
      kind: 'quiz',
      fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Principle 2 of 5 — Develop Your Pieces',
      introText:
        "Develop your pieces. Bring your knights and bishops out before anything else. Both knights are already in the game here, that's the idea.",
      // Konji su vec razvijeni; lovac na f1 je obelezen kao sledeci na redu.
      quizBoardHighlight: {
        squares: [
          { square: 'f3', color: D13_INFO },
          { square: 'c6', color: D13_INFO },
          { square: 'f1', color: D13_INFO },
        ],
      },
      doneText: 'Knights out first - bishops are next.',
      hintText: '',
      nextButtonText: 'Got it!',
    },
    {
      id: 'p3-dont-repeat',
      kind: 'quiz',
      fen: 'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
      orientation: 'w',
      solution: ['quiz'],
      prompt: "Principle 3 of 5 — Don't Move the Same Piece Twice",
      introText:
        "Don't move the same piece twice. Every knight and bishop on this board has moved exactly once, that's why development is already this far ahead.",
      quizBoardHighlight: {
        squares: [
          { square: 'f3', color: D13_INFO },
          { square: 'c6', color: D13_INFO },
          { square: 'c4', color: D13_INFO },
          { square: 'c5', color: D13_INFO },
        ],
      },
      doneText: 'Four pieces developed, each moved only once.',
      hintText: '',
      nextButtonText: 'Got it!',
    },
    {
      id: 'p4-castle-early',
      kind: 'quiz',
      fen: 'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 b kq - 5 4',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Principle 4 of 5 — Castle Early',
      introText:
        'Castle early. Get your king to safety as soon as you can. White just did exactly that, the king is tucked away in the corner already.',
      quizBoardHighlight: {
        arrows: [{ from: 'e1', to: 'g1', color: D13_INFO }],
        squares: [
          { square: 'g1', color: D13_INFO },
          { square: 'f1', color: D13_INFO },
        ],
      },
      doneText: 'Castled - king tucked safely into the corner.',
      hintText: '',
      nextButtonText: 'Got it!',
    },
    {
      id: 'p5-queen-home',
      kind: 'quiz',
      // Ista pozicija kao Principle 4 - lepo ilustruje oba pravila odjednom (Dev Notes).
      fen: 'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 b kq - 5 4',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Principle 5 of 5 — Keep Your Queen Home for Now',
      introText:
        "Keep your queen home for now. Bringing her out too early lets your opponent attack her and gain tempo. Notice White's queen hasn't moved at all yet, and that's perfectly fine this early.",
      quizBoardHighlight: {
        squares: [
          { square: 'd1', color: D13_INFO },
          { square: 'd8', color: D13_INFO },
        ],
      },
      doneText: 'Both queens still home - no rush.',
      hintText: '',
      nextButtonText: 'Got it!',
    },
    {
      id: 'ready-london',
      kind: 'quiz',
      fen: 'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 b kq - 5 4',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Ready for Your First Opening?',
      introText:
        'Ready to learn the basics of the London System, one of the simplest and most popular openings for White?',
      doneText: 'Time to see it in action.',
      hintText: '',
      nextButtonText: 'London System',
    },
    {
      id: 'guided-london',
      kind: 'puzzle',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      orientation: 'w',
      // 1.d4 d5 2.Bf4 Nf6 3.e3 e6 4.Nf3 Bd6 5.Bg3 - verifikovano chess.js,
      // svaki potez legalan, redosled tacan po PGN-u iz tiketa.
      solution: [
        'd2d4',
        'd7d5',
        'c1f4',
        'g8f6',
        'e2e3',
        'e7e6',
        'g1f3',
        'f8d6',
        'f4g3',
      ],
      showSolutionArrowUpfront: true,
      revealArrowOnWrongMove: true,
      prompt: 'Your First Opening — The London System',
      introText:
        "Let's play it together. Follow the arrow for each move, I'll take care of Black.",
      hintText: "Not quite — follow the London System's plan.",
      doneText:
        "You just played the first 5 moves of the London System, one of the simplest and most popular openings for White.",
    },
  ],
};

const DAY_14_FIRST_GAME: Lesson = {
  id: 'l1-d14-first-game',
  level: 1,
  day: 14,
  title: 'Your First Game',
  endScreenTitle: 'Your first game is complete! 🎉',
  piece: {
    name: 'first game',
    glyph: '♟',
    movement: 'mascot',
    bannerText: 'Meet Pawny',
    subBannerText: 'Rated 100–300',
  },
  intro: {
    title: 'Time for your First game',
    text: 'All the lessons led here. Meet **Pawny**, your first opponent. Rated 100 to 300, still figuring out how bishops move. **Loses pieces for fun.** Perfect for a real first game.',
  },
  // JEDINI pop-up ove lekcije - "Meet Pawny", pre nego sto partija pocne.
  introSteps: [
    {
      text: 'All the lessons led here. Meet **Pawny**, your first opponent. Rated 100 to 300, still figuring out how bishops move. **Loses pieces for fun.** Perfect for a real first game.',
      buttonText: 'Start Play',
    },
  ],
  steps: [
    {
      id: 'vs-pawny',
      kind: 'freePlay',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      orientation: 'w',
      // freePlay ne koristi solution - svaki legalan potez je dozvoljen,
      // Pawny (Stockfish, najslabije podesavanje) odgovara kao crni.
      solution: [],
      prompt: 'Your First Game',
      introText: "Make your first move whenever you're ready.",
      hintText: '',
      doneText:
        "Interesting game. Your first real match, no puzzles, no hints. That's chess now.",
      freePlayMessages: [
        "I only just learned how bishops move. Don't tell anyone.",
        'This is the first game where nobody yells at me for hanging my queen.',
        "My last training partner resigned on move 3. You're already ahead of him.",
        "I'm still counting squares in my head. Don't rush me.",
        "Neither of us fully knows what we're doing. That's the fun part.",
        "I'd castle now if I remembered which side.",
        "This is the longest I've survived all week.",
        "Every move you make, I'm taking notes.",
        'Grandmasters probably started exactly like this. Probably.',
        'Still here. Still confused. Still fun.',
        "You've got more of a plan than I do.",
        "This board's seen worse games. Mine, mostly.",
        'I respect a player who thinks before moving. Unlike me.',
        'Real chess feels different than the puzzles.',
        'Whatever happens next, this counts as your first real game.',
      ],
      // Trener (Outposty), ne Pawny - kratke, tople recenice posle
      // korisnikovog poteza. Bez uzvicnika (Outpost tone of voice).
      motivationMessages: [
        'Nice and steady.',
        "You're reading the position well.",
        'That was a thoughtful choice.',
        'Keep that rhythm going.',
        'Smart move.',
        "You're finding your footing fast.",
        "That's real progress.",
        'Patient play like that pays off.',
        "You're playing with real focus.",
        'Nice instincts there.',
        'Every move like that adds up.',
        "You're getting the hang of this.",
        'Good sense on that one.',
        "You're settling in nicely.",
        'That kind of focus wins games.',
      ],
    },
  ],
  endScreenButtons: [
    { label: 'Play again', action: 'repeat' },
    { label: 'Game Review', action: 'review' },
    { label: 'Done', action: 'done' },
  ],
};

// Day 15 - cisto informativni registar (isti kao Day13 Openings): plava =
// "pogledaj ovo", roze = "izgubljeno pravo/problem", zelena = "jos uvek
// vazi/sigurno", cilibar = "napadnuto ali NEBITNO" (Pozicija 6 trik).
const D15_SPOTLIGHT = '#11C6D1';
const D15_MOVED = '#f2358d';
const D15_AVAILABLE = '#07DA63';
const D15_IRRELEVANT = '#f59e0b';

const DAY_15_CASTLING_RULES: Lesson = {
  id: 'l1-d15-castling-rules',
  level: 1,
  day: 15,
  title: 'Castling Rules — When You Can’t Castle',
  piece: {
    name: 'castling',
    glyph: '♚',
    movement: 'static',
    bannerText: 'Castling Rules',
  },
  intro: {
    title: 'Castling Rules — When You Can’t Castle',
    text: "Castling is one of the most common sources of illegal moves at this level. We'll go through **every reason it can be blocked** — then flip it around and take that option away from your opponent.",
  },
  // Position 2/3/5/6 grupa (kratke "pronadji rokadu" vezbe) ima svoju temu
  // po poziciji - svaka zasluzuje SOPSTVEN segment, ne grupisanje. Isto za
  // Part 2 puzzle-e (bishop/queen/knight su tri razlicite teme).
  flatProgressSegments: true,
  steps: [
    // ---------- Part 1 ----------
    {
      id: 'p1-king-moved',
      kind: 'quiz',
      fen: 'r2qk2r/ppp2ppp/5n2/2b5/2B5/5N2/PPP1KPPP/R2Q3R w kq - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Position 1 — The King Has Already Moved',
      introText:
        "Look at White's king — it's on e2, not e1. Rule #1: once your king has moved, even one square, **you lose the right to castle** for the rest of that game — even if it comes right back to e1 later. Here it hasn't even come back yet, so there's no question: no castling for White, either side.\n\nFor now, we're **just learning** — you'll get to try it yourself soon.",
      quizBoardHighlight: {
        squares: [{ square: 'e2', color: D15_SPOTLIGHT }],
      },
      doneText: "The king moved - castling rights are gone for good.",
      hintText: '',
      nextButtonText: 'Got it!',
    },
    {
      id: 'p2a-queenside-rook-moved',
      kind: 'quiz',
      fen: '3rk2r/pp1qbppp/2p1bn2/3p2B1/3P4/2NQ1N2/PPP2PPP/1R2K2R w Kk - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Position 2 — One Rook Has Moved',
      introText:
        "Check the queenside corner — White's rook isn't on a1 anymore, it's already stepped to b1. If a rook moves, you only lose castling **on that rook's side**. So queenside (O-O-O) is gone for White and Black, but kingside (O-O) is still completely legal, since the h1 rook and the king never moved.\n\nFor now, we're **just learning** — you'll get to try it yourself soon.",
      quizBoardHighlight: {
        squares: [
          { square: 'b1', color: D15_MOVED },
          { square: 'd8', color: D15_MOVED },
        ],
      },
      doneText: "Queenside rook moved - O-O-O is gone, O-O is still fine.",
      hintText: '',
      nextButtonText: 'Got it!',
    },
    {
      id: 'p2b-castle-kingside',
      kind: 'puzzle',
      fen: '3rk2r/pp1qbppp/2p1bn2/3p2B1/3P4/2NQ1N2/PPP2PPP/1R2K2R w Kk - 0 1',
      orientation: 'w',
      solution: ['e1g1'],
      prompt: 'Castle on the Side You Still Can',
      introText: 'Castle on the side where castling is still legal.',
      doneText: 'O-O — castled kingside, exactly the side you still had.',
      hintText:
        "We're looking for the castle here — other moves aren't the point right now.",
    },
    {
      id: 'p3a-kingside-rook-moved',
      kind: 'quiz',
      fen: 'r3k2r/pppp1ppp/8/4p3/4P1PP/8/PPPP1P2/R3K1R1 w Qkq - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Position 3 — The Other Rook Has Moved',
      introText:
        "This time it's the other rook — White lifted it from h1 to g1 to support the pawn storm. Same rule, mirrored: kingside castling (O-O) is gone because **that rook moved**, but queenside (O-O-O) is still totally fine, since the a1 rook and the king haven't budged.\n\nFor now, we're **just learning** — you'll get to try it yourself soon.",
      quizBoardHighlight: {
        arrows: [{ from: 'e1', to: 'c1', color: D15_AVAILABLE }],
        squares: [
          { square: 'g1', color: D15_MOVED },
          { square: 'a1', color: D15_AVAILABLE },
          { square: 'e1', color: D15_AVAILABLE },
        ],
      },
      doneText: "Kingside rook moved - O-O is gone, O-O-O is still fine.",
      hintText: '',
      nextButtonText: 'Got it!',
    },
    {
      id: 'p3b-castle-queenside',
      kind: 'puzzle',
      fen: 'r3k2r/pppp1ppp/8/4p3/4P1PP/8/PPPP1P2/R3K1R1 w Qkq - 0 1',
      orientation: 'w',
      solution: ['e1c1'],
      prompt: "So, What's the Move?",
      introText: 'Castle on the side where castling is still legal.',
      doneText:
        'O-O-O — castled queenside, the only side still available.',
      hintText:
        "We're looking for a possible castle here — other moves aren't relevant right now.",
    },
    {
      id: 'p4-bishop-attacks-crossing-square',
      kind: 'quiz',
      fen: '4k3/8/b7/8/8/8/8/R3K2R w KQ - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Position 4 — A Bishop Attacks the Crossing Square',
      introText:
        "Having the right to castle isn't enough — the move also has to be legal right now. The king can never cross through a square that's **under attack**. Here Black's bishop covers f1, the square the king would cross on the way to g1, so kingside castling is illegal this turn — even though nothing has moved yet.\n\nFor now, we're **just learning** — you'll get to try it yourself soon.",
      quizBoardHighlight: {
        arrows: [{ from: 'a6', to: 'f1', color: D15_MOVED }],
        squares: [{ square: 'f1', color: D15_MOVED }],
      },
      doneText: "f1 is attacked - the king can't cross it, so O-O is out.",
      hintText: '',
      nextButtonText: 'Got it!',
    },
    {
      id: 'p5a-queen-attacks-landing-square',
      kind: 'quiz',
      fen: '4k3/8/6q1/8/8/8/8/R3K2R w KQ - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Position 5 — A Queen Attacks the Landing Square',
      introText:
        "Same idea, different square: this time it's g1 itself — the square the king would actually land on — that's covered, by the black queen straight down the g-file. **Landing square attacked** means no castling to that side, even though the king isn't in check right now and hasn't moved.\n\nFor now, we're **just learning** — you'll get to try it yourself soon.",
      quizBoardHighlight: {
        arrows: [{ from: 'g6', to: 'g1', color: D15_MOVED }],
        squares: [
          { square: 'g1', color: D15_MOVED },
          { square: 'd1', color: D15_AVAILABLE },
          { square: 'c1', color: D15_AVAILABLE },
        ],
      },
      doneText: "g1 is attacked - O-O is out, but O-O-O is still open.",
      hintText: '',
      nextButtonText: 'Got it!',
    },
    {
      id: 'p5b-castle-queenside',
      kind: 'puzzle',
      fen: '4k3/8/6q1/8/8/8/8/R3K2R w KQ - 0 1',
      orientation: 'w',
      solution: ['e1c1'],
      prompt: 'One Castle Is Still Possible Here',
      introText: 'Find the castle that is still legal.',
      doneText: 'O-O-O — the queenside castle was still completely legal.',
      hintText:
        "We're looking for a possible castle here — other moves aren't relevant right now.",
    },
    {
      id: 'p6a-irrelevant-square',
      kind: 'quiz',
      fen: 'r3k3/8/8/8/8/8/8/1Q2K3 b q - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: "Position 6 — The Trick: an Attacked Square That Doesn't Matter",
      introText:
        "Here's the part almost nobody knows. Castling is only blocked by **squares the king itself touches** — the square it starts on, every square it crosses, and the square it lands on. For Black's queenside castle, that's e8, d8, and c8 only. The rook's own start and landing squares — a8 and d8... wait, b8 — don't count, because the king never goes anywhere near b8.\n\nFor now, we're **just learning** — you'll get to try it yourself soon.",
      quizBoardHighlight: {
        arrows: [{ from: 'b1', to: 'b8', color: D15_IRRELEVANT }],
        squares: [
          { square: 'b8', color: D15_IRRELEVANT },
          { square: 'e8', color: D15_AVAILABLE },
          { square: 'd8', color: D15_AVAILABLE },
          { square: 'c8', color: D15_AVAILABLE },
        ],
      },
      doneText: 'Only squares the king itself touches matter.',
      hintText: '',
      nextButtonText: 'Got it!',
    },
    {
      id: 'p6b-yes-or-no',
      kind: 'quiz',
      fen: 'r3k3/8/8/8/8/8/8/1Q2K3 b q - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt:
        'So: Is Black’s Queenside Castle Still Legal Here, Even With White’s Queen Attacking b8?',
      introText:
        'So: is Black’s queenside castle still legal here, even with White’s queen sitting on b1 attacking b8?',
      quizOptions: ['Yes', 'No'],
      quizCorrectIndex: 0,
      quizRetryOnWrong: true,
      quizExplanationWrong:
        'Not quite — check which squares the king actually touches.',
      quizExplanation:
        "YES! It's possible! It looks like it isn't, but it's absolutely legal :) The queen attacks b8 — a square the king **never crosses or lands on** — so it changes nothing. Only e8, d8, and c8 matter here.",
      quizAutoPlayMove: 'e8c8',
      quizBoardHighlight: {
        arrows: [{ from: 'b1', to: 'b8', color: D15_IRRELEVANT }],
        squares: [
          { square: 'b8', color: D15_IRRELEVANT },
          { square: 'e8', color: D15_AVAILABLE },
          { square: 'd8', color: D15_AVAILABLE },
          { square: 'c8', color: D15_AVAILABLE },
        ],
      },
      quizBoardHighlightUpfront: true,
      doneText:
        "YES! It's possible! It looks like it isn't, but it's absolutely legal :) The queen attacks b8 — a square the king **never crosses or lands on** — so it changes nothing. Only e8, d8, and c8 matter here.",
      hintText: '',
      // Bez ovoga, "Got it!" dobija pun auto-advance tretman (pulsira i sam
      // se napuni/klikne) cim se otkljuci - cak i posle NETACNOG odgovora
      // (quizRetryOnWrong ga otkljucava namerno, vidi DailyLessonActivity).
      // To bi odgurnulo korisnika dalje pre nego sto stigne da odluci da li
      // zeli da proba ponovo - retry inace nema poentu.
      noAutoAdvance: true,
      nextButtonText: 'Got it!',
    },
    {
      id: 'ps-reminder',
      kind: 'quiz',
      fen: '2kr4/8/8/8/8/8/8/1Q2K3 w - - 1 2',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'One More Thing to Remember',
      introText:
        "One more thing to remember: castling is **a king move**. Whether you're playing over the board or online, you always play it by moving the king two squares toward the rook — never by touching the rook first. The board (or arbiter) reads it as a king move, so that's the habit to build.\n\nFor now, we're **just learning** — you'll get to try it yourself soon.",
      doneText: "Castling is always a king move, two squares toward the rook.",
      hintText: '',
      nextButtonText: 'Got it!',
    },
    // ---------- Part 2 ----------
    {
      id: 'part2-intro',
      kind: 'quiz',
      fen: 'r3k3/8/8/8/8/3B4/8/6K1 w q - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Stop the Castle!',
      introText:
        "Now flip it around: you're the one trying to **stop your opponent** from castling. Find the move.",
      doneText: 'Time to take that option away from your opponent.',
      hintText: '',
      // "Got it!" ne odgovara ovde - korisnik jos nije nista "shvatio", tek
      // kreće u akciju. "Let's Go" je prirodniji poziv na pocetak vezbe.
      nextButtonText: "Let's Go",
    },
    {
      id: 'puzzle1-bishop',
      kind: 'puzzle',
      fen: 'r3k3/8/8/8/8/3B4/8/6K1 w q - 0 1',
      orientation: 'w',
      solution: ['goal'],
      goalCondition: 'denyCastleQueenside',
      hintMove: 'd3f5',
      hintNeverRevealsArrow: true,
      prompt: 'Puzzle 1 — Cut It Off With a Bishop',
      introText:
        'White to move. Black is ready to castle queenside. **Find the move** that stops it.',
      extraHintText:
        "Which diagonal from your bishop's current square reaches all the way into Black's back rank?",
      wrongMoveHighlight: {
        arrows: [{ from: 'f5', to: 'c8', color: D15_MOVED }],
        squares: [{ square: 'c8', color: D15_MOVED }],
      },
      doneText:
        "Exactly! Bf5 **covers c8**, the king's landing square. No legal O-O-O for Black now.",
      hintText: 'Not quite — try again!',
      // Ba6 TAKODJE pokriva c8 (druga dijagonala) - radi, ali je lovac
      // zakopan u uglu bez razloga, pa trazimo bolje polje (requireRetry).
      // Bb5/Bg6 ne pokrivaju c8 uopste - deny-uju rokadu DAVANJEM SAHA
      // (chess.js: kralj mora da se pomeri, nema cime da blokira/uzme), sto
      // je potpuno drugaciji (i ispravan) mehanizam - sopstven doneText, ne
      // generican "Bf5 covers c8" tekst koji bi bio netacan za njih.
      altSolutions: [
        {
          uci: 'd3a6',
          requireRetry: true,
          retryMessage:
            "You did stop the castle — but Ba6 leaves your bishop stuck in the corner for nothing. Find a square that does the same job without wasting the piece.",
          doneText:
            "Ba6 also covers c8, same as Bf5 — just from a much less useful square.",
        },
        {
          uci: 'd3b5',
          doneText:
            "Check! With no way to block or capture, Black's king is forced to move — and once it moves, queenside castling is **gone for good** (remember Position 1).",
        },
        {
          uci: 'd3g6',
          doneText:
            "Check! With no way to block or capture, Black's king is forced to move — and once it moves, queenside castling is **gone for good** (remember Position 1).",
        },
      ],
    },
    {
      id: 'puzzle2-queen',
      kind: 'puzzle',
      fen: 'r3k3/1p6/2p5/8/8/8/8/6KQ w q - 0 1',
      orientation: 'w',
      solution: ['goal'],
      goalCondition: 'denyCastleQueenside',
      hintMove: 'h1h4',
      hintNeverRevealsArrow: true,
      // Qh3 TAKODJE radi, ali napada DRUGO polje (c8 - polje sletanja, ne
      // d8 - polje prelaska) - sopstven doneText da objasnjenje odgovara
      // stvarno odigranom potezu, ne uvek istom hardkodovanom Qh4 tekstu.
      altSolutions: [
        {
          uci: 'h1h3',
          doneText:
            "Got it, Qh3 **covers c8**, the king's landing square. Same result, different square.",
        },
      ],
      prompt: 'Puzzle 2 — Cut It Off With a Queen',
      introText:
        'Same idea, bigger piece. **Find the queen move** that stops Black’s castle.',
      extraHintText:
        'Look at the diagonal from h4 or h3 — which back-rank square does it reach, and does the king have to pass through it?',
      wrongMoveHighlight: {
        arrows: [
          { from: 'h4', to: 'd8', color: D15_MOVED },
          { from: 'h3', to: 'c8', color: D15_MOVED },
        ],
        squares: [
          { square: 'h3', color: D15_SPOTLIGHT },
          { square: 'h4', color: D15_SPOTLIGHT },
        ],
      },
      doneText:
        "Got it, Qh4 **hits d8**, the square the king has to pass through. Doesn't matter that c8 itself is totally safe.",
      hintText: 'Not quite — try again!',
    },
    {
      id: 'puzzle3-knight',
      kind: 'puzzle',
      fen: '4k2r/8/8/8/3N4/8/8/6K1 w k - 0 1',
      orientation: 'w',
      solution: ['goal'],
      goalCondition: 'denyCastleKingside',
      hintMove: 'd4e6',
      hintNeverRevealsArrow: true,
      prompt: 'Puzzle 3 — Cut It Off With a Knight',
      introText:
        'One more — this time with a knight. **Find the move** that stops Black’s kingside castle.',
      extraHintText:
        "Which knight move attacks a dark square right next to Black's king?",
      wrongMoveHighlight: {
        arrows: [
          { from: 'd4', to: 'e6', color: D15_SPOTLIGHT },
          { from: 'e6', to: 'f8', color: D15_MOVED },
        ],
        squares: [{ square: 'd4', color: D15_SPOTLIGHT }],
      },
      doneText:
        "Ne6! It **attacks f8**, right in the king's path. No legal O-O for Black now.",
      hintText: 'Not quite — try again!',
    },
  ],
  endScreenButtons: [
    { label: 'Repeat Lesson', action: 'repeat' },
    { label: 'Done', action: 'done' },
  ],
};

const DAY_16_PUZZLE_TIME: Lesson = {
  id: 'l1-d16-puzzle-time',
  level: 1,
  day: 16,
  title: 'Puzzle time!',
  endScreenTitle: '5 for 5.',
  // 5 tematski odvojenih puzli (razlicita figura/ideja svaki put), ne
  // ponovljena vezba istog tipa - jedna greska na puzzli 2 ne sme da oboji
  // i puzzle 1/3/4/5. Svaki dobija SVOJ segment na traci (vidi
  // Lesson.flatProgressSegments), obojen zeleno/roze nezavisno.
  flatProgressSegments: true,
  piece: {
    name: 'puzzle solving',
    glyph: '🧩',
    movement: 'static',
    bannerText: 'Puzzle Time!',
  },
  intro: {
    title: 'Puzzle time!',
    text: "A puzzle is a chess position where you find the **best move** to win an advantage. This one is simple: one position, one move. Find the piece you can **take for free**. Tap it, then tap where it lands.",
  },
  introSteps: [
    {
      text: "A puzzle is a chess position where you find the **best move** to win an advantage. This one is simple: one position, one move. Find the piece you can **take for free**. Tap it, then tap where it lands.",
      buttonText: 'Start Puzzling!',
    },
  ],
  steps: [
    {
      id: 'p1-queen-takes-queen',
      kind: 'puzzle',
      fen: '4k3/ppp2ppp/8/3q4/8/8/PPPQ1PPP/4K3 w - - 0 1',
      orientation: 'w',
      solution: ['d2d5'],
      prompt: 'White to play: take the free piece',
      introText: 'First one. Scan the board for anything undefended.',
      doneText: 'Queen captured. Nothing traded back.',
      hintText: 'Not that one. Something here is hanging. Look again.',
      extraHintText: 'Someone left their queen out in the open.',
    },
    {
      id: 'p2-rook-takes-bishop',
      kind: 'puzzle',
      fen: '8/1pp2k1p/6p1/p4p2/2Pb4/1P6/P2R1PPP/4K3 w - - 0 1',
      orientation: 'w',
      solution: ['d2d4'],
      prompt: 'White to play: take the free piece',
      introText: "Same idea. Check what your rook's file actually covers.",
      doneText: 'Rook takes bishop. On to the next.',
      hintText: 'Not quite. Look at the file your rook sits on.',
      extraHintText: "A bishop wandered onto your rook's line.",
    },
    {
      id: 'p3-bishop-takes-knight',
      kind: 'puzzle',
      fen: 'k6n/pppppp1p/8/8/8/8/PBPPPPPP/4K3 w - - 0 1',
      orientation: 'w',
      solution: ['b2h8'],
      prompt: 'White to play: take the free piece',
      introText: 'Longer reach this time. Follow the diagonal all the way.',
      doneText: 'All the way across the board.',
      hintText: 'Try again. Your bishop sees further than it looks.',
      extraHintText: 'Check the far corner of that diagonal.',
    },
    {
      id: 'p4-knight-takes-queen',
      kind: 'puzzle',
      fen: '1k6/p1pp1ppp/1pb5/4q3/1PP5/PQ1P1N2/4PPPP/6K1 w - - 0 1',
      orientation: 'w',
      solution: ['f3e5'],
      prompt: 'White to play: take the free piece',
      introText: "Different piece, same question: what's hanging?",
      doneText: "Knight takes the queen. That's the whole move.",
      hintText: "Not that move. Knights jump in an L. Check what's in range.",
      extraHintText: "Knights jump in an L. Queens don't always see it coming.",
    },
    {
      id: 'p5-pawn-takes-bishop',
      kind: 'puzzle',
      fen: '1k1r3r/1pp2ppp/pn6/4b3/3P4/4P2N/PPP2PPP/2KR3R w - - 0 1',
      orientation: 'w',
      solution: ['d4e5'],
      prompt: 'White to play: take the free piece',
      introText: 'Last one. Find the free piece and close it out.',
      doneText:
        'Pawn does the work this time. Five puzzles, five pieces. Every one was there for the taking.',
      hintText: 'Not this time. Pawns only capture to the side.',
      extraHintText: "Pawns capture sideways, not straight. This one's ready.",
    },
  ],
  endScreenButtons: [
    { label: 'Done', action: 'done' },
    { label: 'Repeat', action: 'repeat' },
    { label: 'Play', action: 'play' },
  ],
};

// Day 17 - CEO red svakog topa se boji automatski (vidi
// LessonStep.highlightRookRanks), ova boja ostaje samo za strelicu koja
// pokazuje liniju saha (top koji upravo sahira -> kraljevo polje).
const D17_CHECK = '#07DA63';

const DAY_17_TWO_ROOKS_CHECKMATE: Lesson = {
  id: 'l1-d17-two-rooks-checkmate',
  level: 1,
  day: 17,
  title: 'Two Rooks Checkmate',
  piece: {
    name: 'two rooks',
    glyph: '♜',
    movement: 'static',
  },
  intro: {
    title: 'Two Rooks Checkmate',
    text: 'Two rooks and a lone king. No king support needed. Just two rooks, working together, forcing the king to the edge of the board.',
  },
  steps: [
    {
      id: 'step1-spread-out',
      kind: 'teach',
      fen: '8/8/8/4k3/8/R7/1R6/6K1 w - - 0 1',
      orientation: 'w',
      solution: ['b2b4'],
      suggestedMove: { uci: 'b2b4', label: 'Rb4' },
      prompt: 'Spread your rooks out',
      introText:
        "The goal is to cut off the opponent's king. Move the rook so you shrink the king's space by one more line.",
      doneText:
        'Line your rooks up side by side, not on the same file. Stacked, they block each other. Spread out, they cover the whole board together.',
      hintText: 'Not that one. Spread the rooks out, not on top of each other.',
      // Ceo red svakog topa se oboji automatski posle poteza - vidi
      // LessonStep.highlightRookRanks (DailyLessonActivity.tsx onMove).
      highlightRookRanks: true,
      // Korisnik mora da STIGNE da pogleda obojene redove pre nego sto
      // predje dalje - bez ovoga tabla se zatamni i Got it! sam puca posle
      // par sekundi (standardno "Next spreman" ponasanje), tacno dok je
      // highlight najbitniji.
      noAutoAdvance: true,
      nextButtonText: 'Got it!',
    },
    {
      id: 'step2-cutoff-and-check',
      kind: 'teach',
      // Beli kralj na g1 dodat da FEN bude validan (svaka pozicija mora da
      // ima oba kralja) - isti neutralni ugao kao u sva ostala 3 FEN-a ove
      // lekcije, bezbedno van svih linija koje tura kontrolise.
      fen: '8/8/4k3/R7/1R6/8/8/6K1 w - - 0 1',
      orientation: 'w',
      solution: ['b4b6'],
      suggestedMove: { uci: 'b4b6', label: 'Rb6+' },
      prompt: 'Cut off, then check',
      introText:
        "Now the king is cut off. One rook holds it there, the other has to deliver check. Try making the move.",
      doneText:
        "One rook always cuts off a rank so the king can't cross it. The other delivers check and pushes the king back.",
      hintText: 'Not that one. The other rook delivers the check.',
      quizBoardHighlight: {
        arrows: [{ from: 'b6', to: 'e6', color: D17_CHECK }],
      },
      highlightRookRanks: true,
      noAutoAdvance: true,
      transitionText:
        'After every check, the jobs swap. The rook that just checked becomes the new cutoff. The other lines up the next check.',
      nextButtonText: 'Got it!',
    },
    {
      id: 'step3-keep-your-distance',
      kind: 'teach',
      fen: '8/8/8/2k5/R7/1R6/8/6K1 w - - 0 1',
      orientation: 'w',
      solution: ['b3h3'],
      suggestedMove: { uci: 'b3h3', label: 'Rh3' },
      prompt: 'Keep your distance',
      introText:
        "Oho! Now the king isn't giving the rook what it wants most. Time to stretch that rook as far from the king as possible, along the same rank.",
      doneText:
        "Checking too close lets the king just capture your rook. Keep the cutoff rook on the same rank. Slide it all the way across the board, out of the king's reach. Whatever the king plays, you're ready to push it down another rank.",
      hintText: 'Not that one. Slide it all the way across the rank, away from the king.',
      // Zasto NE Rb5+ - top bi dao sah, ali kralj na c5 stoji odmah pored i
      // prosto bi ga pojeo. Vidljivo ODMAH, pre bilo kog pokusaja.
      wrongPathPreview: {
        arrows: [{ from: 'b3', to: 'b5' }],
        squares: ['b5'],
      },
      highlightRookRanks: true,
      noAutoAdvance: true,
      transitionText: 'Now finish it yourself. Same idea, five moves to mate.',
      nextButtonText: 'Got it!',
    },
    {
      id: 'main-exercise',
      kind: 'puzzle',
      fen: '8/8/7k/8/R7/R7/8/6K1 w - - 0 1',
      orientation: 'w',
      // Belo (korisnik) / crno (fiksno, UVEK isti potez - nema engine/random
      // logike za protivnika, vidi resolveOpponentReply u lessonEngine.ts).
      solution: [
        'a4a5', // 1. Ra5
        'h6g6', // 1... Kg6 (fiksno)
        'a3b3', // 2. Rb3
        'g6f6', // 2... Kf6 (fiksno)
        'b3b6', // 3. Rb6+
        'f6e7', // 3... Ke7 (fiksno)
        'a5a7', // 4. Ra7+
        'e7d8', // 4... Kd8 (fiksno)
        'b6b8', // 5. Rb8#
      ],
      prompt: 'Mate in 5: finish it yourself',
      introText:
        'First, always cut off the king if you get the chance. Then split your rooks up so they can dance and take turns checking the king, all the way to mate.',
      hintText:
        "That could work too. Let's learn the method that always gets you there first.",
      // Isti fiksan tekst na SVAKI promasaj, bez variranja/eskalacije - tacno
      // kako tiket trazi ("Same flow every time").
      hintTextAlways: true,
      // Strelica do TACNO JEDNOG resenja se otkriva odmah na prvi promasaj,
      // ne tek posle Hint klika - "hint koji nikad ne nudi vise opcija".
      revealArrowOnWrongMove: true,
      highlightRookRanks: true,
      moveExplanations: {
        0: "Ra5 cuts off rank 5. The king can't cross it. Fewer squares, no way back.",
        2: "Rooks need room to move. Keep them off the same file, or they get in each other's way.",
        4: 'One rook holds the rank. The other checks. Same two jobs, every time.',
        6: "Same idea, roles swapped. This rook checks now, that one holds the line. The king's running out of board.",
      },
      moveHighlights: {
        4: { arrows: [{ from: 'b6', to: 'f6', color: D17_CHECK }] },
        6: { arrows: [{ from: 'a7', to: 'e7', color: D17_CHECK }] },
      },
      doneText: 'You can checkmate with two rooks now. Every time.',
      celebrate: true,
    },
  ],
  endScreenButtons: [
    { label: 'Repeat lesson', action: 'repeat' },
    { label: 'Done', action: 'done' },
    { label: 'Play', action: 'play' },
  ],
};

const DAY_18_SECOND_GAME: Lesson = {
  id: 'l1-d18-second-game',
  level: 1,
  day: 18,
  title: 'Your Second Game',
  endScreenTitle: 'Second game complete.',
  // Pawny slika i dalje vidljiva (movement:'mascot', Pawny 2.0 - vidi
  // pawnyAvatar ispod) ali bez "Meet Pawny" re-intro teksta - samo ime i
  // snaga kao labela ispod slike, bot je vec predstavljen u Day 14.
  piece: {
    name: 'second game',
    glyph: '♟',
    movement: 'mascot',
    bannerText: 'Pawny 2.0',
    subBannerText: 'Rated 150–350',
  },
  intro: {
    title: 'Time for Game 2',
    text: "You've covered a lot since your first game. Time to test it. Same Pawny, a little sharper this time. Rated **150 to 350**, and paying more attention. Let's see what stuck.",
  },
  introSteps: [
    {
      text: "You've covered a lot since your first game. Time to test it. Same Pawny, a little sharper this time. Rated **150 to 350**, and paying more attention. Let's see what stuck.",
      buttonText: 'Ready',
    },
  ],
  // Day 18 "Pawny 2.0" - novi avatar kroz ceo chat (Pawny-jeve poruke I END
  // screen ostaju COACH poruke, ne diraju ovo - samo Pawny-jev lik u balonu).
  pawnyAvatar: '/pawny/pawny2.png',
  steps: [
    {
      id: 'vs-pawny-2',
      kind: 'freePlay',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      orientation: 'w',
      solution: [],
      prompt: 'Your Second Game',
      introText: "Make your first move whenever you're ready.",
      hintText: '',
      doneText:
        "Second real game down. Still no puzzles, still no hints. That's the part that counts.",
      // Nema motivationMessages (Outposty) za ovu partiju - tiket trazi SAMO
      // Pawny-jeve poruke na svakih 5 poteza, isto kao Day 14, ali nov pool;
      // ne izmisljam dodatan trenerov sloj koji tiket ne trazi.
      freePlayMessages: [
        "I've been practicing since our last game. Don't get used to easy wins.",
        "Still can't tell you why the knight moves like that. Works though.",
        "This one's tighter than our first game. I think.",
        'I remember losing a piece right about here last time. Not today.',
        'Somebody taught me what a fork is. Watch out.',
        'I used to hang my queen every game. Down to every other game now.',
        "You've gotten better since Game 1. Rude, honestly.",
        'This is the part where I usually panic. Not yet.',
        "I looked up 'good chess moves' before this game. Didn't help much.",
        "Two games in and I still don't trust my own rooks.",
        "If I win this one, I'm retiring undefeated.",
        "You're playing like you've actually done the lessons.",
        'I upgraded from clueless to slightly less clueless.',
        "This board's seen one loss of mine already. Might see two.",
        'Whatever happens, this one counts more than the first.',
      ],
      // Malo manje nasumicnosti nego Day 14 default (0.8) - "malo ostriji"
      // Pawny. Relativno podesavanje, NE verifikovana 150-350 rtg kalibracija
      // (nema formule koja to povezuje).
      pawnyRandomMoveChance: 0.65,
    },
  ],
  endScreenButtons: [
    { label: 'Play again', action: 'repeat' },
    { label: 'Done', action: 'done' },
    { label: 'Game Review', action: 'review' },
  ],
};

const DAY_19_PAWN_PROMOTION: Lesson = {
  id: 'l1-d19-pawn-promotion',
  level: 1,
  day: 19,
  title: 'Pawn Promotion',
  // 4 tematski odvojena primera (dve trke, dve odbrane) - jedna greska na
  // bilo kom od njih ne sme da oboji i ostala tri (vidi
  // Lesson.flatProgressSegments).
  flatProgressSegments: true,
  piece: {
    name: 'pawn promotion',
    glyph: '♟',
    movement: 'static',
    bannerText: 'Pawn Promotion',
  },
  // Tiket nema poseban onboarding popup za ovu lekciju (za razliku od Day16/18) -
  // ovaj uvodni tekst sam napisala, standardan jedan ekran, "Let's start".
  intro: {
    title: 'Pawn Promotion',
    text: 'A pawn that reaches the last rank **becomes a queen**. Racing to promote, or **stopping the other side** from doing it, decides plenty of endgames. Two racing drills, two defending.',
  },
  steps: [
    {
      id: 'example1-white-races',
      kind: 'puzzle',
      fen: '8/6kp/8/8/P7/8/K7/8 b - - 0 1',
      orientation: 'w',
      // 1...h5 (crno, auto) pa naizmenicno belo(user)/crno(auto) - crni UVEK
      // gura h-pesaka, nema engine/random logike za protivnika.
      solution: [
        'h7h5', // 1...h5 (auto)
        'a4a5', // 2.a5
        'h5h4', // 2...h4 (auto)
        'a5a6', // 3.a6
        'h4h3', // 3...h3 (auto)
        'a6a7', // 4.a7
        'h3h2', // 4...h2 (auto)
        'a7a8q', // 5.a8=Q
        'h2h1q', // 5...h1=Q (auto)
        'a8h1', // 6.Qxh1
      ],
      prompt: 'White to move: win the race',
      introText: 'This looks like a real race. Who gets a queen first? **Move fast**.',
      doneText: 'You got there first. **Queen takes queen**, race won.',
      hintText: "You have to be **fast** with your pawn. That's the only real way through.",
      // Samo dama je tacna ovde - top/lovac/skakac bi usporili/promenili
      // ishod trke, ne samo "drugi ukus" kao kod Pawn lekcije.
      requireExactPromotion: true,
    },
    {
      id: 'example2-black-races',
      kind: 'puzzle',
      fen: '8/k7/p7/8/8/7P/7K/8 b - - 0 1',
      orientation: 'b',
      // Crno (user) na potezu prvo - belo UVEK gura h-pesaka, auto.
      solution: [
        'a6a5', // 1...a5
        'h3h4', // 2.h4
        'a5a4', // 2...a4
        'h4h5', // 3.h5
        'a4a3', // 3...a3
        'h5h6', // 4.h6
        'a3a2', // 4...a2
        'h6h7', // 5.h7
        'a2a1q', // 5...a1=Q
        'h7h8q', // 6.h8=Q
        'a1h8', // 6...Qxh8+
      ],
      prompt: 'Black to move: win the race',
      introText: 'Your turn to race. **Push and promote** before White does.',
      doneText: '**Queen takes queen**. You won the race.',
      hintText: 'This is a pawn race. **Whoever queens first wins**.',
      requireExactPromotion: true,
    },
    {
      id: 'example3-catch-the-pawn-black',
      kind: 'puzzle',
      fen: '8/8/p7/3k4/7P/8/8/3K4 b - - 0 1',
      orientation: 'b',
      // Crno (user) na potezu prvo, NE autoplay belog poteza - FEN se
      // koristi tacno kakav je. Belo UVEK gura h-pesaka (auto), dok ga
      // crni kralj ne uhvati.
      //
      // Tiket je dao VISE "ispravnih" polja po koraku (npr. Ke4/Ke5/Ke6 na
      // 1. potezu) - chess.js provera je pokazala da te tabele nisu
      // medjusobno konzistentne (npr. f7 sa table za 2. korak NIJE legalan
      // potez sa e5, polja iz 1. koraka na kom ta tabela za 2. korak
      // ocigledno racuna). Glavna linija ide preko Ke5-Kf6-Kg6-Kxh7; sve
      // dodatne grane su chess.js-verifikovane i takodje hvataju pesaka:
      // Ke6 (1. potez, umesto Ke5), i sa oba (Ke5 ILI Ke6) kao 2. potez -
      // Kf6 (glavni), Kf7 ili Kg8 (samo posle Ke6) ili Kf5 (samo posle Ke5,
      // ali OBAVEZNO nastavlja f5-g6 direktno, NE f5-f6 - ta putanja kasni
      // tacno jedan tempo i NE hvata pesaka, provereno). Kf6/Kf5/Kf7 grane se
      // spajaju na g6 i hvataju na h7 (g6h7); Kg8 grana ide direktno na h7
      // SVOJIM putem (posle 4.h7+ sah, Kxh7 sa g8 - vidi altMoves[6]), ne
      // prolazi kroz g6. Ke4 namerno NIJE dodat (tiket to eksplicitno
      // ostavlja "your call", nisam nezavisno proverila tu granu) - javi ako
      // i njega treba.
      solution: [
        'd5e5', // 1...Ke5 (ili Ke6, vidi altMoves[0])
        'h4h5', // 2.h5
        'e5f6', // 2...Kf6 (ili e6f6/e5f5/e6f7, vidi altMoves[2])
        'h5h6', // 3.h6
        'f6g6', // 3...Kg6 (ili f5g6/f7g6/f7g8, vidi altMoves[4])
        'h6h7', // 4.h7
        'g6h7', // 4...Kxh7 (ili g8h7 ako je 3...Kg8, vidi altMoves[6])
      ],
      altMoves: {
        0: ['d5e6'],
        2: ['e6f6', 'e5f5', 'e6f7'],
        4: ['f5g6', 'f7g6', 'f7g8'],
        6: ['g8h7'],
      },
      prompt: 'Black to move: catch the pawn',
      introText:
        "Stop. Don't just push blindly. Check if your king can **catch the pawn** first. Time to practice stopping a promotion.",
      doneText:
        "You caught it. **That's a draw**. Your own pawn can't queen either, for the same reason.",
      hintText: "That doesn't keep you in the race. Try a square **closer to the pawn's path**.",
    },
    {
      id: 'example4-catch-the-pawn-white',
      kind: 'puzzle',
      fen: '8/k7/8/p7/8/4K3/8/8 w - - 0 1',
      orientation: 'w',
      // Belo (user) na potezu prvo. Crno UVEK gura a-pesaka (auto, nikad
      // nista drugo). Za razliku od Example 3 (gde su grane dodavane rucno,
      // jedna po jedna), ovde je ceo niz POTPUNO resen unapred - pomocni
      // node skript (ne engine eval, nego tacna retrogradna pretraga svih
      // belih kraljevih poteza na svakom dosegljivom cvoru, do kraja - king+
      // pawn vs king je dovoljno mala pozicija da se potpuno resi, pouzdanije
      // od oslanjanja na engine-ovu "0.00" procenu) ispisao SVAKI beli potez
      // na SVAKOM dosegljivom cvoru koji i dalje garantuje hvatanje pesaka.
      // Glavna linija ide preko Kd3-c3-b3xa2; sve grane dole su deo tog istog
      // potpunog resenja, ne naknadno dodavane.
      solution: [
        'e3d3', // 1.Kd3 (ili Kd4/Kd2, vidi altMoves[0])
        'a5a4', // 1...a4
        'd3c3', // 2.Kc3 (ili Kc4/Kc2/Kc1 u zavisnosti od 1. poteza, altMoves[2])
        'a4a3', // 2...a3
        'c3b3', // 3.Kb3 (ili Kb1 u zavisnosti od 2. poteza, altMoves[4])
        'a3a2', // 3...a2
        'b3a2', // 4.Kxa2 (ili Kb1xa2, altMoves[6])
      ],
      altMoves: {
        0: ['e3d4', 'e3d2'],
        2: [
          // iz Kd4 grane
          'd4c3',
          'd4c4',
          // iz Kd2 grane
          'd2c3',
          'd2c1',
          'd2c2',
          // iz Kd3 (glavne) grane, dodatne opcije pored vec glavnog d3c3
          'd3c4',
          'd3c2',
        ],
        4: [
          'c4b3', // iz Kc4 (bilo koja grana koja tu stigne)
          'c1b1', // iz Kc1 (samo preko Kd2)
          'c2b3', // iz Kc2
          'c2b1', // iz Kc2, druga opcija
        ],
        6: ['b1a2'], // hvatanje sa b1 umesto b3
      },
      prompt: 'White to move: catch the pawn',
      introText: 'Same idea, your turn to defend. **Catch the pawn** before it queens.',
      doneText: 'Pawn caught. You **stopped the promotion**.',
      hintText: "That doesn't get you **closer to the pawn**. Think again.",
      celebrate: true,
    },
  ],
  endScreenTitle: 'You are Pawn Promotion Master!',
  endScreenButtons: [
    { label: 'Repeat lesson', action: 'repeat' },
    { label: 'Done', action: 'done' },
    { label: 'Play', action: 'play' },
  ],
};

const DAY_20_DELIVER_MATE: Lesson = {
  id: 'l1-d20-deliver-mate',
  level: 1,
  day: 20,
  title: 'Deliver Mate',
  piece: {
    name: 'checkmate',
    glyph: '♛',
    movement: 'static',
    bannerText: 'Deliver Mate',
  },
  intro: {
    title: 'Time to deliver mate',
    text: "You know how to promote a pawn. Now finish the game. Race to a **queen** first, then **checkmate** the lone king with it. Stuck? Hint's got you.",
  },
  introSteps: [
    {
      text: "You know how to promote a pawn. Now finish the game. Race to a **queen** first, then **checkmate** the lone king with it. Stuck? Hint's got you.",
      buttonText: "Let's Start",
    },
  ],
  steps: [
    {
      id: 'phase1-pawn-race',
      kind: 'puzzle',
      fen: '8/p7/1k6/6K1/8/8/7P/8 w - - 0 1',
      orientation: 'w',
      // Isti princip kao Day 19 trke - samo guranje pesaka je tacno, crni
      // UVEK gura a-pesaka (auto). Samo dama je tacna promocija (isti razlog
      // kao Day 19 - u trci je bilo koja druga figura stvarno pogresan izbor).
      solution: [
        'h2h4', // 1.h4
        'a7a5', // 1...a5 (auto)
        'h4h5', // 2.h5
        'a5a4', // 2...a4 (auto)
        'h5h6', // 3.h6
        'a4a3', // 3...a3 (auto)
        'h6h7', // 4.h7
        'a3a2', // 4...a2 (auto)
        'h7h8q', // 5.h8=Q
        'a2a1q', // 5...a1=Q (auto)
        'h8a1', // 6.Qxa1
      ],
      requireExactPromotion: true,
      moveExplanations: {
        8: "Take it. **Queen for queen**, and you're up a whole board.",
      },
      prompt: 'White to move: win the race',
      introText: 'Same idea as before. First queen wins the tempo. **Push**.',
      doneText: "Now finish it. **Corner the king**. Hint's there if you want it.",
      hintText: "**Push the pawn**. That's the only way to win this race.",
      // Korisnik treba vremena da pročita prelaznu poruku pre nego sto
      // klikne dalje u Phase 2 - vazna prekretnica, ne rutinski kraj koraka.
      noAutoAdvance: true,
      // Dugme koje prelazi u Phase 2 doslovno kaze "Start" (tiket: "U chatu
      // se pojavljuje dugme Start") - ovde je to isto dugme koje ucitava
      // sledeci korak (Phase 2 FEN se NASTAVLJA tacno odavde), ne posebna
      // in-chat komponenta - identican efekat (klik POKRECE Phase 2 i
      // TRENUTNO aktivira engine, jer je crni odmah na potezu).
      nextButtonText: 'Start',
    },
    {
      id: 'phase2-free-mate',
      kind: 'freePlay',
      // Nastavak TACNO odatle gde se Phase 1 zavrsio (posle 6.Qxa1) -
      // verifikovano chess.js (nije sah, 5 legalnih poteza za crnog, nije pat).
      fen: '8/8/1k6/6K1/8/8/8/Q7 b - - 0 6',
      orientation: 'w',
      solution: [],
      strongOpponent: true,
      liveHint: true,
      hintTechnique: 'queenBoxMethod',
      requireCheckmate: true,
      stalemateText:
        "That's stalemate. No check, yet your opponent has no legal move left. Not a win, it's a draw, not what we want. Try again.",
      techniqueTips: [
        'Cut down the squares the king can reach.',
        "You don't need checks to mate with a queen. Cut the king's lines first. The checkmate comes last.",
        "The queen can't mate alone. Box the king in, then bring your own king up.",
        'Remember the kiss of death? Queen right next to the king, guarded by yours.',
        "Watch for stalemate. No check, yet zero legal moves isn't a win.",
        'Push the king to the edge. Corners are fastest.',
        "Give the king a knight's move of space, no more. That's the box.",
        'Every move, ask yourself what square you just took away.',
        "Don't rush the queen in alone. Bring your king up before you close the box.",
        'The edge is the target. A king in the center has too many exits.',
        'Check that square before you play it. Some queen moves let the king slip back out.',
        'Two pieces beat one. Let your king do some of the work too.',
      ],
      prompt: 'Checkmate with Queen + King',
      introText: 'One queen and your king are enough. **Box him in**.',
      doneText: "Checkmate. Queen and king, that's **all it took**.",
      hintText: '',
    },
  ],
  endScreenTitle: 'Congrats! You just delivered a checkmate!',
  endScreenButtons: [
    { label: 'Repeat lesson', action: 'repeat' },
    { label: 'Done', action: 'done' },
    { label: 'Play', action: 'play' },
  ],
};

export const LESSON_DATABASE: Lesson[] = [
  DAY_1_ROOK,
  DAY_2_BISHOP,
  DAY_3_KING,
  DAY_4_KNIGHT,
  DAY_5_QUEEN,
  DAY_6_PAWN,
  DAY_7_HISTORY,
  DAY_8_PIECE_VALUES,
  DAY_9_CHECKMATE_VS_STALEMATE,
  DAY_10_CHECKMATE_PATTERNS,
  DAY_11_MEET_THE_BOARD,
  DAY_12_CHECKMATE_WITH_QUEEN,
  DAY_13_OPENINGS,
  DAY_14_FIRST_GAME,
  DAY_15_CASTLING_RULES,
  DAY_16_PUZZLE_TIME,
  DAY_17_TWO_ROOKS_CHECKMATE,
  DAY_18_SECOND_GAME,
  DAY_19_PAWN_PROMOTION,
  DAY_20_DELIVER_MATE,
];

export const DEFAULT_LESSON_ID = DAY_1_ROOK.id;

export function findLesson(lessonId: string): Lesson | null {
  return LESSON_DATABASE.find((l) => l.id === lessonId) ?? null;
}

export function findLessonStep(
  lessonId: string,
  stepIndex: number
): LessonStep | null {
  return findLesson(lessonId)?.steps[stepIndex] ?? null;
}

/** Id sledece lekcije u nizu (npr. Rook -> Bishop), ili null ako je poslednja. */
export function getNextLessonId(currentLessonId: string): string | null {
  const idx = LESSON_DATABASE.findIndex((l) => l.id === currentLessonId);
  if (idx === -1 || idx === LESSON_DATABASE.length - 1) return null;
  return LESSON_DATABASE[idx + 1].id;
}
