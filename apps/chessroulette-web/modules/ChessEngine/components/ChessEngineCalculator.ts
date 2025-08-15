export function ChessEngineProbabilityCalc(newCp: number, prevCp: number) {
  const k = 0.00358208;
  const newPercentage = Number(
    ((1 / (1 + Math.exp(-k * newCp))) * 100).toFixed(2)
  );
  const prevPercentage = Number(
    ((1 / (1 + Math.exp(-k * prevCp))) * 100).toFixed(2)
  );
  const diff = Number((newPercentage - prevPercentage).toFixed(2));
  return { diff, newPercentage, prevPercentage };
}
