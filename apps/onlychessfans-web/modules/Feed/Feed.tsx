'use client';

import { Chessboard } from 'react-chessboard';
import { ChessFEN, ChessPGN, getPgnDetails } from '../../lib/util';
import { ContainerWithDimensions } from '../../components/ContainerWithDimensions';
import { DisplayablePost, DisplayableUser } from '../../lib/types';
import LikeButton from './components/LikeButton';
import { Suspense, useOptimistic } from 'react';
import { useRouter } from 'next/navigation';
import { PreviewChessboard } from '../../components/PreviewChessboard/PreviewChessboard';
import { CarouselBoard } from '../../components/CarouselBoard';

type Props = {
  posts: DisplayablePost[];
  // itemBoardSizePx: number;
  containerClassName?: string;
  seenByUsername?: DisplayableUser['username'];
  onPostLiked: (p: { id: DisplayablePost['id'] }) => Promise<unknown>;
  onPostDisliked: (p: { id: DisplayablePost['id'] }) => Promise<unknown>;
};

export const Feed = (props: Props) => {
  // const router = useRouter();
  console.log('feed posts', props.posts);
  // const [optimisticMessages, addOptimisticMessage] = useOptimistic<Message[]>(
  //   messages,
  //   (state: Message[], newMessage: string) => [
  //     ...state,
  //     { message: newMessage },
  //   ]
  // );

  return (
    // <ContainerWithDimensions
    //   className="w-full"
    //   render={({ width }) => {
    // return (
    <div className={`${props.containerClassName} flex flex-col w-full`}>
      {props.posts.map((post, i) => {
        if (post.type === 'FEN') {
          return (
            <article className="mb-10" key={i}>
              <header className="mb-2 flex justify-between text-slate-500">
                <div className="">
                  By{' '}
                  <a
                    href={`u/${post.author.username}`}
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
                {/* <Suspense
                  fallback={
                    <PreviewChessboard
                      key={post.id}
                      fen={post.content}
                      darkSquareColor="rgba(0, 163, 255, .4)"
                    />
                  }
                >
                  <CarouselBoard
                    fens={[]}
                    // darkSquareColor="rgba(0, 163, 255, .4)"
                  />
                </Suspense> */}
              </main>
              <footer className="mt-4 flex justify-between">
                <div>
                  {/* <button className="text-2xl">♡ {post.likes}</button> */}
                  {/* <LikeButton
                    liked={
                      !!(
                        props.seenByUsername &&
                        post.likedBy
                          .map((m) => m.username)
                          .indexOf(props.seenByUsername) > -1
                      )
                    }
                    likesCount={post.likes}
                    onLike={async () => {
                      await props.onPostLiked(post);

                      // router.refresh();
                    }}
                    onDislike={async () => {
                      await props.onPostDisliked(post);

                      // router.refresh();
                    }}
                  /> */}
                  {/* <a href="#"></a> */}
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
        }

        // console.log('gere', post.content);

        const { fen, header } = getPgnDetails(post.content);

        return (
          <article className="mb-10" key={i}>
            <header className="mb-2">
              <div className="flex justify-between text-slate-500">
                <div className="">
                  By{' '}
                  <a
                    href={`u/${post.author.username}`}
                    className="underline text-blue-400"
                  >
                    @{post.author.username}
                  </a>
                </div>
                <div>{post.createdAt.toLocaleDateString()}</div>
              </div>

              <div className="flex justify-between">
                <div>
                  {header.white} ({header.whiteElo}) - {header.black} (
                  {header.blackElo})
                </div>
                <div>{header.result}</div>
              </div>
            </header>
            <main className="bg-white overflow-hidden rounded-lg">
              <PreviewChessboard
                fen={fen}
                key={post.id}
                darkSquareColor="rgba(0, 163, 255, .4)"
              />
            </main>
            <footer className="mt-4 flex justify-between">
              <div>
                <Suspense>
                  {/* <LikeButton
                    liked={
                      !!(
                        props.seenByUsername &&
                        post.likedBy
                          .map((m) => m.username)
                          .indexOf(props.seenByUsername) > -1
                      )
                    }
                    likesCount={post.likes}
                    onLike={async () => {
                      await props.onPostLiked(post);

                      // router.refresh();
                    }}
                    onDislike={async () => {
                      await props.onPostDisliked(post);

                      // router.refresh();
                    }}
                  /> */}
                </Suspense>
                {/* <button className="text-2xl">
                        {props.seenByUsername &&
                        post.likedBy
                          .map((m) => m.username)
                          .indexOf(props.seenByUsername) > -1
                          ? '❤️'
                          : '♡'}{' '}
                        {post.likes}
                      </button> */}
                {/* <a href="#"></a> */}
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
      })}
    </div>
  );
  // }}
  // />
  // );
};
