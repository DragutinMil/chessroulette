import { useEffect, useState, useRef } from 'react';
import {
  ChessColor,
  ChessFEN,
  ShortChessMove,
  promotionalPieceSanToFenBoardPromotionalPieceSymbol,
  toLongChessColor,
} from '@xmatter/util-kit';
import { getStockfishWorker, newStockfish } from './stockfishWorker.js';

type StockfishEngineAIProps = {
  fen: ChessFEN;
  orientation: string;
  isMyTurn: boolean;
  engineMove: any;
  engineLines: any;
  puzzleMode: boolean;
  playMode: boolean;
  newRatingEngine: number;
  isMobile: boolean;
  ratingEngine: any;
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
  isMobile,
  addGameEvaluation,
  newRatingEngine,
  ratingEngine,
  // moveReaction,
  IsMate,
}) => {
  const [stockfishOutput, setStockfishOutput] = useState('Initializing...');
  const [bestMove, setBestMove] = useState('');
  const [lineOne, setLineOne] = useState('');
  const [lineTwo, setLinesTwo] = useState('');
  const [lineThree, setLineThree] = useState('');
  const [changes, setChanges] = useState(0);
  const [depth, setDepth] = useState(11);
  const [skill, setSkill] = useState(13);
  const [currentRating, setCurrentRating] = useState(1999);

  const [error, setError] = useState(false);

  // const [skill, setSkill] = useState('');
  // const [contempt, setContempt] = useState('');
  //   const stockfishRef = useRef<Worker | null>(null);
  //   const [isSearching, setIsSearching] = useState(false);
  // const [lastFen, setLastFen] = useState("");

  const stockfishRef = useRef<Worker | null>(null);

  useEffect(() => {
    function getStockfishSettingsByRating(rating: number) {
      if (rating < 900) return { skill: 1, depth: 2, ratingCurr: 800 };
      if (rating < 1000) return { skill: 2, depth: 3, ratingCurr: 900 };
      if (rating < 1100) return { skill: 3, depth: 3, ratingCurr: 1000 };
      if (rating < 1200) return { skill: 4, depth: 4, ratingCurr: 1100 };
      if (rating < 1300) return { skill: 5, depth: 4, ratingCurr: 1200 };
      if (rating < 1400) return { skill: 6, depth: 5, ratingCurr: 1300 };
      if (rating < 1500) return { skill: 7, depth: 5, ratingCurr: 1400 };
      if (rating < 1600) return { skill: 8, depth: 6, ratingCurr: 1500 };
      if (rating < 1700) return { skill: 9, depth: 6, ratingCurr: 1600 };
      if (rating < 1800) return { skill: 10, depth: 7, ratingCurr: 1700 };
      if (rating < 1900) return { skill: 11, depth: 8, ratingCurr: 1800 };
      if (rating < 2000) return { skill: 12, depth: 9, ratingCurr: 1900 };
      if (rating < 2100) return { skill: 13, depth: 10, ratingCurr: 2000 };
      if (rating < 2200) return { skill: 14, depth: 11, ratingCurr: 2100 };
      if (rating < 2300) return { skill: 15, depth: 12, ratingCurr: 2200 };
      if (rating < 2400) return { skill: 16, depth: 13, ratingCurr: 2300 };
      if (rating < 2500) return { skill: 17, depth: 14, ratingCurr: 2400 };
      if (rating < 2600) return { skill: 18, depth: 16, ratingCurr: 2500 };
      if (rating < 2700) return { skill: 19, depth: 18, ratingCurr: 2600 };
      return { skill: 20, depth: 20 };
    }

    const { skill, depth, ratingCurr } =
      getStockfishSettingsByRating(newRatingEngine);
    if (newRatingEngine) {
      setSkill(skill);
      setDepth(depth);
      //   setCurrentRating(ratingCurr ?? currentRating);
      //  console.log(skill, depth, ratingCurr);
      ratingEngine(ratingCurr ?? currentRating);
    }
  }, [newRatingEngine]);



  useEffect(() => {
    if (typeof window === 'undefined') return; // Ensure it's client-side

    try {
     
      const stockfish = newStockfish()
      stockfishRef.current = stockfish;
      // stockfish.onmessage = (event:any) => {
      //    console.log('standard ucitavanje1')
      //   if (event.data.startsWith('bestmove')) {
      //     setTimeout(() => {
      //       setBestMove(event.data.split(' ')[1]);
      //     }, 300);
      //   }

      //   if (event.data.startsWith('info depth')) {
      //     if (event.data == 'info depth 0 score mate 0') {
      //       IsMate(true);
      //       const parts = fen.split(' ');
      //       parts[1] === 'w'
      //         ? addGameEvaluation(50000)
      //         : addGameEvaluation(-50000);
      //     }
      //     //   console.log('sta',event.data)
      //     if (event.data.startsWith(`info depth ${depth}`)) {
      //       const pvIndex = event.data.indexOf(' pv ');
      //       //   console.log('deptara',event.data)
      //       if (event.data.includes('multipv 2')) {
      //         setLinesTwo(event.data.slice(pvIndex + 4));
      //       }
      //       if (event.data.includes('multipv 1')) {
      //         setLineOne(event.data.slice(pvIndex + 4));
      //         const match = event.data.match(/score (cp|mate) (-?\d+)/);

      //         // POTEZI EVALUACIJA

      //         if (match) {
      //           const type = match[0];
      //           const value = parseInt(match[2], 10);
      //           if (type == 'score mate 1' || type == 'score mate 3') {
      //             console.log('ide mat 1 ili 3', type);
      //             const parts = fen.split(' ');

      //             parts[1] === 'b'
      //               ? addGameEvaluation(50000)
      //               : addGameEvaluation(-50000);
      //           } else if (type === 'score mate 2') {
      //             const parts = fen.split(' ');

      //             parts[1] === 'b'
      //               ? addGameEvaluation(-50000)
      //               : addGameEvaluation(50000);
      //           } else {
      //             const score = isMyTurn ? value : -1 * value;
      //             addGameEvaluation(score);
      //           }
      //         }
      //       }
      //       if (event.data.includes('multipv 3')) {
      //         setLineThree(event.data.slice(pvIndex + 4));
      //       }

      //       setChanges((prev) => prev + 1);
      //     }
      //   }
      //   setStockfishOutput(event.data);
      // };
      stockfish.onerror = (error:any) => {
        console.error('Stockfish error:', error);
        setStockfishOutput('Stockfish error! Check console.');
        stockfishRef.current?.terminate();
        setError(true);
      };
      // Send UCI command to initialize Stockfish
      setTimeout(() => {
        stockfish.postMessage(`isready`);
        stockfish.postMessage(`setoption name MultiPV value 3`);
        stockfish.postMessage('setoption name Threads value 2');
        stockfish.postMessage('setoption name Hash value 64');
        stockfish.postMessage(`setoption name Skill Level value ${skill}`);
        stockfish.postMessage(`position fen ${fen}`);
        stockfish.postMessage(`go depth ${depth}`);
      }, 2000);

      //  return () => stockfish.terminate(); // Cleanup on unmount
    } catch (error) {
      // console.error("Failed to load Stockfish:", error);
      setStockfishOutput('Failed to load Stockfish.');
    }
  }, [error]);

  useEffect(() => {
    console.log('fen')
    // console.log('stockfishRef.current',stockfishRef.current)
    if (stockfishRef.current) {
      stockfishRef.current.onmessage = (event) => {
         console.log('feniranje')
        if (event.data.startsWith('bestmove')) {
          setTimeout(() => {
            setBestMove(event.data.split(' ')[1]), 300;
          });
        }

        if (event.data.startsWith('info depth')) {
          if (event.data == 'info depth 0 score mate 0') {
            IsMate(true);
            //  console.log('event.data', event.data);
            const parts = fen.split(' ');
            // console.log('parts',parts)
            (parts[1] === 'w' && orientation === 'w') ||
            (parts[1] === 'b' && orientation === 'b')
              ? addGameEvaluation(-50000)
              : addGameEvaluation(50000);
          }
          //console.log('sta',event.data)
          if (event.data.startsWith(`info depth ${depth}`)) {
            const pvIndex = event.data.indexOf(' pv ');
            // console.log(event.data)
            if (event.data.includes('multipv 2')) {
              setLinesTwo(event.data.slice(pvIndex + 4));
            }
            if (event.data.includes('multipv 1')) {
              setLineOne(event.data.slice(pvIndex + 4));
              const match = event.data.match(/score (cp|mate) (-?\d+)/);

              // POTEZI EVALUACIJA

              if (match) {
                const type = match[0];
                const value = parseInt(match[2], 10);
                if (type == 'score mate 1' || type == 'score mate 3') {
                  //  console.log('ide mat 1 ili 3');
                  const parts = fen.split(' ');

                  (parts[1] === 'w' && orientation === 'w') ||
                  (parts[1] === 'b' && orientation === 'b')
                    ? addGameEvaluation(50000)
                    : addGameEvaluation(-50000);
                } else if (type === 'score mate 2') {
                  const parts = fen.split(' ');
                  //   console.log('ide mat 2', parts);
                  (parts[1] === 'w' && orientation === 'w') ||
                  (parts[1] === 'b' && orientation === 'b')
                    ? // (parts[1] === 'w' && orientation==='b') || (parts[1] === 'b' && orientation==='w')
                      addGameEvaluation(-50000)
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
      stockfishRef.current.onerror = (error) => {
        console.error('Stockfish error:', error);
        stockfishRef.current?.terminate();
        setError(true);
        setStockfishOutput('Stockfish error! Check console.');
      };
      // Send UCI command to initialize Stockfish

      stockfishRef.current.postMessage(`position fen ${fen}`);
      stockfishRef.current.postMessage(`go depth ${depth}`);
      // stockfishRef.current.postMessage(
      //   `setoption name Skill Level value ${skill}`
      // );
    }
  }, [fen]);

  useEffect(() => {
    let m = bestMove;

    if (!isMyTurn && bestMove && !puzzleMode && playMode) {
      engineMove(m);
    } else {
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