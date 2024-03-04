import { Metadata } from 'next';
import '../../styles.css';
import RoomTemplate from 'apps/chessroulette-web/templates/RoomTemplate';

export const metadata: Metadata = {
  title: 'Play Room',
  description: 'Welcome to Chessroulette',
};

export default function RootLayout({
  // Layouts must accept a children prop.
  // This will be populated with nested layouts or pages
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoomTemplate activity="none">{children}</RoomTemplate>;
}
