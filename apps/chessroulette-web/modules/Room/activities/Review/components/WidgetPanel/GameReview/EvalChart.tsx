'use client';
import { useEffect, useRef, useState } from 'react';
import { EvaluationMove } from '../../../movex';
import { FBHIndex } from '@xmatter/util-kit';

// type EvalChartProps = {
//   review:EvaluationMove[]
// };
type EvalChartProps = {
  review: EvaluationMove[];
  onMoveClick?: (index: FBHIndex) => void;
  // Currently focused move in the notation (the arrows/move list above the
  // board). Drawn as a vertical timeline marker so the user can see where in
  // the game they are.
  focusedIndex?: FBHIndex;
};

// review[i] holds the evaluation after ply i (0 = White's 1st move), the same
// mapping handleClick uses to go back from chart index to FBHIndex.
export const fbhIndexToChartIndex = (
  focusedIndex: FBHIndex | undefined,
  reviewLength: number
): number | null => {
  if (!focusedIndex || reviewLength === 0) return null;
  const ply = focusedIndex[0] * 2 + focusedIndex[1];
  return Math.max(0, Math.min(reviewLength - 1, ply));
};

export default function EvalChart({
  review,
  onMoveClick,
  focusedIndex,
}: EvalChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const activeIndex = fbhIndexToChartIndex(focusedIndex, review?.length ?? 0);

  useEffect(() => {
    if (!canvasRef.current || !review?.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const width = canvas.width;
    const height = canvas.height;

    const minEval = -10;
    const maxEval = 10;

    const clamp = (val: any) => Math.max(minEval, Math.min(maxEval, val));

    const normalizeY = (evalVal: any) => {
      const v = clamp(evalVal);
      return height - ((v - minEval) / (maxEval - minEval)) * height;
    };

    const stepX = review.length > 1 ? width / (review.length - 1) : 0;
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    // 🎨 background (green / red split)
    const zeroY = normalizeY(0);

    ctx.fillStyle = 'rgba(34,197,94,0.15)'; // green
    ctx.fillRect(0, 0, width, zeroY);

    ctx.fillStyle = 'rgba(239,68,68,0.15)'; // red
    ctx.fillRect(0, zeroY, width, height - zeroY);

    // 🟡 grid lines
    // ctx.strokeStyle = 'rgba(255, 255, 255, 0.05);';
    ctx.lineWidth = 0.5;

    for (let i = -10; i <= 10; i += 5) {
      const y = normalizeY(i);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 🔵 line
    ctx.beginPath();
    ctx.lineWidth = 3;

    review.forEach((item: any, i: any) => {
      const x = i * stepX;
      const y = normalizeY(item.eval);

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.strokeStyle = 'rgba(7, 218, 99)';
    ctx.stroke();

    // ⚫ points
    review.forEach((item: any, i: any) => {
      const x = i * stepX;
      const y = normalizeY(item.eval);

      ctx.beginPath();
      ctx.arc(x, y, hovered === i ? 6 : 3, 0, Math.PI * 2);
      //   ctx.fillStyle = hovered === i ? '#f59e0b' : '#111';
      ctx.fill();
    });

    // 📍 timeline marker for the currently focused move
    if (activeIndex !== null) {
      const x = Math.max(1, Math.min(width - 1, activeIndex * stepX));
      const y = normalizeY(Number(review[activeIndex].eval));

      // save/restore so the marker styles don't leak into the next redraw
      // (grid lines rely on the context's default stroke style)
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(7, 218, 99)';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
      ctx.restore();
    }
  }, [review, hovered, activeIndex]);

  // 🖱️ hover logika
  const handleMove = (e: any) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;

    const stepX = rect.width / (review.length - 1);
    const index = Math.round(x / stepX);

    setHovered(index);
  };

  const handleClick = (e: any) => {
    if (!canvasRef.current || !onMoveClick) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const stepX = rect.width / (review.length - 1);
    const index = Math.min(Math.round(x / stepX), review.length - 1);
    const fbhIndex: FBHIndex = [Math.floor(index / 2), (index % 2) as 0 | 1];
    onMoveClick(fbhIndex);
  };

  const hoveredItem = hovered != null ? review[hovered] : null;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <canvas
        ref={canvasRef}
        width={800}
        height={250}
        onMouseMove={handleMove}
        onMouseLeave={() => setHovered(null)}
        onClick={handleClick}
        style={{ width: '100%', cursor: onMoveClick ? 'pointer' : 'default' }}
      />

      {/* 🧠 tooltip */}
      {hoveredItem && hoveredItem.eval > -10 && hoveredItem.eval < 10 && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            background: '#111',
            color: '#fff',
            padding: '6px 10px',
            borderRadius: 6,
            fontSize: 12,
          }}
        >
          Eval: {hoveredItem.eval}
        </div>
      )}
    </div>
  );
}
