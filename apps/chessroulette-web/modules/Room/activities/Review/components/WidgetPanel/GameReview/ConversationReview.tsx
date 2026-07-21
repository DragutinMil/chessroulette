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
import { useIsTablet } from '@app/hooks/useIsTablet';
import { FBHIndex } from '@xmatter/util-kit';

import { DragAndDrop } from '@app/components/PgnInputBox/DragAndDrop';
import type { CompletedGameItem } from '../../../util';

type Props = {
  currentChapterState: ChapterState;
  pulseDot: boolean;
  userData: UserData;
  progressReview: number;
  analizeMatch: () => void;
  worstMove: () => void;
  openViewSubscription: () => void;
  checkOpening: () => void;
  smallMobile: boolean;
  scoreCP?: number;
  suggestions?: string[];
  onSuggestedQuestion?: (q: string) => void;
  onMoveClick?: (index: FBHIndex) => void;
  hasGameLoaded?: boolean;
  onImportGame?: (game: CompletedGameItem) => void;
  completedGames?: CompletedGameItem[];
  isLoadingGames?: boolean;
  showMyGames?: boolean;
  onToggleMyGames?: () => void;
  currentUserId?: string;
};
//console.log('currentChapterState',currentChapterState)

const ConversationReview = ({
  currentChapterState,
  pulseDot,
  userData,
  progressReview,
  analizeMatch,
  worstMove,
  checkOpening,
  openViewSubscription,
  smallMobile,
  scoreCP,
  suggestions,
  onSuggestedQuestion,
  onMoveClick,
  hasGameLoaded,
  onImportGame,
  completedGames,
  isLoadingGames,
  showMyGames,
  onToggleMyGames,
  currentUserId,
}: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [disableButton, setDisableButton] = useState(false);
  const [disableWorstMoveButton, setDisableWorstMoveButton] = useState(false);
  const [disableOpeningButton, setDisableOpeningButton] = useState(false);
  const { isTablet } = useIsTablet();
  useEffect(() => {
    if (currentChapterState.messages.length < 2) {
      return;
    }
    if (!disableWorstMoveButton) {
      const worstMoveButtonClicked = currentChapterState.messages.some((m) =>
        m.participantId?.includes('worstMove')
      );
      if (worstMoveButtonClicked) {
        setDisableWorstMoveButton(worstMoveButtonClicked);
      }
    }
    if (!disableWorstMoveButton) {
      const openingButtonClicked = currentChapterState.messages.some((m) =>
        m.participantId?.includes('gameOpening')
      );
      if (openingButtonClicked) {
        setDisableOpeningButton(openingButtonClicked);
      }
    }
  }, []);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentChapterState.messages, pulseDot]);
  useEffect(() => {
    if (currentChapterState.chessAiMode.review.length == 0) {
      return;
    }
    setDisableButton(false);
  }, [currentChapterState.chessAiMode.review]);
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };
  if (!hasGameLoaded) {
    return (
      <div className="flex flex-col gap-3 py-1">
        <div className="mt-2 md:mt-4 mb-1">
          <p className="text-white text-sm font-medium mb-1">
            Hey! 👋 Ready to exercise?
          </p>
          <p className="text-slate-400 text-sm leading-relaxed">
            Start from Scratch or Start from Import your completed games or drop
            a PGN file to start the analysis.
          </p>
        </div>

        <div className="flex gap-4">
          {onToggleMyGames && (
            <ButtonGreen
              icon={showMyGames ? 'ChevronUpIcon' : 'ChevronDownIcon'}
              onClick={onToggleMyGames}
              className="w-32 text-sm text-white py-[6px] rounded-[20px] transition-colors"
            >
              My Games
            </ButtonGreen>
          )}
        </div>

        <div
          className={`overflow-hidden transition-all duration-300 ease-out ${
            showMyGames ? 'max-h-[750px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="flex flex-col gap-1 overflow-y-auto no-scrollbar  max-h-[170px]  md:max-h-[220px]">
            {isLoadingGames ? (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-slate-500 border-t-white rounded-full animate-spin" />
              </div>
            ) : !completedGames?.length ? (
              <p className="text-center text-slate-400 text-sm py-4">
                No completed games
              </p>
            ) : (
              completedGames.map((game, i) => {
                const isChallenger =
                  game.results?.challenger?.id === currentUserId;
                const opponentName = isChallenger
                  ? game.target_name_first || 'Opponent'
                  : game.initiator_name_first || 'Opponent';
                const winner = game.results?.winner;
                let result: 'W' | 'L' | 'D';
                if (!winner || winner === 'draw') {
                  result = 'D';
                } else if (
                  (winner === 'challenger' && isChallenger) ||
                  (winner === 'challengee' && !isChallenger)
                ) {
                  result = 'W';
                } else {
                  result = 'L';
                }
                const resultClass =
                  result === 'W'
                    ? 'text-green-800 border-green-800/50 w-8'
                    : result === 'L'
                    ? 'text-red-500 border-red-500/50 w-8'
                    : 'text-gray-400 border-gray-400/40';
                return (
                  <button
                    key={game.id || i}
                    onClick={() => onImportGame?.(game)}
                    className="flex items-center justify-between w-full px-3 py-2 rounded-lg border border-conversation-100 bg-[#111111]/30 hover:bg-[#111111]/60 transition-colors text-sm"
                  >
                    <span className="truncate text-slate-200">
                      vs. {opponentName}
                    </span>
                    <span
                      className={`ml-2 font-bold text-xs px-2 py-0.5 rounded border ${resultClass}`}
                    >
                      {result}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className={`
  flex-1 overflow-y-auto rounded-lg no-scrollbar scroll-smooth
  ${
    isTablet
      ? 'h-full'
      : ` ${
          currentChapterState.chessAiMode.mode === 'play'
            ? 'md:h-[340px] h-[290px]'
            : 'md:h-[420px] h-[320px]'
        }
    md:max-h-[600px]`
  }
`}
      // style={{
      //   maxHeight: smallMobile ? '180px' : '',
      // }}
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
          ].participantId?.includes('sales');
        return (
          <div
            key={index}
            className="mb-1 mt-2 pt-1 text-[15px] md:pt-2 md:mb-2"
          >
            {/* CHAT GPT TEXT */}
            {participant?.includes('chatGPT123456') ? (
              <div className="flex">
                <div className=" items-start hidden">
                  {isLastFromThisParticipant ? (
                    <Image
                      src={greenLogo}
                      alt="outpost"
                      className=" max-w-[28px] md:max-w-[px]"
                    />
                  ) : (
                    <div className="min-w-[28px] md:min-w-[36px]" />
                  )}
                </div>

                <div
                  className={`text-white text-sm px-1 md:px-2 ${
                    isTablet ? 'px-0' : ''
                  }  w-full flex   flex-col  items-start `}
                >
                  {msg.content?.includes('analyzeReview') ? (
                    <StatsTable
                      content={msg.content}
                      review={currentChapterState.chessAiMode.review}
                      onMoveClick={onMoveClick}
                    />
                  ) : (
                    <p className="flex  items-center text-[14px]  justify-start  text-left whitespace-pre-line">
                      {msg.content}
                    </p>
                  )}

                  <div className="flex flex-wrap mt-2">
                    {index == 0 &&
                      currentChapterState.messages.length == 1 &&
                      currentChapterState.chessAiMode.fen !== '' &&
                      currentChapterState.chessAiMode.mode !== 'play' && (
                        <ButtonGreen
                          onClick={() => {
                            setDisableButton(true);
                            analizeMatch();
                          }}
                          disabled={disableButton || scoreCP == 0}
                          size="md"
                          className="bg-green-600  text-black font-bold mt-2 px-1 mr-2 whitespace-nowrap px-4"
                          style={{ color: 'black' }}
                        >
                          Game Review
                        </ButtonGreen>
                      )}
                    {index == 1 &&
                      currentChapterState.messages.length > 1 &&
                      !msg.participantId.includes('sales') && (
                        <div className="flex flex-wrap mt-2">
                          <ButtonGreen
                            onClick={() => {
                              setDisableWorstMoveButton(true);
                              worstMove();
                            }}
                            disabled={disableWorstMoveButton}
                            size="md"
                            className="bg-green-600  text-black font-bold mt-2 px-1 mr-2 whitespace-nowrap px-4"
                            style={{ color: 'black' }}
                          >
                            My bad move?
                          </ButtonGreen>
                          <ButtonGreen
                            onClick={() => {
                              setDisableOpeningButton(true);
                              checkOpening();
                            }}
                            disabled={disableOpeningButton}
                            size="md"
                            className="bg-green-600  text-black font-bold mt-2 px-1 mr-2 whitespace-nowrap px-4"
                            style={{ color: 'black' }}
                          >
                            How was my opening?
                          </ButtonGreen>
                        </div>
                      )}
                  </div>
                  {isSales && isLastMessage && (
                    <div className="flex  items-center gap-3 md:flex mt-2">
                      <ButtonGreen
                        onClick={() => {
                          openViewSubscription();
                        }}
                        size="md"
                        className="bg-green-600  text-black font-bold px-3"
                        style={{ color: 'black' }}
                      >
                        Subscribe
                      </ButtonGreen>
                    </div>
                  )}
                  {isLastMessage &&
                    !isSales &&
                    !pulseDot &&
                    suggestions &&
                    suggestions.length > 0 &&
                    onSuggestedQuestion && (
                      <div className="flex flex-wrap mt-2">
                        {suggestions.map((s, i) => (
                          <ButtonGreen
                            key={i}
                            onClick={() => onSuggestedQuestion(s)}
                            size="md"
                            className="bg-green-600 text-black font-bold mt-2 px-1 mr-2 whitespace-nowrap px-4"
                            style={{ color: 'black' }}
                          >
                            {s}
                          </ButtonGreen>
                        ))}
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
