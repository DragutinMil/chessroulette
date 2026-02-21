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
      let baseDepth = 1;
      let baseSkill = 0;
      let baseContempt = 20;

      if (skill === '' && bot) {
        if (bot.slice(-2) == '10') {
          baseDepth = 5;
          baseSkill = 12;
          baseContempt = 22;
        } else if (bot.slice(-2) == '08') {
          baseDepth = 8;
          baseSkill = 8;
          baseContempt = 18;
        } else if (bot.slice(-2) == '05') {
          baseDepth = 9;
          baseSkill = 5;
          baseContempt = 15;
        } else if (bot.slice(-2) == '02') {
          baseDepth = 5;
          baseSkill = 3;
          baseContempt = 15;
        } else if (bot.slice(-2) == '20') {
          baseDepth = 4;
          baseSkill = 0;
          baseContempt = 12;
        } else if (bot == '9yzBb59_POb9L000') {
          baseDepth = 1;
          baseSkill = 0;
          baseContempt = 0;
        } else if (bot == '9aEXYS0xwZS21000') {
          baseDepth = 3;
          baseSkill = 6;
          baseContempt = 5;
        } else if (bot == 'fH0667J9nJ1Ez000') {
          baseDepth = 4;
          baseSkill = 3;
          baseContempt = 4;
        } else if (bot == '-BihTlRZ-SKTL000') {
          baseDepth = 6;
          baseSkill = 6;
          baseContempt = 8;
        } else if (bot == 'Pjdw8gu5kpiRk000') {
          baseDepth = 6;
          baseSkill = 9;
          baseContempt = 9;
        }
        //  console.log('base', baseDepth, baseSkill, baseContempt);
        const randomize = (value: number, delta = 2, min = 0, max = 20) => {
          const rnd = Math.floor(Math.random() * (delta * 2 + 1)) - delta; // -delta .. +delta
          const v = value + rnd;
          return Math.max(min, Math.min(max, v));
        };
        const finalDepth = randomize(baseDepth, 2, 1, 15);
        const finalSkill = randomize(baseSkill, 2, 0, 20);
        const finalContempt = randomize(baseContempt, 2, 0, 30);

        setDepth(String(finalDepth));
        setSkill(String(finalSkill));
        setContempt(String(finalContempt));
        console.log(finalDepth, finalSkill, finalContempt);
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

    if (depth && Number(depth) > 5) {
      stockfishRef.current.postMessage(`go depth ${depth}`);
    }
    if (depth && Number(depth) > 3) {
      stockfishRef.current.postMessage(
        `setoption name UCI_LimitStrength value true`
      );
      stockfishRef.current.postMessage(`setoption name UCI_Elo value 800`);
      stockfishRef.current.postMessage(`go depth ${depth}`);
    } else if (Number(depth) > 2) {
      stockfishRef.current.postMessage(
        `setoption name UCI_LimitStrength value true`
      );
      stockfishRef.current.postMessage(`setoption name UCI_Elo value 700`);
      stockfishRef.current.postMessage(`go movetime 35`);
    } else {
      stockfishRef.current.postMessage(`go movetime 20`);
      stockfishRef.current.postMessage(
        `setoption name UCI_LimitStrength value true`
      );
      stockfishRef.current.postMessage(`setoption name UCI_Elo value 500`);
    }
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
