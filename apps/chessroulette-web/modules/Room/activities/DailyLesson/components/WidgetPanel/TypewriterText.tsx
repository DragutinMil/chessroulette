import React, { useEffect, useMemo, useState } from 'react';
// import { Button } from '@app/components/Button';
import { ButtonGreen } from '@app/components/Button/ButtonGreen';
// import { Message } from '../../movex';
import { parseMessageMoves } from '../../util';
import { FreeBoardNotationProps } from '@app/components/FreeBoardNotation';

// Naglasak u AI chat-u: bold + nasa plava (#11C6D1) za kljucne reci - isto
// pravilo kao u Conversation.tsx (ovaj fajl ima sopstvenu kopiju jer
// Typewriter otkriva tekst slovo po slovo, drugaciji parsing potreban).
// IZUZETAK - naslov taska (string koji pocinje bas sa '**') ostaje BELI.
// kind:'wrongQuizAnswer' - za razliku od Conversation.tsx (gde je cela
// poruka vec dostupna odjednom), ovde se poruka otkriva slovo po slovo i
// renderMarkdownInline se poziva PO SEGMENTU (vise puta po poruci) - fiksna
// roze oznaka zato NIJE ovde (dupliral bi se po segmentu), vec kao poseban,
// UVEK potpuno vidljiv prefiks u return JSX-u ispod (WRONG_ANSWER_LABEL).
const WRONG_ANSWER_LABEL = 'Not quite right.';

function renderMarkdownInline(text: string): React.ReactNode[] {
  // Typewriter otkriva tekst slovo po slovo, pa se otvoreni '**' vidi jos pre
  // nego sto stigne zatvarajuci par - sakrivamo nesparen marker.
  const markers = text.match(/\*\*/g)?.length ?? 0;
  const safe =
    markers % 2 === 1 ? text.replace(/\*\*(?![\s\S]*\*\*)/, '') : text;
  const parts = safe.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  const isTitleMessage = safe.startsWith('**');
  let seenFirstBold = false;
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const isTitle = isTitleMessage && !seenFirstBold;
      seenFirstBold = true;
      return (
        <strong
          key={i}
          className={isTitle ? 'text-white' : 'text-[#11C6D1]'}
        >
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*'))
      return <em key={i}>{part.slice(1, -1)}</em>;
    return part;
  });
}

interface TypewriterTextProps {
  lastMessage: string;
  kind?: 'task' | 'wrongQuizAnswer';
  scrollToBottom: () => void;
  onHistoryNotationRefocus?: FreeBoardNotationProps['onRefocus'];
  notationHistoryLength?: number;
  onDone?: () => void;
  onTypingStart?: () => void;
}
const TypewriterText: React.FC<TypewriterTextProps> = ({
  lastMessage = '',
  kind,
  scrollToBottom,
  onHistoryNotationRefocus,
  notationHistoryLength = 0,
  onDone,
  onTypingStart,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  // const puzzleCategories = [
  //   { label: 'Mate in 1', value: 'Check Mate in 1' },
  //   { label: 'Mate in 2', value: 'Check Mate in 2' },
  //   { label: 'Mate in 3', value: 'Check Mate in 3' },
  //   { label: 'Check-Mate Puzzle', value: 'Check-Mate Puzzle' },
  //   { label: 'Pattern Puzzle', value: 'Pattern Puzzle' },
  // ];
  // const ratingBot = [
  //   { label: '1300', value: 1300 },
  //   { label: '1700', value: 1700 },
  //   { label: '2100', value: 2100 },
  //   { label: '2400', value: 2400 },
  // ];
  useEffect(() => {
    if (!lastMessage || lastMessage.trim() === '') return;

    setDisplayedText('');
    setShowCursor(true);
    onTypingStart?.();

    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex < lastMessage.length) {
        const nextChar = lastMessage[currentIndex];
        currentIndex++;
        setDisplayedText((prev) => prev + nextChar);
      } else {
        clearInterval(interval);
        setShowCursor(false);
        onDone?.();
      }
    }, 8);

    return () => clearInterval(interval);
  }, [lastMessage]);
  useEffect(() => {
    scrollToBottom();
  }, [displayedText.length]);

  const segments = useMemo(() => parseMessageMoves(lastMessage), [lastMessage]);
  const L = displayedText.length;

  return (
    <div className="min-w-0">
      <p className="text-left break-words leading-relaxed whitespace-pre-line">
        {' '}
        {kind === 'wrongQuizAnswer' && (
          <>
            <strong className="text-[#f2358d]">{WRONG_ANSWER_LABEL}</strong>{' '}
          </>
        )}
        {segments.map((seg, i) => {
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
                  onClick={() =>
                    onHistoryNotationRefocus([
                      pairIndex,
                      seg.colorIdx,
                    ] as Parameters<FreeBoardNotationProps['onRefocus']>[0])
                  }
                >
                  {seg.value}
                </button>
              );
            }
            return (
              <React.Fragment key={i}>
                {renderMarkdownInline(seg.value)}
              </React.Fragment>
            );
          }
          if (seg.start < L) {
            return (
              <React.Fragment key={i}>
                {renderMarkdownInline(displayedText.slice(seg.start, L))}
              </React.Fragment>
            );
          }
          return null;
        })}
        {showCursor && <span className="animate-pulse">|</span>}
      </p>
    </div>
  );
};

export default TypewriterText;
