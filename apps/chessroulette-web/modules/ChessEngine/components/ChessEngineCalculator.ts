export async function ChessEngineProbabilityCalc(newCp: number, prevCp: number) {
  const k = 0.00358208;
  const newPercentage = Number(
    ((1 / (1 + Math.exp(-k * newCp))) * 100).toFixed(2)
  );
  console.log('newPercentage', newPercentage);

  const prevPercentage = Number(
    ((1 / (1 + Math.exp(-k * prevCp))) * 100).toFixed(2)
  );
  console.log('prevPercentage', prevPercentage);
  const diff = Number((newPercentage - prevPercentage).toFixed(2));
  return { diff, newPercentage, prevPercentage };
}
