# Chessroulette — Claude Instructions

## Projekat
Next.js 14 full-stack šahovska platforma sa real-time multiplayer igrom, botovima (Stockfish), puzzlama, learn/review modom i video pozivima. Monorepo (NX) sa jednom web app i zasebnim Movex serverom.

## Radni opseg
- Radi **isključivo** u direktorijumu `/Users/mac/Desktop/chessroulette`
- **Ne menjaj kod** bez eksplicitnog zahteva — čitaj, analiziraj, predloži, pitaj
- Kada se dogovorimo šta radimo, tek onda menjam fajlove

## Stil saradnje
- Razgovaramo, analiziramo zajedno, pitam pre nego što dirnem išta
- Ako vidim potencijalni problem koji nije tražen — napomenem, ne diram
- Kratki odgovori osim kada objašnjavam nešto kompleksno

## Git & Build
- **Ne pravi git commitove** bez eksplicitnog zahteva
- **Ne push-uj** na remote bez eksplicitnog zahteva
- **Ne pokreći** build bez zahteva
- Dev server: `yarn start:client` (Next.js, port 4200) + `yarn start:movex` (Movex server, poseban proces)
- Type check: `yarn tsc-web`

## Stack
- **Next.js 14** + React 18 + TypeScript
- **NX monorepo** — web app živi u `apps/chessroulette-web/`
- **Movex** (`movex`, `movex-react`, `movex-core-util`) — real-time state management; sav game state ide kroz `room` resource; **dispatch nije concurrent-safe** — nikad dva dispatcha u isto vreme na isti resource
- **chess.js** — validacija šahovskih poteza i FEN manipulacija
- **react-chessboard** v5.6.0 (pinned!) — UI tabla
- **Stockfish.js** v10 — bot engine, radi kao Web Worker (`/public/stockfish.js`)
- **Prisma** + PostgreSQL — baza
- **NextAuth v4** — autentifikacija
- **Tailwind CSS** + classnames
- **Jitsi** (`@jitsi/react-sdk`) — video pozivi u Meetup modu
- **PeerJS** — WebRTC peer-to-peer
- **Storybook** — component stories

## Struktura projekta

```
apps/chessroulette-web/
├── app/                    # Next.js App Router (routes)
│   ├── room/               # sobe (match, learn, puzzle, review, meetup)
│   ├── profile/
│   └── learn/
├── modules/
│   ├── Room/               # core — container za sve aktivnosti
│   │   └── activities/
│   │       ├── Match/      # PvP i bot igra
│   │       ├── Learn/      # učenje otvaranja
│   │       ├── LearnAi/    # learn sa AI asistentom
│   │       ├── Puzzle/     # taktički zadaci
│   │       ├── Review/     # analiza odigrane partije
│   │       └── Meetup/     # video + šah
│   ├── Match/              # game state, dispatch actions, PlayContainer
│   ├── ChessEngine/        # Stockfish integracija i bot logika
│   ├── Game/               # GameBoardContainer
│   ├── User/               # user profil i rating
│   └── ...
├── components/
│   ├── Chessboard/
│   │   └── ChessboardContainer/   # glavna tabla sa svom logikom
│   │       └── hooks/
│   │           └── useMoves.ts    # move/premove handling
│   └── Boards/
│       └── Playboard/             # wraps ChessboardContainer za igru
└── movex.config.ts                # Movex resource config (room reducer)
```

## Movex — važno
- Sav real-time state (igra, potezi, chat...) ide kroz `room` resource
- `dispatch` je async i koristi `PromiseDelegate` interno — **nikad ne dispatchuj dok je prethodni dispatch u toku** (crash: "PromiseDelegate is already settled!")
- `usePlayActionsDispatch()` — hook za dispatch akcija unutar Match/Play konteksta
- Akcije: `play:move`, `play:start`, `play:resignGame`, itd.

## Bot sistem
- `ChessEngineBots.tsx` (`modules/ChessEngine/`) — Stockfish Web Worker wrapper
- Bot tipovi: `matchFake` (matchmaking), `botelja` (normalni bots), `basic`
- Bot ID-evi su 16-char stringovi (npr. `'9yzBb59_POb9L000'`)
- Bot boja se čita iz `match.gameInPlay.players.w/b`
- `engineMove` callback → `ChessboardContainer` → `onMove` → movex dispatch

## Premove sistem
- `useMoves.ts` — sva logika za poteze i premove
- Premove se čuva u `playerMoves[color].preMove` state-u
- Premove se izvršava u `useEffect([isMyTurn, promoMove, playerMoves])` kada postane `isMyTurn = true`
- `premoveAnimationDelay`: prop postoji ali je **zakomentarisan u destructuringu** — hook interno računa delay (`botType ? 200 : 0`)
- **Pažnja**: nikad ne smanjivati premove delay ispod ~150ms u bot igrama zbog Movex race condition-a

## Šahovske konstante
- FEN format: standardni, `parts[1]` = boja na potezu (`'w'`/`'b'`)
- `boardOrientation` = `'w'` ili `'b'` (boja igrača)
- `isMyTurn = boardOrientation === turn`

## Deployment
- Web app → **Vercel**
- Movex server → **Fly.io** (zasebni Docker container)
- Skripte: `deploy-movex-preview/staging/prod` u root `package.json`
- Env: `.env.local` za web (NextAuth secrets, DB url, itd.) — ne commitovati

## Poznate napomene (stečeno znanje)
- `isMyTurn` u `ChessEngineBots.tsx` useEffect nije bio u deps arrayu (stale closure) — sada se čita kroz `isMyTurnRef`
- `react-chessboard` je pinovan na `5.6.0` — ne upgradovati bez provere API promena
- Movex verzija `^0.1.6` — relativno mlada library, neke edge case-ove treba ručno handlovati
- `lastPlayedFenRef` u botu sprečava duplo igranje iste pozicije
- Bot delay za potez: 600–6000ms random (zavisi od faze igre i time class-a)
