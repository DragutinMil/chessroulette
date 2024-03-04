import { objectOmit } from '@xmatter/util-kit';
import { activityParamsSchema } from 'apps/chessroulette-web/modules/room/io/paramsSchema';
import { links } from 'apps/chessroulette-web/modules/room/links';
import { getRandomStr } from 'apps/chessroulette-web/util';
import { NextRequest, NextResponse } from 'next/server';
import z from 'zod';

const paramsSchema = z
  .object({
    // TODO: this can be used later when they hit the api, now just the op prefixed id
    client: z.string(), // Outpost
  })
  .and(activityParamsSchema);

export function GET(request: NextRequest) {
  const params = new URLSearchParams(request.nextUrl.search);
  const result = paramsSchema.safeParse(Object.fromEntries(params));

  if (!result.success) {
    return NextResponse.json(result.error, { status: 400 });
  }

  const activityParams = result.data;
  const roomId = activityParams.client.slice(0, 3) + getRandomStr(7);

  if (activityParams.activity === 'learn') {
    const instructor = links.getOnDemandRoomCreationLink(
      {
        ...objectOmit(activityParams, ['client']),
        id: roomId,
        instructor: true,
      },
      request.nextUrl
    );

    const student = links.getOnDemandRoomCreationLink(
      {
        ...objectOmit(activityParams, ['client']),
        id: roomId,
        instructor: false,
      },
      request.nextUrl
    );

    return NextResponse.json({
      links: [
        {
          userRole: 'instructor',
          url: instructor,
        },
        {
          userRole: 'student',
          url: student,
        },
      ],
    });
  }

  if (activityParams.activity === 'meetup') {
    return NextResponse.json({
      links: [
        {
          userRole: 'participant',
          url: links.getOnDemandRoomCreationLink(
            {
              ...objectOmit(activityParams, ['client']),
              id: roomId,
            },
            request.nextUrl
          ),
        },
      ],
    });
  }

  return NextResponse.json(
    {
      Error: `Ooops! this shouldn't happen.`,
    },
    { status: 500 }
  );
}
