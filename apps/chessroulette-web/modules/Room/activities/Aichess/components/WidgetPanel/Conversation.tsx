import { useEffect, useRef } from 'react';
import type { ChapterState, UserData } from '../../movex/types';
import TypewriterText from './TypewriterText';
import greenLogo from '../../../../../../components/Logo/assets/Logo_green_small.svg';
import Image from 'next/image';

type Props = {
  currentChapterState: ChapterState;
  pulseDot: boolean;
  userData: UserData;
  takeBack: () => void;
  playNext: () => void;
  hint: () => void;
  onSelectPuzzle: (category: string) => void;
};
//console.log('currentChapterState',currentChapterState)

const Conversation = ({
  currentChapterState,
  pulseDot,
  userData,
  takeBack,
  playNext,
  hint,
  onSelectPuzzle,
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
    overflow-scroll rounded-lg no-scrollbar scroll-smooth
    ${currentChapterState.chessAiMode.mode !== 'puzzle' ? 'h-[135px]' : 'h-[74px]'}
    md:h-[316px]
  `}
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
        //   console.log('message',lastMessage)
        return (
          <div key={index} className="mb-1 pt-1 text-[15px] md:pt-2 md:mb-2">
            {/* CHAT GPT TEXT */}
            {participant == 'chatGPT123456' ? (
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
                <div className="max-w-xs  max-w-[80%]   text-white   text-sm px-4">
                  {isLastMessage && lastMessage ? (
                    <TypewriterText
                      lastMessage={lastMessage}
                      onSelectPuzzle={onSelectPuzzle}
                      hint={hint}
                      scrollToBottom={scrollToBottom}
                      takeBack={takeBack}
                      playNext={playNext}
                    />
                  ) : (
                    <p className="flex  items-center text-[14px]  justify-end  text-left whitespace-pre-line">
                      {msg.content}
                    </p>
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
            {pulseDot && isLastMessage && (
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
