import { Metadata } from 'next';
import { AuthenticatedGeneralPage } from 'apps/chessroulette-web/appPages/AuthenticatedGeneralPage';
import { findUserLessons } from '../../../modules/Learn/Lessons/apiActions';
import z from 'zod';
import { User } from 'apps/chessroulette-web/modules/user';
import { LessonItem } from 'apps/chessroulette-web/modules/Learn/Lessons/components/LessonItem';
import { LessonsList } from 'apps/chessroulette-web/modules/Learn/Lessons/components/LessonsList';
import { getCustomServerSession } from 'apps/chessroulette-web/services/Auth/lib';
import { CustomSession, authOptions } from '../../../services/Auth';
import { GeneralPageTemplate } from 'apps/chessroulette-web/templates/GeneralPageTemplate';
import { invoke } from '@xmatter/util-kit';
import { Lesson } from '@prisma/client';
import { LessonModel } from 'apps/chessroulette-web/modules/Learn/Lessons/types';

export const metadata: Metadata = {
  title: 'Lessons | Chessroulette',
  description: 'Moves That Matter Lessons That Last',
};

const paramsSchema = z.object({
  tag: z.string().optional(),
});

export default async function LessonsPage({
  searchParams,
  params,
}: {
  searchParams: Record<string, string>;
  params: Record<string, string>;
}) {
  const allParams = Object.assign(searchParams, params);

  const result = paramsSchema.safeParse(
    Object.fromEntries(new URLSearchParams(allParams))
  );

  const getLessons = (user: User) => {
    return findUserLessons({
      userId: user.id,
      query: result.success ? result.data : {},
    });
  };

  const session = await getCustomServerSession(authOptions);

  if (!session) {
    return <div>No User</div>;
  }

  return (
    <GeneralPageTemplate session={session}>
      {/* <>
          {allParams && (
            <div className="pb-2">
              Params:
              {JSON.stringify(allParams, null, 2)}
            </div>
          )}

          {invoke(async () => {
            const lessons = await getLessons(session.user);

            return <LessonsList lessons={lessons} />;
          })}
        </> */}

      {/* <div>logged in {session.user.id}</div> */}
      {/* {invoke(async () => {
          // const lessons = await getLessons(session.user);

          return (
            <>
              {allParams && (
                <div className="pb-2">
                  Params:
                  {JSON.stringify(allParams, null, 2)}
                </div>
              )}

              <LessonsList lessons={[]} />
            </>
          );
        })} */}
      <>
        {allParams && (
          <div className="pb-2">
            Params:
            {JSON.stringify(allParams, null, 2)}
          </div>
        )}

        <LessonsList lessons={await getLessons(session.user)} />
      </>
    </GeneralPageTemplate>
  );

  // return <div>not logged in</div>;

  // return (
  //   <AuthenticatedGeneralPage
  //     resolveData={async (session) => await getLessons(session.user)}
  //     render={async (session, data) => {
  //       // const lessons = ;

  //       return (
  //         <>
  //           {allParams && (
  //             <div className="pb-2">
  //               Params:
  //               {JSON.stringify(allParams, null, 2)}
  //             </div>
  //           )}

  //           <LessonsList lessons={data as LessonModel[]} />
  //         </>
  //       );
  //     }}
  //   />
  // );
}
