import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@app/components/Button';
import { ButtonGreen } from '@app/components/Button/ButtonGreen';
import { Message } from '../../movex';
import {parseMessageMoves} from '../../util';
import { FreeBoardNotationProps } from '@app/components/FreeBoardNotation';

interface TypewriterTextProps {
  lastMessage: string;
  scrollToBottom: () => void;
  takeBack: () => void;
  playNext: () => void;
  hint: () => void;
  onSelectRating: (category: number) => void;
  onSelectLearnMode?: (mode: 'opening' | 'midgame' | 'endgame') => void;
  onHistoryNotationRefocus?: FreeBoardNotationProps['onRefocus'];
  notationHistoryLength?: number;
}
const TypewriterText: React.FC<TypewriterTextProps> = ({
  lastMessage = '',
  scrollToBottom,
  takeBack,
  playNext,
  hint,
  onSelectRating,
  onSelectLearnMode,
  onHistoryNotationRefocus,   
  notationHistoryLength = 0,  
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  const puzzleCategories = [
    { label: 'Mate in 1', value: 'Check Mate in 1' },
    { label: 'Mate in 2', value: 'Check Mate in 2' },
    { label: 'Mate in 3', value: 'Check Mate in 3' },
    { label: 'Check-Mate Puzzle', value: 'Check-Mate Puzzle' },
    { label: 'Pattern Puzzle', value: 'Pattern Puzzle' },

    // [{"label":"Check Mate in 1"},{"label":"Check Mate in 2"},{"label":"Check Mate in 3"},{"label":"Check Mate in 4"},{"label":"Check Mate in 5"},{"label":"Check Mate in 6"},
    //   {"label":"Check Mate in 7"},{"label":"Check-Mate Puzzles"},{"label":"Endgame"},{"label":"Pattern Puzzles"}]
  ];
  const ratingBot = [
    { label: '1300', value: 1300 },
    { label: '1700', value: 1700 },
    { label: '2100', value: 2100 },
    { label: '2400', value: 2400 },
    // { label: '2400', value: '2400' },
  ];
  useEffect(() => {
    if (!lastMessage || lastMessage.trim() === '') return;

    setDisplayedText('');
    setShowCursor(true);

    let currentIndex = 0;

    const interval = setInterval(() => {
      setDisplayedText((prev) => {
        if (currentIndex < lastMessage.length) {
          const nextChar = lastMessage[currentIndex];
          currentIndex++;
          return prev + nextChar;
        } else {
          clearInterval(interval);
          setShowCursor(false);
          return prev;
        }
      });
    }, 20);

    return () => clearInterval(interval);
  }, [lastMessage]);
  useEffect(() => {
    scrollToBottom();
  }, [displayedText.length]);

  const segments = useMemo(() => parseMessageMoves(lastMessage), [lastMessage]);
  const L = displayedText.length;

  return (
  <div className="min-w-0">
<p className="text-left whitespace-pre-wrap break-words leading-relaxed">          {segments.map((seg, i) => {
          if (seg.end <= L) {
            if (seg.type === 'move' && onHistoryNotationRefocus) {
              const pairIndex = Math.min(
                seg.moveNumber - 1,
                Math.max(0, notationHistoryLength - 1)
              );
              return (
                <button
                  key={i}
                  type="button"
                  className="underline cursor-pointer hover:bg-white/10 rounded px-0.5 -mx-0.5"
                  onClick={() => onHistoryNotationRefocus([pairIndex, seg.colorIdx] as Parameters<FreeBoardNotationProps['onRefocus']>[0])}                >
                  {seg.value}
                </button>
              );
            }
            return <React.Fragment key={i}>{seg.value}</React.Fragment>;
          }
          if (seg.start < L) {
            return (
              <React.Fragment key={i}>
                {displayedText.slice(seg.start, L)}
              </React.Fragment>
            );
          }
          return null;
        })}
        {showCursor && <span className="animate-pulse">|</span>}
      </p>

      {lastMessage.includes('Would you like a hint') &&
        displayedText.length == lastMessage.length && (
          <div className="flex  sitems-center gap-3 hidden md:flex mt-2">
            <ButtonGreen
              onClick={() => {
                hint();
              }}
              size="lg"
            >
              {' '}
              🔍 Hint
            </ButtonGreen>
          </div>
        )}
      <div className="flex flex-wrap"></div>
      <div className="flex flex-wrap">
        {lastMessage.includes(
          'Which strength level would you like to play against'
        ) &&
          displayedText.length == lastMessage.length &&
          ratingBot.map((category) => (
            <ButtonGreen
              key={category.value}
              onClick={() => {
                onSelectRating(category.value);
              }}
              size="md"
              className=" font-bold mt-2 px-1 mr-2 whitespace-nowrap"
            >
              {category.label}
            </ButtonGreen>
          ))}

          
      </div>
      {lastMessage.includes('What would you like to learn today?') &&
  displayedText.length === lastMessage.length && (
  <div className="flex flex-wrap items-center gap-2 mt-3">
    <ButtonGreen
      onClick={() => onSelectLearnMode?.('opening')}
      size="md"
      className="font-bold mt-2 px-3 mr-2 whitespace-nowrap"
    >
      Openings ✅
    </ButtonGreen>
    <ButtonGreen
      size="md"
      disabled
      className="font-bold mt-2 px-3 mr-2 whitespace-nowrap opacity-60 cursor-not-allowed"
      title="Coming soon"
    >
      Midgame 🔒
    </ButtonGreen>
    <ButtonGreen
      size="md"
      disabled
      className="font-bold mt-2 px-3 mr-2 whitespace-nowrap opacity-60 cursor-not-allowed"
      title="Coming soon"
    >
      Endgame 🔒
    </ButtonGreen>
  </div>
)}
    </div>
  );
};

export default TypewriterText;
