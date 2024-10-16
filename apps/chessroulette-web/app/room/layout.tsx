import { Metadata } from 'next';
import { authOptions } from 'apps/chessroulette-web/services/Auth';
import { getCustomServerSession } from 'apps/chessroulette-web/services/Auth/getCustomServerSession';
import { MovexProvider } from 'apps/chessroulette-web/providers/MovexProvider';

export const metadata: Metadata = {
  title: 'Room | Chessroulette',
  description: '',
};

export default async function RoomLayout({
  // Layouts must accept a children prop.
  // This will be populated with nested layouts or pages
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MovexProvider session={await getCustomServerSession(authOptions)}>
      {children}
    </MovexProvider>
  );
}
