import { useEffect,useState } from 'react';
import { ChessFEN, noop } from '@xmatter/util-kit';
import { useChessEngineFromFen } from '../hooks/useChessEngine';
import { EngineResultState } from '../lib/types';

type Props = {
  /**
   * This can be the gameId or anything unique that doesn't change on every move
   * It's used to tell the engine to set a new game
   */
  gameId: string;
  fen: ChessFEN;
  onUpdate?: (s: EngineResultState) => void;
};

export const ChessEngineAnalysisDisplay = ({
  gameId,
  fen,
  onUpdate = noop,
}: Props) => {
  const engineState = useChessEngineFromFen(gameId, fen, { depth: 10 });
  const [percentW, setPercentW] = useState(50)
  const [percentB, setPercentB] = useState(50)
  useEffect(() => {
    onUpdate(engineState);
    
    if(engineState.bestLine){
      setPercentW( engineState.bestLine.evaluation.heightsPct.w )
      setPercentB( engineState.bestLine.evaluation.heightsPct.b )
    }
   // console.log('engineState', percentW,percentB);
  }, [engineState]);

  return (
    <div className="text-sm pb-2  spx-2 border-b border-slate-600 soverflow-hidden">
      <p className="text-xs text-slate-400">{engineState.id?.name} Engine</p>
      <div className="w-full my-2 h-4 flex overflow-hidden rounded">
        <div
          className={`bg-white transition-all duration-500`}
          style={{ width: `${percentW}%` }}
        ></div>
        <div
          className={`bg-black transition-all duration-500`}
          style={{ width: `${percentB}%` }}
        ></div>
      </div>
      {engineState.bestLine ? (
        // Guta obrisi
        <>
        
          <p className="flex items-center gap-2">
            <span className="text-lg font-bold ">
              {engineState.bestLine.evaluation.evalAsStr}{' '}
            </span>
            {engineState.bestMove && (
              <span>
                <span className="font-bold">Best Move:</span>{' '}
                {engineState.bestMove}{' '}
                <span className="text-slate-400 italic">
                  (Depth {engineState.bestLine.depth})
                </span>
              </span>
            )}
          </p>
          <div>
            {engineState.bestLine.pv
              ?.split(' ')
              .slice(0, 8)
              ?.map((move, i) => (
                <span
                  key={`${i}-${move}`}
                  className="inline-block sp-1 hover:text-slate-300 hover:cursor-pointer rounded-sm"
                  style={{ margin: '.1em' }}
                >
                  {move}
                </span>
              ))}
          </div>
        </>
      ) : (
        <div  className="flex-col">
        <span >Loading Engine...</span>
        <div  className="text-slate-700 text-xl ">.</div>
        </div>
      )}
    </div>
  );
};
