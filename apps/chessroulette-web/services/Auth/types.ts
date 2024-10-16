import { User } from '@app/modules/user/type';
import { Session as NextAuthSession } from 'next-auth';

export type CustomSessionUser = NextAuthSession['user'] & User;

export type CustomSession = NextAuthSession & {
  user: CustomSessionUser;
};
