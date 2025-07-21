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
  stockfishInfo: any;
  puzzleMode: boolean;
  playMode: boolean;
  // engineMove: (m: ShortChessMove) => void;
};

type StockfishInfo = {
  eval?: number; // ocena u pešacima (0.24 = +0.24)
  mateIn?: number; // ako je direktan mat   // broj analiziranih pozicija
  nps?: number; // brzina analize (pozicija u sekundi)    // dubina analize
  pv?: string[]; // glavna linija (principal variation)
};

const StockfishEngineAI: React.FC<StockfishEngineAIProps> = ({
  fen,
  isMyTurn,
  engineMove,
  puzzleMode,
  playMode,
  stockfishInfo,
}) => {
  const [stockfishOutput, setStockfishOutput] = useState('Initializing...');
  const [bestMove, setBestMove] = useState('');

  const [depth, setDepth] = useState('1');
  const [skill, setSkill] = useState('');
  const [contempt, setContempt] = useState('');

  function parseStockfishInfo(line: string): StockfishInfo | null {
    if (!line.startsWith('info')) return null;

    const tokens = line.split(' ');
    const result: StockfishInfo = {};

    for (let i = 0; i < tokens.length; i++) {
      switch (tokens[i]) {
        case 'score':
          if (tokens[i + 1] === 'cp') {
            result.eval = parseInt(tokens[i + 2]) / 100; // pretvori u pešake
          } else if (tokens[i + 1] === 'mate') {
            result.mateIn = parseInt(tokens[i + 2]);
          }
          break;
        case 'nps':
          result.nps = parseInt(tokens[i + 1]);
          break;
        case 'pv':
          result.pv = tokens.slice(i + 1);
          i = tokens.length; // kraj, ostatak je pv
          break;
      }
    }

    return result;
  }
  useEffect(() => {
    if (typeof window === 'undefined') return; // Ensure it's client-side
    setDepth('10');
    setSkill('15');
    setContempt('22');

    try {
      const stockfish = new Worker('/stockfish.js');
      stockfish.onmessage = (event) => {
        if (event.data.startsWith('bestmove')) {
          setBestMove(event.data.split(' ')[1]);
          //  console.log('event stockfish move',event.data)
        }
        if (event.data.startsWith('info')) {
          const parsed = parseStockfishInfo(event.data);
          //  console.log('event stockfish move sec',event.data)
        }
        setStockfishOutput(event.data);
      };
      stockfish.onerror = (error) => {
        console.error('Stockfish error:', error);
        setStockfishOutput('Stockfish error! Check console.');
      };
      stockfish.postMessage('uci'); // Send UCI command to initialize Stockfish
      stockfish.postMessage(`setoption name Skill Level value ${skill}`);
      stockfish.postMessage(`setoption name Contempt value ${contempt}`);

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
      stockfishInfo(m);
    } else {
      stockfishInfo(m);
    }
  }, [bestMove, playMode]);

  return null;
};

export default StockfishEngineAI;
