import { Metadata } from 'next';
import MovexProvider from '../../providers/MovexProvider';

export const metadata: Metadata = {
  title: 'Room | Chessroulette',
  description: 'Moves That Matter Lessons That Last',
};

export default function RootLayout({
  // Layouts must accept a children prop.
  // This will be populated with nested layouts or pages
  children,
}: {
  children: React.ReactNode;
}) {
  return <MovexProvider>{children}</MovexProvider>;
}
