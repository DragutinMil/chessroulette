import { useMemo } from 'react';
import { DistributivePick, getNewChessGame } from '@xmatter/util-kit';
import { Playboard, PlayboardProps } from '@app/components/Boards';
import { useGame } from '@app/modules/Game/hooks';
import type { CheckmateSquares } from '@app/components/Chessboard/ChessboardContainer/ChessboardDisplay';

export type GameBoardContainerProps = DistributivePick<
  PlayboardProps,
  | 'onLastMoveWasPromotionChange'
  | 'overlayComponent'
  | 'playingColor'
  | 'onMove'
  | 'canPlay'
  | 'turn'
  | 'sizePx'
  | 'rightSideSizePx'
  | 'rightSideClassName'
  | 'rightSideComponent'
  | 'boardOrientation'
>;

const isBulletTimeClass = (timeClass?: string) =>
  !!timeClass && timeClass.startsWith('bullet');

export const GameBoardContainer = (
  boardProps: GameBoardContainerProps,
  stopEngineMove?: boolean,
  botId?: string,
  userRating?: number,
  botType?: string
) => {
  const { displayState, committedState } = useGame();
  const disableAnimations = isBulletTimeClass(committedState.game.timeClass);

  // polja za '#' oznaku i pad kralja - samo kad tabla prikazuje matnu poziciju
  const checkmate = useMemo((): CheckmateSquares | undefined => {
    if (!displayState.lastMove) return undefined;
    const chess = getNewChessGame({ fen: displayState.fen });
    if (!chess.isCheckmate()) return undefined;
    const matedColor = chess.turn();
    const kingSquare = chess
      .board()
      .flat()
      .find((p) => p?.type === 'k' && p.color === matedColor)?.square;
    if (!kingSquare) return undefined;
    return { attackerSquare: displayState.lastMove.to, kingSquare };
  }, [displayState.fen, displayState.lastMove]);

  return (
    <Playboard
      fen={displayState.fen}
      stopEngineMove={stopEngineMove}
      botId={botId}
      botType={botType}
      userRating={userRating}
      lastMove={displayState.lastMove}
      onLastMoveWasPromotionChange={boardProps.onLastMoveWasPromotionChange}
      disableAnimations={disableAnimations}
      checkmate={checkmate}
      {...boardProps}
    />
  );
};
