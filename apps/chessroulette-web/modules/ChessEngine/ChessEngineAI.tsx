import { useEffect, useState } from 'react';
import {
  ChessColor,
  ChessFEN,
  ShortChessMove,
  promotionalPieceSanToFenBoardPromotionalPieceSymbol,
  toLongChessColor,
} from '@xmatter/util-kit';

type StockfishEngineAIProps = {
  fen: ChessFEN;
  isMyTurn: boolean;
  engineMove: any;
  engineLines: any;
  puzzleMode: boolean;
  playMode: boolean;
  prevScore: number;
  moveReaction: (moveDeffinition: number) => void;
  addGameEvaluation: (score: number) => void;
};

const StockfishEngineAI: React.FC<StockfishEngineAIProps> = ({
  fen,
  isMyTurn,
  engineMove,
  puzzleMode,
  playMode,
  engineLines,
  prevScore,
  addGameEvaluation,
  moveReaction,
}) => {
  const [stockfishOutput, setStockfishOutput] = useState('Initializing...');
  const [bestMove, setBestMove] = useState('');
  const [stupidMove, setStupidMove] = useState(false);
  const [GoodMove, setGoodMove] = useState(false);
  const [lineOne, setLineOne] = useState('');
  const [lineTwo, setLinesTwo] = useState('');
  const [lineThree, setLineThree] = useState('');
  const [changes, setChanges] = useState(0);
  const [depth, setDepth] = useState('10');
  const [skill, setSkill] = useState('');
  const [contempt, setContempt] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return; // Ensure it's client-side
    setDepth('10');
    setSkill('15');
    setContempt('22');

    try {
      const stockfish = new Worker('/stockfish2.js');
      stockfish.onmessage = (event) => {
        if (event.data.startsWith('bestmove')) {
          setTimeout(() => {
            setBestMove(event.data.split(' ')[1]), 1000;
          });
        }
        if (event.data.startsWith('info depth')) {
          if (event.data.startsWith('info depth 10')) {
            const pvIndex = event.data.indexOf(' pv ');
            //  if (pvIndex === -1) return null;

            if (event.data.includes('multipv 2')) {
              setLinesTwo(event.data.slice(pvIndex + 4));
            }
            if (event.data.includes('multipv 1')) {
              setLineOne(event.data.slice(pvIndex + 4));
              const match = event.data.match(/score cp (-?\d+)/);
              if (match) {
                const score = isMyTurn
                  ? parseInt(match[1], 10)
                  : -1 * parseInt(match[1], 10);
                setStupidMove(false);
                setGoodMove(false);
                if (prevScore !== 0) {
                  const evalDiff = score - prevScore;
                  // console.log('score vs prev',score,prevScore)
                  if (evalDiff < -500) {
                    setStupidMove(true);
                    setGoodMove(false);
                  } else if (evalDiff > 400) {
                    setStupidMove(false);
                    setGoodMove(true);
                  }
                }

                addGameEvaluation(score);
              }
            }
            if (event.data.includes('multipv 3')) {
              setLineThree(event.data.slice(pvIndex + 4));
            }

            setChanges(changes + 1);
          }
        }
        setStockfishOutput(event.data);
      };
      stockfish.onerror = (error) => {
        console.error('Stockfish error:', error);
        setStockfishOutput('Stockfish error! Check console.');
      };
      stockfish.postMessage('uci'); // Send UCI command to initialize Stockfish
      stockfish.postMessage(`setoption name Skill Level value ${skill}`);
      stockfish.postMessage(`isready`);
      stockfish.postMessage(`setoption name Contempt value ${contempt}`);
      stockfish.postMessage(`setoption name MultiPV value 3`);

      stockfish.postMessage(`position fen ${fen}`);
      stockfish.postMessage(`go depth ${depth}`);

      return () => stockfish.terminate(); // Cleanup on unmount
    } catch (error) {
      // console.error("Failed to load Stockfish:", error);
      setStockfishOutput('Failed to load Stockfish.');
    }
  }, [fen]);

  // useEffect(() => {
  //    if(resetMoveReaction){

  //    }
  //   }, [resetMoveReaction]);

  useEffect(() => {
    let m = bestMove;
    if (!isMyTurn && bestMove && !puzzleMode && playMode && !stupidMove) {
      engineMove(m);
    } else if (bestMove && playMode && !puzzleMode && !stupidMove) {
      engineMove(m);
    } else if (stupidMove || GoodMove) {
      const moveDeffinition = stupidMove ? 0 : 1;

      moveReaction(moveDeffinition);
    }
  }, [bestMove, playMode]);

  useEffect(() => {
    const stockfishLines = {
      1: lineOne,
      2: lineTwo,
      3: lineThree,
    };
    engineLines(stockfishLines);
  }, [changes]);

  return null;
};

export default StockfishEngineAI;
