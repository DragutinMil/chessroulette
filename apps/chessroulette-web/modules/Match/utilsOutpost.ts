import Cookies from 'js-cookie';
import { decodeJwt } from 'jose';

export function checkUser() {
  const url = new URL(window.location.href);
  const userId = url.searchParams.get('userId');
  // console.log('userId',userId)
  //from mobile app check
  if (Cookies.get('token')) {
    const data = decodeJwt(Cookies.get('token'));
    if (data) {
      if (data?.user_id !== userId) {
        console.log('out App');
        return 'outApp';
      } else {
        console.log('ulogovan kroz app');
        return 'app';
      }
    }
  }
  //from web check
  //console.log('Cookies.get(sessionToken)',Cookies.get('sessionToken'))
  if (Cookies.get('sessionToken')) {
    const token: string | undefined = Cookies.get('sessionToken');
    if (token) {
      const data = decodeJwt(token);
      if (data?.user_id !== userId) {
        return 'outWeb';
      } else {
        console.log('ulogovan kroz web');
        return 'web';
      }
    }
  }
}

export async function sendResult() {
  const parts = window.location.pathname.split('/');
  const match_id = parts[parts.length - 1];
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_WEB + 'fetch_roulette_match_result',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          match_id: match_id, //match_id
        }),
      }
    );
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
  } catch (error) {
    console.error('Fetch error', error);
  }
}
