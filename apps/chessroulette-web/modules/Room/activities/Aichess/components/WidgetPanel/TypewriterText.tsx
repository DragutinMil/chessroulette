import React, { useEffect, useState } from 'react';
import { Button } from '@app/components/Button';
import { ButtonGreen } from '@app/components/Button/ButtonGreen';
import { Message } from '../../movex';

interface TypewriterTextProps {
  lastMessage: string;
  scrollToBottom: () => void;
  takeBack: () => void;
  playNext: () => void;
  hint: () => void;
  onSelectPuzzle: (category: string) => void;
}
const TypewriterText: React.FC<TypewriterTextProps> = ({
  lastMessage = '',
  scrollToBottom,
  takeBack,
  playNext,
  hint,
  onSelectPuzzle,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  const puzzleCategories = [
    { label: 'Mate in 1', value: 'Check Mate in 1' },
    { label: 'Mate in 2', value: 'Check Mate in 2' },
    { label: 'Mate in 3', value: 'Check Mate in 3' },
    { label: 'Check-Mate Puzzles', value: 'Check-Mate Puzzles' },
    { label: 'Pattern Puzzles', value: 'Pattern Puzzles' },

    // [{"label":"Check Mate in 1"},{"label":"Check Mate in 2"},{"label":"Check Mate in 3"},{"label":"Check Mate in 4"},{"label":"Check Mate in 5"},{"label":"Check Mate in 6"},
    //   {"label":"Check Mate in 7"},{"label":"Check-Mate Puzzles"},{"label":"Endgame"},{"label":"Pattern Puzzles"}]
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

  return (
    <div>
      <p className="text-left whitespace-pre-wrap">
        {displayedText.replace(/undefined/g, '')}
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
      <div className="flex flex-wrap">
        {lastMessage.includes('Ready for exercise') &&
          displayedText.length == lastMessage.length &&
          puzzleCategories.map((category) => (
            <ButtonGreen
              key={category.value}
              onClick={() => {
                onSelectPuzzle(category.value);
              }}
              size="md"
              className=" font-bold mt-2 px-1 mr-2 whitespace-nowrap"
            >
              {category.label}
            </ButtonGreen>
          ))}
      </div>
    </div>
  );
};

export default TypewriterText;
