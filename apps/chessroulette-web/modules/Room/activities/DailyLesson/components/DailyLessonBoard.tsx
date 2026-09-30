import { ChapterBoardState, ChapterState } from '../movex';
import { Freeboard } from '@app/components/Boards';
import { type ChessboardOptions } from 'react-chessboard';
import { FreeBoardHistory, ShortChessMove } from '@xmatter/util-kit';
import { ChessboardContainerProps } from '@app/components/Chessboard';
import { RIGHT_SIDE_SIZE_PX } from '@app/modules/Room/constants';
import { pieceAt } from '../lessonEngine';

type Props = Required<
  Pick<
    ChessboardContainerProps,
    'onMove' | 'onArrowsChange' | 'onCircleDraw' | 'onClearCircles' | 'sizePx'
  >
> &
  Pick<
    ChessboardContainerProps,
    | 'rightSideComponent'
    | 'rightSideClassName'
    | 'hintSquares'
    | 'hintFromSquare'
  > &
  ChapterBoardState & {
    notation?: ChapterState['notation'];
    squareRenderer?: ChessboardOptions['squareRenderer'];
    canPlay?: boolean;
  };

export const DailyLessonBoard = ({
  displayFen: fen,
  orientation,
  arrowsMap,
  circlesMap,
  sizePx,
  notation,
  rightSideComponent,
  rightSideClassName,
  canPlay = true,
  ...chessBoardProps
}: Props) => {
  const lm =
    notation &&
    FreeBoardHistory.findMoveAtIndex(notation.history, notation.focusedIndex);
  const lastMove = lm?.isNonMove ? undefined : lm;

  // Ko je stvarno na potezu po FEN-u - NE korisnikova boja fiksno. U puzzle
  // koracima, dok korisnikov potez ceka odigravanje protivnika, ovo je
  // protivnikova boja; cim protivnik odigra, vraca se na orientation.
  const sideToMove =
    (fen.split(' ')[1] as 'w' | 'b' | undefined) ?? orientation;

  /**
   * Namerno propustamo i poteze koji nisu validni po sahovskim pravilima -
   * lekcija na njih odgovara crvenim X-om i strelicama kuda figura sme.
   * Blokiramo samo vucenje protivnickih figura i praznih polja - da li je
   * "red" na korisniku sad kontrolise `turn` prop ispod (aktivira premove
   * sistem iz useMoves.ts kad nije red na korisniku).
   */
  const onValidateMove = (move: ShortChessMove) => {
    if (!canPlay) return false;
    const piece = pieceAt(fen, move.from);
    return !!piece && piece.color === orientation;
  };

  return (
    <Freeboard
      containerClassName="shadow-2xl"
      boardOrientation={orientation}
      // NAMERNO nije fiksno na `orientation`: kad je u puzzle koraku red na
      // protivniku, ovo mora da bude njegova boja da bi useMoves.ts ispravno
      // prepoznao "nije moj red" i uhvaceni potez pretvorio u premove koji
      // se automatski izvrsi cim protivnik odigra. Bez ovoga, react-chessboard
      // zamrzava onPieceDrop na trenutak hvatanja figure (handleDragEnd u
      // biblioteci nema onPieceDrop u svom useCallback deps nizu) - potez
      // uhvacen dok cekamo protivnika bi se uvek odbijao na drop-u, cak i
      // kad je protivnik u medjuvremenu vec odigrao.
      turn={sideToMove}
      sizePx={sizePx}
      fen={fen}
      lastMove={lastMove}
      arrowsMap={arrowsMap}
      circlesMap={circlesMap}
      onValidateMove={onValidateMove}
      {...chessBoardProps}
      rightSideSizePx={RIGHT_SIDE_SIZE_PX}
      rightSideClassName={`flex flex-col ${rightSideClassName}`}
      rightSideComponent={rightSideComponent}
    />
  );
};
