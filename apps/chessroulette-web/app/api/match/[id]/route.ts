import { objectOmit } from '@xmatter/util-kit';
import { activityParamsSchema } from 'apps/chessroulette-web/modules/room/io/paramsSchema';
import { links } from 'apps/chessroulette-web/modules/room/links';
import { RoomState } from 'apps/chessroulette-web/modules/room/movex/reducer';
import { getRandomStr } from 'apps/chessroulette-web/util';
import { MovexClientResourceShape } from 'movex-core-util';
import { NextRequest, NextResponse } from 'next/server';
import z from 'zod';

const MOVEX_ENDPOINT_URL = process.env.NEXT_PUBLIC_MOVEX_ENDPOINT_URL as string;

const paramsSchema = z.object({
  // TODO: this can be used later when they hit the api, now just the op prefixed id
  id: z.string(), // Outpost
});

export function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // const params = new URLSearchParams(request.nextUrl.search);
  console.log('here', params);
  // const params = new URLSearchParams(request.nextUrl.searchParams);
  // const result = paramsSchema.safeParse(Object.fromEntries(params));

  // if (!result.success) {
  //   return NextResponse.json(result.error, { status: 400 });
  // }

  const movexRoomUrl = `http://${MOVEX_ENDPOINT_URL}/api/resources/room:${params.id}`;

  return fetch(movexRoomUrl)
    .then((s) => {
      if (s.ok) {
        return s.json();
      }

      throw s;
    })
    .then(
      (resource: MovexClientResourceShape<string, RoomState>) => {
        const [room] = resource.state;

        if (room.activity.activityType === 'match') {
          // return room.activity.activityState;

          return NextResponse.json(room.activity.activityState);
        }

        return NextResponse.json(
          {
            Error: `Not found a Match Resource`,
          },
          { status: 404 }
        );
      },
      (e: Response) => {
        if (e.statusText) {
          return NextResponse.json(
            {
              Error: e.statusText,
            },
            { status: e.status }
          );
        }

        console.error('[api/match/[id]] Error', {
          params,
          error: e,
        });

        return NextResponse.json(
          {
            Error: `Ooops! This shouldn't happen.`,
          },
          { status: 500 }
        );
      }
    );
}
