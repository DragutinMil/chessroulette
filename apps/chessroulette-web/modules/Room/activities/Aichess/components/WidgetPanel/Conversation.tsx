import { useEffect, useRef } from 'react';
import type { ChapterState } from '../../movex/types';

type Props = {
  currentChapterState: ChapterState;
  pulseDot: boolean;
};
//console.log('currentChapterState',currentChapterState)
const Conversation = ({ currentChapterState, pulseDot }: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // scroll to end on new message
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentChapterState.messages]);
  return (
    <div
      ref={scrollRef}
      className="overflow-scroll  rounded-lg  h-[316px] no-scrollbar  scroll-smooth "
    >
      {currentChapterState.messages.map((msg, index) => {
        const participant = msg.participantId;
        return (
          <div key={index} className="mb-4 text-[15px]">
            {participant == 'chatGPT123456' ? (
              <div className="flex ">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-200">
                  <img
                    src="https://outpostchess.fra1.digitaloceanspaces.com/bfce3526-2133-4ac5-8b16-9c377529f0b6.jpg"
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="ml-4 max-w-xs mr-4 max-w-[80%] bg-[#202122] text-white border border-[#2a2b2d] rounded-xl  py-2 text-sm px-4">
                  <p className="flex  items-center justify-end  text-left whitespace-pre-line">
                    {msg.content}
                  </p>
                </div>
                {/* <div className="w-8 h-8 min-w-8  flex items-center justify-center rounded-full bg-indigo-1600 text-white font-semibold text-sm">
                DM
              </div> */}
              </div>
            ) : (
              <div className="flex justify-end">
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
          </div>
        );
      })}
      {pulseDot && (
        <div className="flex justify-end ">
          <div className="ml-4 max-w-xs  mr-4 max-w-[80%] bg-[#202122] text-white border border-[#2a2b2d] rounded-xl  py-2 text-sm px-4">
            <div className="flex items-center pt-2 space-x-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-200">
            <img
              src="https://outpostchess.fra1.digitaloceanspaces.com/bfce3526-2133-4ac5-8b16-9c377529f0b6.jpg"
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Conversation;
