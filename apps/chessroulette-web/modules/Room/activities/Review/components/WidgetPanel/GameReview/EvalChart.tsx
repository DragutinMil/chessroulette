'use client';
import { useEffect, useRef, useState } from 'react';
import { EvaluationMove } from '../../../movex';

// type EvalChartProps = {
//   review:EvaluationMove[]
// };
export default function EvalChart({ review }: any) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);

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

    const stepX = width / (review.length - 1);
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
  }, [review, hovered]);

  // 🖱️ hover logika
  const handleMove = (e: any) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;

    const stepX = rect.width / (review.length - 1);
    const index = Math.round(x / stepX);

    setHovered(index);
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
        style={{ width: '100%' }}
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
