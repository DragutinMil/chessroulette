'use client';

import { Button } from 'apps/chessroulette-web/components/Button';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center h-screen w-screen text-lg divide-x">
      <div className="flex flex-col gap-4 items-center">
        <h2 className="text-2xl">Something went wrong!</h2>
        <Button
          onClick={
            // Attempt to recover by trying to re-render the segment
            () => reset()
          }
        >
          Try again
        </Button>
      </div>
    </div>
  );
}
