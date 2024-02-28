// import { iceServersResponse, IceServersResponse, io } from 'chessroulette-io';
import { AsyncResultWrapper } from 'ts-async-results';
import { Err, Ok } from 'ts-results';
import { IceServerResponse } from './type';
// import { http } from 'src/lib/http';

type ApiError = 'BadRequest' | 'BadResponse';

export const getIceURLS = () =>
  new AsyncResultWrapper<IceServerResponse, ApiError>(async () => {

    // TODO: Remove the hardcoded ice server
    return new Ok([
      {
        url: 'stun:stun.ideasip.com',
        urls: 'stun:stun.ideasip.com',
        credential: undefined,
        username: undefined,
      },
    ]);
    // try {
    //   const { data } = await http.get('api/iceurls');

    //   return io.toResult(iceServersResponse.decode(data)).mapErr(() => 'BadResponse');
    // } catch (e) {
    //   return new Err('BadRequest');
    // }
  });
