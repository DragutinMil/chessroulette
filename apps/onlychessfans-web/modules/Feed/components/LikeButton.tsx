'use client';

import { dislikePost, likePost } from 'apps/onlychessfans-web/app/actions';
import { DisplayablePost } from 'apps/onlychessfans-web/lib/types';
import { useRouter } from 'next/navigation';

type Props = {
  // onLike: () => void;
  // onDislike: () => void;
  liked: boolean;
  likesCount: number;
  postId: DisplayablePost['id'];
};

export default (props: Props) => {
  // const [state, formAction] = useFormState(createTodo, initialState)
  const router = useRouter();

  return (
    <form
      action={async () => {
        if (props.liked) {
          await dislikePost({ postId: props.postId });
        } else {
          await likePost({ postId: props.postId });
        }

        router.refresh();
      }}
    >
      <button
        className="text-xl group"
        // onClick={() => (props.liked ? props.onDislike() : props.onLike())}
        type="submit"
      >
        {props.liked ? (
          <>❤️</>
        ) : (
          <>
            <span className="inline group-hover:hidden">♡</span>
            <span className="hidden group-hover:inline">🤍</span>
          </>
        )}{' '}
        {props.likesCount}
      </button>
    </form>
  );
};
