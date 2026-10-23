import React, { useEffect, useRef, useState } from 'react';
import { ChatMessage } from '@app/modules/Match/movex/types';
import { User } from '@app/modules/User';

export const QUICK_MESSAGES_GAME = [
  'Good luck! 🍀',
  'Nice move! 👏',
  'Wow 😮',
  'Hmm… 🤔',
  'Bold move 😏',
  'Oops 🙈',
  'Saw that coming 😎',
  'Not today! 🛡️',
];

export const QUICK_MESSAGES_END = [
  'Good game 🤝',
  'Well played 👏',
  'Close one! 😅',
  'Argh! 😤',
  'You got lucky 😜',
];

const ALL_QUICK_MESSAGES = new Set([
  ...QUICK_MESSAGES_GAME,
  ...QUICK_MESSAGES_END,
]);

export const QUICK_MESSAGE_LIMIT = 3;
const QUICK_MESSAGE_COOLDOWN_MS = 1200;
const BUBBLE_VISIBLE_MS = 3000;
const BUBBLE_LEAVE_MS = 400;

// Movex dispatch nije concurrent-safe pa je cooldown zajednicki za sve instance (chat + dijalog)
let lastQuickSentAt = 0;

export const isQuickMessage = (content?: string) =>
  !!content && ALL_QUICK_MESSAGES.has(content);

// Broji moje quick poruke posle poslednje poruke protivnika
export const getQuickMessageStreak = (
  messages: ChatMessage[],
  currentUserId: User['id']
) => {
  let count = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].senderId !== currentUserId) break;
    if (isQuickMessage(messages[i].content)) count++;
  }
  return count;
};

type QuickChatChipsProps = {
  options: string[];
  messages: ChatMessage[];
  currentUserId: User['id'];
  onSend: (content: string) => void;
  onCooldownChange?: (coolingDown: boolean) => void;
  disabled?: boolean;
  className?: string;
};

export const QuickChatChips: React.FC<QuickChatChipsProps> = ({
  options,
  messages,
  currentUserId,
  onSend,
  onCooldownChange,
  disabled = false,
  className = '',
}) => {
  const [coolingDown, setCoolingDown] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const limitReached =
    getQuickMessageStreak(messages, currentUserId) >= QUICK_MESSAGE_LIMIT;
  const isDisabled = disabled || coolingDown || limitReached;

  useEffect(() => {
    onCooldownChange?.(coolingDown);
  }, [coolingDown]);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const handleClick = (content: string) => {
    if (isDisabled) return;
    if (Date.now() - lastQuickSentAt < QUICK_MESSAGE_COOLDOWN_MS) return;

    lastQuickSentAt = Date.now();
    setCoolingDown(true);
    onSend(content);
    timeoutRef.current = setTimeout(
      () => setCoolingDown(false),
      QUICK_MESSAGE_COOLDOWN_MS
    );
  };

  return (
    <div
      className={`flex gap-2 ${className}`}
      title={limitReached ? 'Wait for your opponent to reply' : undefined}
    >
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => handleClick(option)}
          disabled={isDisabled}
          className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[12px] text-white transition-all duration-200 ${
            isDisabled
              ? 'border-[#D9D9D9]/20 bg-[#111111]/20 opacity-40 cursor-default'
              : 'border-conversation-100 bg-[#111111]/40 hover:border-[#07DA63] hover:scale-[1.0] hover:shadow-[0_0_10px_rgba(7,218,99,0.3)]'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
};

const QuickMessageBubble = ({
  label,
  content,
  own,
}: {
  label: string;
  content: string;
  own: boolean;
}) => {
  const [stage, setStage] = useState<'enter' | 'shown' | 'leave'>('enter');

  useEffect(() => {
    const t0 = setTimeout(() => setStage('shown'), 20);
    const t1 = setTimeout(
      () => setStage('leave'),
      BUBBLE_VISIBLE_MS - BUBBLE_LEAVE_MS
    );
    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
    };
  }, []);

  // Ulazi "iskakanjem" kao bedz za rejting, izlazi tako sto odleti gore
  const transform =
    stage === 'enter'
      ? 'scale(0.4)'
      : stage === 'shown'
      ? 'scale(1)'
      : 'translateY(-14px) scale(0.95)';

  return (
    <div
      className={`rounded-full border px-3 py-1 text-sm font-semibold bg-[#111111] ${
        own ? 'border-green-500/60 text-green-400' : 'border-conversation-100 text-white'
      }`}
      style={{
        transition: `opacity ${BUBBLE_LEAVE_MS}ms ease, transform ${BUBBLE_LEAVE_MS}ms`,
        transitionTimingFunction:
          stage === 'leave' ? 'ease' : 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        opacity: stage === 'shown' ? 1 : 0,
        transform,
        boxShadow: 'rgba(7, 218, 99, 0.2) 0px 0px 12px 0px',
      }}
    >
      <span className="text-slate-400 font-normal">{label}:</span> {content}
    </div>
  );
};

type EndGameQuickChatProps = {
  messages: ChatMessage[];
  currentUserId: User['id'];
  getSenderName: (senderId: User['id']) => string;
  onSend: (content: string) => void;
  onCooldownChange?: (coolingDown: boolean) => void;
};

export const EndGameQuickChat: React.FC<EndGameQuickChatProps> = ({
  messages,
  currentUserId,
  getSenderName,
  onSend,
  onCooldownChange,
}) => {
  // Animiraju se samo quick poruke koje stignu dok je dijalog otvoren
  const seenCountRef = useRef(messages.length);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const [bubble, setBubble] = useState<ChatMessage | null>(null);

  useEffect(() => {
    const newMessages = messages.slice(seenCountRef.current);
    seenCountRef.current = messages.length;

    const lastQuick = [...newMessages]
      .reverse()
      .find((msg) => isQuickMessage(msg.content));
    if (!lastQuick) return;

    setBubble(lastQuick);
    clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(
      () => setBubble(null),
      BUBBLE_VISIBLE_MS
    );
  }, [messages.length]);

  useEffect(() => () => clearTimeout(hideTimeoutRef.current), []);

  const dismissBubble = () => {
    clearTimeout(hideTimeoutRef.current);
    setBubble(null);
  };

  // Balon ide preko cipova da ne zauzima dodatnu visinu u dijalogu
  return (
    <div className="relative w-full">
      <div
        className="transition-opacity duration-300"
        style={{ opacity: bubble ? 0.15 : 1 }}
      >
        <QuickChatChips
          options={QUICK_MESSAGES_END}
          messages={messages}
          currentUserId={currentUserId}
          onSend={onSend}
          onCooldownChange={onCooldownChange}
          disabled={!!bubble}
          className="overflow-x-auto scrollbar-hide py-1"
        />
      </div>
      {bubble && (
        <div
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onClick={dismissBubble}
        >
          <QuickMessageBubble
            key={`${bubble.senderId}-${bubble.timestamp}`}
            label={
              bubble.senderId === currentUserId
                ? 'You'
                : getSenderName(bubble.senderId)
            }
            content={bubble.content}
            own={bubble.senderId === currentUserId}
          />
        </div>
      )}
    </div>
  );
};
