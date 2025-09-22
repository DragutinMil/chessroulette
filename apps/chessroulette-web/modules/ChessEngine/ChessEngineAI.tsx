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
  const [error, setError] = useState(false);

  // const [skill, setSkill] = useState('');
  // const [contempt, setContempt] = useState('');
//   const stockfishRef = useRef<Worker | null>(null);
//   const [isSearching, setIsSearching] = useState(false);
// const [lastFen, setLastFen] = useState("");

 const stockfishRef = useRef<Worker | null>(null);




///MOJ STARI KOD , UCITAVANJE POSLE SVAKE POZICIJE, NE VALJA

  useEffect(() => {
    console.log('ideee')
    if (typeof window === 'undefined') return; // Ensure it's client-side
    setDepth('10');
  
    

    try {
      
      const stockfish = new Worker('/stockfish-17-single.js');
      stockfishRef.current = stockfish;
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
             

              if (match) {
                const type = match[0];
                const value = parseInt(match[2], 10);
                if (type == 'score mate 1' || type == 'score mate 3') {
                //  console.log('ide mat 1 ili 3');
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
       stockfishRef.current?.terminate() 
      setError(true)

       
      
      };
       // Send UCI command to initialize Stockfish
     
      stockfish.postMessage(`isready`);

      stockfish.postMessage(`setoption name MultiPV value 3`);
      stockfish.postMessage('setoption name Threads value 2');
      stockfish.postMessage('setoption name Hash value 64');
      stockfish.postMessage(`position fen ${fen}`);
      stockfish.postMessage(`go depth ${depth}`);

    //  return () => stockfish.terminate(); // Cleanup on unmount
    } catch (error) {
      // console.error("Failed to load Stockfish:", error);
      setStockfishOutput('Failed to load Stockfish.');
    }
  }, [error]);

  useEffect(() => {
   // console.log('stockfishRef.current',stockfishRef.current)
    if (stockfishRef.current) {
       stockfishRef.current.onmessage = (event) => {
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
             

              if (match) {
                const type = match[0];
                const value = parseInt(match[2], 10);
                if (type == 'score mate 1' || type == 'score mate 3') {
                //  console.log('ide mat 1 ili 3');
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
      stockfishRef.current.onerror = (error) => {
        console.error('Stockfish error:', error);
         stockfishRef.current?.terminate() 
      setError(true)
        setStockfishOutput('Stockfish error! Check console.');
      };
       // Send UCI command to initialize Stockfish
     
      stockfishRef.current.postMessage(`isready`);

      stockfishRef.current.postMessage(`setoption name MultiPV value 3`);
      stockfishRef.current.postMessage('setoption name Threads value 2');
      stockfishRef.current.postMessage('setoption name Hash value 64');
      stockfishRef.current.postMessage(`position fen ${fen}`);
      stockfishRef.current.postMessage(`go depth ${depth}`);

    }
  }, [fen]);



useEffect(() => {

  }, []);

  useEffect(() => {
    let m = bestMove;
   // console.log(m);
    if (!isMyTurn && bestMove && !puzzleMode && playMode) {
      engineMove(m);
    }
  
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

























// import { useEffect, useState, useRef } from 'react';
// import {
//   ChessColor,
//   ChessFEN,
//   ShortChessMove,
//   promotionalPieceSanToFenBoardPromotionalPieceSymbol,
//   toLongChessColor,
// } from '@xmatter/util-kit';

// type StockfishEngineAIProps = {
//   fen: ChessFEN;
//   orientation: string;
//   isMyTurn: boolean;
//   engineMove: any;
//   engineLines: any;
//   puzzleMode: boolean;
//   playMode: boolean;
//   prevScore: number;
//   // moveReaction: (moveDeffinition: number) => void;
//   addGameEvaluation: (score: number) => void;
//   IsMate: (mate: boolean) => void;
// };

// const StockfishEngineAI: React.FC<StockfishEngineAIProps> = ({
//   fen,
//   isMyTurn,
//   engineMove,
//   puzzleMode,
//   playMode,
//   engineLines,
//   orientation,
//   prevScore,
//   addGameEvaluation,
//   // moveReaction,
//   IsMate,
// }) => {
//   const [stockfishOutput, setStockfishOutput] = useState('Initializing...');
//   const [bestMove, setBestMove] = useState('');
//   const [stupidMove, setStupidMove] = useState(false);
//   const [GoodMove, setGoodMove] = useState(false);
//   const [lineOne, setLineOne] = useState('');
//   const [lineTwo, setLinesTwo] = useState('');
//   const [lineThree, setLineThree] = useState('');
//   const [changes, setChanges] = useState(0);
//   const [depth, setDepth] = useState('10');
//   const [loaded, setLoaded] = useState(false);
//   // const [skill, setSkill] = useState('');
//   // const [contempt, setContempt] = useState('');
// //   const stockfishRef = useRef<Worker | null>(null);
// //   const [isSearching, setIsSearching] = useState(false);
// // const [lastFen, setLastFen] = useState("");






// ///MOJ STARI KOD , UCITAVANJE POSLE SVAKE POZICIJE, NE VALJA

//   useEffect(() => {
//     if (typeof window === 'undefined') return; // Ensure it's client-side
//     setDepth('10');
  
    

//     try {
    
//       const stockfish = new Worker('/stockfish-17-single.js');

//       stockfish.onmessage = (event) => {
//         //console.log('event.data',event.data)
//         if (event.data.startsWith('bestmove')) {
//           setTimeout(() => {
//             setBestMove(event.data.split(' ')[1]), 1000;
//           });
//         }
//         if (event.data.startsWith('info depth')) {
//           if (event.data == 'info depth 0 score mate 0') {
//             IsMate(true);
//             const parts = fen.split(' ');
//             parts[1] === 'w'
//               ? addGameEvaluation(50000)
//               : addGameEvaluation(-50000);
//           }
//           //console.log('sta',event.data)
//           if (event.data.startsWith('info depth 10')) {
//             const pvIndex = event.data.indexOf(' pv ');
//             //  console.log(event.data)
//             if (event.data.includes('multipv 2')) {
//               setLinesTwo(event.data.slice(pvIndex + 4));
//             }
//             if (event.data.includes('multipv 1')) {
//               setLineOne(event.data.slice(pvIndex + 4));
//               const match = event.data.match(/score (cp|mate) (-?\d+)/);

//               // POTEZI EVALUACIJA
             

//               if (match) {
//                 const type = match[0];
//                 const value = parseInt(match[2], 10);
//                 if (type == 'score mate 1' || type == 'score mate 3') {
//                 //  console.log('ide mat 1 ili 3');
//                   const parts = fen.split(' ');
//                   parts[1] === 'b'
//                     ? addGameEvaluation(50000)
//                     : addGameEvaluation(-50000);
//                 } else if (type === 'score mate 2') {
//                   const parts = fen.split(' ');
//                   parts[1] === 'b'
//                     ? addGameEvaluation(-50000)
//                     : addGameEvaluation(50000);
//                 } else {
//                   const score = isMyTurn ? value : -1 * value;
//                   addGameEvaluation(score);
//                 }
//               }
//             }
//             if (event.data.includes('multipv 3')) {
//               setLineThree(event.data.slice(pvIndex + 4));
//             }

//             setChanges(changes + 1);
//           }
//         }
//         setStockfishOutput(event.data);
//       };
//       stockfish.onerror = (error) => {
//         console.error('Stockfish error:', error);
//         setStockfishOutput('Stockfish error! Check console.');
//       };
//        // Send UCI command to initialize Stockfish
     
//       stockfish.postMessage(`isready`);

//       stockfish.postMessage(`setoption name MultiPV value 3`);
//       stockfish.postMessage('setoption name Threads value 2');
//       stockfish.postMessage('setoption name Hash value 64');
//       stockfish.postMessage(`position fen ${fen}`);
//       stockfish.postMessage(`go depth ${depth}`);

//     //  return () => stockfish.terminate(); // Cleanup on unmount
//     } catch (error) {
//       // console.error("Failed to load Stockfish:", error);
//       setStockfishOutput('Failed to load Stockfish.');
//     }
//   }, [fen]);


// useEffect(() => {

//   }, []);

//   useEffect(() => {
//     let m = bestMove;
//    // console.log(m);
//     if (!isMyTurn && bestMove && !puzzleMode && playMode) {
//       engineMove(m);
//     }
  
//     else {
//       engineMove(m);
//     }
//   }, [bestMove, playMode]);

//   useEffect(() => {
//     const stockfishLines = {
//       1: lineOne,
//       2: lineTwo,
//       3: lineThree,
//     };
//     engineLines(stockfishLines);
//   }, [changes]);

//   return null;
// };

// export default StockfishEngineAI;
