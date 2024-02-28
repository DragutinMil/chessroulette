import { ChessFENBoard } from '@xmatter/util-kit';
import { Chess } from 'chess.js';

type PGNHeader = {
  date?: Date;
  result?: string;
  // winner?: 'white' | 'black' | d;
  white?: string;
  whiteElo?: number;
  black?: string;
  blackElo?: number;
};

export type ChessPGN = string;
export type ChessFEN = string;

export const getPgnDetails = (pgn: ChessPGN) => {
  const instance = new Chess();

  instance.loadPgn(pgn);

  const header = instance.header();

  return {
    fen: instance.fen(),
    header: {
      date: header.Date,
      result: header.Result,
      white: header.White,
      whiteElo: header.WhiteElo ? Number(header.WhiteElo) : undefined,
      black: header.Black,
      blackElo: header.BlackElo ? Number(header.BlackElo) : undefined,
    },
  };
};

export const range = (length: number, startAt = 0) =>
  Array.from({ length }, (_, i) => i + startAt);

export const pgnToFens = (pgn: ChessPGN): ChessFEN[] => {
  const instance = new Chess();

  instance.loadPgn(pgn);

  // console.log(instance.history())

  const newGame = new Chess();

  const history = instance.history();

  const fens: ChessFEN[] = [];

  while (fens.length < history.length) {
    try {
      newGame.move(history[fens.length]);

      fens.push(newGame.fen());
    } catch (e) {
      throw e;
    }
  }

  return fens;
};

export const isObject = (m: unknown): m is object =>
  m !== null && typeof m === 'object';

// Use this to get inherited keys as well
export const keyInObject = <X extends {}, Y extends PropertyKey>(
  obj: X,
  prop: Y
): obj is X & Record<Y, unknown> => prop in obj;


