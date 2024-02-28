'use server';

import { CarouselBoard } from 'apps/onlychessfans-web/components/CarouselBoard';
import LikeButton from 'apps/onlychessfans-web/modules/Feed/components/LikeButton';
import { PreviewChessboard } from 'apps/onlychessfans-web/components/PreviewChessboard/PreviewChessboard';
import {
  DisplayablePost,
  DisplayableUser,
} from 'apps/onlychessfans-web/lib/types';
import { getPgnDetails, pgnToFens } from 'apps/onlychessfans-web/lib/util';
import { Suspense } from 'react';

type Props = {
  post: DisplayablePost;
  // onLiked: () => void;
  // onDisliked: () => void;
  seenByUser?: DisplayableUser;
};

export const SSRPost = ({ post, seenByUser }: Props) => {
  // const { fen, header } = getPgnDetails(post.content);

  return (
    <article className="mb-10">
      <header className="mb-2 flex justify-between text-slate-500">
        <div className="">
          By{' '}
          <a
            href={`/u/${post.author.username}`}
            className="underline text-blue-400"
          >
            @{post.author.username}
          </a>
        </div>
        <div>{post.createdAt.toLocaleDateString()}</div>
        {/* <div>
                        {header.white} ({header.whiteElo}) - {header.black} (
                        {header.blackElo})
                      </div> */}
        {/* <div>{header.result}</div> */}
      </header>
      <main className="bg-white overflow-hidden rounded-lg">
        <Suspense
          fallback={
            <PreviewChessboard
              key={post.id}
              fen={post.content}
              darkSquareColor="rgba(0, 163, 255, .4)"
            />
          }
        >
          <CarouselBoard
            fens={
              post.type === 'FEN'
                ? [post.content]
                : pgnToFens(post.content).slice(-10)
            }
            // darkSquareColor="rgba(0, 163, 255, .4)"
          />
        </Suspense>
      </main>
      <footer className="mt-4 flex justify-between">
        <div>
          <LikeButton
            liked={
              !!(
                seenByUser &&
                post.likedBy
                  .map((p) => p.username)
                  .indexOf(seenByUser.username) > -1
              )
            }
            likesCount={post.likes}
            postId={post.id}
          />
        </div>
        <div>
          {/* {game.categories.map((c) => (
                          <a className="mr-1 hover:underline " href={`#${c}`}>
                            #{c}
                          </a>
                        ))} */}
        </div>
      </footer>
    </article>
  );
};
