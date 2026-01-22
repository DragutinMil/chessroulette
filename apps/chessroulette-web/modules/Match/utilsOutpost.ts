import Cookies from 'js-cookie';
import { decodeJwt } from 'jose';

export async function  checkUser() {
  const url = new URL(window.location.href);
  const userId = url.searchParams.get('userId');

  function safeDecode(standardToken: string | undefined) {
    if (!standardToken) return null;
    try {
      return decodeJwt(standardToken);
    } catch (err) {
      console.warn('Invalid JWT:', err);
      return null;
    }
  }

  //from mobile app check
  // if (Cookies.get('token')) {
  //   const appToken = Cookies.get('token');
  //   if (appToken) {
  //     const data = safeDecode(appToken);
  //     if (data) {
       
  //       if (data?.user_id !== userId) {
  //         console.log('out App');
  //         return 'outApp';
  //       } else {
  //         console.log('ulogovan kroz app');
  //         return 'app';
  //       }
  //     }
  //   }
  // }
  //from web check
  if (Cookies.get('sessionToken')) {
    const webToken = Cookies.get('sessionToken');
    if (webToken) {
      const data = safeDecode(webToken);
      if (data) {
        if (data?.user_id !== userId) {
          console.log('outWeb');
          return 'outWeb';
        } else {
          //  console.log('throught web');
          return 'web';
        }
      }
    }
  } else {
    return null;
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
export async function newRematchRequest(matchId: string) {
  const token: string | undefined = Cookies.get('sessionToken');
  console.log('rer', token);
  const response = await fetch(
    process.env.NEXT_PUBLIC_API_WEB + 'challenge_rematch',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        match_id: matchId,
      }),
    }
  );
  if (!response.ok) {
    throw new Error(`Error: ${response.status}`);
  }
  const data = await response.json();

  return {
    target_url: data.target_url,
    initiator_url: data.initiator_url,
  };
}
