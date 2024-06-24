import { PlayersInfo, PlayersInfoProps } from './components/PlayersInfo';
import { useGame } from './providers/useGame';
import { Results } from './types';

type Props = Omit<PlayersInfoProps, 'turn' | 'game' | 'isGameOngoing'> & {
  results: Results;
};

export const PlayersInfoContainer = (props: Props) => {
  const { realState } = useGame();

  console.log('results', props.results);
  console.log('players', props.players);
  return (
    <PlayersInfo
      {...props}
      turn={realState.turn}
      isGameOngoing={realState.game.status === 'ongoing'}
      game={realState.game}
    />
  );
};
