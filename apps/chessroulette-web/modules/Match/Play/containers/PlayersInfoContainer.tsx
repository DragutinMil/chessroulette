// import { PlayersInfo, PlayersInfoProps } from '../components/PlayersInfo';
// import { useGame } from '../providers/useGame';
import { useGame } from '@app/modules/Game/hooks';
import { Old_Play_Results } from '../types';
import { PlayersInfo, PlayersInfoProps } from '@app/modules/Game/components/PlayersInfo';

type Props = Omit<
  PlayersInfoProps,
  'turn' | 'game' | 'isGameOngoing' | 'clientClockOffset'
> & {
  results: Old_Play_Results;
  gameCounterActive: boolean;
};

export const PlayersInfoContainer = (props: Props) => {
  const { realState } = useGame();

  return <PlayersInfo {...props} turn={realState.turn} game={realState.game} />;
};
