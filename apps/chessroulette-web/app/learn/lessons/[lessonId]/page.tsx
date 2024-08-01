import { Metadata } from 'next';
import { AuthenticatedGeneralPage } from 'apps/chessroulette-web/appPages/AuthenticatedGeneralPage';
import z from 'zod';
import { User } from 'apps/chessroulette-web/modules/user';
import { LessonItem } from 'apps/chessroulette-web/modules/Learn/Lessons/components/LessonItem';
import { LessonsList } from 'apps/chessroulette-web/modules/Learn/Lessons/components/LessonsList';
import {
  findLesson,
  findUserLessons,
} from 'apps/chessroulette-web/modules/Learn/Lessons/apiActions';
import { LessonEditorView } from 'apps/chessroulette-web/modules/Learn/Lessons/LessonEditor/LessonEditorView';
// import { getCustomServerSession } from 'apps/chessroulette-web/services/Auth/lib';
// import { authOptions } from 'apps/chessroulette-web/services/Auth';
import { GeneralPageTemplate } from 'apps/chessroulette-web/templates/GeneralPageTemplate';
import RoomTemplate from 'apps/chessroulette-web/templates/RoomTemplate';
import Header from 'apps/chessroulette-web/components/Header';
import { UpdateLessonContainer } from 'apps/chessroulette-web/modules/Learn/Lessons/UpdateLessonContainer';
import { get_UNSAFE_URL_SESSION } from 'apps/chessroulette-web/services/Auth/lib';
import { getCustomServerSession } from 'apps/chessroulette-web/services/Auth/getCustomServerSession';
import { authOptions } from 'apps/chessroulette-web/services/Auth';

export const metadata: Metadata = {
  title: 'Lessons | Chessroulette',
  description: 'Moves That Matter Lessons That Last',
};

const paramsSchema = z.object({
  // tag: z.string().optional(),
});

export default async function LessonPage({
  searchParams,
  params,
}: {
  searchParams: Record<string, string>;
  params: { lessonId: string };
}) {
  // const allParams = Object.assign(searchParams, params);

  // const result = paramsSchema.safeParse(
  //   Object.fromEntries(new URLSearchParams(allParams))
  // );

  // const getLessons = (user: User) => {
  //   return findUserLessons({
  //     userId: user.id,
  //     query: result.success ? result.data : {},
  //   });
  // };

  const session = await get_UNSAFE_URL_SESSION(searchParams);

  if (!session) {
    return <div>No User</div>;
  }

  const lesson = await findLesson(params);

  if (!lesson) {
    return <div>Should show error page</div>;
  }

  return (
    <div className="flex flex-col flex-1 w-full min-h-full">
      <Header
        // themeName={props.themeName}
        showOnboarding
        session={session}
      />
      <div
        className={`
           ml-[max(env(safe-area-inset-left),1.5rem)]
           mr-[max(env(safe-area-inset-right),1.5rem)]
           mb-[max(env(safe-area-inset-right),2rem)]
           mt-2
           flex-1 relative overflow-hidden`}
      >
        <div className="absolute inset-0">
          <UpdateLessonContainer lesson={lesson} />
        </div>
      </div>
    </div>
  );
}
