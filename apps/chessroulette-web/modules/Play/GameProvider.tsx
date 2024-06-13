import {
  GameActionsProvider,
  GameActionsProviderProps,
} from './providers/GameActionsProvider';

type Props = GameActionsProviderProps;

export const GameProvider = (props: Props) => {
  return <GameActionsProvider {...props} />;
};
