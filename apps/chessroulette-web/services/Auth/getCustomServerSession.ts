'use server';

import { getServerSession } from 'next-auth';
import { CustomSession } from './types';

export const getCustomServerSession = (
  ...args: Parameters<typeof getServerSession>
) => getServerSession(...args) as Promise<CustomSession>;
