import { useEffect ,useState} from "react";
//import { useMoves } from '../../components/Chessboard/ChessboardContainer/hooks/useMoves';
import { Chess } from 'chess.js'
// import {
 
//   ShortChessMove,
//   ChessColor,
// } from '@xmatter/util-kit';

type Stockfish16Props = {
  state: any;
};

const Stockfish16 : React.FC<Stockfish16Props> = ({ 
  state,
})=> {
  const [stockfishOutput, setStockfishOutput] = useState("Initializing...");
  const [bestMove, setBestMove] = useState("");
  const game = new Chess();

  console.log('krkic',state)
  useEffect(() => {
    if (typeof window === "undefined") return; // Ensure it's client-side

    try {
       const stockfish = new Worker("/stockfish.js"); // Load from public folder
      // console.log("Stockfish worker created!");
      
      stockfish.onmessage = (event) => {

      //  console.log("Stockfish:", event.data ,state.turn);  && state.turn=='w'
      if (event.data.startsWith("bestmove") ) {
       // console.log('state',event.data)
        setBestMove(event.data.split(" ")[1]);
       
      }

        setStockfishOutput(event.data);
      };
// stockfish.postMessage(`position fen ${fen}`);
      stockfish.onerror = (error) => {
        // console.error("Stockfish error:", error);
        setStockfishOutput("Stockfish error! Check console.");
      };
      
      stockfish.postMessage("uci"); // Send UCI command to initialize Stockfish
      stockfish.postMessage(`position fen ${state}`);
      stockfish.postMessage("go depth 1");

      return () => stockfish.terminate(); // Cleanup on unmount
    } catch (error) {
      // console.error("Failed to load Stockfish:", error);
      setStockfishOutput("Failed to load Stockfish.");
    }
  }, [state]);
  
  useEffect(() => {
    

          //  ({from: 'd5', to: 'd4'})
    if(state.turn=='b'){
      console.log('bestMove',bestMove,state.turn)
      // game.move('g7g6')
    }
      

  }, [bestMove]);


  return (
    <div>
      {bestMove && <p>Best Move: {bestMove}</p>}
    </div>
  );
};


//   const [engine, setEngine] = useState<Worker | null>(null);
//   const [bestMove, setBestMove] = useState("");

//   useEffect(() => {
//     const stockfish = new Worker("/stockfish.js"); // Pokreće Stockfish.js iz `public` foldera
//     setEngine(stockfish);

//     stockfish.onmessage = (event) => {
//       console.log("Stockfish:", event.data);
//       if (event.data.startsWith("bestmove")) {
//         setBestMove(event.data.split(" ")[1]);
//       }
//     };

//     return () => stockfish.terminate();
//   }, []);

//   const analyzePosition = () => {
//     if (engine) {
//       engine.postMessage("uci");
//       engine.postMessage("position startpos");
//       engine.postMessage("go depth 5");
//     }
//   };

//   return (
//     <div>
//       <h2>Stockfish Chess Engine</h2>
//       <button onClick={analyzePosition}>Analyze Position</button>
//       {bestMove && <p>Best Move: {bestMove}</p>}
//     </div>
//   );
// };
export default Stockfish16;