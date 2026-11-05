import { ChessColor, ChessFEN } from '@xmatter/util-kit';
// Day 28 "My First Opening with White - London" - potezi (UCI) se citaju
// odavde (LearnAi-jeva baza otvaranja, jedini izvor istine za "London
// System" liniju), NE prekucavaju se rucno - vidi DAY_28_FIRST_OPENING ispod.
// Prozni opisi po potezu su ipak NASI, ne kopirani iz te baze - njeni
// komentari idu uz NJEN moves-indeks koji ne mapira 1:1 na nas
// moveExplanations mehanizam (koji okida samo posle KORISNIKOVOG - belog -
// poteza, posle automatskog crnog odgovora), pa su prepisani/verifikovani
// rucno da tacno opisuju poziciju u tom trenutku.
import { OPENING_DATABASE } from '../LearnAi/openingDatabase';

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

/**
 * Korisnikov potez koji nije skriptovan na JEDNO ocekivano polje - bilo koji
 * legalan potez koji daje SAH se prihvata (npr. Day 26 "Perpetual Check" -
 * "koji god sah da se da u redu je"). Koristi se u `solution` na KORISNIKOVIM
 * indeksima (par sa ANY_LEGAL_REPLY na protivnikovim), umesto fiksnog UCI-ja.
 * Vidi LessonStep.requireLegalCheck.
 */
export const ANY_LEGAL_CHECK = '+';

/**
 * Korisnikov potez kralja (npr. 'K>c7'): prihvata se BILO KOJI legalan korak
 * kralja koji ga priblizava polju posle '>', osim poteza koji daje pat.
 * Hint pokazuje jedan takav potez. Day 20 Phase 2.
 */
export const KING_APPROACH = 'K>';

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
  /** Poruka na pat - uz `requireCheckmate`, ili za KING_APPROACH potez koji daje pat. */
  stalemateText?: string;
  /** KING_APPROACH korak: poruka kad kralj ne ide ka cilju. */
  kingApproachWrongText?: string;
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
  /** moveHighlights ostaju i posle protivnikovog odgovora, do sledeceg poteza (Day 20). */
  keepMoveHighlights?: boolean;
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
  /** Fiksna poruka kad je pogresan potez uzimanje (npr. pogresan pesak u "skupi pesake"). */
  wrongCaptureText?: string;
  /** Nelegalan potez se ne racuna kao greska - samo ova poruka u chatu (Day 28/29). */
  illegalMoveText?: string;
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
  /**
   * Samo kind:'puzzle' (npr. Day 26 "Perpetual Check") - korisnikovi indeksi
   * u `solution` su ANY_LEGAL_CHECK (ne fiksan UCI): potez je tacan SAMO ako
   * (1) daje sah I (2) je "bezbedan" - PROVERENO (isSafeCheckMove u
   * lessonEngine.ts, pravi minimax, ne samo "da li je sah") da i dalje vodi
   * ka remiju bez obzira koje legalno bekstvo kralj kasnije odabere. Legalan
   * sah koji NIJE bezbedan (npr. gura damu na polje odakle kralj moze da
   * pobegne u poziciju bez daljeg saha, ili gde dama postaje hvatljiva) NIJE
   * tacan ovde - korisnicin eksplicitan zahtev, "ne sahiramo na najgluplja
   * moguca polja". Vidi `unsafeCheckText` za poruku u tom slucaju.
   * Protivnikovi indeksi ostaju ANY_LEGAL_REPLY (engine bira bilo koji
   * legalan potez - obicno jedini legalan je da kralj pobegne, pozicija je
   * tako postavljena). Hint ovde ide kroz ISTI standardni dvostepeni sistem
   * kao svuda drugde (1. klik oznaci damu, 2./poslednji klik doda strelicu)
   * - "figura" (dama) se trazi na trenutnoj tabli na 1. klik (jeftino), ali
   * STVARAN potez na 2. klik mora biti UZIVO izracunat (findSafeCheckMove,
   * lokalan minimax, ne Stockfish) jer se tacna "bezbedna" sledeca sah-polja
   * menjaju zavisno od toga gde je kralj STVARNO pobegao. Generican
   * mehanizam, ne Day26-specifican.
   */
  requireLegalCheck?: boolean;
  /**
   * Samo uz `requireLegalCheck` - poruka kad je korisnikov potez TEHNICKI
   * sah (legalan, daje sah), ali NIJE deo bezbedne strategije (vidi gore) -
   * razlicita od standardnog `hintText` (koji je za poteze koji uopste NISU
   * sah). Crveni X se prikazuje u oba slucaja (isti standardni pogresan-potez
   * vizuelni jezik), samo je poruka druga.
   */
  unsafeCheckText?: string;
  /**
   * Potez koji NIJE step.solution[indeks] (ne prolazi korak dalje), ali je
   * PREPOZNAT kao svoja sopstvena kategorija vredna POSEBNE poruke, razlicite
   * od generickog `hintText` - npr. Day 21 "Opposition": kad se trazi
   * paralelna opozicija a korisnik odigra dijagonalnu (JESTE opozicija, samo
   * pogresna vrsta), ili potez koji ne spada u ono sto lekcija uci ali je
   * (provereno) objektivno i dalje dobijajuci (ne zelimo da mu kazemo da je
   * partija izgubljena kad nije). Kljuc je indeks u `solution` nizu (isto kao
   * `altMoves`), vrednost niz prepoznatih poteza + njihova poruka. Potez se
   * NE primenjuje (isto ponasanje kao standardan pogresan potez - crveni X,
   * zvuk, hint tacke za pravu figuru - samo je poruka druga, salje se TACNO
   * kako je napisana, bez variranja). Generican mehanizam, nije Day21-specifican.
   */
  otherTypeMoves?: Record<number, { uci: string; message: string }[]>;
  /** Kviz odgovori (samo kind:'quiz') - obicno 4 teksta (Yes/No kviz moze imati 2), prikazuju se kao dugmad. */
  quizOptions?: string[];
  /** Indeks tacnog odgovora u quizOptions (0-3), samo kind:'quiz'. Ignorise se kad je zadato `quizMultiSelect`. */
  quizCorrectIndex?: number;
  /**
   * Samo kind:'quiz' (Day 31 "Graduation Test 2" Q2/Q3) - umesto jednog
   * tacnog odgovora, korisnik BIRA TACNO `quizCorrectIndices.length` opcija
   * (dugmad se TOGGLE-uju, ne zakljucavaju na prvi klik) - cim je taj broj
   * izabran, automatski se ocenjuje: TACNO samo ako izabrani skup TACNO
   * odgovara `quizCorrectIndices` (sve-ili-nista, nema delimicnih poena).
   * Jedan pokusaj, bez retry-ja (isto kao standardan kviz). Generican
   * mehanizam.
   */
  quizMultiSelect?: boolean;
  /** Samo uz `quizMultiSelect` - indeksi SVIH tacnih opcija (npr. [0,1] za "biraju se 2"). */
  quizCorrectIndices?: number[];
  /**
   * Samo kind:'quiz' (Day 31 Q14) - netacan odgovor NE zavrsava korak (kao
   * `quizRetryOnWrong`), ALI umesto binarnog ishoda, svaki netacan pokusaj
   * oduzima poene (isti princip kao `anyLegalMoveStreak`/`exactMoveUci` -
   * vidi scoreDeduction, floor 0.25) i automatski prikazuje "crosshair"
   * strelice (fajl + red do tacnog polja, citano iz zavrsetka tacne
   * quizOptions opcije, npr. 'g5') da korisnik vidi KAKO se koordinata cita.
   * Samo za lekcije sa `Lesson.graduationTest`. Generican mehanizam.
   */
  quizScoredRetry?: boolean;
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
   * Umesto FIKSNOG `quizExplanation` na TACAN odgovor, bira NASUMICAN tekst
   * iz ovog fonda (isti princip kao pickVariedMessage - ne ponavlja
   * poslednji poslati) - npr. Day 23 "Bridge" kviz: "That's it."/"Right."/
   * "That's the one.", generican fond za svih 10 pitanja, ne fiksna poruka
   * po pitanju. Ako je zadato, ima prednost nad `quizExplanation`.
   */
  quizCorrectFeedbackPool?: string[];
  /**
   * Umesto autorovanog `quizExplanationWrong`, automatski generise "Not
   * quite. The right answer: {tacan odgovor}." gde je {tacan odgovor} TEKST
   * iz `quizOptions[quizCorrectIndex]` - npr. Day 23 "Bridge" kviz, gde je
   * ovo ISTA generička poruka za svih 10 pitanja, bez potrebe da se tacan
   * odgovor rucno prepisuje u svaku. Ignorise `quizExplanationWrong` kad je
   * zadato oba (ovo ima prednost).
   */
  quizShowCorrectAnswerOnWrong?: boolean;
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
   * Samo kind:'quiz' SA quizOptions i extraHintText - Hint dugme normalno
   * salje extraHintText SAMO JEDNOM po koraku (dalji klikovi ne radi nista,
   * npr. Day 9 Checkmate/Stalemate - hint tu otkriva resenje, nema smisla
   * dvaput). Kad je ovo true, isti generican extraHintText se salje na SVAKI
   * klik, bez ogranicenja (npr. Day 22 "Material" - hint je samo podsetnik na
   * vrednosti figura, ne otkriva odgovor, logicno da radi uvek). Generican
   * mehanizam, ne Day22-specifican.
   */
  unlimitedQuizHint?: boolean;
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
    /**
     * `fill` (opciono, podrazumevano false/outline) - puna obojena pozadina
     * polja umesto tankog 3px okvira (npr. Day 27 "Chess Notation" Part A -
     * outline se slabo video na praznoj tabli, korisnica trazila "puno
     * obojeno"). Isti vizuelni jezik kao LessonStep.highlightRookRanks (Day
     * 17), samo po polju umesto po celom redu. `dot` (opciono) dodaje i
     * nasu plavu tackicu na sredini (isti vizuelni jezik kao markSquares
     * korisnikova sopstvena oznaka) - jos jedan sloj kontrasta preko `fill`,
     * korisnica trazila kad ni sama puna boja nije bila dovoljno jasna.
     * Generican, ne Day27-specifican.
     */
    squares?: {
      square: string;
      color: string;
      fill?: boolean;
      dot?: boolean;
    }[];
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
   * Skracena verzija nextButtonText-a za mobilni, gde dugme stoji u istom
   * redu sa progress trakom (npr. 'London S.' umesto 'London System').
   * Bez nje mobilni prikazuje pun nextButtonText.
   */
  nextButtonTextMobile?: string;
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
   * Samo kind:'markSquares' - objasnjenje na PRVI (jos uvek otvoren) promasaj,
   * razlicito od `retryPromptText` (npr. Day 27 "Chess Notation" Part B -
   * "nadji i obelezi polje X"). I prvi i svaki sledeci netacan pokusaj
   * ODMAH zavrsava korak (korisnik mora moci da klikne Next, ne sme ostati
   * zakljucan dok ne pogodi) - ovo je samo tekst, ne gate na zavrsetak.
   * Bez ovoga pada nazad na `retryPromptText`.
   */
  firstMissText?: string;
  /** Rezervisano za buduce koriscenje (board highlight uz `firstMissText`) - trenutno se ne koristi, obelezavanje pogresnog polja ide kroz `wrongMarkedSquare` u DailyLessonActivity.tsx. */
  firstMissHighlight?: {
    arrows?: { from: string; to: string; color: string }[];
    squares?: { square: string; color: string }[];
  };
  /** markSquares u ocenjenom testu (Day 31 Q13) - tacan pokusaj donosi poen; jedan pokusaj kao svuda. */
  scoredMarkSquares?: boolean;
  /**
   * Iskljucuje ovaj korak iz brojanja na progress traci (Lesson.
   * flatProgressSegments) - za kratke "watch & learn" prelazne poruke
   * izmedju tematskih celina (npr. Day 27 "Chess Notation" - 4 uvodna/
   * prelazna chat-balona sa sopstvenim dugmetom, ne racunaju se u "16/16").
   * Generican mehanizam, ne Day27-specifican.
   */
  excludeFromProgress?: boolean;
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
   * Samo kind:'quiz' - na TACAN odgovor, sledeci korak se ucitava sam posle
   * kratke pauze, BEZ rucnog Next klika (npr. Day 30 "Graduation Checkpoint
   * 1" Part B - "immediate advance" na tacan odgovor). Na NETACAN odgovor
   * ovo se ne primenjuje - uvek ceka rucni Next (user treba vremena da
   * procita objasnjenje). Opt-in PO KORAKU - npr. Day 27 ga namerno ne
   * koristi nigde (korisnica tada trazila iskljucivo rucni Next kroz celu
   * tu lekciju). Generican mehanizam.
   */
  autoAdvanceOnCorrect?: boolean;
  /**
   * Samo kind:'quiz' (quizOptions) i kind:'markSquares' (Day 27 "Chess
   * Notation") - posle odgovora (tacnog ILI netacnog), slovo (file) i broj
   * (rank) tacnog polja ulete iz svoje linije/reda i sretnu se na tom polju,
   * da korisnik vizuelno nauci KAKO se koordinata cita. Ciljno polje se cita
   * iz `solution[0]` (markSquares) ili iz zavrsnog dela tacne quizOptions
   * stringa (kviz, regex `[a-h][1-8]$`) - vidi triggerRevealAnimation u
   * DailyLessonActivity.tsx. Generican mehanizam, ne Day27-specifican.
   */
  revealSquareAnimation?: boolean;
  /**
   * Samo kind:'quiz' (Day 27 "Chess Notation" Part C "napisi potez") - UCI
   * potez (npr. 'g1f3') koji se ODIGRA NA TABLI cim se korak ucita, pre bilo
   * kog odgovora - `fen` je POLAZNA pozicija (figura na polaznom polju), ne
   * gotova pozicija na odredistu. Korisnica trazila da vidi STVARAN potez
   * (npr. konj Ng1-f3), ne samo vec-odigranu poziciju. Generican mehanizam,
   * ne Day27-specifican - vidi beginStep u DailyLessonActivity.tsx.
   */
  playMoveOnLoad?: string;
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
  /**
   * Samo kind:'teach' (Day 30 "Graduation Checkpoint 1" Part A, Q1-5) -
   * "pokazi mi N legalnih poteza" umesto tacno odredjenog niza u `solution`.
   * Prihvata SVAKI sahovski legalan potez figure na `drillPieceSquare`
   * (chess.js provera na trenutnoj poziciji, ne poredjenje sa unapred
   * zapisanim potezom) - potez se stvarno odigra, figura nastavlja odatle
   * za sledeci pokusaj. Korak je gotov cim korisnik odigra OVOLIKO LEGALNIH
   * poteza UKUPNO - pogresan/ilegalan pokusaj NE resetuje ovaj brojac
   * (korisnica eksplicitno trazila "3 u totalu, cak i pored greske"), samo
   * kosta poene (vidi scoreDeduction). Nezavisno od `solution`, koji ovde
   * ostaje prazan placeholder (progress/isStepComplete mehanizam i dalje
   * racuna preko njegove duzine, vidi engine). Generican mehanizam.
   */
  anyLegalMoveStreak?: number;
  /**
   * Samo uz `anyLegalMoveStreak`/`exactMoveUci`/`raceSolution` - polazno
   * polje figure koja se testira. Potezi sa BILO KOG DRUGOG polja (npr.
   * dummy kralj dodat samo zbog FEN validacije) se TIHO ignorisu, ne broje
   * se niti kao tacni niti kao pogresni - nisu deo ovog zadatka.
   */
  drillPieceSquare?: string;
  /**
   * Samo kind:'teach' (Day 30 Q6/Q7, Day 31 Q5/Q6) - TACNO ODREDJEN potez
   * (UCI) zavrsava korak odmah; jedan string ili VISE prihvatljivih (npr.
   * Day 31 Q5 - Qa8# ILI Qg7#, oba su mat). Promocija se poredi TACNO
   * (movesMatch sa requireExactPromotion) kad UCI nosi peto slovo - Day 31
   * Q6 trazi bas damu, underpromocija se odbija. SVAKI drugi potez sa
   * `drillPieceSquare` (legalan ili ne) se tretira kao pogresan pokusaj -
   * isti penal kao kod `anyLegalMoveStreak`, ali korak se NE zavrsava dok se
   * ne odigra jedan od ovih poteza (streak koncept ne postoji ovde).
   */
  exactMoveUci?: string | string[];
  /**
   * Samo kind:'teach' (Day 30 Q8 "promotion race") - TACNA, unapred zadata
   * sekvenca poteza (UCI niz, npr. dvopoljni skok pa niz jednopoljnih
   * guranja do promocije). Svaki potez se poredi sa
   * `raceSolution[drillMovesPlayedRef.current]` (movesMatch, zahteva TACNU
   * promociju - obicno dama) - SVAKO odstupanje (spor prvi potez umesto
   * dvopoljnog skoka, pogresna figura pri promociji, bilo koji drugi potez)
   * se ODBIJA: ne primenjuje se, penal (vidi scoreDeduction), korisnik mora
   * da odigra TACNO taj potez da bi napredovao. Korisnicin eksplicitan
   * zahtev - prvobitna verzija ("bilo koji legalan potez, penal na kraju za
   * spori put") je bila previse popustljiva.
   */
  raceSolution?: string[];
  /**
   * Samo uz `anyLegalMoveStreak`/`exactMoveUci`/`raceSolution` - frakcioni
   * penal po pogresnom/ilegalnom pokusaju (Day 30 formula: 1.0 start, -0.25
   * po pokusaju, floor 0.25). Default 0.25 ako nije zadato.
   */
  scoreDeduction?: number;
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
   * standardnog jednog ekrana. `intro.title` ostaje fallback TITLE kad neki
   * ekran nema sopstveni `title` (vidi nize) - `intro.text` je isto fallback
   * TEXT (jednak prvom koraku) za bilo koji kod koji eventualno cita
   * `intro.text` direktno. Klik na dugme POSLEDNJEG koraka otvara tablu
   * (isto kao standardni "Let's start"). Generican, ne lekcija-specifican.
   */
  introSteps?: {
    text: string;
    buttonText: string;
    /**
     * Sopstveni naslov za OVAJ ekran (npr. Day 23 "Bridge" - 8 kartica, SVAKA
     * sa drugim naslovom: "Rule number 1", "Where chess began"...). Bez
     * ovoga pada nazad na `intro.title` (postojece ponasanje, nepromenjeno -
     * npr. Day 20/22, gde SVI ekrani deli isti naslov).
     */
    title?: string;
    /**
     * Isti bullet-lista mehanizam kao `preStepIntro.bullets` (npr. Day 23
     * kartica 3 "Quick refresher" - vrednosti figura, isti sadrzaj kao Day
     * 22). Bez ovoga, ekran prikazuje samo `text` (postojece ponasanje).
     */
    bullets?: string[];
  }[];
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
     * kao postojece "Home"/"Free Play" dugme u Puzzle aktivnosti. 'testOpening'
     * (Day 28 "My First Opening with White — London") - skace direktno na
     * Lesson.testStepId korak, resetujuci brojace (isti princip kao Repeat,
     * ali BEZ ponovnog vodjenog dela) - vidi onTestOpening u DailyLessonActivity.tsx.
     * 'nextLesson' (Day 30 "Graduation Checkpoint 1", "Start Test 2") - isti
     * prelazak kao podrazumevano "Next Lesson" dugme (sledeca lekcija po
     * `day` redosledu), samo sa svojim labelom ovde - onemogucen/sivo dok
     * sledeca lekcija ne postoji u bazi, isti princip kao podrazumevani tok.
     */
    action:
      | 'repeat'
      | 'done'
      | 'review'
      | 'play'
      | 'testOpening'
      | 'nextLesson'
      | 'placeholder';
    /** Samo za action:'placeholder' - objasnjava zasto je dugme neaktivno. */
    tooltip?: string;
  }[];
  /**
   * Samo uz endScreenButtons action:'testOpening' (Day 28) - ID koraka na
   * koji se skace (loadStep po indeksu nadjenom preko ovog ID-a), BEZ
   * ponovnog ucenja/vodjenja - "testiraj me opet" na istoj liniji.
   */
  testStepId?: string;
  /**
   * Zamenjuje standardni naslov "Lesson complete! 🎉" na zavrsnom popup-u
   * (npr. Day 14 "Your first game is complete!" - to JESTE partija, ne
   * lekcija). Kad nije zadato, ostaje podrazumevani naslov.
   */
  endScreenTitle?: string;
  /**
   * Zamenjuje podrazumevani Pawny avatar (`/pawny/pawny.webp`) u AI chat-u
   * (Conversation.tsx) kroz CELU lekciju - npr. Day 18 "Game 2" dobija novi,
   * "sigurniji" vizuel ("Pawny 2.0") umesto Day 14-ovog originala. Path pod
   * `public/`, isti format kao postojeci. Kad nije zadato, ostaje original.
   */
  pawnyAvatar?: string;
  /**
   * Indeks od kog se SVI sledeci koraci u `steps` nasumicno premestaju
   * (redosled), JEDNOM po pokretanju lekcije (i na svaki Repeat) - npr. Day
   * 22 "Material": 4 fiksna warm-up primera, pa 5 glavnih primera u random
   * redosledu, svaki tacno jednom. Koraci PRE ovog indeksa ostaju u
   * autorovanom redosledu. Generican mehanizam, ne Day22-specifican.
   */
  shuffleStepsFrom?: number;
  /**
   * "Bridge" lekcija bez sahovske table uopste (npr. Day 23 - istorija,
   * geometrija table, faze partije... + kviz, nista od toga ne treba
   * konkretnu poziciju). Standardni split-layout (tabla levo, chat/kviz
   * desno) postaje PUN-EKRAN kviz/chat kartica preko dekorativne, NE-
   * interaktivne pozadine (vidi DailyLessonActivity.tsx) - LessonStep.fen
   * i dalje mora postojati (tip to zahteva), ali se nikad stvarno ne
   * prikazuje kao tabla. Generican mehanizam, ne Day23-specifican.
   */
  boardless?: boolean;
  /**
   * Day 30 "Graduation Checkpoint 1" (i buduci "Test 2") - oznacava lekciju
   * kao OCENJEN test: svaki kind:'quiz' korak (tacan=1/netacno=0) i svaki
   * `anyLegalMoveStreak`/`exactMoveUci`/`raceSolution` korak (frakcioni
   * poeni) sabira se u lessonState.score. Zavrsni ekran, kad je ovo polje
   * zadato, IGNORISE standardni endScreenTitle/step.doneText/endScreenButtons
   * i umesto toga bira pass/fail varijantu po pragu - vidi
   * DailyLessonDialogContainer.tsx. Generican mehanizam, ne Day30-specifican.
   */
  graduationTest?: {
    /** Maksimalan mogu broj poena (zbir svih bodovanih koraka, npr. 16). */
    maxScore: number;
    /** Razlomak potreban za prolaz (0.6 = 60%). */
    passThreshold: number;
    passTitle: string;
    passBody: string;
    /** Akcioni red dugmadi SAMO za prolaz - npr. Done + "Start Test 2". */
    passButtons: { label: string; action: 'done' | 'nextLesson' | 'play' }[];
    failTitle: string;
    failBody: string;
    /** Akcioni red dugmadi SAMO za pad - npr. samo Repeat, bez Done. */
    failButtons: { label: string; action: 'repeat' }[];
    /**
     * Day 31 "Graduation Test 2" - ako je zadato, zamenjuje passTitle/
     * passBody/passButtons kad korisnik prodje OVAJ test I se na njega
     * stiglo preko "Next Lesson"/"Start Test X" dugmeta SA prethodno
     * polozenog `requiresPriorPassLessonId` (vidi onNextLesson - dodaje
     * `?fromLessonId=` u URL). NAPOMENA: ovo je lagana, URL-bazirana
     * provera (nema backend/cross-session cuvanje napretka u ovom repou,
     * vidi ranije ustanovljeno ogranicenje) - pouzdana za normalan tok
     * (klik kroz testove redom), ne i protiv namernog direktnog otvaranja
     * URL-a. Bez ove potvrde, prolaz i dalje prikazuje standardni passTitle/
     * passBody/passButtons (npr. "Test 2 passed"), ne finalni ekran.
     */
    finalScreen?: {
      requiresPriorPassLessonId: string;
      title: string;
      body: string;
      buttons: {
        label: string;
        action: 'done' | 'nextLesson' | 'play' | 'repeat';
      }[];
    };
  };
};

const DAY_1_ROOK: Lesson = {
  id: 'l1-d1-rook',
  level: 1,
  day: 1,
  title: 'Rook: How the Rook Moves',
  piece: { name: 'rook', glyph: '♜', movement: 'straight' },
  intro: {
    title: 'Rook: How the Rook Moves',
    text: 'The rook moves in **straight lines**: left, right, up and down. As far as it likes. It can **never jump** over another piece.',
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
        'Your rook is on a4. Slide it **sideways** and capture every pawn on the row.',
      successText: 'Good. **Keep going.**',
      doneText: 'All pawns gone. The rook owns the **whole row**.',
      hintText: 'The rook moves **straight only**: left, right, up or down.',
    },
    {
      id: 'teach-vertical',
      kind: 'teach',
      fen: '7k/3p4/3p4/8/8/8/8/3R3K w - - 0 1',
      orientation: 'w',
      solution: ['d1d6', 'd6d7'],
      prompt: 'Now capture going up the board',
      introText:
        'Same rook, new direction. Climb the **d-file** and take both pawns.',
      successText: "That's it. **One more.**",
      doneText: 'The rook goes **up and down** too.',
      hintText: "The rook can't jump. Take the **closest pawn** first.",
    },
    {
      id: 'teach-mixed',
      kind: 'teach',
      fen: '7k/8/1p2p3/8/8/4p1p1/8/1R5K w - - 0 1',
      orientation: 'w',
      solution: ['b1b6', 'b6e6', 'e6e3', 'e3g3'],
      prompt: 'Mix it up: sideways, up and down',
      introText:
        'Four pawns this time. Use **both directions** to collect them all.',
      successText: 'Good. **Next pawn.**',
      doneText: 'Four for four. You move the rook in **every direction** now.',
      hintText:
        "Straight lines only. Find a pawn on the rook's **row or column**.",
    },
    {
      id: 'teach-mate',
      kind: 'teach',
      fen: '6k1/5ppp/8/8/8/8/5PPP/2R3K1 w - - 0 1',
      orientation: 'w',
      solution: ['c1c8'],
      prompt: "One move. It's checkmate. Find it.",
      introText:
        'The black king is trapped behind **its own pawns**. One rook move ends the game.',
      doneText:
        "Checkmate. 🎉 You know how the rook moves. That's a **real start**.",
      hintText:
        "The king can't breathe behind its own pawns. Take the **back rank**.",
      celebrate: true,
    },
    {
      id: 'puzzle-1',
      kind: 'puzzle',
      fen: 'r1b3k1/5ppb/pn5p/1p6/5N2/P5P1/1PP3BP/2KR4 w - - 0 1',
      orientation: 'w',
      solution: ['d1d8'],
      prompt: 'White to play: mate in 1',
      introText: 'Same idea as before. The **back rank** is wide open.',
      doneText: 'Checkmate. **One down.**',
      hintText: 'Look at the open **d-file** and the black back rank.',
    },
    {
      id: 'puzzle-2',
      kind: 'puzzle',
      fen: 'r5k1/pp3p1p/2r3pB/5n2/8/P2R3P/1P3PP1/3R2K1 w - - 0 1',
      orientation: 'w',
      solution: ['d3d8', 'a8d8', 'd1d8'],
      prompt: 'White to play: mate in 2',
      introText:
        'You have two rooks on the d-file. **Give the first one away** to open the door.',
      successText: 'Now **finish it**.',
      doneText: 'A **rook sacrifice** into mate. Clean.',
      hintText: 'Sacrifice on **d8** first. The second rook delivers mate.',
    },
    {
      id: 'puzzle-3',
      kind: 'puzzle',
      fen: '4r1k1/pb3pp1/1pn1r2p/8/8/2B3P1/PP2NP1P/R3R1K1 b - - 0 1',
      orientation: 'b',
      solution: ['e6e2', 'e1e2', 'e8e2'],
      prompt: 'Black to play: win a piece',
      introText:
        'You are Black now. Both your rooks look down the e-file. **Count the attackers.**',
      successText: 'Good. Now **take it back**.',
      doneText: 'A **whole knight** up.',
      hintText: 'Stack your rooks on the e-file and take on **e2** twice.',
    },
    {
      id: 'puzzle-4',
      kind: 'puzzle',
      fen: 'r7/5pk1/8/1bR5/1P4p1/1BP3Pp/5P1P/6K1 b - - 0 1',
      orientation: 'b',
      solution: ['a8a1', 'b3d1', 'a1d1'],
      prompt: 'Black to play: mate in 2',
      introText:
        'The white king is stuck on the **back rank** and your pawn on h3 covers g2.',
      successText: 'He blocked. Now **take it**.',
      doneText: 'Checkmate. The **back rank** strikes again.',
      hintText: 'Bring your rook to the **first rank** with check.',
    },
    {
      id: 'puzzle-5',
      kind: 'puzzle',
      fen: '8/6k1/R7/8/5K2/8/8/1R6 w - - 0 1',
      orientation: 'w',
      solution: ['b1b7', ANY_LEGAL_REPLY, 'a6a8'],
      prompt: 'White to play: mate in 2',
      introText:
        'Two rooks, no king needed. Push the black king up **one rank at a time**.',
      successText: 'Now the **other rook** finishes it.',
      doneText:
        'That is a **ladder mate**. Five puzzles, five solved. The rook is yours.',
      hintText:
        'Check with one rook to push the king up, then **mate with the other**.',
      celebrate: true,
    },
  ],
};

const DAY_2_BISHOP: Lesson = {
  id: 'l1-d2-bishop',
  level: 1,
  day: 2,
  title: 'Bishop: How the Bishop Moves',
  piece: { name: 'bishop', glyph: '♝', movement: 'diagonal' },
  intro: {
    title: 'Bishop: How the Bishop Moves',
    text: 'The bishop moves **diagonally**, in all four corner directions. As far as it likes. It can **never jump** over another piece.',
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
        'Your bishop is on a1. Slide it along the **diagonal** and capture every pawn in its path.',
      successText: 'Good. **Keep going.**',
      doneText: 'All pawns gone. One **diagonal**, three captures.',
      hintText: 'The bishop moves **diagonally only**, like a slanted line.',
    },
    {
      id: 'teach-diagonal-up-left',
      kind: 'teach',
      fen: 'k7/8/2p5/8/8/5p2/8/K6B w - - 0 1',
      orientation: 'w',
      solution: ['h1f3', 'f3c6'],
      prompt: 'Now capture along the other diagonal',
      introText:
        'Same bishop, opposite corner. Climb the diagonal from **h1** and take both pawns.',
      successText: "That's it. **One more.**",
      doneText: 'The bishop goes diagonally in **every direction**.',
      hintText: "The bishop can't jump. Take the **closest pawn** first.",
    },
    {
      id: 'teach-mixed',
      kind: 'teach',
      fen: 'k7/8/4p3/8/8/1p5p/8/3B3K w - - 0 1',
      orientation: 'w',
      solution: ['d1b3', 'b3e6', 'e6h3'],
      prompt: 'Mix it up: zigzag across the diagonals',
      introText:
        'Three pawns, different directions. **Zigzag** across the board to collect them all.',
      successText: 'Good. **Next pawn.**',
      doneText:
        'Three for three. You move the bishop in **every direction** now.',
      hintText: 'Diagonals only. Find a pawn on one of the **four diagonals**.',
    },
    {
      id: 'teach-mate',
      kind: 'teach',
      fen: 'k7/ppK5/8/3B4/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['d5b7'],
      prompt: "One move. It's checkmate. Find it.",
      introText:
        'The black king is trapped in the corner by **its own pawns**. Your king cuts off the escape. One bishop move ends it.',
      doneText:
        "Checkmate. 🎉 You know how the bishop moves. That's a **real start**.",
      hintText: "The king can't breathe in the corner. **Take the pawn.**",
      celebrate: true,
    },
    {
      id: 'puzzle-1',
      kind: 'puzzle',
      fen: '6bk/p6p/1p6/8/3nB3/8/P6P/6BK w - - 0 1',
      orientation: 'w',
      solution: ['g1d4'],
      prompt: 'White to play: mate in 1',
      introText: 'Same idea as before. Find the **diagonal** into the knight.',
      doneText: 'Checkmate. **One down.**',
      hintText: 'Look at both bishops. One of them reaches **d4** with mate.',
    },
    {
      id: 'puzzle-2',
      kind: 'puzzle',
      fen: '6k1/6B1/6K1/8/8/7B/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['h3e6'],
      prompt: 'White to play: mate in 1',
      introText: 'Two bishops, one king with **nowhere to go**.',
      doneText: 'Checkmate. **Two down.**',
      hintText: 'The king on g8 is boxed in. Find the **check that ends it**.',
    },
    {
      id: 'puzzle-3',
      kind: 'puzzle',
      fen: 'r1bk2r1/2pp4/8/8/1PK5/P6P/1B4P1/4R3 w - - 0 1',
      orientation: 'w',
      solution: ['b2f6'],
      prompt: 'White to play: mate in 1',
      introText:
        'The bishop has a **long, clear diagonal** into the black camp.',
      doneText:
        'Checkmate. Three puzzles, three solved. The **bishop** is yours.',
      hintText: 'Follow the long diagonal all the way to **f6**.',
      celebrate: true,
    },
  ],
};

const DAY_3_KING: Lesson = {
  id: 'l1-d3-king',
  level: 1,
  day: 3,
  title: 'King: How the King Moves',
  piece: { name: 'king', glyph: '♚', movement: 'king' },
  intro: {
    title: 'King: How the King Moves',
    text: 'The King moves **one square** at a time, in any direction. Up, down, left, right or diagonal. It can **never move into danger**.',
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
        'Your King is on d4. Step **one square at a time** to capture the pawns to the right.',
      successText: 'Good. **Keep going.**',
      doneText: 'All pawns gone, **one step at a time**.',
      hintText:
        'The King moves only **one square** at a time. Follow the arrows.',
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
        'Same King, new directions. Step **forward**, then **sideways**. Either pawn first.',
      doneText:
        'The King walks forward and sideways. **One square, any direction.**',
      hintText:
        'The King moves only **one square** at a time. Follow the arrows.',
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
      prompt: 'Mix: all 8 directions',
      introText:
        'Now mix it up: diagonal, sideways and straight. Find the **fastest route** to all three pawns.',
      successText: 'Good. **Next pawn.**',
      doneText:
        'Three directions, three captures. The King goes **anywhere**, one step at a time.',
      hintText:
        'The King moves only **one square** at a time. Follow the arrows.',
    },
    {
      id: 'king-hunts-pawn',
      kind: 'puzzle',
      fen: '7k/8/8/3K4/7p/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['d5e4', 'h4h3', 'e4f3'],
      prompt: 'Stop the pawn',
      introText:
        'That pawn is about to promote. **Stop it with your King.** Two moves.',
      doneText: 'Your King **catches the pawn**.',
      hintText: 'Chase the pawn. Move your King **one square closer**.',
    },
    {
      id: 'castle-kingside',
      kind: 'teach',
      fen: '4k3/8/8/8/8/8/8/4K2R w K - 0 1',
      orientation: 'w',
      solution: ['e1g1'],
      prompt: 'Castle king-side',
      introText:
        'Small castling is a special king move 👑. The king moves **2 squares toward the rook**, then the rook jumps next to the king.',
      doneText:
        'That is **king-side castling**, or small castling. It keeps the king safe and brings the rook into the game faster.',
      hintText:
        "Move your King **two squares** toward the rook. That's castling.",
      preStepIntro: {
        title: "Let's learn castling",
        text: "Time to learn **castling**, the king's favorite move.",
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
        'Big castling works the same way, on the other side of the board. Grab the king and move it **two squares toward the rook**. King e1 to **c1**, rook a1 to **d1**. This is queen-side castling, or big castling.',
      doneText:
        'Both castles done. **King lesson complete.** See you tomorrow.',
      hintText: 'Move your King **two squares** toward the a1 rook.',
      celebrate: true,
      preStepIntro: {
        title: "Let's learn queen-side castling",
        text: 'This is **big castling**. Same idea, other side of the board.',
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
  title: 'Knight: How the Knight Moves',
  piece: { name: 'knight', glyph: '♞', movement: 'knight' },
  intro: {
    title: 'Knight: How the Knight Moves',
    text: "The Knight moves in an **L-shape**: 2 squares in one direction, then 1 to the side. It's the **only piece that can jump** over other pieces.",
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
        'Your Knight is on d4. Jump to each pawn. The L-shape can face **any of 8 directions**.',
      successText: "That's it. **Two squares, then one** to the side.",
      doneText:
        "Same **L-shape** every time. Two squares, then one. That's the Knight's signature.",
      hintText:
        'The Knight moves in an **L-shape**: two squares, then one to the side. Follow the arrows.',
    },
    {
      id: 'teach-jump-over',
      kind: 'teach',
      fen: '6k1/8/8/p2p4/1p2p3/3p4/1pp5/N5K1 w - - 0 1',
      orientation: 'w',
      solution: ['a1b3'],
      prompt: 'Find the safe square',
      introText:
        'Every square around the Knight looks blocked. Find the **safe square** anyway.',
      doneText:
        'The Knight ignores traffic. It **jumps over everything**. No other piece can.',
      hintText:
        'The Knight moves in an **L-shape**: two squares, then one to the side. Follow the arrows.',
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
        'Now the Knight zigzags. Every capture faces a **different direction**.',
      successText: "That's it. A **new direction** every jump.",
      doneText:
        'The Knight zigzags like no other piece. The L-shape works in **8 directions**.',
      hintText:
        'The Knight moves in an **L-shape**: two squares, then one to the side. Follow the arrows.',
    },
    {
      id: 'teach-knights-march',
      kind: 'teach',
      fen: '7k/3p4/5p2/2p5/8/1p6/8/N6K w - - 0 1',
      orientation: 'w',
      solution: ['a1b3', 'b3c5', 'c5d7', 'd7f6'],
      prompt: "The Knight's march",
      introText:
        'The Knight starts in the corner. Guide it **across the board**. Four captures.',
      successText: 'The Knight **keeps marching**.',
      doneText: "Corner to corner. 🐴 You've got the **L-shape** down.",
      hintText:
        'Follow the L: two squares then one, or **one then two**. Follow the arrows.',
    },
    {
      id: 'puzzle-warmup',
      kind: 'puzzle',
      fen: '7k/8/8/6p1/8/5N2/8/7K w - - 0 1',
      orientation: 'w',
      solution: ['f3g5'],
      prompt: 'Single capture: warm up',
      introText: 'Test time. **Take the pawn** with the Knight.',
      doneText: 'Got it. **Warm-up done.**',
      hintText:
        "That's not an **L-shape**. Follow the arrows to where the Knight can land.",
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
      introText: 'Two pawns this time. **Plan your route.**',
      successText: 'Good. **One more.**',
      doneText: 'Both pawns. **Route planned right.**',
      hintText:
        "That's not an **L-shape**. Follow the arrows to where the Knight can land.",
    },
    {
      id: 'puzzle-fork',
      kind: 'puzzle',
      fen: '8/8/3K1R2/8/8/2n5/8/7k b - - 0 1',
      orientation: 'b',
      solution: ['c3e4'],
      prompt: 'Find the fork',
      introText: 'One move. Find the **Knight fork**: one jump, two targets.',
      doneText:
        "King and Rook, both attacked. That's a **fork**. 🐴 Knight lesson done, see you tomorrow.",
      hintText:
        "That's not an **L-shape**. Follow the arrows to where the Knight can land.",
      celebrate: true,
    },
  ],
};

const DAY_5_QUEEN: Lesson = {
  id: 'l1-d5-queen',
  level: 1,
  day: 5,
  title: 'Queen: How the Queen Moves',
  piece: { name: 'queen', glyph: '♛', movement: 'queen' },
  intro: {
    title: 'Queen: How the Queen Moves',
    text: "The Queen is the **most powerful piece** on the board. She moves straight and diagonally, in all 8 directions, as far as she likes. She's the **Rook and Bishop combined**.",
  },
  steps: [
    {
      id: 'teach-straight',
      kind: 'teach',
      wrongCaptureText:
        'Wrong pawn. Capture them in an order that lets you take **every pawn in a row**, all the way to the end. Think again ;)',
      fen: 'k7/3p2p1/8/8/3Q4/1p4p1/8/7K w - - 0 1',
      orientation: 'w',
      solution: ['d4d7', 'd7g7', 'g7g3', 'g3b3'],
      prompt: 'Collect the pawns',
      introText: 'Every move must **capture a pawn**. Plan the route ahead.',
      successText: 'Straight line. **Good.**',
      doneText:
        "The Queen moves straight: left, right, up, down. **Like a Rook**, and that's only half of her.",
      hintText:
        'The Queen moves **straight or diagonally**. Every move must capture a pawn, so plan ahead.',
    },
    {
      id: 'teach-diagonal',
      kind: 'teach',
      wrongCaptureText:
        'Wrong pawn. Capture them in an order that lets you take **every pawn in a row**, all the way to the end. Think again ;)',
      fen: 'k7/5p2/6p1/3p4/4Q3/1p6/8/7K w - - 0 1',
      orientation: 'w',
      solution: ['e4d5', 'd5b3', 'b3f7', 'f7g6'],
      prompt: 'Collect the pawns diagonally',
      introText: 'Every move must **capture a pawn**. Plan the route ahead.',
      successText: 'Good. **Diagonal** power.',
      doneText:
        'The Queen also moves diagonally, **like a Bishop**. Queen = Rook + Bishop.',
      hintText:
        'The Queen moves **straight or diagonally**. Check the highlighted squares.',
    },
    {
      id: 'teach-mix',
      kind: 'teach',
      wrongCaptureText:
        'Wrong pawn. Capture them in an order that lets you take **every pawn in a row**, all the way to the end. Think again ;)',
      fen: 'k7/3p4/8/5p2/3Q4/1p3p2/8/7K w - - 0 1',
      orientation: 'w',
      solution: ['d4d7', 'd7f5', 'f5f3', 'f3b3'],
      prompt: 'Mix: every direction',
      introText: 'Every move must **capture a pawn**. Plan the route ahead.',
      successText: "Any direction. **That's the Queen.**",
      doneText:
        'Straight and diagonal, **every direction**. No piece does more.',
      hintText:
        'The Queen moves **straight or diagonally**. Check the highlighted squares.',
    },
    {
      id: 'teach-queens-reign',
      kind: 'teach',
      wrongCaptureText:
        'Wrong pawn. Capture them in an order that lets you take **every pawn in a row**, all the way to the end. Think again ;)',
      fen: 'k7/8/2p2p2/7p/8/5p2/2Q5/7K w - - 0 1',
      orientation: 'w',
      solution: ['c2c6', 'c6f6', 'f6f3', 'f3h5'],
      prompt: "The Queen's reign",
      introText:
        'The Queen starts in the corner. Guide her **across the board**. Every move must capture a pawn.',
      successText: 'Onward, **Your Majesty**.',
      doneText:
        "Up, down, sideways, diagonal. 👑 You've got the **most powerful piece** down.",
      hintText:
        'The Queen moves **straight or diagonally**. Follow the arrows.',
    },
    {
      id: 'puzzle-warmup',
      kind: 'puzzle',
      fen: '6k1/5ppp/7q/8/6Q1/6P1/5P1P/6K1 w - - 0 1',
      orientation: 'w',
      solution: ['g4c8'],
      prompt: 'Checkmate in one',
      introText:
        'Test time, real game. White to play and **checkmate in one**.',
      doneText: 'Checkmate. **Well spotted.**',
      hintText:
        "That's not a **Queen move**. Follow the arrows to where she can go.",
    },
    {
      id: 'puzzle-find-the-mate',
      kind: 'puzzle',
      // beli pesak na e3 zatvara Qf4-c1, pa su i Qe1# i Qa1# mat (chess.js)
      fen: '6k1/5pp1/8/q7/5Q1p/4P3/5PPP/6K1 b - - 0 1',
      orientation: 'b',
      solution: ['a5e1'],
      altMoves: { 0: ['a5a1'] },
      prompt: 'Find the checkmate',
      introText: 'Black to move. Find **mate in one** with the Queen.',
      doneText: 'Checkmate. The **Queen delivers**.',
      hintText:
        "That's not a **Queen move**. Follow the arrows to where she can go.",
    },
    {
      id: 'puzzle-queens-triumph',
      kind: 'puzzle',
      fen: '5rk1/1bp2pp1/1p2q2p/p2p4/P2Q4/1P6/2P2PPP/B4RK1 w - - 0 1',
      orientation: 'w',
      solution: ['d4g7'],
      prompt: "The Queen's triumph",
      introText:
        'This is a real game. White to play, **checkmate in one**. Yes, really.',
      doneText: 'Checkmate. 👑 **Queen lesson done.** See you tomorrow.',
      hintText:
        "That's not a **Queen move**. Follow the arrows to where she can go.",
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
    text: 'The Pawn is the **only piece that can never move backward**. It also has a few **secret rules**. Here they are.',
  },
  steps: [
    {
      id: 'move-one-square',
      kind: 'teach',
      fen: '7k/8/8/8/3P4/8/8/7K w - - 0 1',
      orientation: 'w',
      solution: ['d4d5'],
      prompt: 'Move the pawn forward',
      introText: "This pawn isn't on its starting square. Move it **forward**.",
      doneText: "Right. **One square forward** is the pawn's everyday move.",
      hintText:
        'Only **one square**. This pawn left its starting square, so the two-square bonus is gone.',
      preStepIntro: {
        title: 'Pawn Movement',
        text: "The Pawn moves **straight ahead**. There's a twist, depending on where it stands.",
        bullets: [
          'Normally, it moves just **one square** forward',
          'From its **starting square**, it gets a bonus: **one or two squares**, just this once',
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
      prompt: 'Use the bonus: jump two',
      introText: "This pawn hasn't moved yet. Jump it forward **two squares**.",
      doneText: 'Two squares at once. That bonus works **only once**.',
      hintText:
        'Jump **two squares**. This pawn is still on its starting square.',
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
        "Three pawns are stuck and can't move. Find the **free pawn** and move it.",
      doneText: 'One square or two, both work. You found the **free pawn**.',
      hintText:
        'This pawn is **blocked**: an enemy piece stands right in front of it. Try another pawn.',
    },
    {
      id: 'diagonal-capture',
      kind: 'teach',
      fen: '7k/8/2p5/3p4/2P5/8/8/7K w - - 0 1',
      orientation: 'w',
      solution: ['c4d5', 'd5c6'],
      prompt: 'Capture both pawns',
      introText: 'Capture **diagonally** right, then diagonally left.',
      successText: 'Good. Now capture diagonally to the **other side**.',
      successTextAlways: true,
      doneText:
        "Left and right, diagonally. That's the pawn's **only way to attack**.",
      hintText:
        "The Pawn can't capture straight ahead. It captures **diagonally**. Check the highlighted squares.",
      preStepIntro: {
        title: 'How the Pawn Captures',
        text: 'The Pawn moves straight, but **captures diagonally**.',
        bullets: [
          'It can capture **one square diagonally forward**, left or right',
          'It can **never** capture straight ahead',
          'No target, no diagonal move. It steps diagonally **only onto an enemy piece**',
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
        'A black pawn just jumped from h7 to h5. **Now or never**: only one of your pawns can capture it en passant. Which one?',
      doneText:
        "g5×h6. The pawn on h5 is gone and yours lands on h6. That's **en passant**, the strangest move in chess.",
      hintText:
        'This pawn is blocked. En passant only works for the pawn **right beside** the black pawn that just jumped.',
      preStepIntro: {
        title: 'En Passant: the Secret Capture',
        text: "The pawn's strangest rule: a **capture nobody expects**.",
        bullets: [
          'If an enemy pawn jumps **two squares** and lands right beside yours, you can capture it **as if it only moved one**',
          'You can only do this **immediately**, on your very next move',
          'Wait even one move and the chance is **gone forever**',
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
      prompt: 'Promote to a Queen',
      introText:
        'The pawn is one step from transforming. Move it to the **last rank** and choose a Queen.',
      doneText:
        'Pawn to Queen. ♟️→♛ From the **weakest piece to the strongest** in one move.',
      nonQueenPromotionText:
        "Good, that's a legal move. Still, the **Queen** is always the strongest choice. Promote to a Queen.",
      requireExactPromotion: true,
      hintText: 'The Pawn only moves forward. Get it to the **last rank**.',
      preStepIntro: {
        title: "Promotion: The Pawn's Transformation",
        text: 'When a pawn reaches the last rank, it **transforms** into a new piece.',
        bullets: [
          'You can choose: **Queen**, Rook, Bishop, or Knight',
          "⭐ Almost always choose the **Queen**. She's the most powerful",
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
        "Test time. Each puzzle checks one rule. This pawn isn't on e2. **How far** can it go?",
      doneText: 'Right. **One square.**',
      hintText:
        'This pawn is not on its starting square. The bonus only works from **e2 or e7**. From here, one square.',
    },
    {
      id: 'puzzle-capture',
      kind: 'puzzle',
      fen: '7k/8/8/8/3pp3/4P3/8/5K2 w - - 0 1',
      orientation: 'w',
      solution: ['e3d4'],
      prompt: 'Find the capture',
      introText:
        'This pawn is blocked straight ahead. It can still **capture diagonally**.',
      doneText: 'Diagonal capture. The **only way** a pawn attacks.',
      hintText:
        "The Pawn can't capture straight ahead. Capturing is **always diagonal**.",
    },
    {
      id: 'puzzle-en-passant',
      kind: 'puzzle',
      fen: '7k/4p3/3p4/3P4/8/8/5K2/8 b - - 0 1',
      orientation: 'w',
      solution: ['e7e5', 'd5e6'],
      prompt: 'En passant: now or never',
      introText:
        'The black pawn just jumped from e7 to e5. Your pawn on d5 is blocked. **En passant** is the only option.',
      doneText:
        'd5×e6. The black pawn disappears and yours lands behind it. **En passant**, caught in the act.',
      hintText:
        'd6 is blocked. Look at the black pawn on **e5**. It just jumped two squares.',
    },
    {
      id: 'puzzle-promotion',
      kind: 'puzzle',
      fen: '7k/3P4/8/8/8/8/8/5K2 w - - 0 1',
      orientation: 'w',
      solution: ['d7d8q'],
      prompt: 'One step from transformation',
      introText: 'The pawn is on d7, **one step** from becoming a Queen.',
      doneText: 'Promoted. ♟️ **Pawn lesson done.** See you tomorrow.',
      nonQueenPromotionText:
        "Good, that's a legal move. Still, the **Queen** is always the strongest choice. Promote to a Queen.",
      requireExactPromotion: true,
      hintText:
        'The Pawn only moves forward. Get it to the **last rank** and choose your piece.',
      celebrate: true,
    },
  ],
};

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1';

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
    text: "Chess has a little math in it. Simple math. Every piece has a **point value**, like a score, and you add them up. That tells you if a **trade is a good deal**. You guess each value, I tell you if you're right. 🎯",
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
        title: 'Chess mathematician',
        text: 'Nothing gets **past you**.',
      },
      {
        min: 7,
        title: 'Almost there',
        text: "A bit more practice and it's **perfect**.",
      },
      {
        min: 4,
        title: 'Good start',
        text: 'Check the **table** one more time and try again.',
      },
      {
        min: 0,
        title: 'Not yet',
        text: 'Piece values are easy to learn. Give it **another shot**.',
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
        'Start with the humblest piece: the **pawn**. ♟️ How much is one pawn worth?',
      quizOptions: ['1 point', '2 points', '3 points', '5 points'],
      quizCorrectIndex: 0,
      quizExplanation:
        'Correct. A pawn is worth **1 point**. Small, and you have 8 of them. Reach the other end and it **becomes a queen**. 👑',
      quizExplanationWrong:
        "The pawn is the weakest piece: **1 point**. Don't underestimate it. You have 8, and they can become queens. 👑",
      doneText: 'A pawn is worth **1 point**. Small, and there are 8 of them.',
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
        'The **knight**. 🐴 It jumps in an L-shape and leaps over pieces. How much is it worth?',
      quizOptions: ['1 point', '2 points', '3 points', '5 points'],
      quizCorrectIndex: 2,
      quizExplanation:
        "Correct. The knight is worth **3 points**. It's the only piece that **jumps over others**.",
      quizExplanationWrong:
        'The knight is worth **3 points**. More than a pawn, less than a rook or queen. Its secret weapon: it **jumps over others**. 🐴',
      doneText:
        "The knight is worth **3 points**, and it's the only piece that jumps.",
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
        'The **bishop**. ⚡ It slides along diagonals, fast and far. How much is it worth?',
      quizOptions: ['1 point', '3 points', '5 points', '7 points'],
      quizCorrectIndex: 1,
      quizExplanation:
        'Correct. The bishop is worth **3 points**, same as the knight. Same value, different style: the knight jumps, the bishop glides.',
      quizExplanationWrong:
        'The bishop is worth **3 points**, same as the knight. They are "value twins": same score, different moves.',
      doneText:
        'The bishop is worth **3 points**, same as the knight. The "value twins".',
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
        'The **rook**. 🏰 It controls entire rows and columns. How many points is it worth?',
      quizOptions: ['3 points', '4 points', '5 points', '7 points'],
      quizCorrectIndex: 2,
      quizExplanation:
        'Correct. The rook is worth **5 points**, more than a knight or bishop. Trade a knight for a rook and you **win the exchange**. ♜',
      quizExplanationWrong:
        'The rook is worth **5 points**, more than a knight or bishop. Getting a rook for one of them is called **winning the exchange**. ♜',
      doneText: 'The rook is worth **5 points**, more than a knight or bishop.',
      hintText: '',
    },
    {
      id: 'value-king',
      kind: 'quiz',
      fen: '7k/8/8/8/8/8/8/4K3 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'How much is the King worth?',
      introText: 'The **king**. 👑 How much is it worth?',
      quizOptions: [
        '5 points',
        '9 points',
        '10 points',
        "No price. It's worth everything",
      ],
      quizCorrectIndex: 3,
      quizExplanation:
        'Exactly. The king is **priceless**. ∞ Lose the king and you **lose the game**. It can never be traded. 👑',
      quizExplanationWrong:
        "The king has no point value. It's worth **∞**, because when the king falls, the **game is over**. It can fight, never be traded. 👑",
      doneText: 'The king is **priceless**. Lose it and you lose the game.',
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
        'Last one: the **queen**. ⭐ Any direction, any number of squares. How many points is she worth?',
      quizOptions: ['5 points', '7 points', '9 points', '12 points'],
      quizCorrectIndex: 2,
      quizExplanation:
        "Correct. 🎉 The queen is worth **9 points**. That's nine pawns, almost two rooks, or three knights. That's why everyone **guards the queen**.",
      quizExplanationWrong:
        'The queen is worth **9 points**, the most of any piece. Lose her and you **lose 9 points** at once. 🛡️',
      doneText: 'The queen is worth **9 points**, the most of any piece.',
      hintText: '',
    },
    {
      id: 'mixed1-white',
      kind: 'quiz',
      fen: '7k/8/8/3n1n2/8/4B3/4R3/7K w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: "Mixed Position 1: White's material",
      introText:
        'White has a rook and a bishop. Black has two knights. How many points does **white** have?',
      quizOptions: ['6 points', '7 points', '8 points', '9 points'],
      quizCorrectIndex: 2,
      quizExplanation:
        'Correct. Rook (5) + Bishop (3) = **8 points** for white. ✅ Now black.',
      quizExplanationWrong:
        "Rook = 5, Bishop = 3. Together that's **8 points**. Now black.",
      doneText: 'White has **8 points**: Rook (5) + Bishop (3).',
      hintText: '',
      preStepIntro: {
        title: 'Piece Values: Quick Recap',
        text: 'All values in one place. Next, the real challenge: **add it all up** on the board. 🧮',
        bullets: [
          '♟️ **Pawn**: 1 point',
          '🐴 **Knight**: 3 points',
          '⚡ **Bishop**: 3 points',
          '🏰 **Rook**: 5 points',
          '⭐ **Queen**: 9 points',
          '👑 **King**: ∞ (never traded)',
        ],
        buttonText: 'Ready',
      },
    },
    {
      id: 'mixed1-black',
      kind: 'quiz',
      fen: '7k/8/8/3n1n2/8/4B3/4R3/7K w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: "Mixed Position 1: Black's material",
      introText: "Black has **two knights**. What's the total?",
      quizOptions: ['3 points', '5 points', '6 points', '8 points'],
      quizCorrectIndex: 2,
      quizExplanation:
        'Correct. Knight (3) + Knight (3) = **6 points** for black. ✅ White 8, black 6.',
      quizExplanationWrong:
        'Knight + knight = 3 + 3 = **6 points** for black. White 8, black 6.',
      doneText: 'Black has **6 points**: Knight (3) + Knight (3).',
      hintText: '',
    },
    {
      id: 'mixed1-verdict',
      kind: 'quiz',
      fen: '7k/8/8/3n1n2/8/4B3/4R3/7K w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Mixed Position 1: Who is ahead?',
      introText: 'White has 8, black has 6. **Who is ahead?**',
      quizOptions: ['White is winning', 'Black is winning', "It's equal"],
      quizCorrectIndex: 0,
      quizExplanation:
        'Correct. 🎉 White is **2 points ahead**. That is called a **material advantage**. ♟️',
      quizExplanationWrong:
        'White 8, black 6. White is ahead by **2 points**: a material advantage. 🧮',
      doneText: 'White is ahead by 2 points: a **material advantage**.',
      hintText: '',
    },
    {
      id: 'mixed2-black',
      kind: 'quiz',
      fen: '7k/8/3r4/8/5b2/8/2Q5/7K w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: "Mixed Position 2: Black's material",
      introText:
        'Next position. 👀 White has a queen. Black has a rook and a bishop. How many points does **black** have?',
      quizOptions: ['6 points', '7 points', '8 points', '10 points'],
      quizCorrectIndex: 2,
      quizExplanation:
        'Correct. Rook (5) + Bishop (3) = **8 points** for black. ✅ Now white.',
      quizExplanationWrong:
        'Rook (5) + Bishop (3) = **8 points** for black. Now white.',
      doneText: 'Black has **8 points**: Rook (5) + Bishop (3).',
      hintText: '',
    },
    {
      id: 'mixed2-white',
      kind: 'quiz',
      fen: '7k/8/3r4/8/5b2/8/2Q5/7K w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: "Mixed Position 2: White's material",
      introText: 'White only has a **queen**. How much is that worth?',
      quizOptions: ['5 points', '7 points', '9 points', '12 points'],
      quizCorrectIndex: 2,
      quizExplanation:
        'Right. Queen = **9 points**. ✅ White 9, black 8. Close.',
      quizExplanationWrong: 'Queen = **9 points**. White 9, black 8. Close.',
      doneText: 'White has **9 points**, all in the queen.',
      hintText: '',
    },
    {
      id: 'mixed2-verdict',
      kind: 'quiz',
      fen: '7k/8/3r4/8/5b2/8/2Q5/7K w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Mixed Position 2: Who is ahead?',
      introText: 'White has 9, black has 8. **Who is ahead?**',
      quizOptions: [
        'White is winning',
        'Black is winning',
        "It's almost equal",
      ],
      quizCorrectIndex: 0,
      quizExplanation:
        'Correct. White is ahead by **1 point**. Small, and real. A queen outweighs a **rook + bishop**. 👑',
      quizExplanationWrong:
        'White 9, black 8. White is ahead, barely. Queen (9) > Rook + Bishop (8). **1 point** is still an advantage.',
      doneText:
        'White is ahead by **1 point**. A queen edges out a rook + bishop.',
      hintText: '',
    },
    {
      id: 'mixed3-white',
      kind: 'quiz',
      fen: '7k/1p6/8/8/4R3/8/2PP4/7K w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: "Mixed Position 3: White's material",
      introText:
        "Last position, now with pawns. Each pawn is **1 point**. 🎯 White has a rook and two pawns. What's the total?",
      quizOptions: ['5 points', '6 points', '7 points', '8 points'],
      quizCorrectIndex: 2,
      quizExplanation:
        'Correct. Rook (5) + Pawn (1) + Pawn (1) = **7 points**. ✅ Now black.',
      quizExplanationWrong:
        'Rook (5) + Pawn (1) + Pawn (1) = **7 points** for white. Now black.',
      doneText: 'White has **7 points**: Rook (5) + Pawn (1) + Pawn (1).',
      hintText: '',
    },
    {
      id: 'mixed3-black',
      kind: 'quiz',
      fen: '7k/1p6/8/8/4R3/8/2PP4/7K w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: "Mixed Position 3: Black's material",
      introText: 'Black only has **one pawn**. How much is that worth?',
      quizOptions: ['0 points', '1 point', '2 points', '3 points'],
      quizCorrectIndex: 1,
      quizExplanation: 'Correct. One pawn = **1 point**. ✅ White 7, black 1.',
      quizExplanationWrong: 'One pawn = **1 point**. White 7, black 1.',
      doneText: 'Black has just **1 point**, a single pawn.',
      hintText: '',
    },
    {
      id: 'mixed3-verdict',
      kind: 'quiz',
      fen: '7k/1p6/8/8/4R3/8/2PP4/7K w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Mixed Position 3: Who is ahead?',
      introText: 'White has 7, black has 1. **Who is ahead?**',
      quizOptions: [
        'White is winning by a lot',
        'Black is winning',
        "It's equal",
      ],
      quizCorrectIndex: 0,
      quizExplanation:
        'Correct. 🏆 White is **6 points** ahead. That is huge. In a real game, white almost always wins from here. The points tell you **who is ahead**, no guessing. 🧮',
      quizExplanationWrong:
        'White 7, black 1. White is winning **by a lot**: 6 points ahead. 🧮',
      doneText:
        "⭐ Piece values, done. Pawn = 1, Knight/Bishop = 3, Rook = 5, Queen = 9, King = ∞. Count both sides: more points means a **material advantage**. Chess isn't only math. **Position matters** too.",
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
    bannerText: 'Chess History Time',
  },
  intro: {
    title: 'The History of Chess',
    text: 'Meet the game itself. A few **facts from history**, then a quick **board challenge**.',
  },
  steps: [
    {
      id: 'quiz-origin',
      kind: 'quiz',
      quizDimBoard: true,
      fen: STARTING_FEN,
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Question 1: Origin of Chess',
      introText: 'Where did chess **originate**?',
      quizOptions: ['China', 'Persia', 'India', 'Egypt'],
      quizCorrectIndex: 2,
      quizExplanation:
        'Chess traces back to **India**, where a game called **Chaturanga** appeared around the 6th century, during the Gupta Empire. From India it spread to Persia, then to the Arab world and Europe.',
      doneText:
        'Chess traces back to **India**, around the 6th century, as a game called Chaturanga.',
      hintText: '',
    },
    {
      id: 'quiz-original-name',
      kind: 'quiz',
      quizDimBoard: true,
      fen: STARTING_FEN,
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Question 2: Original Name',
      introText: 'What was chess **originally called**?',
      quizOptions: ['Chaturanga', 'Vizier', 'Sultania', 'Shahinshah'],
      quizCorrectIndex: 0,
      quizExplanation:
        'In Sanskrit, "chaturanga" means **"four divisions of the army"**: infantry, cavalry, elephants and chariots. Those were the first four types of pieces. Through Persia it reached the Arabs as **"shatranj"**, because Arabic has no "ch" or "ng" sounds.',
      doneText:
        '"Chaturanga" means **"four divisions of the army"** in Sanskrit.',
      hintText: '',
    },
    {
      id: 'quiz-checkmate',
      kind: 'quiz',
      quizDimBoard: true,
      fen: STARTING_FEN,
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Question 3: What Checkmate Really Means',
      introText: 'What does **"checkmate"** actually mean?',
      quizOptions: [
        '"The king has escaped"',
        '"The king is trapped / has no way out"',
        '"The king is captured"',
        '"The king changes places"',
      ],
      quizCorrectIndex: 1,
      quizExplanation:
        'It comes from the Persian **"Shah Mat"**: "shah" means king, "mat" means helpless, **trapped, with no escape**. People later read it as "the king is dead". The accurate meaning is a king with no way out. That\'s why the king is never actually captured: the game ends the moment there\'s no escape.',
      doneText:
        '"Shah Mat" means the king is **trapped, with no escape**. That\'s checkmate.',
      hintText: '',
    },
    {
      id: 'quiz-squares',
      kind: 'quiz',
      quizDimBoard: true,
      fen: STARTING_FEN,
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Question 4: Number of Squares',
      introText: 'How many **squares** does a chessboard have?',
      quizOptions: ['32', '100', '64', '81'],
      quizCorrectIndex: 2,
      quizExplanation:
        'The board has 8 rows and 8 columns: 8×8 = **64 squares**, alternating light and dark.',
      doneText:
        'The board has 8×8 = **64 squares**, alternating light and dark.',
      hintText: '',
    },
    {
      id: 'quiz-pieces',
      kind: 'quiz',
      quizDimBoard: true,
      fen: STARTING_FEN,
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Question 5: Number of Pieces',
      introText: 'How many **pieces** does each player start with?',
      quizOptions: ['8', '12', '16', '20'],
      quizCorrectIndex: 2,
      quizExplanation:
        'Each player starts with 8 pawns and 8 other pieces (2 rooks, 2 knights, 2 bishops, a queen and a king): **16 in total**.',
      doneText: 'Each player starts with **16 pieces**: 8 pawns and 8 others.',
      hintText: '',
    },
    {
      id: 'quiz-four-players',
      kind: 'quiz',
      quizDimBoard: true,
      fen: STARTING_FEN,
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Question 6: Players in the Earliest Version',
      introText:
        'How many **players** took part when chess was first invented?',
      quizOptions: ['2', '3', '4', '6'],
      quizCorrectIndex: 2,
      quizExplanation:
        'The earliest known version in India, **Chaturaji** ("four kings"), was played by **four people**, each with an army, moves decided by dice. The two-player game came later.',
      doneText:
        'The earliest version, Chaturaji ("four kings"), was played by **four people** at once.',
      hintText: '',
    },
    {
      id: 'quiz-setup',
      kind: 'quiz',
      quizDimBoard: true,
      fen: STARTING_FEN,
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Question 7: Correctly Set Up Board',
      introText: 'The board is **set up correctly** when:',
      quizOptions: [
        "There's a light square in the bottom-left corner",
        "There's a dark square in the bottom-left corner",
        "It doesn't matter, any square works",
        'The queen is always on a dark square regardless of the corner',
      ],
      quizCorrectIndex: 1,
      quizExplanation:
        'The rule: **dark corner on the left**. Your bottom-left square must be dark. It stops the most common beginner mistake: a board set up backwards.',
      doneText: 'The rule to remember: **dark corner on the left**.',
      hintText: '',
    },
    {
      id: 'mark-a-row',
      kind: 'teach',
      fen: LINE_TASK_FEN,
      orientation: 'w',
      solution: ['a1h1'],
      revealPath: true,
      prompt: 'Mark one row',
      introText:
        'Drag the Queen straight across the board, **same number** the whole way. From a1 to h1.',
      doneText: "That's a **row**: 8 squares running left to right.",
      hintText:
        'A row runs left to right, all on the **same number**. Follow the arrow.',
      preStepIntro: {
        title: 'Row, File, Diagonal',
        text: 'The board has **three basic lines**. Here they are.',
        bullets: [
          '**Row (rank)**: 8 squares running left to right, numbered 1-8',
          '**File**: 8 squares running bottom to top, labeled a-h',
          '**Diagonal**: same-colored squares running corner to corner',
        ],
        buttonText: "Let's try it",
      },
    },
    {
      id: 'mark-a-file',
      kind: 'teach',
      fen: LINE_TASK_FEN,
      orientation: 'w',
      solution: ['a1a8'],
      revealPath: true,
      prompt: 'Mark one file',
      introText:
        'Now drag the Queen straight up the board, **same letter** the whole way. From a1 to a8.',
      doneText:
        "That's a **file**: 8 squares running bottom to top, same letter.",
      hintText:
        'A file runs up and down, all on the **same letter**. Follow the arrow.',
    },
    {
      id: 'mark-a-diagonal',
      kind: 'teach',
      fen: LINE_TASK_FEN,
      orientation: 'w',
      solution: ['a1h8'],
      revealPath: true,
      prompt: 'Mark one diagonal',
      introText:
        'Last one. Drag the Queen along a diagonal: **corner to corner**, same-colored squares.',
      doneText:
        "That's a **diagonal**: same-colored squares, corner to corner.",
      hintText:
        'A diagonal cuts across the board, **corner to corner**. Follow the arrow.',
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
    text: 'Two endings confuse beginners most: **Checkmate** and **Stalemate**. They look similar. One is a **win**, the other a **draw**. Real positions below.',
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
        "Look at Black's king on g8. Check **every square** it could move to before you decide.",
      quizOptions: ['Checkmate', 'Stalemate', 'Neither'],
      quizCorrectIndex: 0,
      quizExplanation:
        "This is **Checkmate**. The rook on d8 checks the king on g8. f8 and h8 are covered by the same rook, and f7, g7, h7 are blocked by **Black's own pawns**. No escape, no block, no capture: game over.",
      extraHintText:
        "Look at the king's **escape squares**. Are they all blocked or covered?",
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
      doneText: 'This is **Checkmate**. The king had nowhere to go.',
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
        'The white queen just moved right next to the black king. Can the king **capture it, block it, or run**?',
      quizOptions: ['Checkmate', 'Stalemate', 'Neither'],
      quizCorrectIndex: 0,
      quizExplanation:
        "This is **Checkmate**. The queen on g7, protected by her king, gives check, and every square around the black king is covered. It's called the **Kiss of Death**: the queen sits right next to the king she mates.",
      extraHintText:
        'Check every square around the black king. Is **even one** safe?',
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
      doneText: 'This is **Checkmate**: the Kiss of Death pattern.',
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
        "Look carefully. Is Black's king **in check** right now? Always check that first.",
      quizOptions: ['Checkmate', 'Stalemate', 'Neither'],
      quizCorrectIndex: 1,
      quizExplanation:
        "This is **Stalemate**: a draw, not a win. Black's king is not in check and has no legal move. g8, g7 and h7 are all covered. No legal move and no check means an instant draw. It's the most common way winning players **throw away a win**.",
      extraHintText:
        'First: is the king **in check**? Then: does it have **any legal square**?',
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
      doneText: 'This is **Stalemate**: no check, no moves, a draw.',
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
        "Check **both** of Black's pieces, not just the king. Does either one have a legal move?",
      quizOptions: ['Checkmate', 'Stalemate', 'Neither'],
      quizCorrectIndex: 1,
      quizExplanation:
        "Also **Stalemate**. b7 and b8 are covered by White's king. a7 holds Black's own pawn, blocked by the pawn on a6. No check, no legal moves. In real games, **your own pawns** can trap your own king like this.",
      extraHintText:
        'Look at every Black piece. Does the **pawn** have a move? Does the king?',
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
      doneText: 'This is **Stalemate**. The black pawn trapped its own king.',
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
        title: 'Part B: Play It',
        text: 'Your turn. You get a position and **find the move yourself**.',
      },
      prompt: 'Find the checkmate',
      introText: 'Black to move. Find **checkmate in one**.',
      doneText:
        'Checkmate. The white king is boxed in by its own pawns, and your rook mates on the **back rank**.',
      extraHintText:
        "The pawns on f2, g2 and h2 aren't protection here. **They're a trap.** Which file is open for your rook?",
      hintText: "That's not **checkmate** yet. Try again.",
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
        'Heads up: stalemate turns a **winning position into a draw**. You learn it here so you can **avoid it**. White to move, way ahead in material. Find the queen move that would stalemate Black.',
      doneText:
        "That's Stalemate. No check, zero legal moves, instant draw. White was winning and this move **throws the win away**. Now you know the move to avoid.",
      extraHintText:
        'Stalemate = no legal moves and **no check**. Find the square where the queen covers **g7, g8 and h7** at once without giving check.',
      hintText: 'Not a **stalemate** yet. Try again.',
    },
    // ---------- Part C - Chat Quiz with the AI Coach (3 positions) ----------
    {
      id: 'c1-neither',
      kind: 'quiz',
      fen: '4k3/8/4K3/8/8/8/8/8 b - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Checkmate, Stalemate, or Neither?',
      introText: 'Black to move. Checkmate, Stalemate, or **Neither**?',
      quizOptions: ['Checkmate', 'Stalemate', 'Neither'],
      quizCorrectIndex: 2,
      quizExplanation:
        "Exactly. Black's king can go to **d8**. Not stuck, not in check. A normal position.",
      quizExplanationWrong:
        'Look again. Is the black king **in check**? Does it have anywhere to go?',
      extraHintText: 'Check the **d8** square.',
      doneText: "That's **Neither**. A normal, ongoing position.",
      hintText: '',
    },
    {
      id: 'c2-ladder-mate',
      kind: 'quiz',
      fen: '1R5k/R7/8/8/8/8/8/6K1 b - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Checkmate, Stalemate, or Neither?',
      introText: "Next one. **What's happening** here?",
      quizOptions: ['Checkmate', 'Stalemate', 'Neither'],
      quizCorrectIndex: 0,
      quizExplanation:
        'Correct. This is a **ladder mate**: two rooks climbing the board, cutting off the king rank by rank.',
      quizExplanationWrong:
        'Look at both rooks. One covers the **7th rank**, the other checks on the 8th. Any square left?',
      extraHintText:
        'Count the squares next to the black king. **Who covers each one?**',
      doneText: "That's **Checkmate**: a ladder mate.",
      hintText: '',
    },
    {
      id: 'c3-rook-stalemate',
      kind: 'quiz',
      fen: '5K1k/R7/8/8/8/8/8/8 b - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Checkmate, Stalemate, or Neither?',
      introText: 'Last one. The **trickiest** of the three.',
      quizOptions: ['Checkmate', 'Stalemate', 'Neither'],
      quizCorrectIndex: 1,
      quizExplanation:
        "Exactly. Black's king isn't in check, and every square is covered. A **draw**, even though White is clearly stronger.",
      quizExplanationWrong:
        'Check first: is the king **in check**? If not, and it has no moves, what does that mean?',
      extraHintText: 'Is the black king **in check** right now? Look closely.',
      doneText:
        'Checkmate is a **win**. Stalemate is a **draw**, no matter the material. Knowing the difference saves you points. See you next lesson.',
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
    text: "Checkmate **ends the game**: the king is in check and can't escape, block, or capture. Today, **5 different pieces** deliver it, even the smallest one.",
  },
  introSteps: [
    {
      text: "Checkmate **ends the game**: the king is in check and can't escape, block, or capture. Today, **5 different pieces** deliver it, even the smallest one.",
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
      prompt: 'Example 1: Queen & Rook',
      introText:
        "This is what checkmate looks like. The queen on e8 checks along the **back rank**, and the rook behind her means she **can't be captured**. f8 and h8 are covered, and Black's own pawns block the rest. No escape.",
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
      doneText:
        "That's checkmate: **no escape, no block, no capture**. The king is never actually captured. The game ends right here.",
      hintText: '',
      nextButtonText: 'Got it',
    },
    {
      id: 't2-ladder-mate',
      kind: 'quiz',
      fen: '6k1/8/8/8/8/8/r7/1r5K w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Example 2: Ladder Mate',
      introText:
        "Now White's king is in trouble. The rook on b1 checks on the back rank, and the rook on a2 **seals off the escape**. Two rooks as a team. Checkmate.",
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
      doneText: 'Two rooks, **ladder mate**. Textbook.',
      hintText: '',
      nextButtonText: 'Got it',
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
      prompt: 'Find the checkmate: Queen',
      introText:
        'Your queen and king **team up** to trap the enemy king. Find mate in one.',
      extraHintText:
        'Put your queen right next to the black king, on a square **your king protects**.',
      doneText:
        "Qg7#. Your king on g6 protects the queen, so Black can't take her. Every square is covered. This is the **Kiss of Death**. You'll see it a lot.",
      hintText:
        "That's not checkmate. Give check so the king has **no escape at all**. There's more than one mate here.",
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
            'Qa8#. Your queen checks along the back rank and your king on g6 covers the rest. A clean **back-rank mate**.',
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
            'Qb8#. Same idea, different square. The queen owns the back rank, your king seals the rest. **Back-rank mate**.',
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
            'Qc8#. Your queen checks on the back rank, your king on g6 covers every escape. **Back-rank mate**.',
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
      prompt: 'Find the checkmate: Rook',
      introText:
        'A rook alone can mate too, if the king has **nowhere to hide**. Find mate in one.',
      extraHintText:
        "White's pawns on g2 and h2 trap their own king. Which file is **open** for your rook?",
      doneText:
        'Rb1#. The pawns on g2 and h2 look safe and **block their own king**. Your rook owns the back rank. This is a **back-rank mate**, one of the most common in chess.',
      hintText: 'Not **checkmate** yet. Try again.',
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
      prompt: 'Find the checkmate: Knight',
      introText:
        'Knights move like no other piece. Perfect for a **sneaky checkmate**. Find mate in one.',
      extraHintText:
        "White's own rook and pawns surround the king. Does it have **any square**? Now find a knight check.",
      doneText:
        "Nf7#. This is a **smothered mate**. White's own pieces box the king in, and your knight alone finishes it. Nobody can capture the knight.",
      hintText: "That's not **checkmate**. Try again.",
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
      prompt: 'Find the checkmate: Bishop',
      introText:
        'Even a bishop, **diagonals only**, can deliver checkmate. Find mate in one.',
      extraHintText:
        'Your bishop can **capture a pawn and check** at the same time. Which pawn sits on its diagonal?',
      doneText:
        "Bxg7#. The bishop captures and checks. Your king on f7 **protects it**, and h7 is blocked by Black's own pawn.",
      hintText: 'Not **checkmate** yet. Try again.',
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
      prompt: 'Find the checkmate: Pawn',
      introText:
        'This one surprises everyone. Even a **pawn** can deliver checkmate. Find it.',
      extraHintText:
        'Your pawn can **capture next to the black king**. What happens to the king after that?',
      doneText:
        'cxb7#. The pawn captures and checks. Your king on c8 protects it and covers b8, and a7 is blocked. The **smallest piece** just delivered mate.',
      hintText: 'Not **checkmate** yet. Try again.',
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
      prompt: 'Bonus 1: Queen & Knight',
      introText:
        'Your queen and knight **combine** for a clean checkmate. Find it.',
      extraHintText:
        'Put your queen next to the black king, on a square **your knight defends**.',
      doneText:
        "Qg7#. Your knight on e6 defends the queen, so the king can't take her. A classic **queen-and-knight** mate.",
      hintText:
        "That's not checkmate. Give check so the king has **no escape at all**. There's more than one mate here.",
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
            'Qa8#. Queen on the back rank, knight covers g7, h7 is blocked. **Back-rank mate**.',
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
            'Qb8#. Same idea, different square. Queen on the back rank, knight covers g7. **Back-rank mate**.',
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
      prompt: 'Bonus 2: Rook & Bishop',
      introText:
        'This time your rook needs **help from the bishop**. Find the checkmate.',
      extraHintText:
        'Move your rook all the way up its file to the **back rank**.',
      doneText:
        'Ra8#. The rook checks on the back rank and the bishop on h6 **covers g7**. Teamwork.',
      hintText: 'Not **checkmate** yet. Try again.',
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
      prompt: 'Bonus 3: Epaulette Mate',
      introText:
        "Black's own rooks are about to become **the problem**. Find the checkmate.",
      extraHintText:
        'One queen square checks along the file and covers **both diagonals** next to the king at once.',
      doneText:
        "Qe6#. This is an **epaulette mate**. Black's own rooks block the sides, like epaulettes on a uniform, and your queen covers the rest.",
      hintText: 'Not **checkmate** yet. Try again.',
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
    text: 'Get to know the board itself: the **Kingside**, the **Queenside**, the **center**, and the lines every piece moves along.',
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
        'This half, the e, f, g and h files, is the **Kingside**. Your king usually ends up here after castling.',
      quizBoardHighlight: { squares: filesZone(['e', 'f', 'g', 'h']) },
      doneText: "That's the **Kingside**: e, f, g, h.",
      hintText: '',
      nextButtonText: 'Got it',
    },
    {
      id: 'a2-queenside',
      kind: 'quiz',
      fen: STARTING_FEN,
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'The Queenside',
      introText:
        "This half, a, b, c, d, is the **Queenside**. Castling here is a **long castle**: the king travels further. On the Kingside it's a **short castle**.",
      quizBoardHighlight: {
        squares: filesZone(['a', 'b', 'c', 'd'], D11_QUEENSIDE),
      },
      doneText: "That's the **Queenside**: a, b, c, d.",
      hintText: '',
      transitionText: 'Good. **Next one.**',
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
        'Find the heart of the board: the **4 most important squares** in the center. To mark a square, **right-click** it on desktop or tap it on mobile.',
      retryPromptText:
        'The center is **d4, d5, e4 and e5**. Control them and you control the board. Every strong opening fights for them.',
      extraHintText:
        'These four, **d4, d5, e4, e5**, are the center. Control them, control the board.',
      doneText:
        'Exactly: **d4, d5, e4, e5**. Control them and you control the board. Every strong opening fights for them.',
      hintText: '',
      quizBoardHighlight: {
        squares: ['d4', 'd5', 'e4', 'e5'].map((square) => ({
          square,
          color: D11_INFO,
        })),
      },
      nextButtonText: 'Got it',
    },
    {
      id: 'b2-wide-center',
      kind: 'markSquares',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: [
        'c3',
        'c4',
        'c5',
        'c6',
        'd3',
        'd6',
        'e3',
        'e6',
        'f3',
        'f4',
        'f5',
        'f6',
      ],
      prompt: 'Mark the Wide Center',
      introText:
        'The ring around the center matters too: the **wide center**. Same as before: right-click on desktop, tap on mobile. Mark it.',
      retryPromptText:
        'The wide center is this 16-square zone, **c3 to f6**. Pieces here have more room and more targets.',
      extraHintText:
        'This whole zone, **c3 to f6**, is the wide center. More space, more targets.',
      doneText:
        'With the center, that makes a 16-square zone, **c3 to f6**. Pieces here have more room and more targets.',
      hintText: '',
      quizBoardHighlight: {
        squares: [
          'c3',
          'c4',
          'c5',
          'c6',
          'd3',
          'd6',
          'e3',
          'e6',
          'f3',
          'f4',
          'f5',
          'f6',
        ].map((square) => ({ square, color: D11_INFO })),
      },
      transitionText: 'Good. **Next one.**',
    },
    // ---------- Section C - Rows, Diagonals & Files (recognition) ----------
    {
      id: 'c1-row',
      kind: 'quiz',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'What kind of line is this?',
      introText: "Take a look. **What's drawn** here?",
      quizOptions: ['A Row', 'A File', 'A Diagonal'],
      quizCorrectIndex: 0,
      quizBoardHighlightUpfront: true,
      quizBoardHighlight: {
        arrows: [{ from: 'a4', to: 'h4', color: D11_INFO }],
      },
      quizExplanation:
        'This is a **Row**, also called a rank: 8 squares side to side. The **back row** matters most: castling happens there, and so do the checkmates from Day 10.',
      doneText: "That's a **Row** (rank): 8 squares side to side.",
      hintText: '',
      nextButtonText: 'Got it',
    },
    {
      id: 'c2-diagonal',
      kind: 'quiz',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'What kind of line is this?',
      introText: 'And **this one**?',
      quizOptions: ['A Row', 'A File', 'A Diagonal'],
      quizCorrectIndex: 2,
      quizBoardHighlightUpfront: true,
      quizBoardHighlight: {
        arrows: [{ from: 'a1', to: 'h8', color: D11_INFO }],
      },
      quizExplanation:
        "This is a **Diagonal**. Bishops live here, it's the only line they move on. The queen uses diagonals too.",
      doneText: "That's a **Diagonal**.",
      hintText: '',
      nextButtonText: 'Got it',
    },
    {
      id: 'c3-file',
      kind: 'quiz',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'What kind of line is this?',
      introText: "Last one. **What's this?**",
      quizOptions: ['A Row', 'A File', 'A Diagonal'],
      quizCorrectIndex: 1,
      quizBoardHighlightUpfront: true,
      quizBoardHighlight: {
        arrows: [{ from: 'd1', to: 'd8', color: D11_INFO }],
      },
      quizExplanation:
        'This is a **File**. Rooks love files, especially **open files** with no pawns in the way. An open file for your rook is a big advantage.',
      doneText:
        "You've met the **whole board**: Kingside, Queenside, the center, and every line on it.",
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
    text: "Your queen is the strongest piece on the board. She still **can't mate alone**: she needs **her own king's help**. Today you learn how they work together.",
  },
  introSteps: [
    {
      text: "Your queen is the strongest piece on the board. She still **can't mate alone**: she needs **her own king's help**. Today you learn how they work together.",
      buttonText: 'Got it',
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
        "Remember this one? **Stalemate**, not checkmate. It's the most common way players ruin this ending. Rule: the king must **always have a legal move**, until the very last one.",
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
      doneText: 'That is **stalemate**: no legal move, no check.',
      hintText: '',
      nextButtonText: 'Got it',
    },
    {
      id: 't3-the-plan',
      kind: 'quiz',
      fen: '6k1/8/4K3/8/8/8/8/Q7 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'The Plan',
      introText:
        "The plan: **box the king in** with your queen, a knight's move away so she's safe. Then **walk your king in** and finish together.",
      doneText: 'The plan: **box the king in**, then bring your king up.',
      hintText: '',
      nextButtonText: 'Ready',
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
        title: 'Bring It On',
        text: "Practice time. I'll **guide every move**. Follow along.",
        buttonText: 'Start',
      },
      prompt: 'Move 1: Box the King In',
      introText:
        "The queen doesn't need to give check. She's **fencing in squares** around the king, not attacking him.",
      doneText:
        'The king has **one square** left. Always leave at least one legal square. **Zero means stalemate**, not checkmate.',
      hintText: "That's not the move. **Follow the arrow.**",
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
      nextButtonText: 'Got it',
    },
    {
      id: 'move2-qg5',
      kind: 'puzzle',
      fen: '8/7k/4KQ2/8/8/8/8/8 w - - 2 2',
      orientation: 'w',
      solution: ['f6g5', 'h7h8'],
      showSolutionArrowUpfront: true,
      prompt: 'Move 2: Pack Him Into the Corner',
      introText:
        'Qg5. Pack the king into the corner so he has **only one square**.',
      doneText:
        'Remember this position. **This is your goal.** From here, bring up your king and help the queen deliver the **Kiss of Death**.',
      hintText: "That's not the move. **Follow the arrow.**",
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
      nextButtonText: 'Got it',
    },
    {
      id: 'move3-kf7',
      kind: 'puzzle',
      fen: '7k/8/4K3/6Q1/8/8/8/8 w - - 4 3',
      orientation: 'w',
      solution: ['e6f7', 'h8h7'],
      revealArrowOnWrongMove: true,
      prompt: 'Move 3: Bring the King In',
      introText:
        'Your turn. The only piece that can help the queen now is **your king**.',
      doneText: 'Exactly. **King in place.**',
      hintText: 'Look where **your king** needs to go.',
    },
    {
      id: 'move4-checkmate',
      kind: 'puzzle',
      fen: '8/5K1k/8/6Q1/8/8/8/8 w - - 6 4',
      orientation: 'w',
      solution: ['goal'],
      goalCondition: 'checkmate',
      hintMove: 'g5g7',
      prompt: 'Find the Checkmate',
      introText: 'Deliver the **Kiss of Death**.',
      extraHintText:
        'The **Kiss of Death**: the queen goes right in front of the king, protected by your king.',
      doneText:
        "The **Kiss of Death**. The queen sits in front of the king, protected by yours. Checkmate. King and queen mate is a skill you'll use **in almost every game**.",
      hintText: 'Not **checkmate** yet. Try again.',
      celebrate: true,
      // Qh5#/Qh4# JESU sah-mat (goalCondition je tehnicki zadovoljen), ali ova
      // lekcija uci bas Kiss of Death (dama ispred kralja) - requireRetry ih
      // vraca na ponovni pokusaj umesto da zavrse korak.
      altSolutions: [
        {
          uci: 'g5h5',
          requireRetry: true,
          retryMessage:
            "That's checkmate. It's not the **Kiss of Death**, and that's the mate we're learning. Try again.",
          doneText:
            "Qh5#. Different square, same idea: the queen checks, your king protects. King and queen mate, a skill you'll use **in almost every game**.",
        },
        {
          uci: 'g5h4',
          requireRetry: true,
          retryMessage:
            "That's checkmate. It's not the **Kiss of Death**, and that's the mate we're learning. Try again.",
          doneText:
            "Qh4#. The queen checks on the h-file, your king backs her up. King and queen mate, a skill you'll use **in almost every game**.",
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
  title: 'Openings: The Basics',
  piece: {
    name: 'opening',
    glyph: '♟',
    movement: 'static',
    bannerText: 'Opening Basics',
  },
  intro: {
    title: 'Openings: The Basics',
    text: 'The opening is the **first few moves** of a game, where both players set up their pieces. A good opening gets your pieces **ready to attack and defend** before the real fight.',
  },
  // JEDINI punoekranski pop-up u celoj lekciji - svih 5 principa posle ovoga
  // ide kroz AI chat (watch-style 'quiz' koraci), ne kroz dodatne pop-up prozore.
  introSteps: [
    {
      text: 'The opening is the **first few moves** of a game, where both players set up their pieces. A good opening gets your pieces **ready to attack and defend** before the real fight.',
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
      prompt: 'Principle 1 of 5: Control the Center',
      introText:
        'The middle of the board, **d4, d5, e4, e5**, is the most valuable real estate. Both sides are already **fighting for it** after move 1.',
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
      doneText: 'Control the center: the fight for **d4, d5, e4, e5**.',
      hintText: '',
      nextButtonText: 'Got it',
    },
    {
      id: 'p2-develop-pieces',
      kind: 'quiz',
      fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Principle 2 of 5: Develop Your Pieces',
      introText:
        'Bring your **knights and bishops out** before anything else. Both knights are already in the game here.',
      // Konji su vec razvijeni; lovac na f1 je obelezen kao sledeci na redu.
      quizBoardHighlight: {
        squares: [
          { square: 'f3', color: D13_INFO },
          { square: 'c6', color: D13_INFO },
          { square: 'f1', color: D13_INFO },
        ],
      },
      doneText: 'Knights out first, **bishops next**.',
      hintText: '',
      nextButtonText: 'Got it',
    },
    {
      id: 'p3-dont-repeat',
      kind: 'quiz',
      fen: 'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
      orientation: 'w',
      solution: ['quiz'],
      prompt: "Principle 3 of 5: Don't Move the Same Piece Twice",
      introText:
        "Every knight and bishop here moved **exactly once**. That's why development is this far ahead.",
      quizBoardHighlight: {
        squares: [
          { square: 'f3', color: D13_INFO },
          { square: 'c6', color: D13_INFO },
          { square: 'c4', color: D13_INFO },
          { square: 'c5', color: D13_INFO },
        ],
      },
      doneText: 'Four pieces developed, each moved **only once**.',
      hintText: '',
      nextButtonText: 'Got it',
    },
    {
      id: 'p4-castle-early',
      kind: 'quiz',
      fen: 'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 b kq - 5 4',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Principle 4 of 5: Castle Early',
      introText:
        'Get your **king to safety** as soon as you can. White just did: the king is tucked in the corner.',
      quizBoardHighlight: {
        arrows: [{ from: 'e1', to: 'g1', color: D13_INFO }],
        squares: [
          { square: 'g1', color: D13_INFO },
          { square: 'f1', color: D13_INFO },
        ],
      },
      doneText: 'Castled. King **safe in the corner**.',
      hintText: '',
      nextButtonText: 'Got it',
    },
    {
      id: 'p5-queen-home',
      kind: 'quiz',
      // Ista pozicija kao Principle 4 - lepo ilustruje oba pravila odjednom (Dev Notes).
      fen: 'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 b kq - 5 4',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Principle 5 of 5: Keep Your Queen Home for Now',
      introText:
        "Bring the queen out too early and your opponent **attacks her and gains time**. White's queen hasn't moved yet. That's fine this early.",
      quizBoardHighlight: {
        squares: [
          { square: 'd1', color: D13_INFO },
          { square: 'd8', color: D13_INFO },
        ],
      },
      doneText: 'Both queens still home. **No rush.**',
      hintText: '',
      nextButtonText: 'Got it',
    },
    {
      id: 'ready-london',
      kind: 'quiz',
      fen: 'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 b kq - 5 4',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Ready for Your First Opening?',
      introText:
        'Next: the **London System**, one of the simplest and most popular openings for White.',
      doneText: 'Time to see it **in action**.',
      hintText: '',
      nextButtonText: 'London System',
      nextButtonTextMobile: 'London S.',
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
      prompt: 'Your First Opening: The London System',
      introText:
        'Play it together. **Follow the arrow** for each move. I play Black.',
      hintText: "Follow the **London System's plan**.",
      doneText: 'You just played the **first 5 moves** of the London System.',
    },
  ],
};

const DAY_14_FIRST_GAME: Lesson = {
  id: 'l1-d14-first-game',
  level: 1,
  day: 14,
  title: 'Game 1.0',
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
      introText: "Make your first move **whenever you're ready**.",
      hintText: '',
      doneText:
        "Interesting game. Your **first real match**, no puzzles, no hints. That's chess now.",
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
    { label: 'Next Lesson', action: 'nextLesson' },
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
  title: 'Castling Rules: When You Can’t Castle',
  piece: {
    name: 'castling',
    glyph: '♚',
    movement: 'static',
    bannerText: 'Castling Rules',
  },
  intro: {
    title: 'Castling Rules: When You Can’t Castle',
    text: "Castling isn't always allowed. First you'll learn **when you can't castle**. Then you'll use those rules to **stop your opponent from castling**.",
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
      prompt: 'Position 1: The King Has Already Moved',
      introText:
        "White's king is on e2, not e1. Rule #1: once your king moves, even one square, **you lose the right to castle** for the rest of the game, even if it comes back to e1. No castling for White, either side.\n\nFor now, we're **just learning**. You'll try it yourself soon.",
      quizBoardHighlight: {
        squares: [{ square: 'e2', color: D15_SPOTLIGHT }],
      },
      doneText: 'The king moved. Castling rights are **gone for good**.',
      hintText: '',
      nextButtonText: 'Got it',
    },
    {
      id: 'p2a-queenside-rook-moved',
      kind: 'quiz',
      fen: '3rk2r/pp1qbppp/2p1bn2/3p2B1/3P4/2NQ1N2/PPP2PPP/1R2K2R w Kk - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Position 2: One Rook Has Moved',
      introText:
        "White's queenside rook already stepped from a1 to b1. A rook move only costs castling **on that rook's side**. Queenside (O-O-O) is gone for both sides. Kingside (O-O) is still legal: the h1 rook and the king never moved.\n\nFor now, we're **just learning**. You'll try it yourself soon.",
      quizBoardHighlight: {
        squares: [
          { square: 'b1', color: D15_MOVED },
          { square: 'd8', color: D15_MOVED },
        ],
      },
      doneText: 'Queenside rook moved. O-O-O is gone, **O-O is still fine**.',
      hintText: '',
      nextButtonText: 'Got it',
    },
    {
      id: 'p2b-castle-kingside',
      kind: 'puzzle',
      fen: '3rk2r/pp1qbppp/2p1bn2/3p2B1/3P4/2NQ1N2/PPP2PPP/1R2K2R w Kk - 0 1',
      orientation: 'w',
      solution: ['e1g1'],
      prompt: 'Castle on the Side You Still Can',
      introText: 'Castle on the side where castling is **still legal**.',
      doneText: 'O-O. Castled **kingside**, the side you still had.',
      hintText:
        "We want **the castle** here. Other moves aren't the point right now.",
    },
    {
      id: 'p3a-kingside-rook-moved',
      kind: 'quiz',
      fen: 'r3k2r/pppp1ppp/8/4p3/4P1PP/8/PPPP1P2/R3K1R1 w Qkq - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Position 3: The Other Rook Has Moved',
      introText:
        "Now the other rook: White moved it from h1 to g1 to support the pawn storm. Same rule, mirrored. O-O is gone because **that rook moved**. O-O-O is still fine: the a1 rook and the king haven't moved.\n\nFor now, we're **just learning**. You'll try it yourself soon.",
      quizBoardHighlight: {
        arrows: [{ from: 'e1', to: 'c1', color: D15_AVAILABLE }],
        squares: [
          { square: 'g1', color: D15_MOVED },
          { square: 'a1', color: D15_AVAILABLE },
          { square: 'e1', color: D15_AVAILABLE },
        ],
      },
      doneText: 'Kingside rook moved. O-O is gone, **O-O-O is still fine**.',
      hintText: '',
      nextButtonText: 'Got it',
    },
    {
      id: 'p3b-castle-queenside',
      kind: 'puzzle',
      fen: 'r3k2r/pppp1ppp/8/4p3/4P1PP/8/PPPP1P2/R3K1R1 w Qkq - 0 1',
      orientation: 'w',
      solution: ['e1c1'],
      prompt: "So, What's the Move?",
      introText: 'Castle on the side where castling is **still legal**.',
      doneText: 'O-O-O. Castled **queenside**, the only side left.',
      hintText:
        "We want **a castle** here. Other moves aren't the point right now.",
    },
    {
      id: 'p4-bishop-attacks-crossing-square',
      kind: 'quiz',
      fen: '4k3/8/b7/8/8/8/8/R3K2R w KQ - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Position 4: A Bishop Attacks the Crossing Square',
      introText:
        "Having the right to castle isn't enough. The move must also be legal **right now**. The king can never cross a square that's **under attack**. Black's bishop covers f1, the square the king crosses to reach g1, so O-O is illegal this turn.\n\nFor now, we're **just learning**. You'll try it yourself soon.",
      quizBoardHighlight: {
        arrows: [{ from: 'a6', to: 'f1', color: D15_MOVED }],
        squares: [{ square: 'f1', color: D15_MOVED }],
      },
      doneText: "f1 is attacked. The king **can't cross it**, so O-O is out.",
      hintText: '',
      nextButtonText: 'Got it',
    },
    {
      id: 'p5a-queen-attacks-landing-square',
      kind: 'quiz',
      fen: '4k3/8/6q1/8/8/8/8/R3K2R w KQ - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Position 5: A Queen Attacks the Landing Square',
      introText:
        "Same idea, different square. Now g1 itself, where the king would land, is covered by the black queen on the g-file. **Landing square attacked** means no castling to that side, even with no check and no king move.\n\nFor now, we're **just learning**. You'll try it yourself soon.",
      quizBoardHighlight: {
        arrows: [{ from: 'g6', to: 'g1', color: D15_MOVED }],
        squares: [
          { square: 'g1', color: D15_MOVED },
          { square: 'd1', color: D15_AVAILABLE },
          { square: 'c1', color: D15_AVAILABLE },
        ],
      },
      doneText: 'g1 is attacked. O-O is out, **O-O-O is still open**.',
      hintText: '',
      nextButtonText: 'Got it',
    },
    {
      id: 'p5b-castle-queenside',
      kind: 'puzzle',
      fen: '4k3/8/6q1/8/8/8/8/R3K2R w KQ - 0 1',
      orientation: 'w',
      solution: ['e1c1'],
      prompt: 'One Castle Is Still Possible Here',
      introText: 'Find the castle that is **still legal**.',
      doneText: 'O-O-O. The **queenside castle** was still legal.',
      hintText:
        "We want **a castle** here. Other moves aren't the point right now.",
    },
    {
      id: 'p6a-irrelevant-square',
      kind: 'quiz',
      fen: 'r3k3/8/8/8/8/8/8/1Q2K3 b q - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: "Position 6: The Trick, an Attacked Square That Doesn't Matter",
      introText:
        "The part almost nobody knows. Castling is only blocked by **squares the king itself touches**: where it starts, every square it crosses, and where it lands. For Black's queenside castle that's e8, d8 and c8 only. b8 doesn't count: the rook passes it, the king never does.\n\nFor now, we're **just learning**. You'll try it yourself soon.",
      quizBoardHighlight: {
        arrows: [{ from: 'b1', to: 'b8', color: D15_IRRELEVANT }],
        squares: [
          { square: 'b8', color: D15_IRRELEVANT },
          { square: 'e8', color: D15_AVAILABLE },
          { square: 'd8', color: D15_AVAILABLE },
          { square: 'c8', color: D15_AVAILABLE },
        ],
      },
      doneText: 'Only squares **the king itself touches** matter.',
      hintText: '',
      nextButtonText: 'Got it',
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
        'Is Black’s queenside castle **still legal** here, with White’s queen on b1 attacking b8?',
      quizOptions: ['Yes', 'No'],
      quizCorrectIndex: 0,
      quizRetryOnWrong: true,
      quizExplanationWrong:
        'Check which squares **the king** actually touches.',
      quizExplanation:
        "Yes, it's legal. It doesn't look it. The queen attacks b8, a square the king **never crosses or lands on**, so it changes nothing. Only e8, d8 and c8 matter.",
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
        "Yes, it's legal. It doesn't look it. The queen attacks b8, a square the king **never crosses or lands on**, so it changes nothing. Only e8, d8 and c8 matter.",
      hintText: '',
      // Bez ovoga, "Got it!" dobija pun auto-advance tretman (pulsira i sam
      // se napuni/klikne) cim se otkljuci - cak i posle NETACNOG odgovora
      // (quizRetryOnWrong ga otkljucava namerno, vidi DailyLessonActivity).
      // To bi odgurnulo korisnika dalje pre nego sto stigne da odluci da li
      // zeli da proba ponovo - retry inace nema poentu.
      noAutoAdvance: true,
      nextButtonText: 'Got it',
    },
    {
      id: 'ps-reminder',
      kind: 'quiz',
      fen: '2kr4/8/8/8/8/8/8/1Q2K3 w - - 1 2',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'One More Thing to Remember',
      introText:
        "One more thing: castling is **a king move**. Over the board or online, you move the king two squares toward the rook. Never touch the rook first. That's the habit to build.\n\nFor now, we're **just learning**. You'll try it yourself soon.",
      doneText:
        'Castling is always **a king move**, two squares toward the rook.',
      hintText: '',
      nextButtonText: 'Got it',
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
      doneText: 'Time to **take that option away** from your opponent.',
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
      prompt: 'Puzzle 1: Cut It Off With a Bishop',
      introText:
        'White to move. Black is ready to castle queenside. **Find the move** that stops it.',
      extraHintText:
        "Which diagonal from your bishop reaches **Black's back rank**?",
      wrongMoveHighlight: {
        arrows: [{ from: 'f5', to: 'c8', color: D15_MOVED }],
        squares: [{ square: 'c8', color: D15_MOVED }],
      },
      doneText:
        "Exactly. Bf5 **covers c8**, the king's landing square. No legal O-O-O for Black now.",
      hintText: "That doesn't **stop the castle**. Try again.",
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
            'That stops the castle. It also leaves your bishop **stuck in the corner** for nothing. Find a square that does the same job.',
          doneText:
            'Ba6 also covers c8, same as Bf5, from a **much less useful square**.',
        },
        {
          uci: 'd3b5',
          doneText:
            "Check. Black can't block or capture, so the king must move, and then queenside castling is **gone for good** (remember Position 1).",
        },
        {
          uci: 'd3g6',
          doneText:
            "Check. Black can't block or capture, so the king must move, and then queenside castling is **gone for good** (remember Position 1).",
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
      // Qh3 TAKODJE radi, ali napada DRUGO polje (c8 - polje sletanja, ne
      // d8 - polje prelaska) - sopstven doneText da objasnjenje odgovara
      // stvarno odigranom potezu, ne uvek istom hardkodovanom Qh4 tekstu.
      altSolutions: [
        {
          uci: 'h1h3',
          doneText:
            "Got it, Qh3 **covers c8**, the king's landing square. Same result, different square.",
        },
        // sah gde crni MORA kraljem (chess.js) - rokada nestaje zauvek
        {
          uci: 'h1h5',
          doneText:
            "That works too. It's **check**, so the king has to move. And once the king moves, castling is **gone for good**.",
        },
        {
          uci: 'h1e4',
          doneText:
            "That works too. It's **check**, so the king has to move. And once the king moves, castling is **gone for good**.",
        },
        {
          uci: 'h1h8',
          doneText:
            "That works too. It's **check**, so the king has to move. And once the king moves, castling is **gone for good**.",
        },
        // sah, ali crni moze da uzme damu (bxc6) i zadrzi rokadu
        {
          uci: 'h1c6',
          doneText:
            "It's **check**, so no castling this turn. Your queen is **hanging**, though: Black takes it with bxc6.",
        },
      ],
      prompt: 'Puzzle 2: Cut It Off With a Queen',
      introText:
        'Same idea, bigger piece. **Find the queen move** that stops Black’s castle.',
      extraHintText:
        'Look at the diagonal from h4 or h3. Which back-rank square does it reach, and does **the king pass through it**?',
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
      hintText: "That doesn't **stop the castle**. Try again.",
    },
    {
      id: 'puzzle3-knight',
      kind: 'puzzle',
      fen: '4k2r/8/8/8/3N4/8/8/6K1 w k - 0 1',
      orientation: 'w',
      solution: ['goal'],
      goalCondition: 'denyCastleKingside',
      hintMove: 'd4e6',
      prompt: 'Puzzle 3: Cut It Off With a Knight',
      introText:
        'One more, with a knight. **Find the move** that stops Black’s kingside castle.',
      extraHintText:
        "Which knight move attacks a **dark square** right next to Black's king?",
      wrongMoveHighlight: {
        arrows: [
          { from: 'd4', to: 'e6', color: D15_SPOTLIGHT },
          { from: 'e6', to: 'f8', color: D15_MOVED },
        ],
        squares: [{ square: 'd4', color: D15_SPOTLIGHT }],
      },
      doneText:
        "Ne6! It **attacks f8**, right in the king's path. No legal O-O for Black now.",
      hintText: "That doesn't **stop the castle**. Try again.",
    },
  ],
  endScreenButtons: [
    { label: 'Next Lesson', action: 'nextLesson' },
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
    text: 'A puzzle is a chess position where you find the **best move** to win an advantage. This one is simple: one position, one move. Find the piece you can **take for free**. Tap it, then tap where it lands.',
  },
  introSteps: [
    {
      text: 'A puzzle is a chess position where you find the **best move** to win an advantage. This one is simple: one position, one move. Find the piece you can **take for free**. Tap it, then tap where it lands.',
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
      introText: 'First one. Scan the board for anything **undefended**.',
      doneText: 'Queen captured. **Nothing traded back.**',
      hintText: 'Not that one. Something here is **hanging**. Look again.',
      extraHintText: 'Someone left their **queen** out in the open.',
    },
    {
      id: 'p2-rook-takes-bishop',
      kind: 'puzzle',
      fen: '8/1pp2k1p/6p1/p4p2/2Pb4/1P6/P2R1PPP/4K3 w - - 0 1',
      orientation: 'w',
      solution: ['d2d4'],
      prompt: 'White to play: take the free piece',
      introText: "Same idea. Check what your **rook's file** actually covers.",
      doneText: 'Rook takes **bishop**. On to the next.',
      hintText: 'Not quite. Look at the **file** your rook sits on.',
      extraHintText: "A **bishop** wandered onto your rook's line.",
    },
    {
      id: 'p3-bishop-takes-knight',
      kind: 'puzzle',
      fen: 'k6n/pppppp1p/8/8/8/8/PBPPPPPP/4K3 w - - 0 1',
      orientation: 'w',
      solution: ['b2h8'],
      prompt: 'White to play: take the free piece',
      introText: 'Longer reach this time. Follow the **diagonal** all the way.',
      doneText: 'All the way **across the board**.',
      hintText: 'Try again. Your bishop sees **further** than it looks.',
      extraHintText: 'Check the **far corner** of that diagonal.',
    },
    {
      id: 'p4-knight-takes-queen',
      kind: 'puzzle',
      fen: '1k6/p1pp1ppp/1pb5/4q3/1PP5/PQ1P1N2/4PPPP/6K1 w - - 0 1',
      orientation: 'w',
      solution: ['f3e5'],
      prompt: 'White to play: take the free piece',
      introText: "Different piece, same question: **what's hanging?**",
      doneText: "Knight takes the **queen**. That's the whole move.",
      hintText:
        "Not that move. Knights jump in an **L**. Check what's in range.",
      extraHintText:
        "Knights jump in an L. **Queens** don't always see it coming.",
    },
    {
      id: 'p5-pawn-takes-bishop',
      kind: 'puzzle',
      fen: '1k1r3r/1pp2ppp/pn6/4b3/3P4/4P2N/PPP2PPP/2KR3R w - - 0 1',
      orientation: 'w',
      solution: ['d4e5'],
      prompt: 'White to play: take the free piece',
      introText: 'Last one. Find the **free piece** and close it out.',
      doneText:
        'Pawn does the work this time. Five puzzles, five pieces. Every one was **there for the taking**.',
      hintText: 'Not this time. Pawns only capture **to the side**.',
      extraHintText:
        "Pawns capture **sideways**, not straight. This one's ready.",
    },
  ],
  endScreenButtons: [
    { label: 'Next Lesson', action: 'nextLesson' },
    { label: 'Done', action: 'done' },
    { label: 'Repeat', action: 'repeat' },
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
    text: 'Two rooks and a lone king. **No king support needed.** Two rooks, working together, force the king to the **edge of the board**.',
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
        "The goal: **cut off** the opponent's king. Move the rook to shrink the king's space by **one more line**.",
      doneText:
        'Line your rooks up **side by side**, not on the same file. Stacked, they block each other. Spread out, they cover the whole board.',
      hintText:
        'Not that one. **Spread the rooks out**, not on top of each other.',
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
        'Now the king is cut off. One rook holds it there, **the other delivers check**. Make the move.',
      doneText:
        "One rook **cuts off a rank** so the king can't cross it. The other checks and **pushes the king back**.",
      hintText: 'Not that one. **The other rook** delivers the check.',
      quizBoardHighlight: {
        arrows: [{ from: 'b6', to: 'e6', color: D17_CHECK }],
      },
      highlightRookRanks: true,
      noAutoAdvance: true,
      transitionText:
        'After every check, **the jobs swap**. The rook that just checked becomes the new cutoff. The other lines up the next check.',
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
        'The king is closing in on your rook. Slide that rook **as far from the king as possible**, along the same rank.',
      doneText:
        "Check too close and the king **captures your rook**. Keep the cutoff rook on the same rank, slid all the way across, **out of the king's reach**. Then you push it down another rank.",
      hintText:
        'Not that one. Slide it all the way across the rank, **away from the king**.',
      // Zasto NE Rb5+ - top bi dao sah, ali kralj na c5 stoji odmah pored i
      // prosto bi ga pojeo. Vidljivo ODMAH, pre bilo kog pokusaja.
      wrongPathPreview: {
        arrows: [{ from: 'b3', to: 'b5' }],
        squares: ['b5'],
      },
      highlightRookRanks: true,
      noAutoAdvance: true,
      transitionText:
        'Now finish it yourself. Same idea, **five moves to mate**.',
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
        'First, **cut off the king** when you can. Then split your rooks and **take turns checking**, all the way to mate.',
      hintText:
        'That could work too. Learn the method that **always gets you there** first.',
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
      doneText: 'You can checkmate with **two rooks** now. Every time.',
      celebrate: true,
    },
  ],
  endScreenButtons: [
    { label: 'Next Lesson', action: 'nextLesson' },
    { label: 'Repeat lesson', action: 'repeat' },
    { label: 'Done', action: 'done' },
  ],
};

const DAY_18_SECOND_GAME: Lesson = {
  id: 'l1-d18-second-game',
  level: 1,
  day: 18,
  title: 'Game 2.0',
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
  pawnyAvatar: '/pawny/pawny2.webp',
  steps: [
    {
      id: 'vs-pawny-2',
      kind: 'freePlay',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      orientation: 'w',
      solution: [],
      prompt: 'Your Second Game',
      introText: "Make your first move **whenever you're ready**.",
      hintText: '',
      doneText:
        "Second **real game** down. Still no puzzles, still no hints. That's the part that counts.",
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
    { label: 'Next Lesson', action: 'nextLesson' },
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
      introText:
        'This looks like a real race. Who gets a queen first? **Move fast**.',
      doneText: 'You got there first. **Queen takes queen**, race won.',
      hintText:
        "You have to be **fast** with your pawn. That's the only real way through.",
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
      doneText: 'Queen takes queen. You **won the race**.',
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
      hintText:
        "That doesn't keep you in the race. Try a square **closer to the pawn's path**.",
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
      introText:
        'Same idea, your turn to defend. **Catch the pawn** before it queens.',
      doneText: 'Pawn caught. You **stopped the promotion**.',
      hintText: "That doesn't get you **closer to the pawn**. Think again.",
      celebrate: true,
    },
  ],
  endScreenTitle: 'You are Pawn Promotion Master!',
  endScreenButtons: [
    { label: 'Next Lesson', action: 'nextLesson' },
    { label: 'Repeat lesson', action: 'repeat' },
    { label: 'Done', action: 'done' },
  ],
};

// Day 20 Phase 2 - linije dame koje drze "kutiju" oko kralja
const D20_BOX = 'rgba(17, 198, 209, 0.45)';
const D20_FREE = 'rgba(7, 218, 99, 0.55)';
const d20Box = (squares: string[], free: string[] = []) => ({
  squares: [
    ...squares.map((square) => ({ square, color: D20_BOX, fill: true })),
    ...free.map((square) => ({
      square,
      color: D20_FREE,
      fill: true,
      dot: true,
    })),
  ],
});
const D20_FINAL_BOX = d20Box(
  ['b5', 'b6', 'b7', 'b8', 'a6', 'a5'],
  ['a7', 'a8']
);

const DAY_20_DELIVER_MATE: Lesson = {
  id: 'l1-d20-deliver-mate',
  level: 1,
  day: 20,
  title: 'Promote & Checkmate',
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
        'b6c5', // 6...Kc5 (auto) - Phase 2 krece tacno odavde
      ],
      requireExactPromotion: true,
      moveExplanations: {
        8: "Take it. **Queen for queen**, and you're up a whole board.",
      },
      prompt: 'White to move: win the race',
      introText: 'Same idea as before. First queen wins the tempo. **Push**.',
      doneText:
        "Now finish it. **Corner the king**. Hint's there if you want it.",
      hintText: 'The only way to win this race: **push the pawn**.',
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
      id: 'phase2-box-mate',
      kind: 'puzzle',
      // Nastavak posle 6...Kc5 (Phase 1). Ceo niz verifikovan u chess.js:
      // nijedan beli potez nije sah do mata, nigde pat.
      fen: '8/8/8/2k3K1/8/8/8/Q7 w - - 1 7',
      orientation: 'w',
      solution: [
        'a1a4', // 7.Qa4
        'c5d6', // 7...Kd6
        'a4e4', // 8.Qe4
        'd6c5', // 8...Kc5
        'e4d3', // 9.Qd3
        'c5b4', // 9...Kb4
        'd3c2', // 10.Qc2
        'b4b5', // 10...Kb5
        'c2c3', // 11.Qc3
        'b5a6', // 11...Ka6
        'c3b4', // 12.Qb4
        'a6a7', // 12...Ka7
        'b4b5', // 13.Qb5
        'a7a8', // 13...Ka8
        // Kralj ka c7 bilo kojim putem (uvek 4 koraka); crni ima samo a8/a7
        `${KING_APPROACH}c7`, // 14.Kf6 (npr.)
        ANY_LEGAL_REPLY, // 14...Ka7
        `${KING_APPROACH}c7`, // 15.Ke7
        ANY_LEGAL_REPLY, // 15...Ka8
        `${KING_APPROACH}c7`, // 16.Kd7
        ANY_LEGAL_REPLY, // 16...Ka7
        `${KING_APPROACH}c7`, // 17.Kc7
        ANY_LEGAL_REPLY, // 17...Ka8
        'b5b7', // 18.Qb7#
      ],
      kingApproachWrongText:
        'Bring your **king closer** to the enemy king. Any route works, as long as each step gets nearer.',
      stalemateText:
        "Careful, that's **stalemate**. The king has no move and isn't in check. Leave him a square.",
      // Qb8# je takodje kiss of death (dama do kralja, cuva je Kc7)
      altMoves: { 22: ['b5b8'] },
      otherTypeMoves: {
        22: [
          ...['b5a4', 'b5a5', 'b5a6'].map((uci) => ({
            uci,
            message:
              "Super, that's checkmate too. Today we're learning the **kiss of death**, though: queen right next to the king, guarded by yours.",
          })),
          ...['b5b6', 'b5c5'].map((uci) => ({
            uci,
            message:
              "Careful, that's **stalemate**. The king has no move and isn't in check. Leave him a square until the mate.",
          })),
        ],
      },
      keepMoveHighlights: true,
      moveExplanations: {
        0: "No check, just a wall. Rank 4 is closed. The king **can't come down**.",
        2: "The queen sits a **knight's jump** from the king. He's boxed in, a5 to d8.",
        4: 'Same trick, smaller box. Only **files a to c** left.',
        6: 'Two files left. Keep **shadowing** him.',
        8: "He steps, you follow at a **knight's jump**.",
        10: "One file left. He's **on the edge**.",
        12: "**REMEMBER THIS, IT MATTERS!** This is the picture you want for every queen mate. The king has just **2 squares**, a7 and a8. Always leave him at least one, or it's **stalemate**. Now it's your king's turn. **King up!**",
        14: 'The queen holds the box alone. Keep walking toward **c7**.',
        16: 'Closer.',
        18: 'One more step.',
        20: 'Now the queen goes **right next to the king**, guarded by yours.',
      },
      moveHighlights: {
        0: d20Box([
          'a4',
          'b4',
          'c4',
          'd4',
          'e4',
          'f4',
          'g4',
          'h4',
          'a5',
          'a6',
          'a7',
          'a8',
        ]),
        2: d20Box(['e4', 'a4', 'b4', 'c4', 'd4', 'e5', 'e6', 'e7', 'e8']),
        4: d20Box(['d3', 'a3', 'b3', 'c3', 'd4', 'd5', 'd6', 'd7', 'd8']),
        6: d20Box(['c2', 'a2', 'b2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8']),
        8: d20Box(['c3', 'a3', 'b3', 'c4', 'c5', 'c6', 'c7', 'c8']),
        10: d20Box(['b4', 'a4', 'b5', 'b6', 'b7', 'b8']),
        12: D20_FINAL_BOX,
        14: D20_FINAL_BOX,
        16: D20_FINAL_BOX,
        18: D20_FINAL_BOX,
        20: D20_FINAL_BOX,
      },
      prompt: 'Checkmate with Queen + King',
      introText:
        'No checks. The queen **boxes the king in**, step by step. Then your king comes up.',
      hintText:
        "Not that one. Follow the plan: **box first, no checks**, then bring your king. Hint's there.",
      hintTextAlways: true,
      doneText:
        'Checkmate. The **kiss of death**: queen next to the king, guarded by yours.',
    },
  ],
  endScreenTitle: 'Congrats! You just delivered a checkmate!',
  endScreenButtons: [
    { label: 'Next Lesson', action: 'nextLesson' },
    { label: 'Repeat lesson', action: 'repeat' },
    { label: 'Done', action: 'done' },
  ],
};

/**
 * Day 21 "Opposition" - svi FEN-ovi/potezi nizu E/F verifikovani i preko
 * chess.js i preko Lichess tablebase API-ja (ne samo chess.js legalnost -
 * STVARAN ishod dobija/remi), ne samo prepisani iz tiketa. Otkriveno pri
 * verifikaciji: u E (i njenom zrcalu F), POSTOJI drugi pobednicki potez osim
 * ciste opozicije (Kd6/Ke3 - kralj ide direktno ispred sopstvenog pesaka) -
 * tiket bi ga generickom "to pusta kralja nazad" porukom pogresno opisao kao
 * gubitak partije, pa ima sopstvenu, iskrenu poruku (otherTypeMoves ispod).
 */
const DAY_21_OPPOSITION: Lesson = {
  id: 'l1-d21-opposition',
  level: 1,
  day: 21,
  title: 'King Opposition',
  piece: {
    name: 'opposition',
    glyph: '♚',
    movement: 'static',
    bannerText: 'Opposition',
  },
  intro: {
    title: 'Opposition',
    text: "Two kings, **one empty square** between them. Whoever has to move first **gives ground**. That's what decides who promotes a pawn, or who's shut out for good.",
  },
  flatProgressSegments: true,
  steps: [
    {
      id: 'a-parallel-concept',
      kind: 'quiz',
      fen: '8/8/4k3/8/4K3/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Opposition',
      introText:
        'This is **opposition**. Kings facing off, one empty square between them, **same file or rank**. Whoever has to move gives ground. That lost ground is what lets a pawn slip through, or keeps one shut out for good.',
      doneText: 'Opposition: **one square** between, same file or rank.',
      hintText: '',
      nextButtonText: 'Got it!',
    },
    {
      id: 'b-parallel-practice',
      kind: 'teach',
      fen: '8/8/4k3/8/8/4K3/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['e3e4'],
      prompt: 'Take the Opposition',
      introText: 'Play the move that takes the **opposition**.',
      doneText:
        "That's it. Same file, **one square gap**, black has to move next.",
      hintText:
        'Not lined up yet. Same file or rank, **one square** between the kings.',
      nextButtonText: 'Got it!',
    },
    {
      id: 'c-diagonal-concept',
      kind: 'quiz',
      fen: '8/8/5k2/8/3K4/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Diagonal Opposition',
      introText:
        "Opposition doesn't need to be in a straight line. **Same diagonal**, one square between them, works exactly the same way.",
      doneText: 'Opposition works on the **diagonal** too.',
      hintText: '',
      nextButtonText: 'Got it!',
    },
    {
      id: 'd-diagonal-practice',
      kind: 'teach',
      fen: '8/8/5k2/8/8/3K4/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['d3d4'],
      prompt: 'Find the Diagonal',
      introText: 'Now find the **diagonal opposition**.',
      doneText:
        "Same idea, different angle. The gap's **on the diagonal** now. Black still has to give way.",
      hintText:
        'Not on the diagonal yet. Same distance from the corner square, **one gap** between the kings.',
      nextButtonText: 'Got it!',
    },
    {
      id: 'e-pawn-white',
      kind: 'puzzle',
      fen: '2k5/8/8/2PK4/8/8/8/8 w - - 0 7',
      orientation: 'w',
      // d5c6 (user, paralelna opozicija - dobija, provereno tablebase),
      // c8b8 (crni, skriptovano - tiket bira bas ovu granu, ne adaptivno),
      // c6d7 (user - dostize key square, provereno tablebase kao najbrzi mat).
      solution: ['d5c6', 'c8b8', 'c6d7'],
      otherTypeMoves: {
        0: [
          {
            uci: 'd5e6',
            message:
              "Good, that's the other kind of opposition. We need **the parallel one** here to keep the king out.",
          },
          {
            uci: 'd5d6',
            message:
              "That still keeps the win, just not the opposition trick we're drilling. Try the move that **takes the opposition**.",
          },
        ],
      },
      prompt: 'Opposition Earns the Win',
      introText:
        "Here's why opposition actually matters! You've got the technique. Now use it: an extra pawn, and **opposition gets it home**.",
      moveExplanations: {
        0: "The king can't get back in front of the pawn now. **Attack c8** next. That's the square your pawn needs to promote. **Play Kd7**.",
      },
      quizBoardHighlight: {
        arrows: [{ from: 'c5', to: 'c8', color: CM_PROTECT }],
      },
      doneText:
        "Now there's a **clear path to promotion**. That's why opposition matters.",
      hintText:
        'That lets the king back in front of the pawn. Look for the move that **takes the opposition** instead.',
      nextButtonText: 'Got it!',
    },
    {
      id: 'f-pawn-black',
      kind: 'puzzle',
      fen: '8/8/8/8/3pk3/8/8/3K4 b - - 0 7',
      orientation: 'b',
      // e4d3 (user, paralelna opozicija - dobija, provereno tablebase),
      // d1e1 (belo, skriptovano), d3c2 (user - key square, provereno tablebase).
      solution: ['e4d3', 'd1e1', 'd3c2'],
      otherTypeMoves: {
        0: [
          {
            uci: 'e4f3',
            message:
              "Good, that's the other kind of opposition. We need **the parallel one** here.",
          },
          {
            uci: 'e4e3',
            message:
              "That still keeps the win, just not the opposition trick we're drilling. Try the move that **takes the opposition**.",
          },
        ],
      },
      prompt: 'Opposition Works Both Ways',
      introText:
        'Same idea, other side. Find the move that boots the white king **off d1**.',
      moveExplanations: {
        0: "Opposition doesn't care about color. Whoever takes it wins the tempo. **Attack d1** next. That's the square your pawn needs to promote. **Play Kc2**.",
      },
      quizBoardHighlight: {
        arrows: [{ from: 'd4', to: 'd1', color: CM_PROTECT }],
      },
      doneText:
        "Now there's a **clear path to promotion**. That's why opposition matters.",
      hintText:
        'That lets the white king slip back. Look for the move that **takes the opposition** instead.',
      nextButtonText: 'Got it!',
      celebrate: true,
    },
  ],
  endScreenButtons: [
    { label: 'Next Lesson', action: 'nextLesson' },
    { label: 'Repeat lesson', action: 'repeat' },
    { label: 'Done', action: 'done' },
  ],
};

/**
 * Day 22 "Material" - 9 FEN-ova verifikovani preko chess.js (sabran zbir
 * vrednosti figura, p1/n3/b3/r5/q9, poredjen sa tiketovim "tacan odgovor" za
 * svaki primer) - svi se poklapaju, bez korekcija.
 *
 * Dva uvodna popup-a (razlicit title) - umesto novog mehanizma, kombinacija
 * DVA VEC POSTOJECA: `intro`+`introSteps` (JEDNOclan niz, samo da dugme bude
 * "Next" umesto default "Let's start") za popup 1, pa `steps[0].preStepIntro`
 * (sopstveni title + `bullets` za vrednosti figura) za popup 2 - lanac je
 * automatski (loadStep nakon showIntro odmah provери preStepIntro na prvom
 * koraku). "Dizajn asset" za King=infinity nije dat (nema Figma linka) -
 * ovde je to prost Unicode "∞" karakter uz tekst, ne custom icon.
 *
 * Faza 1 (4 primera) je fiksnim redosledom; Faza 2 (5 primera, tacno jednom,
 * random redosled) koristi novo `Lesson.shuffleStepsFrom: 4`. Zato SVAKI od
 * tih 5 nosi IDENTICAN `doneText` (= tekst sa End Screen-a) - koji god od
 * njih slucajno ispadne poslednji (shuffle), to je tekst koji ce se prikazati
 * (DialogContainer cita `step.doneText` sa POSLEDNJEG koraka za End Screen
 * telo, ne poseban Lesson-level tekst).
 */
const MATERIAL_PROMPT = 'Who has the material advantage?';
const MATERIAL_HINT =
  "Pawn: 1. Knight: 3. Bishop: 3. Rook: 5. Queen: 9. King: can't be traded. Now do the math. Simple math for you.";
const MATERIAL_END_TEXT =
  "That's the first read in every position, before a single move gets played. More material, you press it. Less material, you find another plan. This is where strategy starts.";

function materialStep(
  id: string,
  fen: string,
  introText: string,
  correct: 'White' | 'Black'
): LessonStep {
  const correctIndex = correct === 'White' ? 0 : 1;
  const wrongColor = correct === 'White' ? 'Black' : 'White';
  return {
    id,
    kind: 'quiz',
    fen,
    orientation: 'w',
    solution: ['quiz'],
    prompt: MATERIAL_PROMPT,
    introText,
    quizOptions: ['White', 'Black'],
    quizCorrectIndex: correctIndex,
    // quizRetryOnWrong (isto kao Day 15 "Yes/No") - netacan odgovor NE
    // zavrsava primer, dugmad se otkljucaju, korisnik proba ponovo, bez
    // ogranicenja broja pokusaja (tiketov zahtev).
    quizRetryOnWrong: true,
    quizExplanationWrong: `Count again. I'm not convinced ${wrongColor}'s ahead there. **Pawn 1, knight 3, bishop 3, rook 5, queen 9.**`,
    extraHintText: MATERIAL_HINT,
    unlimitedQuizHint: true,
    // Vidi komentar iznad DAY_22 - End Screen telo cita doneText sa
    // POSLEDNJEG koraka, a koji je poslednji zavisi od shuffle-a.
    doneText: MATERIAL_END_TEXT,
    hintText: '',
  };
}

const DAY_22_MATERIAL: Lesson = {
  id: 'l1-d22-material',
  level: 1,
  day: 22,
  title: 'Material',
  piece: {
    name: 'material',
    glyph: '⚖',
    movement: 'static',
    bannerText: 'Material',
  },
  intro: {
    title: "What's a position evaluation?",
    text: "Every position has a score. Part of that score is **material**: who's holding more piece value. Today you learn to count it. Get it right and **you'll know what to play for** before you make a move.",
  },
  introSteps: [
    {
      text: "Every position has a score. Part of that score is **material**: who's holding more piece value. Today you learn to count it. Get it right and **you'll know what to play for** before you make a move.",
      buttonText: 'Next',
    },
  ],
  shuffleStepsFrom: 4,
  steps: [
    {
      ...materialStep(
        'warmup-1-pawns',
        '6k1/pp6/8/8/8/8/PPPP4/6K1 w - - 0 1',
        'Just pawns here. Count them.',
        'White'
      ),
      // Popup 2 ("Quick refresher") - prikazuje se PRE ovog, prvog koraka,
      // posle popup 1. Bullets = sam reminder vrednosti figura, bez custom
      // asset-a (vidi komentar iznad DAY_22).
      preStepIntro: {
        title: 'Quick refresher',
        text: "Here's what each piece is **worth**:",
        bullets: [
          '♙ Pawn: 1',
          '♘ Knight: 3',
          '♗ Bishop: 3',
          '♖ Rook: 5',
          '♕ Queen: 9',
          "♔ King: ∞ (can't be traded)",
        ],
        buttonText: "Let's Start",
      },
    },
    materialStep(
      'warmup-2-knight',
      '6k1/4p3/2n5/8/8/8/4P3/6K1 w - - 0 1',
      'One knight makes the difference. Spot it?',
      'Black'
    ),
    materialStep(
      'warmup-3-rook',
      '8/4pk2/3p1p2/2p5/5P2/1P3KP1/P7/3R4 w - - 0 1',
      'One rook says it all.',
      'White'
    ),
    materialStep(
      'warmup-4-bishop',
      '8/4p3/3pk3/2p5/1bP2P2/3P1K2/4P3/8 w - - 0 1',
      'One bishop tips the scale.',
      'Black'
    ),
    materialStep(
      'main-1-rooks',
      '1nb2rk1/pp3ppp/8/8/8/8/PP3PPP/1NBR1RK1 w - - 0 1',
      "Count the **rooks** first, this one's not close.",
      'White'
    ),
    materialStep(
      'main-2-hidden-bishop',
      'r1bq1rk1/ppp1bppp/2np1n2/4p3/4P3/2NP1N1P/PPP1BPP1/R2Q1RK1 w - - 0 1',
      "Don't just scan the center, check **every square**.",
      'Black'
    ),
    materialStep(
      'main-3-queen-vs-rooks',
      '3q2k1/ppp2ppp/8/8/8/8/PPP2PPP/R4RK1 w - - 0 1',
      'A queen against two rooks. **Numbers over feelings**.',
      'White'
    ),
    materialStep(
      'main-4-pawn',
      'r2q1rk1/pppb1ppp/2np1n2/8/1b1PP3/2N2NP1/PPP2PBP/R1BQR1K1 w - - 0 1',
      'Just **one extra pawn** can be the whole story.',
      'White'
    ),
    materialStep(
      'main-5-bishops-vs-rook',
      '3r2k1/pp4pp/8/8/8/8/PP4PP/2B2BK1 w - - 0 1',
      'Two bishops against one rook. **Add it up**.',
      'White'
    ),
  ],
  endScreenTitle: 'You count material now.',
  endScreenButtons: [
    { label: 'Next Lesson', action: 'nextLesson' },
    { label: 'Repeat lesson', action: 'repeat' },
    { label: 'Done', action: 'done' },
  ],
};

/**
 * Day 23 "Bridge" - cista informativna lekcija, BEZ sahovske table
 * (Lesson.boardless - vidi DailyLessonActivity.tsx za novi layout). Samo 3
 * Learn kartice: trading = `introSteps`, vrednosti figura i rokada =
 * `preStepIntro` ispred pitanja 3 i 8, 10 kviz pitanja = `steps` (kind:'quiz', bez quizRetryOnWrong - svaki klik, tacan
 * ili ne, ide dalje, standardan Next klik izmedju). `fen`/`orientation` na
 * svakom koraku su placeholderi (tip ih zahteva), nikad se ne prikazuju.
 *
 * Nekoliko tiketovih rečenica je imalo "but" usred kontrastne misli (Corner
 * rule - bez jastucnih reci) - zamenjeno sa "yet", bez promene smisla:
 * kartica 7 (en passant) i 2 od 10 score-tier poruka (4/10, 3/10, 5/10) -
 * ostalo preneto verbatim iz tiketa.
 */
const BRIDGE_PIECE_VALUES_BULLETS = [
  '♙ Pawn: 1',
  '♘ Knight: 3',
  '♗ Bishop: 3',
  '♖ Rook: 5',
  '♕ Queen: 9',
  "♔ King: ∞ (can't be traded)",
];
const BRIDGE_CORRECT_POOL = ["That's it.", 'Right.', "That's the one."];

function bridgeQuizStep(
  id: string,
  prompt: string,
  question: string,
  options: [string, string, string],
  correctIndex: 0 | 1 | 2,
  preStepIntro?: LessonStep['preStepIntro']
): LessonStep {
  return {
    id,
    kind: 'quiz',
    preStepIntro,
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    orientation: 'w',
    solution: ['quiz'],
    prompt,
    introText: question,
    quizOptions: options,
    quizCorrectIndex: correctIndex,
    quizCorrectFeedbackPool: BRIDGE_CORRECT_POOL,
    quizShowCorrectAnswerOnWrong: true,
    doneText: "Here's **how you did**.",
    hintText: '',
  };
}

const BRIDGE_CARD_VALUES: LessonStep['preStepIntro'] = {
  title: 'Quick refresher',
  text: "Here's what each piece is **worth**:",
  bullets: BRIDGE_PIECE_VALUES_BULLETS,
  buttonText: 'Got it',
};
const BRIDGE_CARD_CASTLING: LessonStep['preStepIntro'] = {
  title: 'Castling: yes or no',
  text: "You can castle if **neither the king nor that rook has moved**, nothing sits between them, and the king isn't in check, doesn't pass through check, and doesn't land in check. Break any of those, it's off the table.",
  buttonText: 'Got it',
};

const DAY_23_BRIDGE: Lesson = {
  id: 'l1-d23-bridge',
  level: 1,
  day: 23,
  title: 'Learn & Quiz Time',
  boardless: true,
  piece: {
    name: 'chess essentials',
    glyph: '♟',
    movement: 'static',
    bannerText: 'Chess Essentials',
  },
  intro: {
    title: 'Rule number 1: "Up material? Start trading."',
    text: "Fewer pieces on the board favors the side that's already ahead. Trade knights, bishops, rooks, queens. **Keep your pawns**, they're your endgame plan.",
  },
  introSteps: [
    {
      title: 'Rule number 1: "Up material? Start trading."',
      text: "Fewer pieces on the board favors the side that's already ahead. Trade knights, bishops, rooks, queens. **Keep your pawns**, they're your endgame plan.",
      buttonText: 'Start quiz',
    },
  ],
  steps: [
    bridgeQuizStep(
      'quiz-1-material',
      'Question 1 of 10',
      "You're **ahead in material**. What's usually the smart plan?",
      [
        'Trade pieces, keep your pawns',
        'Trade pawns, keep your pieces',
        'Avoid every trade',
      ],
      0
    ),
    bridgeQuizStep(
      'quiz-2-king-endgame',
      'Question 2 of 10',
      'When does the king become a **fighting piece**?',
      ['The opening', 'The middlegame', 'The endgame'],
      2
    ),
    bridgeQuizStep(
      'quiz-3-piece-value',
      'Question 3 of 10',
      'Which piece is **worth the most**?',
      ['Rook', 'Queen', 'Bishop'],
      1,
      BRIDGE_CARD_VALUES
    ),
    bridgeQuizStep(
      'quiz-4-origin',
      'Question 4 of 10',
      'Where did chess **originally come from**?',
      ['India', 'Italy', 'China'],
      0
    ),
    bridgeQuizStep(
      'quiz-5-ranks',
      'Question 5 of 10',
      'What do we call the rows that go **from 1 to 8** on the board?',
      ['Files', 'Ranks', 'Diagonals'],
      1
    ),
    bridgeQuizStep(
      'quiz-6-middlegame',
      'Question 6 of 10',
      'Which phase comes **right after the opening**?',
      ['Endgame', 'Middlegame', 'Checkmate'],
      1
    ),
    bridgeQuizStep(
      'quiz-7-promotion',
      'Question 7 of 10',
      "What's it called when your pawn **reaches the last rank** and becomes a queen?",
      ['En passant', 'Castling', 'Promotion'],
      2
    ),
    bridgeQuizStep(
      'quiz-8-castling',
      'Question 8 of 10',
      "You **can't castle** if...",
      [
        'Your king has already moved',
        'Your bishop already moved.',
        'You have more pawns than your opponent',
      ],
      0,
      BRIDGE_CARD_CASTLING
    ),
    bridgeQuizStep(
      'quiz-9-squares',
      'Question 9 of 10',
      'How many **squares** are on a chessboard?',
      ['32', '64', '100'],
      1
    ),
    bridgeQuizStep(
      'quiz-10-pawns',
      'Question 10 of 10',
      'How many **pawns** does each player start with?',
      ['6', '10', '8'],
      2
    ),
  ],
  scoreSummary: {
    stepIds: [
      'quiz-1-material',
      'quiz-2-king-endgame',
      'quiz-3-piece-value',
      'quiz-4-origin',
      'quiz-5-ranks',
      'quiz-6-middlegame',
      'quiz-7-promotion',
      'quiz-8-castling',
      'quiz-9-squares',
      'quiz-10-pawns',
    ],
    tiers: [
      {
        min: 10,
        title: 'Absolute genius',
        text: 'Absolute genius! Total chess mastery, **not a single wrong answer**!',
      },
      {
        min: 9,
        title: 'So close',
        text: 'So close! Just **one wrong answer** kept you from ultimate chess glory.',
      },
      {
        min: 8,
        title: 'Sharp mind',
        text: "Sharp mind! That's a **serious display** of chess knowledge.",
      },
      {
        min: 7,
        title: 'Solid score',
        text: 'Solid score! You clearly **know your chess stuff**, almost impressed!',
      },
      {
        min: 6,
        title: 'Not bad',
        text: 'Not bad! Your chess brain is definitely **starting to kick in**.',
      },
      {
        min: 5,
        title: 'Halfway there',
        text: 'Halfway there! Average score, yet we both know you can **push higher**.',
      },
      {
        min: 4,
        title: 'Ouch',
        text: 'Not a total disaster, yet your chess IQ is taking a hit. **Try again!**',
      },
      {
        min: 3,
        title: 'Keep practicing',
        text: 'Chess trivia is tough, yet you can definitely **do better** than this!',
      },
      {
        min: 2,
        title: 'Needs work',
        text: "Well, at least it's not a 1/10... barely! **Hit retry** and test your brain again.",
      },
      {
        min: 0,
        title: 'Back to the books',
        text: 'Ouch! Did you guess every answer with your eyes closed? Time to **open the books**!',
      },
    ],
  },
  endScreenButtons: [
    { label: 'Next Lesson', action: 'nextLesson' },
    { label: 'Repeat Quiz', action: 'repeat' },
    { label: 'Done', action: 'done' },
  ],
};

/**
 * Day 24 "Game 3" - treca prava Pawny partija, isti obrazac kao Day 14/18
 * (kind:'freePlay'). Pawny 3.0 avatar (slika koju je korisnica poslala,
 * sacuvana kao public/pawny/pawny3.webp).
 *
 * NAMERNO izostavljen "dinamicki opener" (prva poruka na osnovu STVARNOG
 * ishoda Game 2 za tog korisnika) - tiket sam predvidja ovaj fallback ako
 * podatak nije lako dostupan: "Ako to nije lako dostupno na backend-u...
 * fallback je da se prva poruka i dalje bira nasumicno iz pool-a". Provereno
 * citanjem koda (ne pogadjam): apps/chessroulette-web/prisma/schema.prisma
 * nema NIJEDAN model za ishod partije/lekcije po korisniku (samo
 * Account/Session/User/Chapter/Lesson/LessonTag - Lesson/LessonTag su za
 * drugaciju "Learn" opening funkciju, ne DailyLesson), a cela DailyLesson
 * progres/stanje je vec ustanovljeno kao session-only (Movex room state, ne
 * perzistira kroz lekcije - svaka lekcija je zaseban room/URL). Nema
 * backend endpoint-a niti bilo kakve postojece perzistencije da se ovo
 * precita pre starta Game 3 - ne izmisljam lazan/fake ishod. Pool od 15
 * poruka (dole) radi nepromenjeno, standardno nasumicno biranje bez
 * ponavljanja iste dva puta zaredom - ISTI generican mehanizam kao Day
 * 14/18, ne treba nista novo.
 *
 * Tiket pominje (ne kao Acceptance Criteria) da "treba razmisliti" o
 * 10-minutnom satu - korisnica je eksplicitno odlucila da ga NE zeli (ni
 * probni dodatak nije zadrzan) - partija ostaje netajmovana, isto kao Day
 * 14/18.
 */
const DAY_24_THIRD_GAME: Lesson = {
  id: 'l1-d24-third-game',
  level: 1,
  day: 24,
  title: 'Game 3.0',
  endScreenTitle: 'Third game complete.',
  piece: {
    name: 'third game',
    glyph: '♟',
    movement: 'mascot',
    bannerText: 'Pawny 3.0',
    subBannerText: 'Rated 200–400',
  },
  intro: {
    title: 'Time for Game 3',
    text: "Two games down against Pawny. This is the third, and **the sharpest yet**. Rated **200 to 400**. Let's see how close this one really is.",
  },
  introSteps: [
    {
      text: "Two games down against Pawny. This is the third, and **the sharpest yet**. Rated **200 to 400**. Let's see how close this one really is.",
      buttonText: 'Ready',
    },
  ],
  // Day 24 "Pawny 3.0" - novi avatar kroz ceo chat (isti princip kao Day 18
  // pawny2.webp).
  pawnyAvatar: '/pawny/pawny3.webp',
  steps: [
    {
      id: 'vs-pawny-3',
      kind: 'freePlay',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      orientation: 'w',
      solution: [],
      prompt: 'Game 3',
      introText: "Make your first move **whenever you're ready**.",
      hintText: '',
      doneText:
        "Third real game down. Still no puzzles, still no hints. **Three in a row** now, that's the part that counts.",
      // Nov, poseban pool - ne mesa se sa Day 14/18 pool-om (tiketov zahtev).
      freePlayMessages: [
        "Third game. I'm basically a veteran now.",
        'I actually knew that opening had a name this time.',
        "Two games taught me a few things. Let's see if I actually learned them.",
        "I still count on my fingers sometimes. Don't judge.",
        'This one I actually prepared for. Barely.',
        "Whatever the score is between us, today's the one that matters.",
        'Someone told me castling early is good. I did it. Feels weird.',
        "I've stopped hanging my queen in move ten. Progress.",
        "I've watched two of my own games back. Learned more than I expected.",
        "This board doesn't scare me anymore. The position still does.",
        "I know what a fork is now. Doesn't mean I can dodge one.",
        'Third game, same nerves, slightly better math.',
        "If this one goes sideways, I'm blaming the opening.",
        "I've read about the endgame. Reading and playing are different things.",
        "Two games made me stubborn, not smart. Let's go.",
      ],
      // Dalji korak u istom pravcu kao Day 14 (0.8) -> Day 18 (0.65) - "jos
      // ostriji" Pawny za Game 3 (tiket: +50 rtg na obe granice). Relativno
      // podesavanje, ISTA napomena kao Day 18 - nije verifikovana tacna rtg
      // kalibracija (nema formule koja ovaj broj povezuje sa rtg brojem).
      pawnyRandomMoveChance: 0.5,
    },
  ],
  endScreenButtons: [
    { label: 'Next Lesson', action: 'nextLesson' },
    { label: 'Play again', action: 'repeat' },
    { label: 'Done', action: 'done' },
    { label: 'Game Review', action: 'review' },
  ],
};

/**
 * Day 25 "Mate in One" - 5 jednopoteznih mat-zadataka, isti obrazac kao Day
 * 16 "Puzzle time!" (kind:'puzzle', jednoclan `solution`, `extraHintText` =
 * tiketov "Secret hint", standardni dvostepeni Hint - tier1 oznaci figuru
 * sa solution[0].from, tier2 doda strelicu - ne treba nista novo, isti
 * generican mehanizam kao svuda). Sve 5 pozicija nezavisno provereno preko
 * chess.js: legalne, nijedna nije vec u sahu, odigran potez je mat, I
 * (bitno, tiket to tvrdi) svaki je JEDINI legalan potez koji daje mat u toj
 * poziciji - potvrdjeno, bez korekcija.
 *
 * Tiket daje DVA razlicita teksta za trenutak zavrsetka 5. zagonetke - svoj
 * "On correct" red PO zagonetki ("Pawn holds the queen...") I poseban
 * "Completion screen" body ("Five mates, five patterns..."). Mehanizam ima
 * mesta za SAMO JEDAN (End Screen telo cita doneText POSLEDNJEG koraka, isti
 * princip kao Day 16/22/23) - zadrzala sam Completion screen tekst (on se
 * stvarno vidi u End Screen popup-u), ne obe verzije.
 */
const DAY_25_MATE_IN_ONE: Lesson = {
  id: 'l1-d25-mate-in-one',
  level: 1,
  day: 25,
  title: 'Checkmate in One with the Queen',
  endScreenTitle: '5 for 5.',
  flatProgressSegments: true,
  piece: {
    name: 'mate in one',
    glyph: '♕',
    movement: 'static',
    bannerText: 'Mate in One',
  },
  intro: {
    title: 'Mate in one',
    text: "Five positions, **one move each**. Your job: **find checkmate**. Tap the piece, then tap the square it mates from. Stuck? The hint's always there.",
  },
  introSteps: [
    {
      text: "Five positions, **one move each**. Your job: **find checkmate**. Tap the piece, then tap the square it mates from. Stuck? The hint's always there.",
      buttonText: 'Deliver Mate!',
    },
  ],
  steps: [
    {
      id: 'p1-back-rank',
      kind: 'puzzle',
      fen: '6k1/5ppp/8/8/8/8/4Q3/K7 w - - 0 1',
      orientation: 'w',
      solution: ['e2e8'],
      prompt: 'Queen mates on the back rank',
      introText:
        'Find the move that ends it. **His own pawns** are in the way.',
      doneText: "King's **out of moves**. Mate.",
      hintText: "Not yet. Look at what's **blocking his own escape**.",
      extraHintText:
        "His pawns never left home. Now they're the trap. Check the **back rank**.",
    },
    {
      id: 'p2-knight-support',
      kind: 'puzzle',
      fen: 'k7/8/8/N7/8/1Q6/8/4K3 w - - 0 1',
      orientation: 'w',
      solution: ['b3b7'],
      prompt: 'Queen mates with knight support',
      introText: "One move. Your knight's **already helping**.",
      doneText: "Not one square left. **That's mate.**",
      hintText: 'Not that square. The **knight** already covers one side.',
      extraHintText:
        'The knight already covers his escape. Find the **queen move** that finishes it.',
    },
    {
      id: 'p3-bishop-mate',
      kind: 'puzzle',
      fen: '7k/Q7/8/8/8/8/8/KB6 w - - 0 1',
      orientation: 'w',
      solution: ['a7h7'],
      prompt: 'Queen and bishop mate',
      introText: "One move finishes this. Your bishop's **lined up**.",
      doneText: 'Queen and bishop **close the door**. Mate.',
      hintText: 'Not quite. Your **bishop** already does half the work.',
      extraHintText:
        "Your bishop's already lined up. Bring the **queen in behind it**.",
    },
    {
      id: 'p4-rook-mate',
      kind: 'puzzle',
      fen: '7k/8/8/8/Q7/8/8/K5R1 w - - 0 1',
      orientation: 'w',
      solution: ['a4h4'],
      prompt: 'Queen and rook mate',
      introText: 'One move. Your rook already **cuts off an escape**.',
      doneText: 'Rook cuts, **queen finishes**. Mate.',
      hintText: 'Not that one. The **rook** already holds one side.',
      extraHintText:
        'The rook already cut off one side. **Queen takes the other.**',
    },
    {
      id: 'p5-pawn-mate',
      kind: 'puzzle',
      fen: 'k7/8/P7/8/8/8/8/1Q2K3 w - - 0 1',
      orientation: 'w',
      solution: ['b1b7'],
      prompt: 'Queen and pawn mate',
      introText: "One move. That pawn's doing **more than you think**.",
      doneText:
        'Five mates, five patterns, **one queen**. You found the move each time.',
      hintText: 'Not yet. One **pawn** already does half the job.',
      extraHintText: 'One pawn, one queen, **nowhere for the king** to go.',
    },
  ],
  endScreenButtons: [
    { label: 'Next Lesson', action: 'nextLesson' },
    { label: 'Done', action: 'done' },
    { label: 'Repeat', action: 'repeat' },
  ],
};

/**
 * Day 26 "Perpetual Check" - tiket je oznacen kao "Day 25" (isti broj kao
 * prethodna lekcija) - ocigledna greska u numeraciji, nastavljam redosled
 * kao Day 26.
 *
 * Svo troje FEN-ova + skriptovane linije nezavisno provereno preko chess.js
 * (legalnost, sah na svakom potezu korisnika, nijedan korak slucajno mat/pat,
 * stvarna threefold repeticija na Primeru 2 - chess.js.isThreefoldRepetition()
 * === true). Primeri 1 i 3 (7 sahova) nisu provereni kroz DOSLOVNU
 * ponovljenu liniju (tiket daje samo delimican obrazac), nego kroz pravi
 * minimax: POSTOJI damin niz poteza koji garantuje 7 ciklusa saha BEZ MATA,
 * bez obzira KOJE legalno bekstvo kralj odabere u svakom koraku - jaca
 * garancija od "ova tacna linija radi", jer korisnik sme da odigra BILO KOJI
 * legalan sah (tiketov zahtev), ne samo kanonski.
 *
 * `requireLegalCheck` + ANY_LEGAL_CHECK/ANY_LEGAL_REPLY (vidi definicije) -
 * genericki mehanizam izgradjen za ovu lekciju: BILO KOJI legalan sah je
 * tacan potez (ne fiksno polje), protivnik (kralj) odgovara BILO KOJIM
 * legalnim potezom (uvek jedini legalan je bekstvo kraljem - provereno,
 * nijedna druga crna figura nikad nema legalan potez dok je kralj u sahu u
 * ovim pozicijama), a Hint strelica se racuna UZIVO (findSafeCheckMove,
 * lokalan minimax) jer fiksna "kanonska" linija prestaje da vazi cim kralj
 * (ili user) jednom odstupi od nje.
 *
 * "Highlight 6th rank" iz tiketovog opisa Primera 3 (vizuelno isticanje
 * celog 6. reda) NIJE dodato - nema postojeceg "highlight odmah pri
 * ucitavanju" mehanizma za puzzle korake van wrongPathPreview (semanticki
 * pogresna boja/svrha za ovo) - tekst vec kaze "along the 6th rank", nije u
 * Acceptance Criteria, pa nisam gradila nov mehanizam za to.
 */
function perpetualCheckSolution(checks: number): string[] {
  const arr: string[] = [];
  for (let i = 0; i < checks; i++) {
    arr.push(ANY_LEGAL_CHECK);
    if (i < checks - 1) arr.push(ANY_LEGAL_REPLY);
  }
  return arr;
}

const DAY_26_PERPETUAL_CHECK: Lesson = {
  id: 'l1-d26-perpetual-check',
  level: 1,
  day: 26,
  title: 'Perpetual Check',
  endScreenTitle: "That's perpetual check.",
  piece: {
    name: 'perpetual check',
    glyph: '♛',
    movement: 'static',
    bannerText: 'Perpetual Check',
  },
  intro: {
    title: 'Perpetual check',
    text: 'Check the king again and again. If it can never get away, **neither side can make progress**. That forces a draw. This is a **perpetual check**.',
  },
  introSteps: [
    {
      text: 'Check the king again and again. If it can never get away, **neither side can make progress**. That forces a draw. This is a **perpetual check**.',
      buttonText: "Let's go",
    },
  ],
  steps: [
    {
      id: 'example1-lone-king',
      kind: 'puzzle',
      fen: '6k1/8/8/8/4Q3/8/8/K7 w - - 0 1',
      orientation: 'w',
      solution: perpetualCheckSolution(7),
      requireLegalCheck: true,
      prompt: 'The queen alone chases a king with nowhere to hide',
      introText:
        "The queen alone chases this king, and **any check works**. Give check, over and over - that's the whole idea.",
      doneText:
        "Why perpetual check? When you're **down on material**, a draw is a good result. Now see it in real positions.",
      hintText:
        "The point: **check the king again and again**. Press Hint if you're stuck.",
      hintTextAlways: true,
      unsafeCheckText:
        "That's a check, just not the safe one. Find the check that keeps the king running forever.",
      extraHintText: 'Any legal check works here. **Keep the king running.**',
      nextButtonText: "Let's go!",
    },
    {
      id: 'example2-down-material',
      kind: 'puzzle',
      fen: '6k1/1pp3p1/p1n5/4b2Q/8/8/1r1r4/6K1 w - - 0 1',
      orientation: 'w',
      solution: perpetualCheckSolution(4),
      requireLegalCheck: true,
      prompt: 'Down material, saving half a point with a perpetual',
      introText:
        "Black is up in material. You're not winning this one. **The draw is sitting right here**. Don't let the king breathe.",
      doneText:
        "Same two squares, over and over. Black can't stop it. **Draw by repetition.**",
      hintText:
        "That's not check. Down this much material, **check is all you've got**. Try again, or use Hint.",
      hintTextAlways: true,
      unsafeCheckText:
        "That's a check, just not the one that holds the draw. Stick to the safe square.",
      extraHintText:
        'One of **two squares** keeps this going. Hint shows you which.',
    },
    {
      id: 'example3-sixth-rank',
      kind: 'puzzle',
      fen: '1k4rr/8/7b/7p/3Q1p2/7P/6P1/7K w - - 0 1',
      orientation: 'w',
      solution: perpetualCheckSolution(7),
      requireLegalCheck: true,
      prompt: 'A perpetual check along the 6th rank',
      introText:
        'Find the perpetual check along **the 6th rank**. Black is stronger on material here, and a draw would suit you. Just dance along the 6th rank.',
      doneText:
        'Check, check, check. The king **never gets a say**. Three examples, one pattern.',
      hintText:
        'Not check. Black is ahead on material. Stay on the **6th rank** and keep checking.',
      hintTextAlways: true,
      unsafeCheckText:
        "That's a check, just not the one that keeps the dance going. Find the safe square on the 6th rank.",
      extraHintText:
        'Stay on the **6th rank**. Hint shows you the exact square.',
    },
  ],
  endScreenButtons: [
    { label: 'Next Lesson', action: 'nextLesson' },
    { label: 'Done', action: 'done' },
    { label: 'Repeat', action: 'repeat' },
  ],
};

/**
 * Day 27 "Chess Notation" - tiket je oznacen kao "Day 26" (isti broj kao
 * prethodna lekcija) - ocigledna greska u numeraciji, nastavljam kao Day 27.
 *
 * Sva 3 dela (A/B/C, 16 primera ukupno) NEMAJU auto-advance (`noAutoAdvance`
 * na svakom koraku) - korisnica eksplicitno trazila rucni Next klik svuda,
 * da stigne da pročita objasnjenje (prvobitno je bio auto-advance na tacan
 * odgovor, ukinut na njen zahtev). 4 kratke prelazne poruke (pocetna +
 * izmedju B/C + dve unutar C-ovog uvoda) NISU racunate u "16/16" traci
 * (vidi LessonStep.excludeFromProgress - nov, generican mehanizam).
 *
 * Deo B (markSquares) i netacan odgovor u Delu A/C - obelezavaju POGRESNO
 * izabrano polje na tabli (plavi okvir + crvena tackica - vidi
 * wrongMarkedSquare u DailyLessonActivity.tsx), uz TACNO polje istovremeno
 * (zeleno/zuto fill + plava tackica, `quizBoardHighlight`). Jedan pokusaj -
 * korak se odmah zavrsava i na netacan odgovor, korisnik bira kad ide dalje.
 */
// Puna (fill, ne outline) zuta pozadina za "koje je ovo polje" oznake -
// korisnica trazila, tanak 3px okvir se slabo video na praznoj tabli.
const NOTATION_SQUARE_FILL_COLOR = 'rgba(255, 199, 0, 0.55)';

function notationSquareQuiz(
  id: string,
  highlightSquare: string,
  options: [string, string],
  correctIndex: 0 | 1
): LessonStep {
  return {
    id,
    kind: 'quiz',
    fen: '8/8/8/8/8/8/8/8 w - - 0 1',
    orientation: 'w',
    solution: ['quiz'],
    prompt: 'Name the square',
    introText: "What's this square **called**?",
    quizOptions: options,
    quizCorrectIndex: correctIndex,
    // BEZ quizRetryOnWrong - jedan pokusaj, kao Deo B (korisnica eksplicitno
    // trazila da pogresan odgovor ne dozvoljava dalje pogadjanje, samo
    // oznacavanje pogresnog/tacnog polja na tabli pa rucni Next).
    quizExplanation: `Right. That's ${options[correctIndex]}.`,
    quizExplanationWrong:
      "Read it in **two steps**: find the letter below the square, then the number beside it. That's your square.",
    // Puna zuta pozadina (fill, ne outline) - korisnica trazila, tanak okvir
    // se slabo video na praznoj tabli. Zuta i ne plava/zelena - ovo je sam
    // PREDMET pitanja (prikazano UNAPRED, pre bilo kog odgovora), ne potvrda
    // tacnog odgovora.
    quizBoardHighlight: {
      squares: [
        {
          square: highlightSquare,
          color: NOTATION_SQUARE_FILL_COLOR,
          fill: true,
          dot: true,
        },
      ],
    },
    quizBoardHighlightUpfront: true,
    // Bez auto-advance-a - korisnica eksplicitno trazila rucni Next klik
    // kroz celu lekciju, da stigne da pročita objasnjenje.
    noAutoAdvance: true,
    // Slovo+broj animacija (vidi LessonStep.revealSquareAnimation) - i na
    // tacan i na netacan odgovor, korisnicin eksplicitan zahtev.
    revealSquareAnimation: true,
    doneText: 'Square named.',
    hintText: '',
  };
}

function notationFindSquare(
  id: string,
  targetSquare: string,
  introText: string,
  overrides: Partial<LessonStep> = {}
): LessonStep {
  return {
    id,
    kind: 'markSquares',
    fen: '8/8/8/8/8/8/8/8 w - - 0 1',
    orientation: 'w',
    solution: [targetSquare],
    prompt: 'Find the square',
    introText,
    // Bez strelica (korisnicin eksplicitan zahtev) - pogresno obelezeno
    // polje se vec vidi samo po sebi (plavi okvir + crvena tackica, vidi
    // wrongMarkedSquare u DailyLessonActivity.tsx), ovaj tekst samo
    // objasnjava METODU citanja koordinata. Korak se ODMAH zavrsava i na
    // netacan pokusaj (korisnik mora moci da klikne Next, ne ceka se drugi
    // pokusaj) - vidi finalizeMarkAttempt u DailyLessonActivity.tsx.
    firstMissText:
      "Let's read this one together. Follow the rank across, and the file up. Where they cross, that's your square.",
    retryPromptText: "Here's **the square**. Take a look, then we move on.",
    // Fill, ne outline - isti razlog kao gore (Part A) - bolje se vidi.
    quizBoardHighlight: {
      squares: [
        { square: targetSquare, color: '#07DA63', fill: true, dot: true },
      ],
    },
    // Slovo+broj animacija (vidi LessonStep.revealSquareAnimation) - i na
    // tacan i na netacan odgovor, korisnicin eksplicitan zahtev.
    revealSquareAnimation: true,
    doneText: "That's it. **Next square.**",
    hintText: '',
    ...overrides,
  };
}

function notationWriteMove(
  id: string,
  fen: string,
  moveUci: string,
  introText: string,
  options: [string, string],
  overrides: Partial<LessonStep> = {}
): LessonStep {
  return {
    id,
    kind: 'quiz',
    // `fen` je POLAZNA pozicija (figura na polazno polje, NE na odrediste) -
    // tabla stvarno odigra `moveUci` cim se korak ucita, korisnica trazila
    // da vidi PRAVI potez (npr. konj Ng1-f3), ne gotovu poziciju.
    fen,
    orientation: 'w',
    solution: ['quiz'],
    prompt: 'Write the move',
    introText,
    // LessonStep.playMoveOnLoad - odigraj potez CIM se korak ucita, pre bilo
    // kog odgovora (vidi beginStep u DailyLessonActivity.tsx).
    playMoveOnLoad: moveUci,
    quizOptions: options,
    quizCorrectIndex: 0,
    // BEZ quizRetryOnWrong - jedan pokusaj (vidi notationSquareQuiz iznad).
    quizExplanation: 'Right.',
    quizExplanationWrong:
      'Read it again: **letter below, number beside**. Where they cross is your square. Only one option matches.',
    // Bez auto-advance-a - korisnica eksplicitno trazila rucni Next klik
    // kroz celu lekciju, da stigne da pročita objasnjenje.
    noAutoAdvance: true,
    // Slovo+broj animacija na POLJU iz tacne notacije (npr. "Nf3" -> f3) -
    // vidi LessonStep.revealSquareAnimation.
    revealSquareAnimation: true,
    doneText: 'Move written.',
    hintText: '',
    ...overrides,
  };
}

const DAY_27_CHESS_NOTATION: Lesson = {
  id: 'l1-d27-chess-notation',
  level: 1,
  day: 27,
  title: 'Chess Notation',
  endScreenTitle: 'You can read the board now.',
  flatProgressSegments: true,
  piece: {
    name: 'chess notation',
    glyph: '♟',
    movement: 'static',
    bannerText: 'Chess Notation',
  },
  intro: {
    title: 'Chess notation',
    text: 'The board is built from files, A to H, and ranks, 1 to 8. Put them together and every square gets its own name: **a first name** (the letter) and **a last name** (the number).',
  },
  introSteps: [
    {
      text: 'The board is built from files, A to H, and ranks, 1 to 8. Put them together and every square gets its own name: **a first name** (the letter) and **a last name** (the number).',
      buttonText: "Let's learn!",
    },
  ],
  steps: [
    // ---------- Opening chat message (not counted in 16/16) ----------
    {
      id: 'intro-why-notation',
      kind: 'quiz',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Chess notation',
      introText:
        "Notation isn't just for writing moves down. It's how you **see the whole board in your head**, and count moves ahead before you touch a piece.",
      doneText: "Let's get started.",
      hintText: '',
      nextButtonText: "Let's go!",
      excludeFromProgress: true,
    },
    // ---------- Part A - name the highlighted square (5) ----------
    notationSquareQuiz('a1-name-e4', 'e4', ['e5', 'e4'], 1),
    notationSquareQuiz('a2-name-a1', 'a1', ['a1', 'a8'], 0),
    notationSquareQuiz('a3-name-h8', 'h8', ['a8', 'h8'], 1),
    notationSquareQuiz('a4-name-c6', 'c6', ['c6', 'c5'], 0),
    notationSquareQuiz('a5-name-f2', 'f2', ['f7', 'f2'], 1),
    // ---------- Part B - find and mark the named square (5) ----------
    notationFindSquare(
      'b1-find-d5',
      'd5',
      "Now I'll give you the square. Find it on the board and mark it for me, right-click it on desktop, or tap it if you're on mobile. Find **d5**."
    ),
    notationFindSquare('b2-find-b3', 'b3', 'Find **b3**.'),
    notationFindSquare('b3-find-g7', 'g7', 'Find **g7**.'),
    notationFindSquare('b4-find-a4', 'a4', 'Find **a4**.'),
    notationFindSquare('b5-find-h1', 'h1', 'Find **h1**.', {
      transitionText: 'Now you learn how to **write moves**.',
      nextButtonText: 'Yeah!',
    }),
    // ---------- Part C intro (not counted in 16/16) ----------
    {
      id: 'c-intro-letters',
      kind: 'quiz',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Writing moves',
      introText:
        'In notation: King is **K**, Queen **Q**, Rook **R**, Bishop **B**, Knight **N**. Pawns get **no letter**, just the square they land on. Clear?',
      doneText: 'Clear.',
      hintText: '',
      nextButtonText: 'Got it!',
      excludeFromProgress: true,
    },
    {
      id: 'c-intro-order',
      kind: 'quiz',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Writing moves',
      introText:
        "Now that's clear, let's learn the order: first write the piece letter, then the file letter, then the rank number. An example is **Qd2**. Ready?",
      doneText: 'Ready.',
      hintText: '',
      nextButtonText: 'Yeap!',
      excludeFromProgress: true,
    },
    // ---------- Part C - write the move (6, one per piece) ----------
    // FEN je polazna pozicija (figura na polaznom polju) - svaka od ovih
    // odigra pravi potez (g1-f3, e6-h3, f1-g2, a2-a4, b1-d1, f1-g1) cim se
    // korak ucita. BAG otkriven uzivo (korisnica prijavila da NIJEDNA figura
    // nije vidljiva ni u jednom primeru) - koren je u deljenoj biblioteci
    // (ChessFENBoard.validateFenString, util-kit): SVAKA pozicija koja ima
    // bar jednu figuru (nije cisto prazna tabla) prolazi kroz chess.js
    // .load(), koji BACA gresku "missing king" bez oba kralja, pa
    // 'loadedChapter:import' tiho odbija FEN i tabla ostaje na STAROJ
    // (praznoj) poziciji. Popravka OVDE, u lekciji, ne u deljenoj biblioteci
    // (ta izmena bi trazila Dragutinovo odobrenje) - svaki primer sad ima
    // oba kralja, zbijena u uglove van puta demonstrirane figure, sto
    // zadovoljava chess.js validaciju bez diranja zajednickog koda. Svih 6
    // poteza ponovo verifikovano kao legalni (chess.js) SA kraljevima.
    notationWriteMove(
      'c1-knight-f3',
      'k7/8/8/8/8/8/8/K5N1 w - - 0 1',
      'g1f3',
      'The knight just landed on f3. How would you write this move?',
      ['Nc7', 'Nf3'],
      { quizCorrectIndex: 1 }
    ),
    notationWriteMove(
      'c2-queen-h3',
      'k7/8/4Q3/8/8/8/8/K7 w - - 0 1',
      'e6h3',
      'The queen just landed on h3. How would you write this move?',
      ['Qh3', 'Qe6']
    ),
    notationWriteMove(
      'c3-bishop-g2',
      'k7/8/8/8/8/8/8/K4B2 w - - 0 1',
      'f1g2',
      'The bishop just landed on g2. How would you write this move?',
      ['Bb7', 'Bg2'],
      { quizCorrectIndex: 1 }
    ),
    notationWriteMove(
      'c4-pawn-a4',
      '7k/8/8/8/8/8/P7/7K w - - 0 1',
      'a2a4',
      'With pawns, remember: you never write a letter first, just the square it lands on. How would you write this move?',
      ['a4', 'Pa4'],
      {
        quizExplanationWrong:
          'Pawns **never get a letter** in notation, just their square.',
      }
    ),
    notationWriteMove(
      'c5-rook-d1',
      // top na b1, ne a1 - sa a1 bi vec davao sah kralju na a8
      'k7/8/8/8/8/8/8/1R5K w - - 0 1',
      'b1d1',
      'The rook just landed on d1. How would you write this move?',
      ['Rd8', 'Rd1'],
      { quizCorrectIndex: 1 }
    ),
    notationWriteMove(
      'c6-king-g1',
      'k7/8/8/8/8/8/8/5K2 w - - 0 1',
      'f1g1',
      'The king just landed on g1. How would you write this move?',
      ['Kg1', 'Kg8'],
      {
        celebrate: true,
        doneText:
          "Every square has a name. Every move has a notation. That's **the whole language**.",
      }
    ),
  ],
  endScreenButtons: [
    { label: 'Next Lesson', action: 'nextLesson' },
    { label: 'Repeat', action: 'repeat' },
    { label: 'Done', action: 'done' },
  ],
};

/**
 * Day 28 "My First Opening with White - London" - tiket eksplicitno trazi
 * ponasanje istovetno postojecem London System ucenju u LearnAi aktivnosti
 * (openingDatabase.ts), samo uklopljeno u DailyLesson format (popup na
 * pocetku, zavrsni ekran sa Test Opening/Done/Play umesto standardnog).
 * Potezi se CITAJU odavde (ne prekucavaju), jedini izvor istine za liniju -
 * ponovo verifikovano chess.js da je svih 17 poteza legalno. Prozni opisi su
 * ipak nasi (vidi napomenu uz import iznad).
 */
const LONDON_MAIN_LINE: string[] =
  OPENING_DATABASE.find((f) => f.name === 'London System')?.variants.find(
    (v) => v.variantName === 'Main Line'
  )?.moves ?? [];

const DAY_28_FIRST_OPENING: Lesson = {
  id: 'l1-d28-first-opening-london',
  level: 1,
  day: 28,
  title: 'My First Opening with White - London',
  endScreenTitle: 'You played your first opening! 🎉',
  piece: {
    name: 'the London System',
    glyph: '♗',
    movement: 'static',
    bannerText: 'Your First Opening',
  },
  intro: {
    title: 'Your First Opening',
    text: "Now you're a real Player. It's time to learn the first moves of **an opening**. Let's start with a simple one and learn step by step!",
  },
  introSteps: [
    {
      text: "Now you're a real Player. It's time to learn the first moves of **an opening**. Let's start with a simple one and learn step by step!",
      buttonText: 'Start',
    },
  ],
  steps: [
    {
      id: 'guided-london',
      kind: 'puzzle',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      orientation: 'w',
      solution: LONDON_MAIN_LINE,
      showSolutionArrowUpfront: true,
      revealArrowOnWrongMove: true,
      prompt: 'Your First Opening: The London System',
      introText:
        "Let's play it together, **one move at a time**. Follow the arrow, I'll take care of Black.",
      hintText: "Not quite. Follow **the London System's** plan.",
      illegalMoveText:
        "That's an **illegal move**. Follow the London System line. Stuck? Tap **Hint**.",
      // Pise se posle KORISNIKOVOG (belog) poteza, kad je crni auto-odgovor
      // vec odigran - indeks prati solution[] (parni = beli potezi).
      moveExplanations: {
        0: '**The London System** starts in the center. Both sides grab a central pawn right away.',
        2: 'Knights **develop** first, nothing fancy yet.',
        4: "The bishop leaves home for **f4** before the e-pawn can box it in. That's the whole point of the London. Black opens a path for the other bishop.",
        6: 'White **supports the center**. Black develops, eyeing the bishop on f4.',
        8: 'Rather than trade it off, the bishop steps back to **g3**. Black castles into safety.',
        10: 'The last knight joins in. Black strikes back at the center with **c5**.',
        12: 'White **reinforces d4**. Black finishes developing.',
        14: 'The other bishop joins the game. Black **trades off** the one on g3.',
      },
      doneText:
        "You just played a complete London System, from the first pawn move to a safe, developed position. **Castled king, solid center, every piece in play.** That's a real opening.",
      transitionText:
        "Now let's see if it stuck. Same opening, this time **from memory**.",
    },
    {
      id: 'test-london',
      kind: 'puzzle',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      orientation: 'w',
      solution: LONDON_MAIN_LINE,
      // BEZ strelice unapred - ovo je test, ne vodjenje. Hint dugme (standardni
      // dvostepeni sistem) ostaje dostupno ako zatreba.
      prompt: 'Test Yourself: The London System',
      introText:
        "Let's see if it stuck. Play the same opening again, this time **from memory**. I'll take care of Black.",
      hintText: 'Think back to the **pattern** you just played.',
      illegalMoveText:
        "That's an **illegal move**. Follow the London System line. Stuck? Tap **Hint**.",
      doneText: 'You know **the London System** now. That line is yours.',
    },
  ],
  testStepId: 'test-london',
  endScreenButtons: [
    { label: 'Next Lesson', action: 'nextLesson' },
    { label: 'Test Opening', action: 'testOpening' },
    { label: 'Done', action: 'done' },
  ],
};

/**
 * Day 29 "My First Opening with Black - Caro-Kann" - isti princip kao Day
 * 28 (vidi napomene tamo), samo orijentacija 'b' (korisnik igra crnog,
 * belo prvi potez automatski odigra engine - isti generican mehanizam kao
 * puzzle koraci gde prvi potez pripada protivniku, vidi beginStep). Nema
 * "Main Line" varijante u bazi za Caro-Kann, pa je izabrana 'Classical
 * Variation' (B18) - najpoznatija/udzbenicka linija koja pokazuje PRAVU
 * ideju otvaranja (lovac izlazi na f5 PRE e6, izbegavajuci francusku manu).
 * 19 poteza, ponovo verifikovano chess.js.
 */
const CARO_KANN_CLASSICAL_LINE: string[] =
  OPENING_DATABASE.find((f) => f.name === 'Caro-Kann Defense')?.variants.find(
    (v) => v.variantName === 'Classical Variation'
  )?.moves ?? [];

const DAY_29_FIRST_OPENING_BLACK: Lesson = {
  id: 'l1-d29-first-opening-caro-kann',
  level: 1,
  day: 29,
  title: 'My First Opening with Black - Caro-Kann',
  endScreenTitle: 'You played your first opening as Black! 🎉',
  piece: {
    name: 'the Caro-Kann Defense',
    glyph: '♝',
    movement: 'static',
    bannerText: 'Your First Opening (Black)',
  },
  intro: {
    title: 'Your First Opening with Black',
    text: "You've learned your first moves with White, but now let's do **Black**. Easy and simple, as always!",
  },
  introSteps: [
    {
      text: "You've learned your first moves with White, but now let's do **Black**. Easy and simple, as always!",
      buttonText: 'Start',
    },
  ],
  steps: [
    {
      id: 'guided-caro-kann',
      kind: 'puzzle',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      orientation: 'b',
      solution: CARO_KANN_CLASSICAL_LINE,
      showSolutionArrowUpfront: true,
      revealArrowOnWrongMove: true,
      prompt: 'Your First Opening: The Caro-Kann Defense',
      introText:
        "Let's play it together, **one move at a time**. Follow the arrow, I'll take care of White.",
      hintText: "Not quite. Follow **the Caro-Kann's** plan.",
      illegalMoveText:
        "That's an **illegal move**. Follow the Caro-Kann line. Stuck? Tap **Hint**.",
      // Pise se posle KORISNIKOVOG (crnog) poteza, kad je beli auto-odgovor
      // vec odigran - indeks prati solution[] (neparni = crni potezi, prvi
      // potez 0 je belog i vec je auto-odigran pre nego sto korisnik i
      // pocne).
      moveExplanations: {
        1: '**The Caro-Kann** starts with c6, preparing ...d5 without blocking the light-squared bishop, the usual problem in the French. White claims more center with d4.',
        3: 'Black strikes the center with **d5**. White develops a knight, adding pressure on that pawn.',
        5: 'Black trades on e4. White recaptures with the knight, **centralizing** it.',
        7: "The whole point of the Caro-Kann: the bishop gets out to **f5** before e6 locks it in. White's knight hops to g3, eyeing the bishop.",
        9: 'The bishop tucks back to g6, out of reach. White starts **pushing the h-pawn**, gaining space and eyeing the bishop.',
        11: "Black plays h6, a useful little move that keeps White's pieces out of g5. White develops the other knight.",
        13: 'Black brings out a knight. White pushes the h-pawn again, **attacking the bishop**.',
        15: 'The bishop retreats once more, to h7. White develops the last bishop, eyeing it right back.',
      },
      doneText:
        "You just played a complete Caro-Kann Defense as Black, trading when it helped and keeping your position solid the whole way. **That's a real opening, from the other side of the board.**",
      transitionText:
        "Now let's see if it stuck. Same opening, this time **from memory**.",
    },
    {
      id: 'test-caro-kann',
      kind: 'puzzle',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      orientation: 'b',
      solution: CARO_KANN_CLASSICAL_LINE,
      // BEZ strelice unapred - ovo je test, ne vodjenje. Hint dugme (standardni
      // dvostepeni sistem) ostaje dostupno ako zatreba.
      prompt: 'Test Yourself: The Caro-Kann Defense',
      introText:
        "Let's see if it stuck. Play the same opening again, this time **from memory**. I'll take care of White.",
      hintText: 'Think back to the **pattern** you just played.',
      illegalMoveText:
        "That's an **illegal move**. Follow the Caro-Kann line. Stuck? Tap **Hint**.",
      doneText: 'You know **the Caro-Kann** now. That line is yours.',
    },
  ],
  testStepId: 'test-caro-kann',
  endScreenButtons: [
    { label: 'Next Lesson', action: 'nextLesson' },
    { label: 'Test Opening', action: 'testOpening' },
    { label: 'Done', action: 'done' },
  ],
};

/**
 * Day 30 "Graduation Checkpoint 1" - prvi od dva ocenjena testa (16 pitanja,
 * Part A 1-8 zivo na tabli, Part B 9-16 klasican kviz), prag za prolaz 60%
 * (9.6/16). Vidi Lesson.graduationTest i LessonStep.anyLegalMoveStreak/
 * exactMoveUci/raceSolution (lessonDatabase.ts, DailyLessonActivity.tsx) -
 * novi, generican mehanizam izgradjen bas za ovu lekciju.
 *
 * Part A FEN-ovi (Q1,2,4,5,6,7,8) NEMAJU kralja u originalnom tiketu
 * ("izolovane vezbe, ne partije") - DODAO SAM oba kralja (daleko u uglu,
 * h1/a8 ili h1/h8/a8 zavisno od pozicije figure koja se testira) jer
 * deljena biblioteka (ChessFENBoard.validateFenString, util-kit) odbija
 * SVAKU poziciju koja nije cisto prazna tabla bez provere kralja preko
 * chess.js - isti bag kao Day 27 Part C, popravljeno OVDE (lekcija), ne u
 * deljenom kodu. Q3 (kralj) vec ima belog kralja kao samu testiranu
 * figuru, dodat je samo crni. Svih 8 pozicija + potezi (Q6 a2a4, Q7 b4xc5,
 * Q8 5-potezna linija) ponovo verifikovani chess.js NAKON dodavanja
 * kraljeva - obilje legalnih poteza za svaku figuru, kraljevi ne smetaju.
 * Q15/Q16 (checkmate/stalemate) vec imaju oba kralja (prave pozicije),
 * takodje nezavisno verifikovano (chess.js .isCheckmate()/.isStalemate()).
 */
function drillStreakStep(
  id: string,
  pieceSquare: string,
  fen: string,
  introText: string,
  wrongText: string,
  doneText: string
): LessonStep {
  return {
    id,
    kind: 'teach',
    fen,
    orientation: 'w',
    // Placeholder duzine 3 (anyLegalMoveStreak) - sadrzaj se nikad ne cita,
    // samo .length za progress traku/isStepComplete.
    solution: ['*', '*', '*'],
    prompt: 'Piece Moves',
    introText,
    anyLegalMoveStreak: 3,
    drillPieceSquare: pieceSquare,
    hintText: wrongText,
    doneText,
  };
}

const DAY_30_GRADUATION_TEST_1: Lesson = {
  id: 'l1-d30-graduation-test-1',
  level: 1,
  day: 30,
  title: 'Graduation Checkpoint 1',
  flatProgressSegments: true,
  piece: {
    name: 'everything so far',
    glyph: '🎓',
    movement: 'static',
    bannerText: 'Graduation Test 1',
  },
  intro: {
    title: 'Graduation Test 1 of 2',
    text: "**Sixteen questions**, everything you've learned so far. First eight are on **a real board**. Play the actual move. Last eight are **quick-fire**. Get **60%** and you move on.",
  },
  introSteps: [
    {
      text: "**Sixteen questions**, everything you've learned so far. First eight are on **a real board**. Play the actual move. Last eight are **quick-fire**. Get **60%** and you move on.",
      buttonText: 'Start test',
    },
  ],
  steps: [
    // ---------- Part A (Q1-8) - interactive board ----------
    drillStreakStep(
      'q1-rook',
      'e1',
      'k7/8/8/8/8/8/8/4R2K w - - 0 1',
      'Show me how the rook moves. Play **any 3 legal rook moves** in a row.',
      "Hold on. The rook only moves straight, along a rank or a file. It doesn't jump like the knight, and it doesn't move diagonally like the bishop.",
      "That's the rook. **Straight lines, any distance.**"
    ),
    drillStreakStep(
      'q2-bishop',
      'e1',
      'k7/8/8/8/8/8/8/4B2K w - - 0 1',
      'Now the bishop. Play **any 3 legal bishop moves** in a row.',
      'Hold on. The bishop only moves diagonally. Never straight up a file, never across a rank.',
      "That's the bishop. **Diagonals only, any distance.**"
    ),
    drillStreakStep(
      'q3-king',
      'e1',
      'k7/8/8/8/8/8/8/4K3 w - - 0 1',
      'Now the king. Play **any 3 legal king moves** in a row.',
      'Hold on. The king moves one square at a time, in any direction. Never two, never a jump.',
      "That's the king. **One square, any direction.**"
    ),
    drillStreakStep(
      'q4-knight',
      'e1',
      'k7/8/8/8/8/8/8/4N2K w - - 0 1',
      'Now the knight. Play **any 3 legal knight moves** in a row.',
      "Hold on. The knight moves in an L: two squares one way, one square the other. It's the only piece that jumps over anything in its path.",
      "That's the knight. **The only piece that jumps.**"
    ),
    drillStreakStep(
      'q5-queen',
      'e1',
      'k7/8/8/8/8/8/8/4Q2K w - - 0 1',
      'Now the queen. Play **any 3 legal queen moves** in a row.',
      'Hold on. The queen moves any direction, any distance. Ranks, files, or diagonals. But always in a straight line.',
      "That's the queen. **Every direction, every distance.**"
    ),
    {
      id: 'q6-pawn-double-step',
      kind: 'teach',
      fen: '7k/8/8/8/8/8/P7/7K w - - 0 1',
      orientation: 'w',
      solution: ['*'],
      prompt: 'Pawn Double Step',
      introText:
        'Pawns get one special move: **two squares forward**, but only from their starting square. Play it.',
      exactMoveUci: 'a2a4',
      drillPieceSquare: 'a2',
      hintText:
        'A pawn moves two squares only from its **starting square**. Push it: a2 to a4.',
      doneText:
        "That's the pawn's double step. **One-time offer, starting square only.**",
    },
    {
      id: 'q7-pawn-capture',
      kind: 'teach',
      fen: '7k/8/8/2p5/1P6/8/8/7K w - - 0 1',
      orientation: 'w',
      solution: ['*'],
      prompt: 'Pawn Capture',
      introText:
        "Pawns don't capture the way they move. Find **the diagonal capture**.",
      exactMoveUci: 'b4c5',
      drillPieceSquare: 'b4',
      hintText:
        'A pawn moves straight but **captures diagonally**. Look one square diagonally ahead.',
      doneText:
        "That's how a pawn eats. **Straight to move, diagonal to capture.**",
    },
    {
      id: 'q8-pawn-promotion-race',
      kind: 'teach',
      fen: '7k/8/8/8/8/8/4P3/7K w - - 0 1',
      orientation: 'w',
      // Placeholder duzine 5 (raceSolution) - samo za progress traku, stvaran
      // broj odigranih poteza moze biti veci (sporiji put, penal se racuna
      // odvojeno, vidi raceSolution u DailyLessonActivity.tsx).
      solution: ['*', '*', '*', '*', '*'],
      prompt: 'Pawn Promotion Race',
      introText:
        'Play as many moves as you need, but get this pawn to **a queen** as fast as possible.',
      raceSolution: ['e2e4', 'e4e5', 'e5e6', 'e6e7', 'e7e8q'],
      drillPieceSquare: 'e2',
      hintText:
        "That's not how a pawn moves. Straight ahead, one square, or **two only on its first move**.",
      doneText:
        "That's a queen. The fastest path used the **double-step**. Did you catch it?",
    },
    // ---------- Part B (Q9-16) - knowledge quiz ----------
    {
      id: 'q9-chess-origin',
      kind: 'quiz',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Quick one',
      introText: 'Where did **chess** come from?',
      quizOptions: ['China', 'Persia', 'India', 'Egypt'],
      quizCorrectIndex: 2,
      quizExplanation:
        'Right. **India**, around the 6th century. It spread from there.',
      quizExplanationWrong:
        'It started in **India**, around the 6th century, then spread through Persia and beyond.',
      autoAdvanceOnCorrect: true,
      doneText: '',
      hintText: '',
    },
    {
      id: 'q10-board-makeup',
      kind: 'quiz',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'The Board',
      introText: 'What does the **chessboard** consist of?',
      quizOptions: ['Ranks and files', 'Ranks, files, and diagonals'],
      quizCorrectIndex: 1,
      quizExplanation:
        'Right. Every line on the board is **one of those three**.',
      quizExplanationWrong:
        'Ranks, files and diagonals. **Diagonals** are the one people forget.',
      autoAdvanceOnCorrect: true,
      doneText: '',
      hintText: '',
    },
    {
      id: 'q11-queen-value',
      kind: 'quiz',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Piece Values',
      introText: 'How many points is the **queen** worth?',
      quizOptions: ['7', '9', '12'],
      quizCorrectIndex: 1,
      quizExplanation: 'Right. The **most powerful piece** on the board.',
      quizExplanationWrong: 'The queen is worth **9 points**.',
      autoAdvanceOnCorrect: true,
      doneText: '',
      hintText: '',
    },
    {
      id: 'q12-knight-value',
      kind: 'quiz',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Piece Values',
      introText: 'How many points is the **knight** worth?',
      quizOptions: ['2', '5', '3'],
      quizCorrectIndex: 2,
      quizExplanation: 'Right. Same as the **bishop**.',
      quizExplanationWrong: 'The knight is worth **3 points**.',
      autoAdvanceOnCorrect: true,
      doneText: '',
      hintText: '',
    },
    {
      id: 'q13-rook-value',
      kind: 'quiz',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Piece Values',
      introText: 'How many points is the **rook** worth?',
      quizOptions: ['5', '3', '7'],
      quizCorrectIndex: 0,
      quizExplanation:
        'Right. Worth more than a **minor piece**, less than the queen.',
      quizExplanationWrong: 'The rook is worth **5 points**.',
      autoAdvanceOnCorrect: true,
      doneText: '',
      hintText: '',
    },
    {
      id: 'q14-pawn-value',
      kind: 'quiz',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Piece Values',
      introText: 'How many points is a **pawn** worth?',
      quizOptions: ['0.5', '2', '1'],
      quizCorrectIndex: 2,
      quizExplanation: 'Right. The smallest value, **never worthless**.',
      quizExplanationWrong: 'A pawn is worth **1 point**.',
      autoAdvanceOnCorrect: true,
      doneText: '',
      hintText: '',
    },
    {
      id: 'q15-checkmate-check',
      kind: 'quiz',
      fen: '7k/6Q1/6K1/8/8/8/8/8 b - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Checkmate or Stalemate?',
      introText:
        'Look at this position. **Black to move.** Checkmate, or stalemate?',
      quizOptions: ['Checkmate', 'Stalemate'],
      quizCorrectIndex: 0,
      quizExplanation:
        "Right. The king's in check, and there's **no way out**.",
      quizExplanationWrong:
        'This is **checkmate**. The king is in check, with nowhere to go and nothing to block or capture with.',
      autoAdvanceOnCorrect: true,
      doneText: '',
      hintText: '',
    },
    {
      id: 'q16-stalemate-check',
      kind: 'quiz',
      fen: 'k7/8/1Q6/8/8/8/8/K7 b - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Checkmate or Stalemate?',
      introText:
        'Same question, different position. **Black to move.** Checkmate, or stalemate?',
      quizOptions: ['Checkmate', 'Stalemate'],
      quizCorrectIndex: 1,
      quizExplanation:
        "Right. No legal moves, but no check either. **That's a draw.**",
      quizExplanationWrong:
        "This is **stalemate**. The king has no legal moves and isn't in check. That makes it a **draw**, not a loss.",
      autoAdvanceOnCorrect: true,
      celebrate: true,
      doneText: '',
      hintText: '',
    },
  ],
  graduationTest: {
    maxScore: 16,
    passThreshold: 0.6,
    passTitle: 'Test 1 passed',
    passBody:
      'Every piece, every rule, right on the board. **One more test between you and graduation.**',
    passButtons: [
      { label: 'Done', action: 'done' },
      { label: 'Start Test 2', action: 'nextLesson' },
    ],
    failTitle: 'Not quite there',
    failBody:
      'You need **60%** to move on. Go back through whatever tripped you up and try again.',
    failButtons: [{ label: 'Repeat', action: 'repeat' }],
  },
};

/**
 * Day 31 "Graduation Test 2" (Final) - poslednji lesson celog 100-600
 * starter kursa. Za razliku od Day 30, pitanja su POMESANA (nema Part A/B
 * split) - redosled ispod je tacno onaj iz tiketa. Novi mehanizmi izgradjeni
 * BAS za ovu lekciju (svi generican, ne Day31-specificni):
 * - `quizMultiSelect`/`quizCorrectIndices` (Q2/Q3) - "biraju se 2", sve-ili-
 *   nista, dugmad se toggle-uju umesto zakljucavanja na prvi klik.
 * - `exactMoveUci` sad prihvata VISE prihvatljivih poteza (Q5 - Qa8# ILI
 *   Qg7#, oba verifikovana chess.js kao jedini mogući matovi iz te pozicije)
 *   i uvek poredi promociju TACNO (Q6 - samo dama, underpromocija odbijena).
 * - `scoredMarkSquares` (Q13) i `quizScoredRetry` (Q14) - retry dozvoljen,
 *   -0.25 po pogresnom pokusaju (floor 0.25), automatske "crosshair"
 *   strelice (fajl+red do tacnog polja) na SVAKI pogresan pokusaj.
 * - `Lesson.graduationTest.finalScreen` - "Level 1 Graduate" ekran SAMO ako
 *   se na ovu lekciju stiglo preko "Start Test 2" dugmeta sa vec polozenog
 *   Day 30 (URL `?fromLessonId=`, vidi napomena uz finalScreen - LAGANA
 *   provera, nema backend cross-session cuvanje napretka u ovom repou).
 *
 * Q4 - tiket ima protivrecnost: naslov kaze "multi-select, pick 1" i AI
 * chat tekst kaze "Pick the two that are true", ALI je samo JEDNA opcija
 * oznacena "(correct)". Sa samo jednim tacnim odgovorom, "biraj dva" bi bilo
 * nemoguce resiti tacno - ovo je ocigledna tipfeler/copy-paste iz Q2/Q3,
 * popravljeno ovde na standardan single-select kviz (kao Q1/Q7/itd), sa
 * ispravljenim tekstom "Pick the one that's true."
 *
 * Q5 (mat u 1), Q6 (promocija), Q8-Q11 (materijalna prednost) nezavisno
 * verifikovani chess.js (checkmate/legalnost/tacno prebrojavanje poena).
 */
const DAY_31_GRADUATION_TEST_2: Lesson = {
  id: 'l1-d31-graduation-test-2',
  level: 1,
  day: 31,
  title: 'Graduation Test 2 (Final)',
  flatProgressSegments: true,
  piece: {
    name: 'everything so far',
    glyph: '🎓',
    movement: 'static',
    bannerText: 'Graduation Test 2',
  },
  intro: {
    title: 'Graduation Test 2',
    text: '**Last one.** Sixteen more questions, mixed board play and quick-fire quiz. Get **60%** and you graduate.',
  },
  introSteps: [
    {
      text: '**Last one.** Sixteen more questions, mixed board play and quick-fire quiz. Get **60%** and you graduate.',
      buttonText: 'Start test',
    },
  ],
  steps: [
    // ---------- Q1 ----------
    {
      id: 'q1-queen-king-mate',
      kind: 'quiz',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Queen + King vs King',
      introText:
        'In a king and queen versus king endgame, which piece do you need on the board with your **queen** to deliver checkmate?',
      quizOptions: ['Queen alone', 'Your king'],
      quizCorrectIndex: 1,
      quizExplanation:
        'Right. The queen can trap the enemy king. She always needs **her own king close by** to finish the mate.',
      quizExplanationWrong:
        'The queen alone can never force checkmate. She needs **support from her own king**.',
      autoAdvanceOnCorrect: true,
      doneText: '',
      hintText: '',
    },
    // ---------- Q2 - multi-select, pick 2 ----------
    {
      id: 'q2-opening-principles',
      kind: 'quiz',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Opening Principles',
      introText:
        'The opening is the start of the game. Which **two** of these actually matter? Pick both.',
      quizOptions: [
        'Put your pieces in the corner',
        'Control the center',
        'Bring your queen out early',
        'Develop your pieces',
      ],
      quizMultiSelect: true,
      quizCorrectIndices: [1, 3],
      quizExplanation:
        'Right. **Center and development.** Everything else in the opening serves those two.',
      quizExplanationWrong:
        'The two that matter: **control the center** and **develop your pieces**.',
      autoAdvanceOnCorrect: true,
      doneText: '',
      hintText: '',
    },
    // ---------- Q3 - multi-select, pick 2, with diagram ----------
    {
      id: 'q3-castling-rights',
      kind: 'quiz',
      fen: '4k3/8/8/8/8/8/8/1R3K1R w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Castling Rights',
      introText:
        "Look at this position. White's king has already moved once. Which **two** of these make you lose castling rights? Pick both.",
      quizOptions: [
        'Your bishop has moved',
        'Your king has moved',
        'You traded your knights',
        "That side's rook has moved",
      ],
      quizMultiSelect: true,
      quizCorrectIndices: [1, 3],
      quizExplanation:
        'Right. Move your king and castling is **gone for good**. Move a rook and you lose it **only on that side**.',
      quizExplanationWrong:
        'You lose castling when **your king moves**, or when that specific rook moves.',
      autoAdvanceOnCorrect: true,
      doneText: '',
      hintText: '',
    },
    // ---------- Q4 - tiket protivrecnost ispravljena na single-select (vidi napomena iznad) ----------
    {
      id: 'q4-what-is-a-puzzle',
      kind: 'quiz',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'What Is a Puzzle?',
      introText: "What is a **puzzle** in chess? Pick the one that's true.",
      quizOptions: [
        'A type of chess opening',
        'A position where you have to find the best move or sequence of moves',
        'A position where any legal move works fine',
      ],
      quizCorrectIndex: 1,
      quizExplanation:
        "Right. A puzzle gives you a position and asks for the **best move**. It's practice, not a live game.",
      quizExplanationWrong:
        "A puzzle is a position where you find the **best move**. It's practice, not a real game.",
      autoAdvanceOnCorrect: true,
      doneText: '',
      hintText: '',
    },
    // ---------- Q5 - interactive board, mate in 1 ----------
    {
      id: 'q5-mate-in-one',
      kind: 'teach',
      fen: '6k1/8/6K1/8/8/8/8/Q7 w - - 0 1',
      orientation: 'w',
      solution: ['*'],
      prompt: 'One Move to Mate',
      introText: 'One move to **checkmate**. Find it.',
      exactMoveUci: ['a1a8', 'a1g7'],
      drillPieceSquare: 'a1',
      hintText:
        'Not mate yet. Look at the **back rank**. Your king already covers the squares next to it.',
      doneText:
        "That's mate. The queen controls the **whole back rank**, and your king cuts off every escape.",
    },
    // ---------- Q6 - interactive board, promotion piece ----------
    {
      id: 'q6-promotion-piece',
      kind: 'teach',
      fen: '7k/P7/8/8/8/8/8/1K6 w - - 0 1',
      orientation: 'w',
      solution: ['*'],
      prompt: 'Promote the Pawn',
      introText: 'Promote this pawn. Which piece should it **become**?',
      exactMoveUci: 'a7a8q',
      drillPieceSquare: 'a7',
      hintText: 'Remember the piece values. Which one is **strongest**?',
      doneText:
        'Right. The queen is the strongest piece, almost always your **best promotion**.',
    },
    // ---------- Q7 ----------
    {
      id: 'q7-opposition',
      kind: 'quiz',
      fen: '8/8/8/3k4/8/3K4/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'King Standoff',
      introText: 'What does this **standoff between the two kings** show?',
      quizOptions: ['Castling', 'Opposition', 'Zugzwang'],
      quizCorrectIndex: 1,
      quizExplanation:
        'Right. This is **opposition**. Whoever is forced to move first has to give ground.',
      quizExplanationWrong:
        'This is **opposition**. The kings face off, and whoever has to move first is at a disadvantage.',
      autoAdvanceOnCorrect: true,
      doneText: '',
      hintText: '',
    },
    // ---------- Q8 - material, position 1 ----------
    {
      id: 'q8-material-1-who',
      kind: 'quiz',
      fen: '8/4k3/3p1n2/4p3/4P3/3P1B2/2P2K2/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Material Count',
      introText: 'Who has the **material advantage** here?',
      quizOptions: ['White', 'Black', 'Equal'],
      quizCorrectIndex: 0,
      quizExplanation: 'Right. **White** is ahead.',
      quizExplanationWrong:
        'White is ahead here. Count again: **bishop and three pawns** against knight and two pawns.',
      autoAdvanceOnCorrect: true,
      doneText: '',
      hintText: '',
    },
    // ---------- Q9 - material, position 1, by how much ----------
    {
      id: 'q9-material-1-amount',
      kind: 'quiz',
      fen: '8/4k3/3p1n2/4p3/4P3/3P1B2/2P2K2/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Material Count',
      introText: 'By **how many points** is White ahead?',
      quizOptions: ['2', '3', '1'],
      quizCorrectIndex: 2,
      quizExplanation:
        'Right. **One point.** The bishop and extra pawn edge out the knight.',
      quizExplanationWrong:
        'White is ahead by exactly **1 point**. Bishop plus three pawns is 6, knight plus two pawns is 5.',
      autoAdvanceOnCorrect: true,
      doneText: '',
      hintText: '',
    },
    // ---------- Q10 - material, position 2 ----------
    {
      id: 'q10-material-2-who',
      kind: 'quiz',
      fen: '8/3qkpp1/3p3p/2p1p3/4P3/3P3P/2P2PP1/5RK1 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Material Count',
      introText:
        'New position. Who has the **material advantage** here, White or Black?',
      quizOptions: ['White', 'Black', 'Equal'],
      quizCorrectIndex: 1,
      quizExplanation:
        "Right. Black is ahead. The **queen** is worth more than White's rook.",
      quizExplanationWrong:
        'Black is ahead here. Compare **the queen to the rook**.',
      autoAdvanceOnCorrect: true,
      doneText: '',
      hintText: '',
    },
    // ---------- Q11 - material, position 2, by how much ----------
    {
      id: 'q11-material-2-amount',
      kind: 'quiz',
      fen: '8/3qkpp1/3p3p/2p1p3/4P3/3P3P/2P2PP1/5RK1 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Material Count',
      introText: 'By **how many points**?',
      quizOptions: ['2', '6', '4'],
      quizCorrectIndex: 2,
      quizExplanation:
        'Right. **4 points.** A queen is worth 9, a rook 5, and the pawns are even.',
      quizExplanationWrong:
        'Black is ahead by **4 points**. Queen plus six pawns is 15, rook plus six pawns is 11.',
      autoAdvanceOnCorrect: true,
      doneText: '',
      hintText: '',
    },
    // ---------- Q12 ----------
    {
      id: 'q12-perpetual-check',
      kind: 'quiz',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Perpetual Check',
      introText: 'What is **perpetual check**?',
      quizOptions: [
        'When a king is checkmated multiple times in the same game',
        'When one side keeps checking the king over and over, and the game ends in a draw by repetition',
      ],
      quizCorrectIndex: 1,
      quizExplanation:
        'Right. Neither side can escape it, so the game ends in a **draw**.',
      quizExplanationWrong:
        'Perpetual check is one side **giving check over and over**. It never stops, so the game ends in a draw by repetition.',
      autoAdvanceOnCorrect: true,
      doneText: '',
      hintText: '',
    },
    // ---------- Q13 - interactive board click ----------
    {
      id: 'q13-find-e4',
      kind: 'markSquares',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['e4'],
      prompt: 'Find the Square',
      introText: 'Find and click on **e4**.',
      scoredMarkSquares: true,
      quizBoardHighlight: {
        squares: [{ square: 'e4', color: '#07DA63', fill: true, dot: true }],
      },
      firstMissText:
        'Not e4. Count the files from the left (a-h) and the ranks from the bottom (1-8). See where they cross.',
      doneText: "That's **e4**.",
      hintText: '',
    },
    // ---------- Q14 - name the highlighted square ----------
    {
      id: 'q14-name-highlighted-square',
      kind: 'quiz',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Name the Square',
      introText: 'Which square is **highlighted**?',
      quizOptions: ['f5', 'g4', 'g5'],
      quizCorrectIndex: 2,
      quizBoardHighlightUpfront: true,
      quizBoardHighlight: {
        squares: [
          {
            square: 'g5',
            color: 'rgba(255, 199, 0, 0.55)',
            fill: true,
            dot: true,
          },
        ],
      },
      quizExplanation: 'Right. **g5.**',
      quizExplanationWrong:
        "It's **g5**. Letter below, number beside. Where they cross is your square.",
      doneText: '',
      hintText: '',
    },
    // ---------- Q15 ----------
    {
      id: 'q15-opening-white',
      kind: 'quiz',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Your Opening (White)',
      introText:
        'Which opening have you started learning to play with **White**, just the first few moves so far?',
      quizOptions: ['Italian Game', 'London System', "Queen's Gambit"],
      quizCorrectIndex: 1,
      quizExplanation:
        "Right. The **London System**. Just the opening moves so far. That's the start.",
      quizExplanationWrong:
        "You've been learning the **London System** with White, just the first few moves so far.",
      autoAdvanceOnCorrect: true,
      doneText: '',
      hintText: '',
    },
    // ---------- Q16 ----------
    {
      id: 'q16-opening-black',
      kind: 'quiz',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['quiz'],
      prompt: 'Your Opening (Black)',
      introText:
        'And which opening have you started learning to play with **Black**, again, just the first few moves?',
      quizOptions: ['Sicilian Defense', 'French Defense', 'Caro-Kann'],
      quizCorrectIndex: 2,
      quizExplanation: 'Right. The **Caro-Kann**. A solid start for Black.',
      quizExplanationWrong:
        "You've been learning the **Caro-Kann** with Black, just the first few moves so far.",
      celebrate: true,
      doneText: '',
      hintText: '',
    },
  ],
  graduationTest: {
    maxScore: 16,
    passThreshold: 0.6,
    passTitle: 'Test 2 passed',
    passBody:
      'Score locked in. **Make sure Test 1 is done too.** Both are needed to graduate.',
    passButtons: [{ label: 'Done', action: 'done' }],
    failTitle: 'Not quite there',
    failBody:
      'You need **60%** to move on. Go back through whatever tripped you up and try again.',
    failButtons: [{ label: 'Repeat', action: 'repeat' }],
    finalScreen: {
      requiresPriorPassLessonId: 'l1-d30-graduation-test-1',
      title: 'Level 1 Graduate',
      body: "Every piece, every rule, both tests. **You're not a beginner anymore.**",
      buttons: [
        { label: 'Repeat', action: 'repeat' },
        { label: 'Play', action: 'play' },
        { label: 'Done', action: 'done' },
      ],
    },
  },
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
  DAY_21_OPPOSITION,
  DAY_22_MATERIAL,
  DAY_23_BRIDGE,
  DAY_24_THIRD_GAME,
  DAY_25_MATE_IN_ONE,
  DAY_26_PERPETUAL_CHECK,
  DAY_27_CHESS_NOTATION,
  DAY_28_FIRST_OPENING,
  DAY_29_FIRST_OPENING_BLACK,
  DAY_30_GRADUATION_TEST_1,
  DAY_31_GRADUATION_TEST_2,
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
