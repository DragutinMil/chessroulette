import { Metadata } from 'next';
import '../styles.css';
import MovexProvider from '../providers/MovexProvider';

export const metadata: Metadata = {
  title: 'Home | Chessroulette',
  description: 'Moves That Matter Lessons That Last',
};

export default function RootLayout({
  // Layouts must accept a children prop.
  // This will be populated with nested layouts or pages
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <MovexProvider>{children}</MovexProvider>
      </body>
    </html>
  );
}
