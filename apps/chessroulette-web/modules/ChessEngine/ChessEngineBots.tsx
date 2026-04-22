import { useEffect, useState, useRef } from 'react';
import { usePlayActionsDispatch } from '../Match/Play/hooks';
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
  botColor: any;
  engineMove: any;
  botType?: string;
  userRating?: number;
  // engineMove: (m: ShortChessMove) => void;
};

const StockfishEngine: React.FC<StockfishEngineProps> = ({
  fen,
  isMyTurn,
  engineMove,
  botColor,
  botType,
  userRating,
  bot,
}) => {
  // const [stockfishOutput, setStockfishOutput] = useState('Initializing...');
  const [bestMove, setBestMove] = useState('');
  const [depth, setDepth] = useState('1');
  const [skill, setSkill] = useState('');
  const [changeAfterMove, setChangeAfterMove] = useState(0);
  const lastPlayedFenRef = useRef<string | null>(null);
  const fenRef = useRef(fen);
  const [score, setScore] = useState('');
  const [contempt, setContempt] = useState('');
  const stockfishRef = useRef<Worker | null>(null);
  const dispatch = usePlayActionsDispatch();

  useEffect(() => {
    if (typeof window === 'undefined') return; // Ensure it's client-side
    if (skill == '' && bot) {
      let baseDepth = 2;
      let baseSkill = 1;
      let baseContempt = 10;
      if (skill === '' && bot) {
        if (bot.slice(-2) == 'vpHH6Jf7rYKwN010') {
          baseDepth = 6;
          baseSkill = 12;
          baseContempt = 22;
        } else if (bot == 'KdydnDHbBU1JY008') {
          baseDepth = 8;
          baseSkill = 8;
          baseContempt = 18;
        } else if (bot == 'O8kiLgwcKJWy9005') {
          baseDepth = 7;
          baseSkill = 5;
          baseContempt = 15;
        } else if (bot == 'NaNuXa7Ew8Kac002') {
          baseDepth = 5;
          baseSkill = 3;
          baseContempt = 15;
        } else if (bot == '8WCVE7ljCQJTW020') {
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
        getFinalSkill(baseDepth, baseSkill, baseContempt);
      }
    }

    try {
      const stockfish = new Worker('/stockfish.js');
      stockfishRef.current = stockfish;

      stockfish.onmessage = (event) => {
        // console.log('stockfish data',event.data)

        if (
          typeof event.data === 'string' &&
          event.data.startsWith('bestmove')
        ) {
          setBestMove(event.data.split(' ')[1]);
          // console.log('best move',event.data.split(' ')[1])
        }
        if (
          typeof event.data === 'string' &&
          event.data.startsWith(`info depth ${depth}`)
        ) {
          const cp = event.data.match(/score cp (-?\d+)/)?.[1];

          if (cp) {
            setScore(cp);
          }
        }
        // setStockfishOutput(event.data);
      };

      // stockfish.onerror = () => {
      //   setStockfishOutput('Stockfish error! Check console.');
      // };

      stockfish.postMessage('uci');

      return () => {
        stockfish.terminate();
        stockfishRef.current = null;
      };
    } catch (error) {
      // setStockfishOutput('Failed to load Stockfish.');
    }
  }, []);

  useEffect(() => {
    if (!isMyTurn) {
      return;
    }

    const moveNumber = parseInt(fen.split(' ')[5]);
    if (
      ((moveNumber % 5 === 0 && botType == 'matchFake') ||
        (moveNumber % 10 === 0 &&
          (botType == 'botelja' || botType == 'basic'))) &&
      changeAfterMove !== moveNumber
    ) {
      let newDepth = Number(depth);
      let newSkill = Number(skill);
      let newContempt = Number(contempt);

      if (Number(score) > 500 && Number(score) < 800) {
        newDepth += 1;
        newSkill += 1;
        newContempt += 2;
      }

      if (Number(score) > 800) {
        newDepth += 1;
        newSkill += 2;
        newContempt += 3;
      }

      if (Number(score) < -400 && Number(score) > -700) {
        newDepth -= 1;
        newSkill -= 1;
        newContempt -= 2;
      }

      if (Number(score) < -700) {
        newDepth -= 1;
        newSkill -= 2;
        newContempt -= 3;
      }

      if (Number(score) > 2000 && moveNumber > 20 && botType == 'matchFake') {
        dispatch({
          type: 'play:resignGame',
          payload: { color: botColor },
        });
      }

      // 👉 zaštita da ne ide ispod 0
      setDepth(String(Math.max(0, newDepth)));
      setSkill(String(Math.max(0, newSkill)));
      setContempt(String(Math.max(0, newContempt)));

      setChangeAfterMove(moveNumber);
    }
    console.log('cp score', score);
  }, [score]);

  useEffect(() => {
    if (userRating == undefined) {
      return;
    }
    if (botType !== 'matchFake') {
      return;
    }
    //pocetna podesavanja za MATCH MAKE
    let baseDepth;
    let baseSkill;
    let baseContempt;
    if (userRating && userRating > 1500) {
      baseDepth = 7;
      baseSkill = 8;
      baseContempt = 10;
    } else if (userRating > 1300) {
      baseDepth = 3;
      baseSkill = 5;
      baseContempt = 5;
    } else if (userRating > 1200) {
      baseDepth = 2;
      baseSkill = 3;
      baseContempt = 5;
    } else if (userRating > 1100) {
      baseDepth = 0;
      baseSkill = 1;
      baseContempt = 4;
    } else {
      baseDepth = 0;
      baseSkill = 0;
      baseContempt = 1;
    }
    getFinalSkill(baseDepth, baseSkill, baseContempt);
  }, [userRating]);

  const getFinalSkill = (
    baseDepth: number,
    baseSkill: number,
    baseContempt: number
  ) => {
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
  };
  useEffect(() => {
    console.log(depth, skill, contempt);
  }, [depth]);

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
    fenRef.current = fen;
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
  //   if (!bestMove) return;
  //   const currentFen = fenRef.current;
  //   let m = bestMove;
  //   if (lastPlayedFenRef.current === currentFen) {
  //   console.log('⛔ already played this position');
  //   return;
  // }
  //   const timeout = setTimeout(() => {
  //     setTimeout(() => {
  //       const parts = currentFen.split(' ');
  //       //  console.log('parts[1]',parts[1])
  //       //   console.log('botColor',botColor)
  //       if (botColor !== parts[1]) {
  //         console.log('❌ NOT BOT TURN (blocked)');
  //         return;
  //       }

  //       if (!isMyTurn && bestMove) {
  //         lastPlayedFenRef.current = currentFen;
  //         engineMove(m);
  //       }
  //     }, 300);
  //     return () => clearTimeout(timeout);
  //   }, 400);
  // }, [bestMove]);

  useEffect(() => {
    if (!bestMove) return;

    const timeout = setTimeout(() => {
      const currentFen = fenRef.current; // 🔥 uzmi NAJNOVIJI fen ovde

      const parts = currentFen.split(' ');

      if (botColor !== parts[1]) {
        return;
      }

      if (lastPlayedFenRef.current === currentFen) {
        console.log('⛔ already played this position');
        return;
      }

      if (!isMyTurn) {
        lastPlayedFenRef.current = currentFen;
        engineMove(bestMove);
      }
    }, 500);

    return () => clearTimeout(timeout); // ✅ pravi cleanup
  }, [bestMove]);

  return null;
};

export default StockfishEngine;
