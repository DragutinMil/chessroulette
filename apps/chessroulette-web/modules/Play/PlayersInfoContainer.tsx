import { PlayersInfo, PlayersInfoProps } from './components/PlayersInfo';
import { useGame } from './providers/useGame';

type Props = Omit<PlayersInfoProps, 'turn' | 'game' | 'isGameOngoing'>;

export const PlayersInfoContainer = (props: Props) => {
  const { realState } = useGame();

  return (
    <PlayersInfo 
      {...props}
      turn={realState.turn} 
      isGameOngoing={realState.game.status === 'ongoing'}
      game={realState.game}
    />
  );
};
