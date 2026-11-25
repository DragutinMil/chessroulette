import {
  ChessColor,
  ChessFEN,
  ChessFENBoard,
  ChessPGN,
  FBHHistory,
  FBHIndex,
  FreeBoardHistory,
  getNewChessGame,
} from '@xmatter/util-kit';
import { GameDisplayState } from '../types';

// chess.js replay-uje celu partiju - isti pgn trazi vise komponenti na svaki render, pa parsiramo jednom
let pgnCache: { pgn: ChessPGN; history: FBHHistory; fen: ChessFEN } | undefined;
const parsePgn = (pgn: ChessPGN) => {
  if (pgnCache?.pgn !== pgn) {
    const chess = getNewChessGame({ pgn });
    pgnCache = {
      pgn,
      history: FreeBoardHistory.linearToTurnHistory(
        chess.history({ verbose: true })
      ),
      fen: chess.fen(),
    };
  }
  return pgnCache;
};

export const getFenFromPgn = (pgn: ChessPGN): ChessFEN => parsePgn(pgn).fen;

const getLastMove = (history: FBHHistory, atIndex: FBHIndex) => {
  const lm = FreeBoardHistory.findMoveAtIndex(history, atIndex);

  return lm?.isNonMove ? undefined : lm;
};

export const getGameDisplayState = ({
  pgn,
  focusedIndex,
}: {
  pgn: ChessPGN;
  focusedIndex?: FBHIndex;
}): GameDisplayState => {
  const parsed = parsePgn(pgn);
  const allHistory = parsed.history;

  if (!focusedIndex) {
    const lastFocusedIndex = FreeBoardHistory.getLastIndexInHistory(allHistory);

    const fen = parsed.fen;

    return {
      fen,
      history: allHistory,
      focusedIndex: FreeBoardHistory.getLastIndexInHistory(allHistory),
      lastMove: getLastMove(allHistory, lastFocusedIndex),
      turn: getTurnFromFen(fen),
    } as const;
  }

  const [historyAtIndex, lastFocusedIndex] = FreeBoardHistory.sliceHistory(
    allHistory,
    FreeBoardHistory.incrementIndex(focusedIndex)
  );

  const fen = FreeBoardHistory.historyToFen(historyAtIndex);

  return {
    fen,
    history: allHistory,
    focusedIndex: lastFocusedIndex,
    lastMove: getLastMove(historyAtIndex, lastFocusedIndex),
    turn: getTurnFromFen(fen),
  };
};

export const getTurnFromPgn = (pgn: ChessPGN): ChessColor =>
  getTurnFromFen(parsePgn(pgn).fen);

export const getTurnFromFen = (fen: ChessFEN): ChessColor =>
  new ChessFENBoard(fen).getFenState().turn;
