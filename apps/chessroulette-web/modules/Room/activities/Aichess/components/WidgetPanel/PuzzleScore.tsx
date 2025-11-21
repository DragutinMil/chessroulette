import { useEffect, useState, useRef } from 'react';
import type { chessAiMode } from '../../movex/types';
import styles from './css/aichessStyle.module.css';
import confetti from 'canvas-confetti';
type Props = {
  chessAiMode: chessAiMode;
};
export const puzzleRatingLevels = [
  {
    title: '😵 Novice',
    range: [1200, 1349],
    sublevels: [
      { label: '😵 Very Beginner 1', start: 1200, end: 1249 },
      { label: '😵 Very Beginner 2', start: 1250, end: 1299 },
      { label: '😵 Very Beginner 3', start: 1300, end: 1349 },
    ],
  },
  {
    title: '💪 Novice',
    range: [1350, 1499],
    sublevels: [
      { label: '💪 Novice 1', start: 1350, end: 1399 },
      { label: '💪 Novice 2', start: 1400, end: 1449 },
      { label: '💪 Novice 3', start: 1450, end: 1499 },
    ],
  },
  {
    title: '🧠 Tactician',
    range: [1500, 1649],
    sublevels: [
      { label: '🧠 Tactician 1', start: 1500, end: 1549 },
      { label: '🧠 Tactician 2', start: 1550, end: 1599 },
      { label: '🧠 Tactician 3', start: 1600, end: 1649 },
    ],
  },
  {
    title: '⚔️ Attacker',
    range: [1650, 1799],
    sublevels: [
      { label: '⚔️ Attacker 1', start: 1650, end: 1655 },
      { label: '⚔️ Attacker 2', start: 1656, end: 1749 },
      { label: '⚔️ Attacker 3', start: 1750, end: 1799 },
    ],
  },
  {
    title: '🧙 Strategist',
    range: [1800, 1949],
    sublevels: [
      { label: '🧙 Strategist 1', start: 1800, end: 1849 },
      { label: '🧙 Strategist 2', start: 1850, end: 1899 },
      { label: '🧙 Strategist 3', start: 1900, end: 1949 },
    ],
  },
  {
    title: '🧠 Mastermind',
    range: [1950, 2099],
    sublevels: [
      { label: '🧠 Mastermind 1', start: 1950, end: 1999 },
      { label: '🧠 Mastermind 2', start: 2000, end: 2049 },
      { label: '🧠 Mastermind 3', start: 2050, end: 2099 },
    ],
  },
  {
    title: '🦾 Elite',
    range: [2100, 2250],
    sublevels: [
      { label: '🦾 Elite 1', start: 2100, end: 2149 },
      { label: '🦾 Elite 2', start: 2150, end: 2199 },
      { label: '🦾 Elite 3', start: 2200, end: 2249 },
    ],
  },
  {
    title: '🐉 Puzzle Beast',
    range: [2250, 2399],
    sublevels: [
      { label: '🐉 Beast 1', start: 2250, end: 2299 },
      { label: '🐉 Beast 2', start: 2300, end: 2349 },
      { label: '🐉 Beast 3', start: 2350, end: 2399 },
    ],
  },
  {
    title: '🛡️ Grandmaster',
    range: [2400, 2549],
    sublevels: [
      { label: '🛡️ Grandmaster 1', start: 2400, end: 2449 },
      { label: '🛡️ Grandmaster 2', start: 2450, end: 2499 },
      { label: '🛡️ Grandmaster 3', start: 2500, end: 2549 },
    ],
  },
  {
    title: '🔥 Legend',
    range: [2550, 2699],
    sublevels: [
      { label: '🔥 Legend 1', start: 2550, end: 2599 },
      { label: '🔥 Legend 2', start: 2600, end: 2649 },
      { label: '🔥 Legend 3', start: 2650, end: 2699 },
    ],
  },
  {
    title: '🌟 Champion',
    range: [2700, 2849],
    sublevels: [
      { label: '🌟 Champion 1', start: 2700, end: 2749 },
      { label: '🌟 Champion 2', start: 2750, end: 2799 },
      { label: '🌟 Champion 3', start: 2800, end: 2849 },
    ],
  },
  {
    title: '🐲 Dragon Lord',
    range: [2850, 2949],
    sublevels: [
      { label: '🐲 Dragon Lord 1', start: 2850, end: 2899 },
      { label: '🐲 Dragon Lord 2', start: 2900, end: 2949 },
      { label: '🐲 Dragon Lord 3', start: 2950, end: 2999 },
    ],
  },
  {
    title: '👑 Ultimate',
    range: [2950, 3000],
    sublevels: [
      { label: 'Ultimate 1', start: 3000, end: 3049 },
      { label: 'Ultimate 2', start: 3050, end: 3099 },
      { label: 'Ultimate 3', start: 3100, end: Infinity },
    ],
  },
];

//console.log('currentChapterState',currentChapterState)

const PuzzleScore = ({ chessAiMode }: Props) => {
   const componentRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(chessAiMode.userPuzzleRating ?? 0);
  const [flipping, setFlipping] = useState<boolean>(false);
  const [change, setChange] = useState<number>(0);
  const [previousValue, setPreviousValue] = useState<number>(value);
  const [showChange, setShowChange] = useState(false);
  const [animateLabel, setAnimateLabel] = useState(false);
  const [prevLabel, setPrevLabel] = useState<string | null>(null);

  useEffect(() => {
    if (chessAiMode.userPuzzleRating) {
      setChange(chessAiMode.ratingChange);
      setShowChange(true);
      setValue(chessAiMode.userPuzzleRating);
      setTimeout(() => setShowChange(false), 1000);
    }
  }, [chessAiMode.userPuzzleRating]);

  useEffect(() => {
    if (value !== previousValue) {
      setFlipping(true);
      const timeout = setTimeout(() => {
        setFlipping(false);
        setPreviousValue(value);
      }, 600);
      return () => clearTimeout(timeout);
    }
  }, [value, previousValue]);

  

  //   const prevLavel = 1200
  //   const nextLavelGap = 150;
  // const  percentage  = ((value - prevLavel + chessAiMode.ratingChange+1) / nextLavelGap) * 100
  const getSublevel = (rating: number) => {
    for (const level of puzzleRatingLevels) {
      for (const sub of level.sublevels) {
        if (rating >= sub.start && rating <= sub.end) {
          return sub;
        }
      }
    }
    return null;
  };

  const currentSublevel = getSublevel(value);
  const percentage = currentSublevel
    ? ((value - currentSublevel.start) /
        (currentSublevel.end - currentSublevel.start)) *
      100
    : 0;

 
useEffect(() => {
  
  if (!componentRef.current) return;
 


  
  if (!currentSublevel?.label ) return;
  if (prevLabel === null) {
    setPrevLabel(currentSublevel.label);
    return;
  }
  if (prevLabel === currentSublevel.label) return;

  const prev = Number(prevLabel?.slice(-1));
const curr = Number(currentSublevel?.label.slice(-1));

const validTransitions: Record<number, number[]> = {
  1: [2],   
  2: [3],       
  3: [1],      
};
if (validTransitions[prev]?.includes(curr)) {
  
  const rect = componentRef.current.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;
    confetti({
      startVelocity: 15,
      particleCount: 30,
      spread: 360,
      origin: { x, y },
    });
 setAnimateLabel(true);
  setPrevLabel(currentSublevel.label);
  const t = setTimeout(() => {
    setAnimateLabel(false);
  }, 2000);
  
  return () => clearTimeout(t);
}else{
  setPrevLabel(currentSublevel.label);
}
}, [currentSublevel?.label]);


return (
    <div ref={componentRef} >
      <style>
{`
  /* Label intense blink + scale */
  @keyframes sublevelBlinkStrong {
  0%   { transform: scale(1);    opacity: 1;   }
  12%  { transform: scale(1.25); opacity: 0.75; }
  28%  { transform: scale(1.14); opacity: 1;    }
  44%  { transform: scale(1.30); opacity: 0.82; }
  60%  { transform: scale(1.17); opacity: 1;    }
  72%  { transform: scale(1.22); opacity: 0.9;  }
  84%  { transform: scale(1.10); opacity: 1;    }
  92%  { transform: scale(1.17); opacity: 0.85; }
  100% { transform: scale(1);    opacity: 1;    }
}

  .animate-sublevel-blink-strong {
    animation: sublevelBlinkStrong 2s ease-out;
  }

  /* Whole component "burn" pulse */
  @keyframes firePulse {
    0% {
      box-shadow: 0 0 0px rgba(7, 218, 99, 0.0);
      background-color: rgba(7, 218, 99, 0.1);
    }
    30% {
      box-shadow: 0 0 22px rgba(7, 218, 99, 0.45);
      background-color: rgba(7, 218, 99, 0.2);
    }
    60% {
      box-shadow: 0 0 35px rgba(7, 218, 99, 0.55);
      background-color: rgba(7, 218, 99, 0.3);
    }
    100% {
      box-shadow: 0 0 0px rgba(7, 218, 99, 0.0);
      background-color: rgba(7, 218, 99, 0.1);
    }
  }

  .animate-fire-pulse {
    animation: firePulse  1.2s ease-out;
  }
`}
</style>
      {/* {value > 0 && ( */}
      <div className={`rounded-lg mb-1 mt-1 md:px-4 md:pb-4 px-2 pb-2 pt-2 border border-conversation-100 bg-[#01210B]
    ${animateLabel ? "animate-fire-pulse" : ""}
  `}>
        <div className="flex justify-between ">
          <div className="text-[10px] font-bold text-[#8F8F90] mb-1 relative">
                {animateLabel && (
    <span className="text-red-400 text-[16px] animate-sublevel-blink-strong absolute bottom-[-3px] left-12">🔥</span>
  )}
            RATING
          </div>
          <div className=" text-[10px] font-bold text-[#8F8F90] mb-1 ">
        
            LEVEL
          </div>
        </div>
        <div
          className={`${styles.flipNumber} w-full text-white text-xl  font-bold mb-2 inline-block min-w-[40px] min-h-[24px]`}
        >
          <div className="flex justify-between align-center">
            <div>
              <span
                key={value}
                className={`${styles.flipInner} ${flipping ? styles.flip : ''}`}
              >
                {value}
              </span>

              {showChange &&
                change !== 0 &&
                (change > 0 ? (
                  <span className="absolute -bottom-1  ml-1 text-green-400 text-[18px] font-bold animate-fadeUp">
                    +{change}
                  </span>
                ) : (
                  <span className="absolute -top-4  ml-1 text-red-500 text-[18px] font-bold animate-fadeUp">
                    {change}
                  </span>
                ))}
            </div>
            <span
            
             className={`flex items-center justify-center font-bold text-green-400 md:text-lg text-base  
    ${animateLabel ? "animate-sublevel-blink-strong" : ""}`}>
              {currentSublevel?.label}
            </span>
          </div>
        </div>

        <div className="w-full h-4 bg-[#414141] rounded-full overflow-hidden">
          <div
            className="h-full bg-red-500 transition-all duration-500 rounded-full"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
      {/* )} */}
    </div>
  );
};
 
export default PuzzleScore;
