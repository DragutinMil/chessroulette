import {
  FreeBoardNotation,
  FreeBoardNotationProps,
} from 'apps/chessroulette-web/components/FreeBoardNotation';
import { useGame } from './providers/useGame';
import { noop } from '@xmatter/util-kit';

type Props = Pick<
  FreeBoardNotationProps,
  'emptyContent' | 'className' | 'containerClassName'
>;

export const GameNotationContainer = (props: Props) => {
  const { displayState, actions } = useGame();

  return (
    <FreeBoardNotation
      history={displayState.history}
      focusedIndex={displayState.focusedIndex}
      canDelete={false}
      onDelete={noop}
      onRefocus={actions.onRefocus}
      {...props}
    />
  );
};
