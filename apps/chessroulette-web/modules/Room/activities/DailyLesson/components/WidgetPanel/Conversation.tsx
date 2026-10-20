import { useEffect, useRef, useState } from 'react';
import type { ChapterState, UserData } from '../../movex/types';
import type { LessonStep } from '../../lessonDatabase';
import TypewriterText from './TypewriterText';
import Image from 'next/image';
import React from 'react';
import { Paywall } from '@app/components/Paywall/Paywall';

// Naglasak u AI chat-u: bold + nasa plava (#11C6D1) za kljucne reci unutar
// teksta. IZUZETAK - naslov taska (prompt+introText poruka, uvek pocinje
// bas sa '**...**' na samom pocetku stringa) ostaje BELI bold, nikad plav -
// to je naslov oblacica, ne naglasena rec unutar njega.
function renderMarkdownInline(text: string): React.ReactNode[] {
  const markers = text.match(/\*\*/g)?.length ?? 0;
  const safe =
    markers % 2 === 1 ? text.replace(/\*\*(?![\s\S]*\*\*)/, '') : text;
  const parts = safe.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  const isTitleMessage = safe.startsWith('**');
  let seenFirstBold = false;
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const isTitle = isTitleMessage && !seenFirstBold;
      seenFirstBold = true;
      return (
        <strong
          key={i}
          className={isTitle ? 'text-white' : 'text-[#11C6D1]'}
        >
          {part.slice(2, -2)}
        </strong>
      );
    }
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
  chatLimitPaywallVisible?: boolean;
  onCloseChatLimitPaywall?: () => void;
  /** Next je spreman - tabla je zatamnjena iza dugmeta. Poslednja poruka mora
   * da ostane iznad tog zatamnjenja, inace se stisne tacno kad se pojavi. */
  nextReady?: boolean;
  /** Kviz pitanje (kind:'quiz') - dugmad idu ODMAH POSLE pitanja, u istom
   * skrolujucem toku, umesto u odvojenom bloku van chata. */
  step?: LessonStep | null;
  quizSelectedIndex?: number | null;
  onSelectQuizAnswer?: (index: number) => void;
  /** step.suggestedMove (Day 17) - klikabilno dugme sa potezom, ista pozicija
   * u skrolujucem toku kao quizOptions dugmad gore. */
  suggestedMovePlayed?: boolean;
  onPlaySuggestedMove?: (uci: string) => void;
  /** Lesson.pawnyAvatar (Day 18 "Pawny 2.0") - zamenjuje podrazumevani
   * `/pawny/pawny.png` kroz celu lekciju. */
  pawnyAvatarSrc?: string;
};

const Conversation = ({
  currentChapterState,
  pulseDot,
  userData,
  smallMobile,
  isMobile,
  chatLimitPaywallVisible,
  onCloseChatLimitPaywall,
  nextReady,
  step,
  quizSelectedIndex,
  onSelectQuizAnswer,
  suggestedMovePlayed,
  onPlaySuggestedMove,
  pawnyAvatarSrc = '/pawny/pawny.png',
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

  // Kviz pitanje SA ponudjenim odgovorima (zadnja 'task' poruka) ostaje
  // ZALEPLJENO gore dok se skroluje kroz odgovore/objasnjenje - sve dok ne
  // stigne sledece pitanje. SAMO za quizOptions - "watch & learn" koraci
  // (bez pitanja, npr. Day 15 "Got it!" primeri) nemaju nista ispod cemu bi
  // sticky sluzio, a sticky + poluprovidna pozadina je gurao/skrivao novu
  // poruku (npr. "ovo je statican primer") koja stigne POSLE ove - vidljiva
  // samo kao bled duh iza kartice umesto normalno ispod nje.
  // step.suggestedMove (Day 17) dugme ide odmah ispod task oblacica, isto
  // kao quizOptions - treba i njemu lastTaskMessageIndex, ali BEZ sticky
  // tretmana (vidi isStickyQuizQuestion ispod) - ovi su kratki jednopotezni
  // demo koraci, sticky + poluprovidna pozadina bi sakrila doneText poruku
  // koja stize odmah posle klika (ista zamka kao ranije kod watch koraka).
  let lastTaskMessageIndex = -1;
  if ((step?.kind === 'quiz' && step.quizOptions) || step?.suggestedMove) {
    for (let i = currentChapterState.messages.length - 1; i >= 0; i--) {
      if (currentChapterState.messages[i].kind === 'task') {
        lastTaskMessageIndex = i;
        break;
      }
    }
  }

  return (
    <>
      {/* Oba avatara "pricaju" blagim bob pokretom dok kucaju - samo na
          poslednjoj (zivoj) poruci, istorijski mirni. Outposty (trener/brend,
          SVUDA u AI chat-u) sporiji/smireniji ritam - Pawny (PROTIVNIK, samo
          Day 14 flavor poruke) brzi/zivlji, da se oseti razlika u "licnosti". */}
      <style>{`
        @keyframes pawnyBob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
        .pawny-talking { animation: pawnyBob 1s ease-in-out infinite; }
        .outposty-talking { animation: pawnyBob 1.8s ease-in-out infinite; }
      `}</style>
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

          const isTask = msg.kind === 'task';
          // suggestedMove koraci NAMERNO ne lepe oblacic (vidi komentar uz
          // lastTaskMessageIndex) - sticky je samo za pravo kviz pitanje.
          const isStickyQuizQuestion =
            step?.kind === 'quiz' &&
            !!step.quizOptions &&
            index === lastTaskMessageIndex;
          // Day 14 "Your First Game" - Pawny-jeve poruke (vidi
          // sendPawnyMessage u DailyLessonActivity.tsx) idu u ISTOJ "bot"
          // bubbli kao Coach, samo sa sopstvenim avatarom/animacijom.
          const isPawny = participant.includes('pawny-bot');

          return (
            <React.Fragment key={index}>
            <div
              className={`mb-1 pt-1 text-[15px] md:pt-2 md:mb-2 ${
                isStickyQuizQuestion
                  ? 'sticky top-0 z-20 bg-op-widget pb-2'
                  : isLastMessage && nextReady
                    ? 'relative z-[95]'
                    : ''
              }`}
            >
              {/* CHAT GPT TEXT */}
              {participant.includes('chatGPT123456') || isPawny ? (
                <div className="flex min-w-0 items-start">
                  {/* Pawny avatar vidljiv i na mobilnom - novi, namerno
                      istaknut lik, za razliku od Coach loga koji ostaje
                      samo desktop (postojece ponasanje, nepromenjeno). */}
                  <div className={isPawny ? 'flex' : 'hidden md:flex'}>
                    {isLastFromThisParticipant ? (
                      isPawny ? (
                        <div
                          className={`relative w-[28px] h-[28px] md:w-[36px] md:h-[36px] mt-1 ${
                            isLastMessage ? 'pawny-talking' : ''
                          }`}
                        >
                          <Image
                            src={pawnyAvatarSrc}
                            alt="Pawny"
                            fill
                            className="object-contain"
                          />
                        </div>
                      ) : (
                        <div
                          className={`relative w-[28px] h-[28px] md:w-[36px] md:h-[36px] mt-1 ${
                            isLastMessage ? 'outposty-talking' : ''
                          }`}
                        >
                          <Image
                            src="/outposty/outposty.png"
                            alt="Outposty"
                            fill
                            className="object-contain"
                          />
                        </div>
                      )
                    ) : (
                      <div className="min-w-[28px] md:min-w-[36px]" />
                    )}
                  </div>

                  <div className="text-white text-sm px-2 md:px-4  flex-1 min-w-0 max-w-md break-words overflow-hidden">
                    {' '}
                    <div
                      className={
                        isTask
                          ? 'border border-[#07DA63]/30 bg-[#07DA63]/[0.07] rounded-xl px-3 py-2.5'
                          : isPawny
                            ? // Pawny-jeve poruke idu u pravi "govorni oblacic" (nasa
                              // brend plava #11C6D1) - razlikuje se od Outposty-jevog
                              // cistog teksta bez pozadine (trener/podrska nepromenjeni).
                              'relative bg-[#11C6D1]/[0.1] border border-[#11C6D1]/30 rounded-2xl rounded-tl-sm px-3 py-2.5'
                            : undefined
                      }
                    >
                      {isLastMessage && typeof lastMessage === 'string' ? (
                        <TypewriterText
                          lastMessage={lastMessage}
                          scrollToBottom={scrollToBottom}
                          onTypingStart={handleTypingStart}
                          onDone={() => setTypingDone(true)}
                        />
                      ) : (
                        <p className="text-[14px] text-left break-words leading-relaxed whitespace-pre-line">
                          {typeof msg.content === 'string' &&
                            renderMarkdownInline(msg.content)}
                        </p>
                      )}
                    </div>
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
                  <div className="outposty-talking relative w-9 h-9 rounded-full overflow-hidden">
                    <Image
                      src="/outposty/outposty.png"
                      alt="Outposty"
                      fill
                      className="object-contain"
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
            {step?.kind === 'quiz' &&
              step.quizOptions &&
              quizSelectedIndex == null &&
              index === lastTaskMessageIndex && (
                <div className="grid grid-cols-2 gap-2 px-2 md:px-4 mt-1 mb-2">
                  {step.quizOptions.map((option, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => onSelectQuizAnswer?.(i)}
                      className="text-left text-xs sm:text-sm px-3 py-2 rounded-xl border transition-colors duration-150 border-conversation-100 text-white hover:border-[#07DA63] hover:bg-[#07DA63]/[0.06] cursor-pointer"
                    >
                      <span className="text-[#07DA63] font-bold">
                        {String.fromCharCode(65 + i)})
                      </span>{' '}
                      {option}
                    </button>
                  ))}
                </div>
              )}
            {step?.suggestedMove &&
              !suggestedMovePlayed &&
              index === lastTaskMessageIndex && (
                <div className="px-2 md:px-4 mt-1 mb-2">
                  <button
                    type="button"
                    onClick={() => onPlaySuggestedMove?.(step.suggestedMove!.uci)}
                    className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl border border-[#07DA63] text-[#07DA63] hover:bg-[#07DA63]/[0.08] transition-colors duration-150 cursor-pointer"
                  >
                    ♜ Play {step.suggestedMove.label}
                  </button>
                </div>
              )}
            </React.Fragment>
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
