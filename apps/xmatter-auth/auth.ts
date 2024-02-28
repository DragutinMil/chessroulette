import NextAuth, { AuthOptions } from 'next-auth';

import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';
import EmailProvider from 'next-auth/providers/email';
import Credentials from 'next-auth/providers/credentials';

// import type { NextAuthConfig } from 'next-auth';
import { appConfig } from './appConfig';

import { PrismaAdapter } from '@auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const emailConfig = {
  EMAIL_SERVER_HOST: 'smtp.mailgun.org',
  EMAIL_SERVER_USER: 'test@mail.chessroulette.org', // 'postmaster@mail.chessroulette.org',
  EMAIL_SERVER_PASSWORD: 'e5e8308dcc5fa5df1ffec46ba1fd10b2-8c90f339-2af7f09c', //'d10b08f23216bd6da36498250433d61d-8c90f339-e79028a8', // Mailgun key 45aa235ba167635c8d72ee2ea1e83458-8c90f339-6a7c2895
  EMAIL_SERVER_PORT: 587,
  EMAIL_FROM: 'gabriel@chessroulette.org',
};

export const authOptions = {
  theme: {
    // logo: 'https://next-auth.js.org/img/logo/logo-sm.png',
    logo: 'https://raw.githubusercontent.com/movesthatmatter/chessroulette-web/72553f4cdecb07e467d5b972a563192e5c8027ac/src/components/Logo/assets/Logo_light_full.svg',
  },
  secret: appConfig.JWT_SECRET,
  adapter: PrismaAdapter(prisma),
  providers: [
    // Credentials({
    //   credentials: {
    //     username: { label: 'Username', type: 'text', placeholder: 'jsmith' },
    //     password: { label: 'Password', type: 'password' },
    //   },
    //   async authorize(credentials, req) {
    //     // Add logic here to look up the user from the credentials supplied
    //     const user = { id: '1', name: 'J Smith', email: 'jsmith@example.com' };

    //     if (user) {
    //       // Any object returned will be saved in `user` property of the JWT
    //       return user;
    //     } else {
    //       // If you return null then an error will be displayed advising the user to check their details.
    //       return null;

    //       // You can also Reject this callback with an Error thus the user will be sent to the error page with the error message as a query parameter
    //     }
    //   },
    // }),
    EmailProvider({
      server: {
        host: emailConfig.EMAIL_SERVER_HOST,
        port: emailConfig.EMAIL_SERVER_PORT,
        auth: {
          user: emailConfig.EMAIL_SERVER_USER,
          pass: emailConfig.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
    // {
    //   id: 'mailgun',
    //   type: 'email',
    //   async sendVerificationRequest({identifier: email, url}) {
    //   }
    // },
    {
      id: 'Lichess',
      name: 'Lichess',
      type: 'oauth',
      authorization: {
        url: 'https://lichess.org/oauth',
        params: { scope: 'board:play email:read preference:read' },
      },
      token: 'https://lichess.org/api/token',
      userinfo: 'https://lichess.org/api/account/email', // TODO: This might need to be custom
      clientId: 'chessroulette',
      profile: (user, tokens) => {
        // Get the remaining profile information
        return fetch('https://lichess.org/api/account', {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        })
          .then((r) => r.json())
          .then((profile) => ({
            ...profile,
            ...user,
          }));
      },
      // clientSecret: 'client_secret',
      checks: ['pkce', 'state'],
      client: {
        token_endpoint_auth_method: 'none',
      },
    },
    // GitHub({
    //   clientId: '',
    //   clientSecret: '',
    // }),
  ],
  debug: true,
} as AuthOptions;

// export const { handlers, auth, signIn, signOut } = NextAuth(config);
