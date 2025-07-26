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
  // engineMove: (m: ShortChessMove) => void;
};



const StockfishEngineAI: React.FC<StockfishEngineAIProps> = ({
  fen,
  isMyTurn,
  engineMove,
  puzzleMode,
  playMode,
  engineLines,
}) => {
  const [stockfishOutput, setStockfishOutput] = useState('Initializing...');
  const [bestMove, setBestMove] = useState('');
  const [lineOne, setLineOne] = useState('');
  const [lineTwo, setLinesTwo] = useState('');
  const [lineThree, setLineThree] = useState('');
  const [changes, setChanges] = useState(0);
  const [depth, setDepth] = useState('1');
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
          setBestMove(event.data.split(' ')[1]);
        }
        if (event.data.startsWith('info depth')) {
          if (
            event.data.startsWith('info depth 5') ||
            event.data.startsWith('info depth 10')
          ) {
            const pvIndex = event.data.indexOf(' pv ');
            //  if (pvIndex === -1) return null;

            if (event.data.includes('multipv 2')) {
              console.log('prepoznaje multipv 2');
              setLinesTwo(event.data.slice(pvIndex + 4));
            }
            if (event.data.includes('multipv 1')) {
              setLineOne(event.data.slice(pvIndex + 4));
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

      setTimeout(() => {
        stockfish.postMessage(`position fen ${fen}`);
        stockfish.postMessage(`go depth ${depth}`);
      }, 1000);

      return () => stockfish.terminate(); // Cleanup on unmount
    } catch (error) {
      // console.error("Failed to load Stockfish:", error);
      setStockfishOutput('Failed to load Stockfish.');
    }
  }, [fen]);

  useEffect(() => {
    let m = bestMove;

    if (!isMyTurn && bestMove && !puzzleMode && playMode) {
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
