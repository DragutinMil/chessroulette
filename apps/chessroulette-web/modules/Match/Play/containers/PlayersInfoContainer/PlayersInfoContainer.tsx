import { useGame } from '@app/modules/Game/hooks';
import { Old_Play_Results } from '../../types';
import { PlayersInfo, PlayersInfoProps } from './PlayersInfo';
import { usePlay } from '../../hooks/usePlay';
import { PENDING_UNTIMED_GAME } from '@app/modules/Game';

type Props = Omit<
  PlayersInfoProps,
  'turn' | 'game' | 'isGameOngoing' | 'clientClockOffset'
> & {
  results: Old_Play_Results;
  gameCounterActive: boolean;
};

export const PlayersInfoContainer = (props: Props) => {
  const {
    committedState: { game, turn },
  } = useGame();

  return <PlayersInfo {...props} turn={turn} game={game} />;
};
