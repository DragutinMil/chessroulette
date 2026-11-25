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
    <>
      {/* lekcije se otvaraju sa theme=op, pa i stranica nosi Outpost izgled.
          Desktop: header zakucan na vrhu, traka preko cele sirine (zato je van
          container-a), poluprovidna da se gradient pozadine nazire.
          Na telefonu header crta DailyLessonsSection u zakucanom delu na vrhu. */}
      <div className="hidden md:block sticky top-0 z-30 bg-black/60 backdrop-blur-md">
        <div className="container mx-auto">
          <Header themeName="op" session={session} showUserActions />
        </div>
      </div>
      <div className="flex flex-col h-full container mx-auto">
        <DailyLessonsSection
          levelLabel="Level 0–600"
          mobileHeader={<Header themeName="op" session={session} />}
        />
      </div>
    </>
  );
}
