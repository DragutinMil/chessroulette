import { authOptions } from 'apps/chessroulette-web/services/Auth';
import NextAuth from 'next-auth';

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
