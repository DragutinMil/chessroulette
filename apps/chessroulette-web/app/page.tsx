import { Metadata } from 'next';
import Header from '../components/Header';
import { MainHomeSection } from '../modules/Home/MainHomeSection';
import { getServerSession } from 'next-auth';
import { authOptions } from '../services/auth';

export const metadata: Metadata = {
  title: 'Chessroulette',
  description: 'Moves That Matter Lessons That Last',
};

export default async function Home() {
  const session = (await getServerSession(authOptions)) || undefined;

  return (
    <div className="gap-2 pl-[max(env(safe-area-inset-left),1.5rem)] pr-[max(env(safe-area-inset-right),1.5rem)]">
      <Header showOnboarding session={session} />
      <MainHomeSection session={session} />
    </div>
  );
  // return works with movex as well</MovexProvider>;
}
