import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chessroulette',
};

export default function Page() {
  return (
    <div className="flex h-screen">
      <div className="bg-red-100 flex-1">
        {/* works */}
        <div className="bg-blue-100 aspect-video" />
      </div>
      <div className="flex-1" />
    </div>
  );
  // return works with movex as well</MovexProvider>;
}
