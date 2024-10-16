import { Metadata } from 'next';
import Header from '../components/Header';
import { MainHomeSection } from '../modules/Home/MainHomeSection';
import { authOptions } from '../services/Auth';
import { getCustomServerSession } from '../services/Auth/getCustomServerSession';

export const metadata: Metadata = {
  title: 'Chessroulette',
  description: '',
};

export default async function Home() {
  const session = await getCustomServerSession(authOptions);

  return (
    <div>
      <Header showOnboarding session={session} />
      <MainHomeSection session={session} />
    </div>
  );
}
