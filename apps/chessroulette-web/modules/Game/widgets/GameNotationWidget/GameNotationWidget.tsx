import { noop } from '@xmatter/util-kit';
import { ChessEngineWithProvider } from '@app/modules/ChessEngine/ChesEngineWithProvider';
import {
  FreeBoardNotation,
  FreeBoardNotationProps,
} from '@app/components/FreeBoardNotation';
import { useGame } from '@app/modules/Game/hooks';
type Props = Pick<
  FreeBoardNotationProps,
  'emptyContent' | 'className' | 'containerClassName'
>;

export const GameNotationWidget = (props: Props) => {
  const { displayState, actions } = useGame();
  // console.log('displayState',displayState)
  return (
    <div>
     <ChessEngineWithProvider
                        gameId={''}
                        fen={displayState.fen}
                        canAnalyze
                        onToggle={(s) =>
                          console.log('s',s)
                         //updateableSearchParams.set({ engine: Number(s) })
      }
    />
    <FreeBoardNotation
      history={displayState.history}
      focusedIndex={displayState.focusedIndex}
      canDelete={false}
      onDelete={noop}
      onRefocus={actions.onRefocus}
      {...props}
    />
    </div> 
  );
};
