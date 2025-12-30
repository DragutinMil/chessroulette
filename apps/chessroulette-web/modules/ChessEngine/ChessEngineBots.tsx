import { useEffect, useState, useRef } from 'react';
import {
  // ChessColor,
  ChessFEN,
  // ShortChessMove,
  // promotionalPieceSanToFenBoardPromotionalPieceSymbol,
  // toLongChessColor,
} from '@xmatter/util-kit';

type StockfishEngineProps = {
  fen: ChessFEN;
  isMyTurn: boolean;
  bot: string;
  engineMove: any;
  // engineMove: (m: ShortChessMove) => void;
};

const StockfishEngine: React.FC<StockfishEngineProps> = ({
  fen,
  isMyTurn,
  engineMove,
  bot,
}) => {
  const [stockfishOutput, setStockfishOutput] = useState('Initializing...');
  const [bestMove, setBestMove] = useState('');
  const [depth, setDepth] = useState('1');
  const [skill, setSkill] = useState('');
  const [contempt, setContempt] = useState('');
  const stockfishRef = useRef<Worker | null>(null);
  useEffect(() => {
    if (typeof window === 'undefined') return; // Ensure it's client-side

    if (skill == '' && bot) {
      if (bot.slice(-2) == '10') {
        setDepth('5');
        setSkill('12');
        setContempt('22');
      } else if (bot.slice(-2) == '08') {
        setDepth('8');
        setSkill('8');
        setContempt('18');
      } else if (bot.slice(-2) == '05') {
        setDepth('9');
        setSkill('5');
        setContempt('15');
      } else if (bot.slice(-2) == '02') {
        setDepth('5');
        setSkill('3');
        setContempt('15');
      } else if (bot.slice(-2) == '20') {
        setDepth('4');
        setSkill('0');
        setContempt('12');
      } else if (bot == '9yzBb59_POb9L000') {
        setDepth('3');
        setSkill('3');
        setContempt('10');
      } else if (bot == '9aEXYS0xwZS21000') {
        setDepth('6');
        setSkill('9');
        setContempt('6');
      } else if (bot == 'fH0667J9nJ1Ez000') {
        setDepth('8');
        setSkill('2');
        setContempt('5');
      } else if (bot == '-BihTlRZ-SKTL000') {
        setDepth('10');
        setSkill('8');
        setContempt('10');
      } else if (bot == 'Pjdw8gu5kpiRk000') {
        setDepth('9');
        setSkill('12');
        setContempt('12');
      } else {
        setDepth('1');
        setSkill('0');
        setContempt('20');
      }
    }

    try {
      const stockfish = new Worker('/stockfish.js');
      stockfishRef.current = stockfish;

      stockfish.onmessage = (event) => {
        if (
          typeof event.data === 'string' &&
          event.data.startsWith('bestmove')
        ) {
          setBestMove(event.data.split(' ')[1]);
        }
        setStockfishOutput(event.data);
      };

      stockfish.onerror = () => {
        setStockfishOutput('Stockfish error! Check console.');
      };

      stockfish.postMessage('uci');

      return () => {
        stockfish.terminate();
        stockfishRef.current = null;
      };
    } catch (error) {
      setStockfishOutput('Failed to load Stockfish.');
    }
  }, []);

  useEffect(() => {
    if (!stockfishRef.current) return;

    stockfishRef.current.postMessage(
      `setoption name Skill Level value ${skill}`
    );
    stockfishRef.current.postMessage(
      `setoption name Contempt value ${contempt}`
    );
  }, [skill, contempt]);
  useEffect(() => {
    if (!stockfishRef.current) return;

    // prekini prethodnu analizu
    stockfishRef.current.postMessage('stop');

    stockfishRef.current.postMessage(`position fen ${fen}`);
    stockfishRef.current.postMessage(`go depth ${depth}`);
  }, [fen, depth]);

  // useEffect(() => {
  // if (typeof window === 'undefined') return;
  //   try {
  //     const stockfish = new Worker('/stockfish.js');
  //     stockfish.onmessage = (event) => {
  //       if (event.data.startsWith('bestmove')) {
  //         setBestMove(event.data.split(' ')[1]);
  //       }
  //       setStockfishOutput(event.data);
  //     };
  //     stockfish.onerror = (error) => {
  //       // console.error("Stockfish error:", error);
  //       setStockfishOutput('Stockfish error! Check console.');
  //     };
  //     stockfish.postMessage('uci'); // Send UCI command to initialize Stockfish
  //     stockfish.postMessage(`setoption name Skill Level value ${skill}`);
  //     stockfish.postMessage(`setoption name Contempt value ${contempt}`);

  //     setTimeout(() => {
  //       stockfish.postMessage(`position fen ${fen}`);
  //       stockfish.postMessage(`go depth ${depth}`);
  //     }, 1000);

  //     return () => stockfish.terminate(); // Cleanup on unmount
  //   } catch (error) {
  //     // console.error("Failed to load Stockfish:", error);
  //     setStockfishOutput('Failed to load Stockfish.');
  //   }
  // }, [fen]);

  useEffect(() => {
    let m = bestMove;
    if (!isMyTurn && bestMove) {
      setTimeout(() => engineMove(m), 700);
    }
  }, [bestMove]);

  return null;
};

export default StockfishEngine;
