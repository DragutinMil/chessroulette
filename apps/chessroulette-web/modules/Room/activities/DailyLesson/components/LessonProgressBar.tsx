import React from 'react';

type Props = {
  /** Broj segmenata - svaki teach korak je jedan, svi puzzli zajedno jedan. */
  total: number;
  /** Indeks segmenta na kom je korisnik. */
  current: number;
  /** Koliko je segmenata u celosti zavrseno. */
  completed: number;
  /** Delimicna popunjenost tekuceg segmenta, 0..1 (puzzle segment). */
  currentFraction?: number;
  /** Tekuci segment je bas zavrsen (isti trenutak kad Next zapocne da pulsira). */
  celebrateStepDone?: boolean;
  /**
   * Indeksi segmenata gde je kviz pitanje odgovoreno NETACNO - ostaju trajno
   * roze (#f2358d, ista boja kao X na pogresnom potezu) umesto zelene, cak i
   * posle prelaska na sledece pitanje. Generican mehanizam (ne samo History),
   * ali realno ima smisla samo za 'quiz' korake (ostali uvek na kraju ispadnu
   * tacni, nema koncept "trajno pogresnog" segmenta).
   */
  wrongSegments?: Set<number>;
};

export const LessonProgressBar = ({
  total,
  current,
  completed,
  currentFraction = 0,
  celebrateStepDone = false,
  wrongSegments,
}: Props) => (
  <div className="flex items-center gap-2 w-full my-2 px-3 py-2 rounded-full border border-[#07DA63] bg-[#07DA63]/[0.06]">
    <div className="flex flex-1 gap-2 min-w-0">
      {Array.from({ length: total }, (_, i) => {
        const isDone = i < completed;
        const isCurrent = i === current && !isDone;
        // Vazi ODMAH (ne samo kad segment postane "gotov" prelaskom na
        // sledece pitanje) - inace se puni zeleno pa tek POSLE boji roze.
        const isWrong = wrongSegments?.has(i);
        const fill = isDone ? 1 : isCurrent ? currentFraction : 0;
        const isCelebrating = isCurrent && celebrateStepDone && !isWrong;
        return (
          <div
            key={i}
            className={`h-[8px] flex-1 rounded-full overflow-visible ${
              isWrong
                ? 'bg-[#f2358d]/25'
                : isCelebrating
                  ? 'bg-[#07DA63]/60 animate-progressPop'
                  : isCurrent
                    ? 'bg-[#07DA63]/25'
                    : 'bg-white/15'
            }`}
          >
            <div
              className={`h-full rounded-full transition-[width] duration-300 ease-out ${
                isWrong
                  ? 'bg-[#f2358d]'
                  : isCelebrating
                    ? 'bg-gradient-to-r from-[#baffd9] to-[#07DA63]'
                    : 'bg-[#07DA63]'
              }`}
              style={{ width: `${Math.min(1, Math.max(0, fill)) * 100}%` }}
            />
          </div>
        );
      })}
    </div>
    <span className="text-xs text-slate-400 tabular-nums shrink-0">
      {Math.min(completed + 1, total)}/{total}
    </span>
  </div>
);
