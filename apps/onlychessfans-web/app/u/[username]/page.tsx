import { Metadata } from 'next';
import { getAuthenticatedUser } from 'apps/onlychessfans-web/lib/user';
import { getPosts } from '../../actions';
import { SSRFeed } from 'apps/onlychessfans-web/modules/Feed';

export const metadata: Metadata = {
  title: 'Only Chess Fans',
};

export default async function Page({
  params: { username },
}: {
  params: { username: string };
}) {
  const authenticatedUser = await getAuthenticatedUser();
  const {
    props: { posts },
  } = await getPosts({ filterBy: { username } });

  return (
    <div className="gap-2 pl-[max(env(safe-area-inset-left),1rem)] pr-[max(env(safe-area-inset-right),1rem)]">
      <main className="mt-6 flex items-center justify-center">
        <div className="min-w-full sm:min-w-[70%] md:min-w-[30%]">
          <SSRFeed
            posts={posts}
            authenticatedUser={authenticatedUser.props.user}
          />
        </div>
      </main>
    </div>
  );
}
