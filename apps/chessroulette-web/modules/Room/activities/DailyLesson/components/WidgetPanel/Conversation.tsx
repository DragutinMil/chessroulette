import { useEffect, useRef, useState } from 'react';
import type { ChapterState, UserData } from '../../movex/types';
import TypewriterText from './TypewriterText';
import greenLogo from '../../../../../../components/Logo/assets/Logo_green_small.svg';
import Image from 'next/image';
import { parseMessageMoves } from '../../util';
import React from 'react';
import { FreeBoardNotationProps } from '@app/components/FreeBoardNotation';
import { Paywall } from '@app/components/Paywall/Paywall';

function renderMarkdownInline(text: string): React.ReactNode[] {
  const markers = text.match(/\*\*/g)?.length ?? 0;
  const safe =
    markers % 2 === 1 ? text.replace(/\*\*(?![\s\S]*\*\*)/, '') : text;
  const parts = safe.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*'))
      return <em key={i}>{part.slice(1, -1)}</em>;
    return part;
  });
}

type Props = {
  currentChapterState: ChapterState;
  pulseDot: boolean;
  userData: UserData;
  smallMobile: boolean;
  isMobile?: boolean;
  onHistoryNotationRefocus?: FreeBoardNotationProps['onRefocus'];
  notationHistoryLength?: number;
  chatLimitPaywallVisible?: boolean;
  onCloseChatLimitPaywall?: () => void;
};

const Conversation = ({
  currentChapterState,
  pulseDot,
  userData,
  smallMobile,
  isMobile,
  onHistoryNotationRefocus,
  notationHistoryLength = 0,
  chatLimitPaywallVisible,
  onCloseChatLimitPaywall,
}: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [typingDone, setTypingDone] = useState(false);
  const restoreTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setTypingDone(false);
  }, [currentChapterState.messages.length]);

  const handleTypingStart = () => {
    if (restoreTimerRef.current) {
      clearTimeout(restoreTimerRef.current);
      restoreTimerRef.current = null;
    }
  };

  useEffect(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  }, [currentChapterState.messages, pulseDot]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };
  return (
    <>
      <div
        ref={scrollRef}
        // Fills whatever space its flex parent gives it (mobile: the rest of
        // the screen below the buttons row; desktop: fixed height) and
        // scrolls internally — the parent no longer scrolls as a page.
        className="min-w-0 max-w-full overflow-y-auto overflow-x-hidden rounded-lg scroll-smooth no-scrollbar h-full min-h-0 md:h-[560px] md:flex-1 pt-2"
      >
        {currentChapterState.messages.map((msg, index) => {
          const participant = msg.participantId;
          const isLastMessage =
            index === currentChapterState.messages.length - 1;
          const isLastFromThisParticipant =
            currentChapterState.messages[index + 1]?.participantId !==
            participant;
          const lastMessage =
            currentChapterState.messages[
              currentChapterState.messages.length - 1
            ].content;
          const isSales =
            currentChapterState.messages[
              currentChapterState.messages.length - 1
            ].participantId.includes('sales');

          return (
            <div key={index} className="mb-1 pt-1 text-[15px] md:pt-2 md:mb-2 ">
              {/* CHAT GPT TEXT */}
              {participant.includes('chatGPT123456') ? (
                <div className="flex min-w-0">
                  <div className="hidden md:flex">
                    {isLastFromThisParticipant ? (
                      <Image
                        src={greenLogo}
                        alt="outpost"
                        className="max-w-[28px] md:max-w-[36px]"
                      />
                    ) : (
                      <div className="min-w-[28px] md:min-w-[36px]" />
                    )}
                  </div>

                  <div className="text-white text-sm px-2 md:px-4  flex-1 min-w-0 max-w-md break-words overflow-hidden">
                    {' '}
                    {isLastMessage && typeof lastMessage === 'string' ? (
                      <div>
                        <TypewriterText
                          lastMessage={lastMessage}
                          scrollToBottom={scrollToBottom}
                          onHistoryNotationRefocus={onHistoryNotationRefocus}
                          notationHistoryLength={notationHistoryLength}
                          onTypingStart={handleTypingStart}
                          onDone={() => setTypingDone(true)}
                        />
                      </div>
                    ) : (
                      <div>
                        <p className="text-[14px] text-left break-words leading-relaxed whitespace-pre-line">
                          {typeof msg.content === 'string' &&
                          onHistoryNotationRefocus &&
                          notationHistoryLength > 0
                            ? parseMessageMoves(msg.content).map((seg, i) =>
                                seg.type === 'move' ? (
                                  <button
                                    key={i}
                                    type="button"
                                    className="underline cursor-pointer hover:bg-white/10 rounded px-0.5 -mx-0.5"
                                    onClick={() => {
                                      const pairIndex = Math.min(
                                        seg.moveNumber - 1,
                                        Math.max(0, notationHistoryLength - 1)
                                      );
                                      onHistoryNotationRefocus([
                                        pairIndex,
                                        seg.colorIdx,
                                      ] as Parameters<
                                        FreeBoardNotationProps['onRefocus']
                                      >[0]);
                                    }}
                                  >
                                    {seg.value}
                                  </button>
                                ) : (
                                  <React.Fragment key={i}>
                                    {renderMarkdownInline(seg.value)}
                                  </React.Fragment>
                                )
                              )
                            : renderMarkdownInline(msg.content as string)}
                        </p>
                      </div>
                    )}
                  </div>
                  {/* <div className="w-8 h-8 min-w-8  flex items-center justify-center rounded-full bg-indigo-1600 text-white font-semibold text-sm">
                DM
              </div> */}
                </div>
              ) : (
                <div className="flex justify-end items-center min-w-0 w-full">
                  <div className="mr-4 border-conversation-100 max-w-xs min-w-0 break-words bg-[#111111]/40 text-white  border shadow-green-soft  rounded-[20px]   text-sm ">
                    <p className="flex p-[14px]   justify-start  text-left whitespace-pre-line">
                      {msg.content}
                    </p>
                  </div>
                  {userData.picture ? (
                    <div className="w-9 h-9 min-w-8  flex items-center justify-center rounded-full">
                      <img
                        className="w-9 h-9 min-w-8  flex items-center justify-center rounded-full  object-cover"
                        src={userData.picture}
                        alt="user_picture"
                      />
                    </div>
                  ) : (
                    <div className="w-9 h-9 min-w-8  flex items-center justify-center rounded-full bg-green-500 text-white font-semibold text-sm">
                      {userData.name_first?.slice(0, 1)}
                      {userData.name_last?.slice(0, 1)}
                    </div>
                  )}
                </div>
              )}

              {pulseDot && isLastMessage && !isSales && (
                <div className="flex justify-start items-center mt-4 ">
                  <div className="w-9 h-9 rounded-full items-center flex overflow-hidden ">
                    <Image
                      src={greenLogo}
                      alt="outpost"
                      className="max-w-[28px] md:max-w-[36px]"
                    />
                  </div>

                  <div className="max-w-xs  mr-4 max-w-[80%]  text-white  rounded-xl  py-2 text-sm px-4">
                    <div className="flex items-center pt-2 space-x-1">
                      <span className="w-2 h-2 bg-[#D9D9D9]/20 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-2 h-2 bg-[#D9D9D9]/20 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-2 h-2 bg-[#D9D9D9]/20 rounded-full animate-bounce"></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div className="h-12" />
      </div>
      <Paywall
        visible={!!chatLimitPaywallVisible}
        onClose={() => onCloseChatLimitPaywall?.()}
        defaultPlan="starter"
        title="Outposty has more to say"
        subtitle="Unlock unlimited chat with your AI coach"
      />
    </>
  );
};

export default Conversation;
