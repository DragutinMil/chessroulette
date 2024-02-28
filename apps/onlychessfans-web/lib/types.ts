import { Post, User } from '@prisma/client';
import { ChessFEN, ChessPGN } from './util';

export type DisplayableUser = Pick<User, 'firstName' | 'lastName' | 'username'>;

export type DisplayablePost = {
  id: string;
  author: DisplayableUser;
  likes: number;
  likedBy: Pick<DisplayableUser, 'username'>[];
  createdAt: Date;
  updatedAt: Date;
  // categories: string[];
} & (
  | {
      type: 'PGN';
      content: ChessPGN;
    }
  | {
      type: 'FEN';
      content: ChessFEN;
    }
);

