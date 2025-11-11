import { useEffect, useRef } from 'react';
import type { ChapterState, UserData } from '../../movex/types';
import TypewriterText from './TypewriterText';
import greenLogo from '../../../../../../components/Logo/assets/Logo_green_small.svg';
import Image from 'next/image';
import { ButtonGreen } from '@app/components/Button/ButtonGreen';

type Props = {
  currentChapterState: ChapterState;
  pulseDot: boolean;
  userData: UserData;
  smallMobile: boolean;
  takeBack: () => void;
  playNext: () => void;
  hint: () => void;
  openViewSubscription: () => void;
  onSelectRating: (category: number) => void;
  onSelectPuzzle: (category: string) => void;
};
//console.log('currentChapterState',currentChapterState)

const Conversation = ({
  currentChapterState,
  pulseDot,
  userData,
  takeBack,
  playNext,
  smallMobile,
  openViewSubscription,
  hint,
  onSelectPuzzle,
  onSelectRating,
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
      className={`
  flex-1 overflow-y-auto rounded-lg no-scrollbar scroll-smooth
  min-h-[150px]
  ${
    currentChapterState.chessAiMode.mode === 'puzzle'
      ? 'md:max-h-[500px] max-h-[190px]'
      : 'max-h-[350px]'
  }
  md:h-[316px]
`}
      style={{
        maxHeight: smallMobile ? '150px' : '',
      }}
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
              <div className="flex">
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

                <div
                  className={`text-white text-sm px-4 ${
                    currentChapterState.chessAiMode.mode === 'review'
                      ? 'w-full'
                      : 'max-w-xs max-w-[80%]'
                  }`}
                >
                  {isLastMessage &&
                  lastMessage &&
                  typeof lastMessage === 'string' ? (
                    <div>
                      <TypewriterText
                        lastMessage={lastMessage}
                        onSelectRating={onSelectRating}
                        onSelectPuzzle={onSelectPuzzle}
                        hint={hint}
                        scrollToBottom={scrollToBottom}
                        takeBack={takeBack}
                        playNext={playNext}
                      />
                      {isSales && isLastMessage && (
                        <div className="flex  items-center gap-3 md:flex mt-2">
                          <ButtonGreen
                            onClick={() => {
                              openViewSubscription();
                            }}
                            size="lg"
                          >
                            Subscribe
                          </ButtonGreen>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="flex  items-center text-[14px]  justify-end  text-left whitespace-pre-line">
                        {msg.content}
                      </p>
                    </div>
                  )}
                </div>
                {/* <div className="w-8 h-8 min-w-8  flex items-center justify-center rounded-full bg-indigo-1600 text-white font-semibold text-sm">
                DM
              </div> */}
              </div>
            ) : (
              <div className="flex justify-end items-center">
                <div className="mr-4 border-conversation-100 max-w-xs max-w-[80%] bg-[#111111]/40 text-white border shadow-green-soft  rounded-[20px]   text-sm ">
                  <p className="flex p-[14px]   justify-start  text-left whitespace-pre-line">
                    {msg.content}
                  </p>
                </div>
                {userData.picture ? (
                  <div className="w-9 h-9 min-w-8  flex items-center justify-center rounded-full">
                    <img
                      className="w-9 h-9 min-w-8  flex items-center justify-center rounded-full"
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
    </div>
  );
};

export default Conversation;
