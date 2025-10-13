import React from 'react';

type StatsTableProps = {
  content: string;
};

const getHighlightClassError = (value: number): string => {
  if (value > 9) return 'text-red-500 font-bold';
  if (value > 4) return 'text-yellow-500 font-bold';
  return '';
};
const getHighlightClassGood = (value: number): string => {
  if (value > 9) return 'text-green-600 font-bold';
  if (value > 4) return 'text-blue-600 font-bold';
  return '';
};

export const StatsTable: React.FC<StatsTableProps> = ({ content }) => {
  const values = content.split('/').map(Number);
  // console.log(values)
  return (
    <div className="w-[85%] justify-center">
      {/* Header */}
      <div className="flex">
        <div className="w-[50%]"></div>
        <div className="w-[25%] text-center">White</div>
        <div className="w-[25%] text-center">Black</div>
      </div>

      {/* ✅ Excellent */}
      <div className="flex mt-1">
        <div className="w-[50%]">✅ Excellent:</div>
        <div
          className={`w-[25%] text-center ${getHighlightClassGood(values[3])}`}
        >
          {values[3]}
        </div>
        <div
          className={`w-[25%] text-center ${getHighlightClassGood(values[10])}`}
        >
          {values[10]}
        </div>
      </div>

      {/* ✅ Good moves */}
      <div className="flex mt-1">
        <div className="w-[50%]">✅ Good moves:</div>
        <div
          className={`w-[25%] text-center ${getHighlightClassGood(values[2])}`}
        >
          {values[2]}
        </div>
        <div
          className={`w-[25%] text-center ${getHighlightClassGood(values[9])}`}
        >
          {values[9]}
        </div>
      </div>

      {/* ⬇️ Bad moves */}
      <div className="flex mt-1">
        <div className="w-[50%]">⬇️ Bad moves:</div>
        <div
          className={`w-[25%] text-center ${getHighlightClassError(values[1])}`}
        >
          {values[1]}
        </div>
        <div
          className={`w-[25%] text-center ${getHighlightClassError(values[8])}`}
        >
          {values[8]}
        </div>
      </div>

      {/* ❌ Blunder */}
      <div className="flex mt-1">
        <div className="w-[50%]">❌ Blunder:</div>
        <div
          className={`w-[25%] text-center ${getHighlightClassError(values[0])}`}
        >
          {values[0]}
        </div>
        <div
          className={`w-[25%] text-center ${getHighlightClassError(values[7])}`}
        >
          {values[7]}
        </div>
      </div>

      {/* 🎯 First Line */}
      <div className="flex mt-1">
        <div className="w-[50%]">🎯 First Line</div>
        <div
          className={`w-[25%] text-center ${getHighlightClassGood(values[4])}`}
        >
          {values[4]}
        </div>
        <div
          className={`w-[25%] text-center ${getHighlightClassGood(values[11])}`}
        >
          {values[11]}
        </div>
      </div>

      {/* ⚡ Second */}
      <div className="flex mt-1">
        <div className="w-[50%]">⚡ Second:</div>
        <div
          className={`w-[25%] text-center ${getHighlightClassGood(values[5])}`}
        >
          {values[5]}
        </div>
        <div
          className={`w-[25%] text-center ${getHighlightClassGood(values[12])}`}
        >
          {values[12]}
        </div>
      </div>

      {/* ⚡ Third */}
      <div className="flex mt-1">
        <div className="w-[50%]">⚡ Third:</div>
        <div
          className={`w-[25%] text-center ${getHighlightClassGood(values[6])}`}
        >
          {values[6]}
        </div>
        <div
          className={`w-[25%] text-center ${getHighlightClassGood(values[13])}`}
        >
          {values[13]}
        </div>
      </div>
    </div>
  );
};
