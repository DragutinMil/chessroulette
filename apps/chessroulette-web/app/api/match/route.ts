import { objectOmit } from '@xmatter/util-kit';
import { activityParamsSchema } from 'apps/chessroulette-web/modules/room/io/paramsSchema';
import { links } from 'apps/chessroulette-web/modules/room/links';
import { getRandomStr } from 'apps/chessroulette-web/util';
import { NextRequest, NextResponse } from 'next/server';
import z from 'zod';

const paramsSchema = z.object({
  // TODO: this can be used later when they hit the api, now just the op prefixed id
  id: z.string(), // Outpost
});

export function GET(request: NextRequest) {
  const params = new URLSearchParams(request.nextUrl.search);
  const result = paramsSchema.safeParse(Object.fromEntries(params));

  if (!result.success) {
    return NextResponse.json(result.error, { status: 400 });
  }

  return NextResponse.json(result.data);
}
