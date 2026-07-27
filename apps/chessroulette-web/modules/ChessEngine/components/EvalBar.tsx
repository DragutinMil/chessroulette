const DEFAULT_WRAPPER_CLASS =
  'w-full mt-1 h-5 md:flex hidden overflow-hidden rounded mt-4';

type Props = {
  percentW: number;
  percentB: number;
  scoreCP: number;
  /** Suppress the numeric score labels (e.g. while a background scan is running, or on a compact bar). */
  hideScore?: boolean;
  /** Replaces the default (desktop-only, h-5) wrapper classes entirely — use for compact/mobile variants. */
  wrapperClassName?: string;
};

export const EvalBar = ({
  percentW,
  percentB,
  scoreCP,
  hideScore = false,
  wrapperClassName = DEFAULT_WRAPPER_CLASS,
}: Props) => {
  return (
    <div className={wrapperClassName}>
      <div
        className="bg-white transition-all duration-500 flex items-center justify-start pl-1"
        style={{ width: `${percentW}%` }}
      >
        {scoreCP > 0 && scoreCP < 49999 && !hideScore && (
          <span
            className="text-[10px] font-bold leading-none whitespace-nowrap relative top-[1px]"
            style={{ color: '#111' }}
          >
            +{(scoreCP / 100).toFixed(2)}
          </span>
        )}
      </div>
      <div
        className="bg-[#000000] transition-all duration-500 flex items-center justify-end pr-1"
        style={{ width: `${percentB}%` }}
      >
        {scoreCP < 0 && scoreCP > -49999 && !hideScore && (
          <span className="text-[10px] font-bold text-white leading-none whitespace-nowrap relative top-[2px]">
            {(scoreCP / 100).toFixed(2)}
          </span>
        )}
      </div>
    </div>
  );
};
