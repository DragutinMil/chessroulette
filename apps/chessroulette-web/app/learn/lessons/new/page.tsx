import { Metadata } from 'next';
import z from 'zod';
import { createLesson } from 'apps/chessroulette-web/modules/Learn/Lessons/apiActions';
import { getCustomServerSession } from 'apps/chessroulette-web/services/Auth/lib';
import { authOptions } from 'apps/chessroulette-web/services/Auth';
import Header from 'apps/chessroulette-web/components/Header';
import { CreateLessonContainer } from 'apps/chessroulette-web/modules/Learn/Lessons/CreateLessonContainer';

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

  const session = await getCustomServerSession(authOptions);

  if (!session) {
    return <div>No User</div>;
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
          <CreateLessonContainer
            // onSubmit={createLesson}
            userId={session.user.id}
            onSubmit={createLesson}
          />
        </div>
      </div>
    </div>
  );
}
