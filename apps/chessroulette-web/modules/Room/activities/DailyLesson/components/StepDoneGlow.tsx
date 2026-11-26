import React from 'react';

type Props = {
  /** Tailwind klasa za zaobljenje prstena, prati zaobljenje roditelja. */
  roundedClassName?: string;
};

/**
 * Korak gotov: zeleno svetlo stalno kruzi oko ivice roditelja (Next dugme,
 * segment progress trake). Roditelj mora biti `relative`. Maska ostavlja
 * samo prsten od 2px, a blur je na spoljnom sloju (maska se u CSS-u
 * primenjuje posle filtera, pa bi blur na istom elementu bio odsecen).
 */
export const StepDoneGlow = ({ roundedClassName = 'rounded-full' }: Props) => (
  <span
    aria-hidden
    className="pointer-events-none absolute -inset-[2px] blur-[3px]"
  >
    <span className={`dl-step-glow absolute inset-0 ${roundedClassName}`} />
    <style>{`
      @keyframes dl-step-glow { 0% { background-position: 0 0; } 50% { background-position: 400% 0; } 100% { background-position: 0 0; } }
      .dl-step-glow {
        padding: 2px;
        background: linear-gradient(45deg, #64D771, #205028, #64D771, #205028, #64D771);
        background-size: 400%;
        -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
        -webkit-mask-composite: xor;
        mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0);
        animation: dl-step-glow 20s linear infinite;
      }
      @media (prefers-reduced-motion: reduce) { .dl-step-glow { animation: none; } }
    `}</style>
  </span>
);
