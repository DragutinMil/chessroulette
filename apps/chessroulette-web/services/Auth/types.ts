import { User } from '@app/modules/User2/type';
import { Session as NextAuthSession } from 'next-auth';

export type CustomSessionUser = NextAuthSession['user'] & User;

export type CustomSession = NextAuthSession & {
  user: CustomSessionUser;
};
