import { useEffect, useState } from 'react';
import type { chessAiMode } from '../../movex/types';
import styles from './css/aichessStyle.module.css';

type Props = {
  chessAiMode: chessAiMode;
};
export const puzzleRatingLevels = [
  {
    title: '💪 Novice',
    range: [1200, 1349],
    sublevels: [
      { label: 'Novice 1', start: 1200, end: 1249 },
      { label: 'Novice 2', start: 1250, end: 1299 },
      { label: 'Novice 3', start: 1300, end: 1349 },
    ],
  },
  {
    title: '🧠 Tactician',
    range: [1350, 1499],
    sublevels: [
      { label: 'Tactician 1', start: 1350, end: 1399 },
      { label: 'Tactician 2', start: 1400, end: 1449 },
      { label: 'Tactician 3', start: 1450, end: 1499 },
    ],
  },
  {
    title: '⚔️ Attacker',
    range: [1500, 1649],
    sublevels: [
      { label: 'Attacker 1', start: 1500, end: 1549 },
      { label: 'Attacker 2', start: 1550, end: 1599 },
      { label: 'Attacker 3', start: 1600, end: 1649 },
    ],
  },
  {
    title: '🧙 Strategist',
    range: [1650, 1799],
    sublevels: [
      { label: 'Strategist 1', start: 1650, end: 1699 },
      { label: 'Strategist 2', start: 1700, end: 1749 },
      { label: 'Strategist 2', start: 1750, end: 1799 },
    ],
  },
  {
    title: '🧠 Mastermind',
    range: [1800, 1949],
    sublevels: [
      { label: 'Mastermind 1', start: 1800, end: 1849 },
      { label: 'Mastermind 2', start: 1850, end: 1899 },
      { label: 'Mastermind 3', start: 1900, end: 1949 },
    ],
  },
  {
    title: '🦾 Elite',
    range: [1950, 2099],
    sublevels: [
      { label: 'Elite 1', start: 1950, end: 1999 },
      { label: 'Elite 2', start: 2000, end: 2049 },
      { label: 'Elite 3', start: 2050, end: 2099 },
    ],
  },
  {
    title: '🐉 Puzzle Beast',
    range: [2100, Infinity],
    sublevels: [
      { label: 'Beast 1', start: 2100, end: 2149 },
      { label: 'Beast 2', start: 2150, end: 2199 },
      { label: 'Beast 3', start: 2200, end: Infinity },
    ],
  },
];

//console.log('currentChapterState',currentChapterState)
const PuzzleScore = ({ chessAiMode }: Props) => {
  const [value, setValue] = useState(chessAiMode.userPuzzleRating ?? 0);
  const [flipping, setFlipping] = useState<boolean>(false);
  const [change, setChange] = useState<number>(0);
  const [previousValue, setPreviousValue] = useState<number>(value);
  const [showChange, setShowChange] = useState(false);
  //const [percentage, setPercentage] = useState<number>(0);
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

  return (
    <div className="rounded-lg  mb-1 mt-1 md:px-4 md:pb-4 px-2 pb-2 pt-2 border border-conversation-100 bg-[#01210B]">
      {value > 0 && (
        <div>
          <div className="flex justify-between">
            <div className="text-[10px] font-bold text-[#8F8F90] mb-1">
              RATING
            </div>
            <div className=" text-[10px] font-bold text-[#8F8F90] mb-1">
              LEVEL
            </div>
          </div>
          <div
            className={`${styles.flipNumber} w-full text-white text-xl font-bold mb-2 inline-block min-w-[40px] min-h-[24px]`}
          >
            <div className="flex justify-between align-center">
              <div>
                <span
                  key={value}
                  className={`${styles.flipInner} ${
                    flipping ? styles.flip : ''
                  }`}
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
              <span className=" flex items-center justify-center font-bold text-green-400 text-[18px] ">
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
      )}
    </div>
  );
};

export default PuzzleScore;
