import { useEffect ,useState} from "react";
import {
    ChessColor,
    ChessFEN,
    ShortChessMove,
    promotionalPieceSanToFenBoardPromotionalPieceSymbol,
    toLongChessColor,
  } from '@xmatter/util-kit';



type StockfishEngineProps = {
  fen: ChessFEN ;
  isMyTurn:boolean;
  bot:string
  engineMove:any
 // engineMove: (m: ShortChessMove) => void;
  
};

const StockfishEngine : React.FC<StockfishEngineProps> = ({ 
  fen,
  isMyTurn,
  engineMove,
  bot
 
})=> {
  const [stockfishOutput, setStockfishOutput] = useState("Initializing...");
  const [bestMove, setBestMove] = useState("");
  const [depth, setDepth] = useState("1");
  const [skill, setSkill] = useState("");
  const [contempt, setContempt] = useState("");
  


  useEffect(() => {
   // console.log('bot',bot)
    if (typeof window === "undefined") return; // Ensure it's client-side
   // console.log('botic',bot.slice(-2),depth,skill,contempt)
   if(skill=='' && bot){
    if(bot.slice(-2) == '10'){
      setDepth('5')
      setSkill('12')
      setContempt('22')
    }
    else if(bot.slice(-2) == '08'){
      setDepth('8')
      setSkill('8')
      setContempt('18')
    }
    else if(bot.slice(-2) == '05'){
      setDepth('9')
      setSkill('5')
      setContempt('15')
    }
    else if(bot.slice(-2) == '02'){
      setDepth('5')
      setSkill('3')
      setContempt('15')
    }
    else if(bot.slice(-2) == '20'){
      setDepth('4')
      setSkill('0')
      setContempt('12')
    }
    else{
      setDepth('1')
      setSkill('0')
      setContempt('20')
    }
   }
    try {
       const stockfish = new Worker("/stockfish.js"); 
      stockfish.onmessage = (event) => {
      if (event.data.startsWith("bestmove") ) {
        setBestMove(event.data.split(" ")[1]);
      }
        setStockfishOutput(event.data);
      };
      stockfish.onerror = (error) => {
        // console.error("Stockfish error:", error);
        setStockfishOutput("Stockfish error! Check console.");
      };
      stockfish.postMessage("uci"); // Send UCI command to initialize Stockfish
      stockfish.postMessage(`setoption name Skill Level value ${skill}`);
      stockfish.postMessage(`setoption name Contempt value ${contempt}`);
      
      setTimeout(() => {
        stockfish.postMessage(`position fen ${fen}`);
        stockfish.postMessage(`go depth ${depth}`);
    }, 1000);

      return () => stockfish.terminate(); // Cleanup on unmount
    } catch (error) {
      // console.error("Failed to load Stockfish:", error);
      setStockfishOutput("Failed to load Stockfish.");
    }
  }, [fen]);
  
  useEffect(() => {
    let m=bestMove
        if(!isMyTurn &&  bestMove){
            engineMove(m);
        }
  }, [bestMove]);


  return null; 
};

export default StockfishEngine;