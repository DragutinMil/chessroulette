import { useCurrentOrPrevMatchPlay } from '../../hooks/usePlay';
import { useMemo } from 'react';
import { getMovesDetailsFromPGN } from '@app/modules/Match/utils';
import { toShortColor } from '@xmatter/util-kit';
import { PlayerBox } from './PlayerBox';
// @deprecate
import { Old_Play_Results } from '../../types';

type Props = {
  results: Old_Play_Results;
  onCheckTime: () => void;
};

export const PlayersInfoContainer = ({ results, onCheckTime }: Props) => {
  const play = useCurrentOrPrevMatchPlay();

  const isGameCountdownActive = useMemo(() => {
    if (!play.hasGame) {
      return false;
    }

    const { game } = play;

    const moves = getMovesDetailsFromPGN(game.pgn);

    if (game.status !== 'ongoing') {
      return false;
    }

    if (moves.totalMoves > 1) {
      return true;
    }

    return !!(
      moves.totalMoves === 1 &&
      moves.lastMoveBy &&
      toShortColor(moves.lastMoveBy) === 'b'
    );
  }, [play.game]);

  if (!play.hasGame) {
    return 'WARN - Players Info Container no game - change me';
  }

  return (
    <div className="flex flex-1 gap-1 flex-col">
      <PlayerBox
        key="away"
        playerInfo={play.playersBySide.away}
        score={results[play.playersBySide.away.color]}
        isActive={
          isGameCountdownActive && play.turn === play.playersBySide.away.color
        }
        gameTimeClass={play.game.timeClass}
        timeLeft={play.game.timeLeft[play.playersBySide.away.color]}
        onCheckTime={onCheckTime}
      />
      <PlayerBox
        key="home"
        playerInfo={play.playersBySide.home}
        score={results[play.playersBySide.home.color]}
        isActive={
          isGameCountdownActive && play.turn === play.playersBySide.home.color
        }
        gameTimeClass={play.game.timeClass}
        timeLeft={play.game.timeLeft[play.playersBySide.home.color]}
        onCheckTime={onCheckTime}
      />
    </div>
  );
};
