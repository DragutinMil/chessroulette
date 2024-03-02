import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chessroulette',
};

export default function Page() {
  return (
    <div className="flex w-full h-full bg-green-100">
      <div className="bg-red-100 flex-1 p-10">
        <div className="bg-blue-100 w-full h-full" />
      </div>
      {/* <div className="flex-1" /> */}
    </div>
  );
}
