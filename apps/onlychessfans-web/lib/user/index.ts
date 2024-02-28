import { LOGGEDIN_USER } from 'apps/onlychessfans-web/config';
import prisma from '../prisma';

export async function getAuthenticatedUser() {
  'use server';

  const user = await prisma.user.findFirst({
    where: { username: LOGGEDIN_USER },
    // include: {
    //   author: {
    //     select: { firstName: true, lastName: true, username: true },
    //   },
    //   likedBy: {
    //     select: { username: true },
    //   },
    //   _count: {
    //     select: { likedBy: true },
    //   },
    // },
  });

  // console.log('posts again', posts[0]._count.);

  return {
    props: { user: user || undefined },
    revalidate: 10,
  };

  // return feed;

  // const res = await fetch('https://api.example.com/...');
  // // The return value is *not* serialized
  // // You can return Date, Map, Set, etc.

  // if (!res.ok) {
  //   // This will activate the closest `error.js` Error Boundary
  //   throw new Error('Failed to fetch data');
  // }

  // return res.json();
}
