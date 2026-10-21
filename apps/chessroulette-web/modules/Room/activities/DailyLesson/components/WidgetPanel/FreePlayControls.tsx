import React from 'react';
import { QuickConfirmButton } from '@app/components/Button/QuickConfirmButton';
import { Button } from '@app/components/Button/Button';
import { Icon } from '@app/components/Icon/Icon';

// Iste ikone/vizuelni jezik kao PlayControls.tsx (Match - "prava" partija),
// kopirano ovde namerno umesto import-a - PlayControls je cvrsto spregnut sa
// Match-ovim Game/GameOffer tipovima i backend-om, Day 14 "Your First Game"
// nema ni jedno ni drugo (lokalna partija protiv Pawny-ja unutar DailyLesson-a).
const TakebackIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height="24px"
    viewBox="0 -960 960 960"
    width="24px"
    fill="#ffffff"
    className="text-white"
  >
    <path d="M680-160v-400H313l144 144-56 57-241-241 240-240 57 57-144 143h447v480h-80Z" />
  </svg>
);

const ResignIcon = () => (
  <svg
    className="text-white"
    xmlns="http://www.w3.org/2000/svg"
    height="24px"
    viewBox="0 -960 960 960"
    width="24px"
    fill="#ffffff"
  >
    <path d="M200-80v-760h640l-80 200 80 200H280v360h-80Zm80-440h442l-48-120 48-120H280v240Zm0 0v-240 240Z" />
  </svg>
);

type Props = {
  onDrawOffer: () => void;
  onTakeBack: () => void;
  onResign: () => void;
  /**
   * Sva 3 dugmeta su UVEK aktivna (ne samo dok je korisnikov red) - korisnik
   * moze da odigra/preda/ponudi remi ili vrati potez i dok Pawny "razmislja".
   * Trenutno se poziva uvek kao `false` (WidgetPanel), ostaje kao prop za
   * eventualnu buducu potrebu (npr. partija vec zavrsena).
   */
  disabled: boolean;
  /** Dodatno za Take Back - nema sta da se vrati (manje od jedne cele runde odigrano). */
  canTakeBack: boolean;
  /**
   * LessonStep.requireCheckmate (Day 20 "Deliver Mate" Phase 2) - sakriva
   * Draw/Resign. Oba bi inace zavrsila korak kao "gotov" (vidi onDrawOffer/
   * onResign u DailyLessonActivity.tsx - oba bezuslovno postave completed:true),
   * sto bi dozvolilo korisniku da zaobidje "mora stvaran sah-mat" zahtev.
   * Take Back ostaje - taj ne zavrsava nista.
   */
  hideDrawResign?: boolean;
  /**
   * LessonStep.liveHint (Day 20 "Deliver Mate" Phase 2) - Hint dugme, u ISTOM
   * vizuelnom jeziku kao Take Back (ne odvojeno ButtonGreen van ove trake,
   * kao ranije - izgledalo je neusaglaseno). Zauzima mesto koje Draw/Resign
   * oslobode kad su sakriveni (hideDrawResign). Bez QuickConfirmButton
   * "potvrdi" koraka - Hint nije destruktivan, jedan klik je dovoljan.
   */
  onHint?: () => void;
  showHint?: boolean;
  hintLoading?: boolean;
};

const HintIcon = () => (
  <Icon
    name="LightBulbIcon"
    kind="outline"
    className="h-6 w-6 text-white"
  />
);

/**
 * Day 14 "Your First Game" - zamenjuje standardno Next dugme (koje je
 * svakako uvek ugaseno, freePlay je jedini/poslednji korak lekcije) pravim
 * kontrolama partije, isti vizuelni jezik (QuickConfirmButton - prvi klik
 * naoruza, drugi potvrdi) kao Match-ov PlayControls.tsx.
 */
export const FreePlayControls = ({
  onDrawOffer,
  onTakeBack,
  onResign,
  disabled,
  canTakeBack,
  hideDrawResign,
  onHint,
  showHint,
  hintLoading,
}: Props) => (
  // Isti okvir (gradijent, padding, gap) kao Match-ov PlayControls.tsx.
  <div
    className="
    rounded-3xl w-full
    pl-2 pr-2 pt-2 pb-2 md:px-2 md:pb-5 md:pt-5  flex flex-row items-center justify-between
       text-xs md:text-sm
       gap-1 md:flex-1 min-h-0 rounded-lg shadow-2xl"
    style={{
      backgroundImage:
        'radial-gradient(61.84% 61.84% at 50% 131.62%, rgba(5, 135, 44, 0.2) 0%, rgb(1, 33, 11) 100%)',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
    }}
  >
    {showHint && (
      <Button
        type="custom"
        size="sm"
        className="flex-1 !h-8 min-w-[50px] !rounded-3xl !text-white"
        bgColor="green"
        onClick={onHint}
        disabled={disabled || hintLoading}
      >
        <HintIcon />
      </Button>
    )}
    {!hideDrawResign && (
      <QuickConfirmButton
        type="custom"
        size="sm"
        confirmationBgcolor="green"
        className="flex-1 !h-8 min-w-[50px] !rounded-3xl"
        confirmationMessage="Draw?"
        bgColor="green"
        iconKind="solid"
        onClick={onDrawOffer}
        disabled={disabled}
      >
        <p className="text-white"> 1/2 </p>
      </QuickConfirmButton>
    )}
    <QuickConfirmButton
      type="custom"
      size="sm"
      className="flex-1 !h-8 min-w-[50px] !rounded-3xl !text-white
        text-xs md:text-sm"
      confirmationBgcolor="green"
      confirmationMessage="Undo?"
      bgColor="green"
      iconKind="solid"
      onClick={onTakeBack}
      disabled={disabled || !canTakeBack}
    >
      <TakebackIcon />
    </QuickConfirmButton>
    {!hideDrawResign && (
      <QuickConfirmButton
        type="custom"
        size="sm"
        className="flex-1 !h-8 min-w-[50px] !rounded-3xl !text-white"
        confirmationBgcolor="red"
        confirmationMessage="Resign?"
        bgColor="green"
        iconKind="solid"
        onClick={onResign}
        disabled={disabled}
      >
        <ResignIcon />
      </QuickConfirmButton>
    )}
  </div>
);
