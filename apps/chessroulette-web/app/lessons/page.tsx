import { Metadata } from 'next';
import Header from '../../components/Header/Header';
import { DailyLessonsSection } from '../../modules/Home/DailyLessonsSection';
import { authOptions } from '../../services/Auth';
import { getCustomServerSession } from '../../services/Auth/getCustomServerSession';
import { metadata as rootMetadata } from '../page';

export const metadata: Metadata = {
  title: `Lessons | ${rootMetadata.title}`,
};

export default async function LessonsPage() {
  const session = await getCustomServerSession(authOptions);
  return (
    <div className="flex flex-col h-full container mx-auto">
      {/* lekcije se otvaraju sa theme=op, pa i stranica nosi Outpost izgled.
          Na telefonu header crta DailyLessonsSection u zakucanom delu na vrhu. */}
      <div className="hidden md:block">
        <Header themeName="op" session={session} />
      </div>
      <DailyLessonsSection
        levelLabel="Level 0–600"
        mobileHeader={<Header themeName="op" session={session} />}
      />
    </div>
  );
}
