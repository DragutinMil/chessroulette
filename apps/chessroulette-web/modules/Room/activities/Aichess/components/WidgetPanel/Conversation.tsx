import { useEffect, useRef } from 'react';
import type { ChapterState } from '../../movex/types';
import TypewriterText from './TypewriterText';
import greenLogo from '../../../../../../components/Logo/assets/Logo_green_small.svg';
import Image from 'next/image';
type Props = {
  currentChapterState: ChapterState;
  pulseDot: boolean;
  takeBack: () => void;
  playNext: () => void;
  hint: () => void;
  onSelectPuzzle: (category: string) => void;
};
//console.log('currentChapterState',currentChapterState)

const Conversation = ({
  currentChapterState,
  pulseDot,
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
      className="overflow-scroll  rounded-lg  h-[316px] no-scrollbar  scroll-smooth "
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
          <div key={index} className="mb-2 pt-2 text-[15px]">
            {/* CHAT GPT TEXT */}
            {participant == 'chatGPT123456' ? (
              <div className="flex">
                <div>
                  {isLastFromThisParticipant ? (
                    <Image src={greenLogo} alt="outpost" />
                  ) : (
                    <Image
                      src={greenLogo}
                      className="opacity-0"
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
                <div className="w-9 h-9 min-w-8  flex items-center justify-center rounded-full bg-indigo-1600 text-white font-semibold text-sm">
                  DM
                </div>
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
