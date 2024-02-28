import RoomTemplate from 'apps/chessroulette-web/templates/RoomTemplate';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chessroulette',
};

export default function Page() {
  return (
    <RoomTemplate>
      <div className="flex h-full bg-green-100">
        <div className="bg-red-100 flex-1">
          {/* <div className="bg-blue-100 aspect-video" /> */}
        </div>
        <div className="flex-1" />
      </div>
    </RoomTemplate>
  );
  // return works with movex as well</MovexProvider>;
}
