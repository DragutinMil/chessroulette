'use server';

import {
  DisplayablePost,
  DisplayableUser,
} from 'apps/onlychessfans-web/lib/types';
import { SSRPost } from './components/Post/SSRPost';

type Props = {
  posts: DisplayablePost[];
  containerClassName?: string;
  authenticatedUser?: DisplayableUser;
};

export const SSRFeed = (props: Props) => {
  return (
    <div className={`${props.containerClassName} flex flex-col w-full`}>
      {props.posts.map((post) => (
        <SSRPost
          key={post.id}
          post={post}
          seenByUser={props.authenticatedUser}
        />
      ))}
    </div>
  );
};
