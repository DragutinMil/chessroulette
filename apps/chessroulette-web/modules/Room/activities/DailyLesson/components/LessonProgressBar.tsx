import React from 'react';
import { Icon } from '@app/components/Icon/Icon';

type Props = {
  /** Broj segmenata - svaki teach korak je jedan, svi puzzli zajedno jedan. */
  total: number;
  /** Indeks segmenta na kom je korisnik. */
  current: number;
  /** Koliko je segmenata u celosti zavrseno. */
  completed: number;
  /** Delimicna popunjenost tekuceg segmenta, 0..1 (puzzle segment). */
  currentFraction?: number;
  onRepeatLesson?: () => void;
};

export const LessonProgressBar = ({
  total,
  current,
  completed,
  currentFraction = 0,
  onRepeatLesson,
}: Props) => (
  <div className="flex items-center gap-2 w-full px-1 my-2">
    <div className="flex flex-1 gap-2 min-w-0">
      {Array.from({ length: total }, (_, i) => {
        const isDone = i < completed;
        const isCurrent = i === current && !isDone;
        const fill = isDone ? 1 : isCurrent ? currentFraction : 0;
        return (
          <div
            key={i}
            className={`h-[8px] flex-1 rounded-full overflow-hidden ${
              isCurrent ? 'bg-[#07DA63]/25' : 'bg-white/15'
            }`}
          >
            <div
              className="h-full rounded-full bg-[#07DA63] transition-[width] duration-300 ease-out"
              style={{ width: `${Math.min(1, Math.max(0, fill)) * 100}%` }}
            />
          </div>
        );
      })}
    </div>
    <span className="text-xs text-slate-400 tabular-nums shrink-0">
      {Math.min(completed + 1, total)}/{total}
    </span>
    {onRepeatLesson && (
      <button
        type="button"
        onClick={onRepeatLesson}
        title="Restart lesson"
        aria-label="Restart lesson"
        className="shrink-0 text-slate-400 hover:text-white transition-colors"
      >
        <Icon name="ArrowPathIcon" kind="outline" className="h-4 w-4" />
      </button>
    )}
  </div>
);
