import React, { useEffect, useState } from 'react';
import { Button } from '@app/components/Button';
interface TypewriterTextProps {
  lastMessage: string;
  scrollToBottom: () => void;
  takeBack: () => void;
  playNext: () => void;
  hint: () => void;
}
const TypewriterText: React.FC<TypewriterTextProps> = ({
  lastMessage = '',
  scrollToBottom,
  takeBack,
  playNext,
  hint,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [answered, setAnswered] = useState(false);
  
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
    }, 30);

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
    { lastMessage.includes('Uhh') && displayedText.length==lastMessage.length && !answered && (
         <div className="flex  sitems-center gap-3 hidden md:flex mt-2">
            <Button
                  onClick={() => {
                                    takeBack();
                                    setAnswered(true)
                                  }}
                                  size="sm"
                                  className={`bg-slate-600 font-bold hover:bg-slate-800 `}
                                > Take Back </Button>
            <Button
                                  onClick={() => {
                                    playNext();
                                    setAnswered(true)
                                  }}
                                  size="sm"
                                  className={`bg-slate-600 font-bold hover:bg-slate-800 `}>
                                  Continue to play </Button>  
        </div>
    )}
    { lastMessage.includes('Would you like a hint') && displayedText.length==lastMessage.length && !answered && (
         <div className="flex  sitems-center gap-3 hidden md:flex mt-2">
            <Button
                  onClick={() => {
                                    hint();
                                    setAnswered(true)
                                  }}
                                  size="sm"
                                  className={`bg-slate-600 font-bold hover:bg-slate-800 `}
                                > 🔍 Hint</Button>  
        </div>
    )}
   
   
    </div>
  );
};

export default TypewriterText;
