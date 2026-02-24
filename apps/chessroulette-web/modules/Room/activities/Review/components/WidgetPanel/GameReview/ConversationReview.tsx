import { useEffect, useRef, useState } from 'react';
import type {
  ChapterState,
  UserData,
  EvaluationMove,
} from '../../../movex/types';
import greenLogo from '../../../../../../../components/Logo/assets/Logo_green_small.svg';
import Image from 'next/image';
import { ButtonGreen } from '@app/components/Button/ButtonGreen';
import { StatsTable } from './StatsTable';
type Props = {
  currentChapterState: ChapterState;
  pulseDot: boolean;
  userData: UserData;
  progressReview: number;
  analizeMatch: () => void;
  openViewSubscription: () => void;
  smallMobile: boolean;
};
//console.log('currentChapterState',currentChapterState)

const ConversationReview = ({
  currentChapterState,
  pulseDot,
  userData,
  progressReview,
  analizeMatch,
  openViewSubscription,
  smallMobile,
}: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [disableButton, setDisableButton] = useState(false);

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
 md:max-h-[500px] max-h-[200px] 
  md:h-[316px]
`}
      style={{
        maxHeight: smallMobile ? '140px' : '',
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
          <div
            key={index}
            className="mb-1 mt-2 pt-1 text-[15px] md:pt-2 md:mb-2"
          >
            {/* CHAT GPT TEXT */}
            {participant.includes('chatGPT123456') ? (
              <div className="flex">
                <div className="md:flex items-start hidden">
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
                  className={`text-white text-sm px-4  w-full flex   flex-col  items-start `}
                >
                  {msg.content.includes('analyzeReview') ? (
                    <StatsTable content={msg.content} />
                  ) : (
                    <p className="flex  items-center text-[14px]  justify-start  text-left whitespace-pre-line">
                      {msg.content}
                    </p>
                  )}

                  <div className="flex flex-wrap mt-2">
                    {index == 0 &&
                      currentChapterState.messages.length == 1 &&
                      currentChapterState.chessAiMode.fen !== '' && (
                        <ButtonGreen
                          onClick={() => {
                            setDisableButton(true);
                            analizeMatch();
                          }}
                          disabled={disableButton}
                          size="md"
                          className="bg-green-600  text-black font-bold mt-2 px-1 mr-2 whitespace-nowrap px-4"
                          style={{ color: 'black' }}
                        >
                          Game Review
                        </ButtonGreen>
                      )}
                  </div>
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
                      className="w-9 h-9 min-w-8  flex items-center justify-center rounded-full object-cover"
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
                {/* {currentChapterState.messages.length == 1 ? ( */}
                {progressReview == 0 ? (
                  <div className="max-w-xs  mr-4 max-w-[80%]  text-white  rounded-xl  py-2 text-sm px-4">
                    <div className="flex items-center pt-2 space-x-1">
                      <span className="w-2 h-2 bg-[#D9D9D9]/20 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-2 h-2 bg-[#D9D9D9]/20 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-2 h-2 bg-[#D9D9D9]/20 rounded-full animate-bounce"></span>
                    </div>
                  </div>
                ) : (
                  <div className="ml-4 text-white text-bold">
                    {progressReview.toFixed(0)}%
                  </div>
                )}
                {/* ) : (
                  <div className="max-w-xs  mr-4 max-w-[80%]  text-white  rounded-xl  py-2 text-sm px-4">
                    <div className="flex items-center pt-2 space-x-1">
                      <span className="w-2 h-2 bg-[#D9D9D9]/20 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-2 h-2 bg-[#D9D9D9]/20 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-2 h-2 bg-[#D9D9D9]/20 rounded-full animate-bounce"></span>
                    </div>
                  </div>
                )} */}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
export default ConversationReview;
