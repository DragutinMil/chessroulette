import React, { useEffect, useState } from 'react';
import { Button } from '@app/components/Button';
interface TypewriterTextProps {
  lastMessage: string;
  scrollToBottom: () => void;
}
const TypewriterText: React.FC<TypewriterTextProps> = ({
  lastMessage = '',
  scrollToBottom,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
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
    { lastMessage.includes('Uhh') && displayedText.length==lastMessage.length && (
         <div className="flex  sitems-center gap-3 hidden md:flex mt-2">
            <Button
                  onClick={() => {
                                   // takeBack();
                                  }}
                                  size="sm"
                                  className={`bg-slate-600 font-bold hover:bg-slate-800 `}
                                > Take Back </Button>
            <Button
                                  onClick={() => {
                                   // play();
                                  }}
                                  size="sm"
                                  className={`bg-slate-600 font-bold hover:bg-slate-800 `}>
                                  Continue to play </Button>  
        </div>
    )}
   
   
    </div>
  );
};

export default TypewriterText;
