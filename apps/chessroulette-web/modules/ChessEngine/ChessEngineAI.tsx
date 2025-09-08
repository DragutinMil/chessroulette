import { useEffect, useState, useRef } from 'react';
import {
  ChessColor,
  ChessFEN,
  ShortChessMove,
  promotionalPieceSanToFenBoardPromotionalPieceSymbol,
  toLongChessColor,
} from '@xmatter/util-kit';

type StockfishEngineAIProps = {
  fen: ChessFEN;
  orientation: string;
  isMyTurn: boolean;
  engineMove: any;
  engineLines: any;
  puzzleMode: boolean;
  playMode: boolean;
  prevScore: number;
  // moveReaction: (moveDeffinition: number) => void;
  addGameEvaluation: (score: number) => void;
  IsMate: (mate: boolean) => void;
};

const StockfishEngineAI: React.FC<StockfishEngineAIProps> = ({
  fen,
  isMyTurn,
  engineMove,
  puzzleMode,
  playMode,
  engineLines,
  orientation,
  prevScore,
  addGameEvaluation,
  // moveReaction,
  IsMate,
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
      const stockfish = new Worker('/stockfish-17-single.js');

      stockfish.onmessage = (event) => {
        //console.log('event.data',event.data)
        if (event.data.startsWith('bestmove')) {
          setTimeout(() => {
            setBestMove(event.data.split(' ')[1]), 1000;
          });
        }
        if (event.data.startsWith('info depth')) {
          if (event.data == 'info depth 0 score mate 0') {
            IsMate(true);
            const parts = fen.split(' ');
            parts[1] === 'w'
              ? addGameEvaluation(50000)
              : addGameEvaluation(-50000);
          }
          //console.log('sta',event.data)
          if (event.data.startsWith('info depth 10')) {
            const pvIndex = event.data.indexOf(' pv ');
            //  console.log(event.data)
            if (event.data.includes('multipv 2')) {
              setLinesTwo(event.data.slice(pvIndex + 4));
            }
            if (event.data.includes('multipv 1')) {
              setLineOne(event.data.slice(pvIndex + 4));
              const match = event.data.match(/score (cp|mate) (-?\d+)/);

              // POTEZI EVALUACIJA
              console.log('match', match[0]);

              if (match) {
                const type = match[0];
                const value = parseInt(match[2], 10);
                if (type == 'score mate 1' || type == 'score mate 3') {
                  console.log('ide mat 1 ili 3');
                  const parts = fen.split(' ');
                  parts[1] === 'b'
                    ? addGameEvaluation(50000)
                    : addGameEvaluation(-50000);
                } else if (type === 'score mate 2') {
                  const parts = fen.split(' ');
                  parts[1] === 'b'
                    ? addGameEvaluation(-50000)
                    : addGameEvaluation(50000);
                } else {
                  const score = isMyTurn ? value : -1 * value;
                  addGameEvaluation(score);
                }
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
    console.log(m);
    if (!isMyTurn && bestMove && !puzzleMode && playMode) {
      engineMove(m);
    }
    // else if (bestMove && playMode && !puzzleMode && !stupidMove) {
    //   engineMove(m);
    // }
    // else if (stupidMove || GoodMove) {
    //   const moveDeffinition = stupidMove ? 0 : 1;
    //   moveReaction(moveDeffinition);
    // }
    else {
      engineMove(m);
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
