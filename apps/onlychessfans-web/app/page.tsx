import { Metadata } from 'next';
import { Submit } from './_components/Submit';
import { SSRFeed } from '../modules/Feed';
import { getAuthenticatedUser } from '../lib/user';
import { getPosts } from './actions';

export const metadata: Metadata = {
  title: 'Only Chess Fans',
};

export default async function Page() {
  const authenticatedUser = await getAuthenticatedUser();
  const {
    props: { posts },
  } = await getPosts();

  return (
    <div className="gap-2 pl-[max(env(safe-area-inset-left),1rem)] pr-[max(env(safe-area-inset-right),1rem)]">
      <main className="mt-6 flex items-center justify-center">
        <div className="min-w-full sm:min-w-[70%] md:min-w-[30%]">
          <Submit />

          <SSRFeed
            posts={posts}
            authenticatedUser={authenticatedUser.props.user}
          />
        </div>
      </main>
    </div>
  );
  // return works with movex as well</MovexProvider>;
}
