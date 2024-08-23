import { useMovexClient } from 'movex-react';
import { PlayersInfo, PlayersInfoProps } from './components/PlayersInfo';
import { useGame } from './providers/useGame';
import { Results } from './types';

type Props = Omit<
  PlayersInfoProps,
  'turn' | 'game' | 'isGameOngoing' | 'clientClockOffset'
> & {
  results: Results;
  gameCounterActive: boolean;
};

export const PlayersInfoContainer = (props: Props) => {
  const { realState } = useGame();

  const client = useMovexClient({ resources: {} });

  return (
    <PlayersInfo
      {...props}
      turn={realState.turn}
      game={realState.game}
      clientClockOffset={client?.clockOffset || 0}
    />
  );
};
