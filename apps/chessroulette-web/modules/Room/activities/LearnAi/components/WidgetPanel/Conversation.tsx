import { useEffect, useRef } from 'react';
import type { ChapterState, UserData } from '../../movex/types';
import TypewriterText from './TypewriterText';
import greenLogo from '../../../../../../components/Logo/assets/Logo_green_small.svg';
import Image from 'next/image';
import { ButtonGreen } from '@app/components/Button/ButtonGreen';
import { parseMessageMoves } from '../../util';
import React from 'react';
import { FreeBoardNotationProps } from '@app/components/FreeBoardNotation';

type Props = {
  showColorChoice?: boolean;
  onSelectColor?: (color: 'w' | 'b') => void;
  suggestedOpenings?: Array<{ name: string; pgn: string }> | null;
  onSelectOpening?: (opening: { name: string; pgn: string }) => void;
  onSelectSomethingElse?: () => void;
  currentChapterState: ChapterState;
  pulseDot: boolean;
  userData: UserData;
  smallMobile: boolean;
  takeBack: () => void;
  playNext: () => void;
  hint: () => void;
  openViewSubscription: () => void;
  onSelectRating: (category: number) => void;
  onSelectLearnMode?: (mode: 'opening' | 'midgame' | 'endgame') => void;
  onHistoryNotationRefocus?: FreeBoardNotationProps['onRefocus'];
  notationHistoryLength?: number;
  suggestedMoves?: Array<{ uci: string; san: string }> | null;
  onSuggestedMove?: (uci: string) => void;
  visibleSuggestedRows?: number;
  onOtherSuggested?: () => void;
  onSuggestedMoveHover?: (uci: string | null) => void;
};
//console.log('currentChapterState',currentChapterState)

const Conversation = ({
  showColorChoice,
  onSelectColor,
  suggestedOpenings,
  onSelectOpening,
  onSelectSomethingElse,
  currentChapterState,
  pulseDot,
  userData,
  takeBack,
  playNext,
  smallMobile,
  openViewSubscription,
  hint,
  onSelectRating,
  onSelectLearnMode,
  onHistoryNotationRefocus,
  notationHistoryLength = 0,
  suggestedMoves,
  onSuggestedMove,
  visibleSuggestedRows = 1,
  onOtherSuggested,
  onSuggestedMoveHover,
}: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentChapterState.messages, pulseDot]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };
  return (
    <div
      ref={scrollRef}
      className="min-w-0 max-w-full overflow-y-auto overflow-x-hidden rounded-lg scroll-smooth no-scrollbar h-[220px] md:h-[280px]"
      style={{ height: smallMobile ? '120px' : undefined }}
    >
      {currentChapterState.messages.map((msg, index) => {
        const participant = msg.participantId;
        const isLastMessage = index === currentChapterState.messages.length - 1;
        const isLastFromThisParticipant =
          currentChapterState.messages[index + 1]?.participantId !==
          participant;
        const lastMessage =
          currentChapterState.messages[currentChapterState.messages.length - 1]
            .content;
        const isSales =
          currentChapterState.messages[
            currentChapterState.messages.length - 1
          ].participantId.includes('sales');

        return (
          <div key={index} className="mb-1 pt-1 text-[15px] md:pt-2 md:mb-2 ">
            {/* CHAT GPT TEXT */}
            {participant.includes('chatGPT123456') ? (
              <div className="flex min-w-0">
              <div>
                  {isLastFromThisParticipant ? (
                    <Image
                      src={greenLogo}
                      alt="outpost"
                      className=" max-w-[28px] md:max-w-[36px]"
                    />
                  ) : (
                    <Image
                      src={greenLogo}
                      className="opacity-0  max-w-[28px] md:max-w-[36px]"
                      alt="outpost"
                    />
                  )}
                </div>

                <div className="text-white text-sm px-4 flex-1 min-w-0 max-w-md break-words overflow-hidden">                {isLastMessage &&
                  typeof lastMessage === 'string' ? (
                    <div>
                      <TypewriterText
                        lastMessage={lastMessage}
                        onSelectRating={onSelectRating}
                        onSelectLearnMode={onSelectLearnMode}
                        hint={hint}
                        scrollToBottom={scrollToBottom}
                        takeBack={takeBack}
                        playNext={playNext}
                        onHistoryNotationRefocus={onHistoryNotationRefocus}
                        notationHistoryLength={notationHistoryLength}
                      />
                      {isSales && isLastMessage && (
                        <div className="flex  items-center gap-3 md:flex mt-2">
                          <ButtonGreen
                            onClick={() => {
                              openViewSubscription();
                            }}
                            size="lg"
                            className="bg-green-600  text-black font-bold "
                            style={{ color: 'black' }}
                          >
                            Subscribe
                          </ButtonGreen>
                        </div>
                      )}
    {suggestedOpenings?.length && lastMessage?.includes('Here are some openings you could try') && (
  <div className="min-w-0">
      {suggestedOpenings.map((op) => (
      <ButtonGreen
        key={op.name}
        onClick={() => onSelectOpening?.(op)}
        size="md"
        className="font-bold mt-2 px-3 mr-2 whitespace-nowrap"
      >
        {op.name}
      </ButtonGreen>
    ))}
    <ButtonGreen
      onClick={onSelectSomethingElse}
      size="md"
      className="font-bold mt-2 px-3 mr-2 whitespace-nowrap border border-dashed"
    >
      Something else
    </ButtonGreen>
  </div>
)}
{showColorChoice && isLastMessage && participant.includes('chatGPT123456') && (
  <div className="min-w-0 flex flex-wrap gap-2 mt-2">
    <ButtonGreen
      onClick={() => onSelectColor?.('w')}
      size="md"
      className="font-bold px-3 mr-2 whitespace-nowrap"
    >
      White
    </ButtonGreen>
    <ButtonGreen
      onClick={() => onSelectColor?.('b')}
      size="md"
      className="font-bold px-3 mr-2 whitespace-nowrap"
    >
      Black
    </ButtonGreen>
  </div>
)}
                    </div>
                  ) : (
                    <div>
                      <p className="flex  items-center text-[14px]  justify-end  text-left whitespace-pre-line">
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
                                    onHistoryNotationRefocus([pairIndex, seg.colorIdx] as Parameters<FreeBoardNotationProps['onRefocus']>[0]);                                  }}
                                >
                                  {seg.value}
                                </button>
                              ) : (
                                <React.Fragment key={i}>{seg.value}</React.Fragment>
                              )
                            )
                          : msg.content}
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
                <div className="mr-4 border-conversation-100 max-w-xs min-w-0 break-words bg-[#111111]/40 text-white border shadow-green-soft  rounded-[20px]   text-sm ">
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
                  <div className="w-9 h-9 min-w-8  flex items-center justify-center rounded-full bg-indigo-1600 text-white font-semibold text-sm">
                    {userData.name_first?.slice(0, 1)}
                    {userData.name_last?.slice(0, 1)}
                  </div>
                )}
              </div>
            )}

            {pulseDot && isLastMessage && !isSales && (
              <div className="flex justify-start items-center mt-4 ">
                <div className="w-9 h-9 rounded-full items-center flex overflow-hidden ">
                  <Image src={greenLogo} alt="outpost" />
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

{suggestedMoves && suggestedMoves.length > 0 && (
  <div className="mb-1 pt-1 text-[15px] md:pt-2 md:mb-2">
    <div className="flex min-w-0">
      <div>
        <Image
          src={greenLogo}
          alt="outpost"
          className="max-w-[28px] md:max-w-[36px]"
        />
      </div>
      <div className="text-white text-sm px-4 flex-1 min-w-0 max-w-md break-words overflow-hidden">
        <p className="text-slate-200 mb-2">Choose next move:</p>
        <div className="flex flex-col gap-2 mt-2">
          {Array.from({ length: visibleSuggestedRows }, (_, row) => (
            <div key={row} className="flex flex-wrap gap-2">
              {suggestedMoves.slice(row * 3, row * 3 + 3).map((m) => (
                <ButtonGreen
                  key={m.uci}
                  onClick={() => onSuggestedMove?.(m.uci)}
                  onMouseEnter={() => onSuggestedMoveHover?.(m.uci)}
                  onMouseLeave={() => onSuggestedMoveHover?.(null)}
                  size="md"
                  className="font-bold font-mono px-3"
                >
                  {m.san}
                </ButtonGreen>
              ))}
            </div>
          ))}
          {visibleSuggestedRows * 3 < suggestedMoves.length && (
            <ButtonGreen
              onClick={onOtherSuggested}
              size="md"
              className="font-bold px-3"
            >
              Other
            </ButtonGreen>
          )}
        </div>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default Conversation;
