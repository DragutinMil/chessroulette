import { noop } from '@xmatter/util-kit';
import {
  FreeBoardNotation,
  FreeBoardNotationProps,
} from '@app/components/FreeBoardNotation';
import { useGame } from '../providers/useGame';

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
