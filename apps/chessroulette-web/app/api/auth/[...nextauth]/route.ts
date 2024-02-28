import { authOptions } from 'apps/chessroulette-web/services/auth';
import NextAuth from 'next-auth';

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
// export const { GET, POST } = handlers;
