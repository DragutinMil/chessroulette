import { PlayersInfo, PlayersInfoProps } from '../components/PlayersInfo';
import { useGame } from '../providers/useGame';
import { Old_Play_Results } from '../types';

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
