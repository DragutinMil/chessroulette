import { useEffect, useRef } from 'react';
import type { ChapterState } from '../../movex/types';
import TypewriterText from './TypewriterText';

type Props = {
  currentChapterState: ChapterState;
  pulseDot: boolean;
  takeBack: () => void;
  playNext: () => void;
    hint: () => void;
};
//console.log('currentChapterState',currentChapterState)
const Conversation = ({ currentChapterState, pulseDot, takeBack,playNext ,hint}: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentChapterState.messages,pulseDot]);
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
    currentChapterState.messages[index + 1]?.participantId !== participant;
        const lastMessage =
          currentChapterState.messages[currentChapterState.messages.length - 1]
            .content;
        //   console.log('message',lastMessage)
        return (
          <div key={index} className="mb-2 text-[15px]">
            {/* CHAT GPT TEXT */}
            {participant == 'chatGPT123456' ? (
              <div className="flex">
                <div className="w-9 h-9 rounded-full overflow-hidden">
                  {isLastFromThisParticipant  && (
                    <img
                      src="https://outpostchess.fra1.digitaloceanspaces.com/bfce3526-2133-4ac5-8b16-9c377529f0b6.jpg"
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="ml-4 max-w-xs mr-4 max-w-[80%] bg-[#202122] text-white border border-[#2a2b2d] rounded-xl  py-2 text-sm px-4">
                  {isLastMessage && lastMessage ? (
                    <TypewriterText
                      lastMessage={lastMessage}
                      hint={hint}
                      scrollToBottom={scrollToBottom}
                      takeBack={takeBack}
                       playNext={playNext}
                    />
                  ) : (
                    <p className="flex  items-center justify-end  text-left whitespace-pre-line">
                      {msg.content}
                    </p>
                  )}
                </div>
                {/* <div className="w-8 h-8 min-w-8  flex items-center justify-center rounded-full bg-indigo-1600 text-white font-semibold text-sm">
                DM
              </div> */}
              </div>
            ) : (
              <div className="flex justify-end mb-4 mt-4">
                <div className="mr-4 max-w-xs max-w-[80%] bg-[#202122] text-white border border-[#2a2b2d] rounded-xl  py-2 text-sm px-4">
                  <p className="flex  items-center justify-start  text-left whitespace-pre-line">
                    {msg.content}
                  </p>
                </div>
                <div className="w-9 h-9 min-w-8  flex items-center justify-center rounded-full bg-indigo-1600 text-white font-semibold text-sm">
                  DM
                </div>
              </div>
            )}
            {pulseDot && isLastMessage && (
              <div className="flex justify-start mt-4 ">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-200">
                  <img
                    src="https://outpostchess.fra1.digitaloceanspaces.com/bfce3526-2133-4ac5-8b16-9c377529f0b6.jpg"
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="ml-4 max-w-xs  mr-4 max-w-[80%] bg-[#202122] text-white border border-[#2a2b2d] rounded-xl  py-2 text-sm px-4">
                  <div className="flex items-center pt-2 space-x-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
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
