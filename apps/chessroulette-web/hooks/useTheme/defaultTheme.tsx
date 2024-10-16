import {
  GetComponentProps,
  PieceSan,
  objectKeys,
  toDictIndexedBy,
} from '@xmatter/util-kit';
import { Chessboard } from 'react-chessboard';
import { Piece } from '@app/components/Chessboard/Piece';
import { pieces as MahaPieces } from '@app/components/Chessboard/assets/mahaPieces';
import { pieces as RegularPieces } from '@app/components/Chessboard/assets/merida';

export type ChessBoardProps = GetComponentProps<typeof Chessboard>;

export type BoardTheme = {
  darkSquare: string;
  lightSquare: string;
  arrowColors: [string, string, string];
  lastMoveToSquare: string;
  lastMoveFromSquare: string;
  preMoveToSquare: string;
  preMoveFromSquare: string;
  hoveredSquare: string;
  clickedPieceSquare: string;
  customPieces?: ChessBoardProps['customPieces'];
  renderPiece: (p: {
    pieceSan: PieceSan;
    squareWidth: number;
  }) => React.ReactElement;
};

type Theme = {
  name: string;
  board: BoardTheme;
};

const renderKidsThemePiece: Theme['board']['renderPiece'] = ({
  pieceSan,
  squareWidth,
}) => (
  <Piece
    registry={MahaPieces}
    squareSize={squareWidth * 1}
    pieceSan={pieceSan}
    className="mb-4"
    style={{
      marginTop: '-1%',
    }}
  />
);

const renderRCHPiece: Theme['board']['renderPiece'] = ({
  pieceSan,
  squareWidth,
}) => (
  <Piece
    registry={RegularPieces}
    squareSize={squareWidth * 1}
    pieceSan={pieceSan}
  />
);

const chessrouletteTheme: Theme = {
  name: 'chessroulette',
  board: {
    darkSquare: 'rgba(0, 163, 255, .4)',
    lightSquare: 'white',
    arrowColors: ['#11c6d1', '#f2358d', '#6f7381'],
    lastMoveToSquare: 'rgba(234, 183, 255, .5)',
    lastMoveFromSquare: 'rgba(234, 183, 255, .5)',
    preMoveFromSquare: 'rgba(21, 183, 155, .5)',
    preMoveToSquare: 'rgba(21, 183, 155, .5)',
    hoveredSquare: 'rgba(204, 183, 255, .9)',
    // clickedPieceSquare: 'rgba(204, 183, 255, .9)',
    clickedPieceSquare: 'rgba(0, 163, 255, .7)',
    renderPiece: renderRCHPiece,
    customPieces: toDictIndexedBy(
      objectKeys(MahaPieces),
      (pieceSan) => pieceSan,
      (pieceSan) => (p: { squareWidth: number }) =>
        renderRCHPiece({ pieceSan, squareWidth: p.squareWidth })
    ),
  },
};

const outpostTheme: Theme = {
  name: 'outpost',
  board: {
    darkSquare: '#C8A07D',
    lightSquare: 'white',
    arrowColors: ['#11c6d1', '#f2358d', '#6f7381'],
    lastMoveToSquare: 'rgba(95, 15, 15, .6)',
    lastMoveFromSquare: 'rgba(95, 15, 15, .6)',
    preMoveFromSquare: 'rgba(21, 183, 155, .5)',
    preMoveToSquare: 'rgba(21, 183, 155, .5)',
    hoveredSquare: 'rgba(134, 583, 255, .5)',
    clickedPieceSquare: 'rgba(134, 583, 255, .5)',
    renderPiece: renderRCHPiece,
    customPieces: toDictIndexedBy(
      objectKeys(MahaPieces),
      (pieceSan) => pieceSan,
      (pieceSan) => (p: { squareWidth: number }) =>
        renderRCHPiece({ pieceSan, squareWidth: p.squareWidth })
    ),
  },
};

const kidsTheme: Theme = {
  name: 'kids',
  board: {
    ...chessrouletteTheme.board,
    renderPiece: renderKidsThemePiece,
    customPieces: toDictIndexedBy(
      objectKeys(MahaPieces),
      (pieceSan) => pieceSan,
      (pieceSan) => (p: { squareWidth: number }) =>
        renderKidsThemePiece({ pieceSan, squareWidth: p.squareWidth })
    ),
  },
};

export const defaultTheme = chessrouletteTheme;

export const themes = {
  chessroulette: chessrouletteTheme,
  cr: chessrouletteTheme,
  outpost: outpostTheme,
  op: outpostTheme,
  kids: kidsTheme,
};
