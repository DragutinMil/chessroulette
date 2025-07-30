import React, { useEffect, useState } from 'react';

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
    <p className="text-left whitespace-pre-wrap">
      {displayedText.replace(/undefined/g, '')}
      {showCursor && <span className="animate-pulse">|</span>}
    </p>
  );
};

export default TypewriterText;
