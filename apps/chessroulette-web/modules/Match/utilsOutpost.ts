import Cookies from 'js-cookie';
import { decodeJwt } from 'jose';

export async function checkUser(userId: string | undefined) {
  console.log('userId', userId);
  if (!userId) {
    return;
  }

  function safeDecode(standardToken: string) {
    // if (!standardToken) return null;
    try {
      return decodeJwt(standardToken);
    } catch (err) {
      console.warn('Invalid JWT:', err);
      return null;
    }
  }
  //from web check
  if (Cookies.get('sessionToken')) {
    const webToken = Cookies.get('sessionToken');
    if (webToken) {
      const data = safeDecode(webToken);
      if (data) {
        if (data?.user_id !== userId) {
          console.log('outWeb');
          return false;
        } else {
          return true;
        }
      } else {
        return false;
      }
    }
  } else {
    return false;
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

export async function newRematchRequestInitiate(matchId: string) {
  const token = Cookies.get('sessionToken');

  if (!token) {
    throw new Error('No authentication token found');
  }

  const trimmedMatchId = matchId.trim();

  // Dodaj match_id kao query parametar u URL
  const baseUrl = process.env.NEXT_PUBLIC_API_WEB;
  const endpoint = 'challenge_inivite_rematch';
  const fullUrl = `${baseUrl}${endpoint}?match_id=${encodeURIComponent(
    trimmedMatchId
  )}`;

  const response = await fetch(fullUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  // Proveri response headers
  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });

  if (!response.ok) {
    const errorText = await response.text();

    // Pokušaj da parsiraš error response kao JSON
    try {
      const errorJson = JSON.parse(errorText);
      console.error('❌ Parsed error:', errorJson);
      if (errorJson.message) {
        console.error('❌ Error message:', errorJson.message);
      }
      if (errorJson.errorCode) {
        console.error('❌ Error code:', errorJson.errorCode);
      }
    } catch (e) {
      console.error('❌ Could not parse error as JSON');
    }

    console.error('❌ Sent match_id:', trimmedMatchId);
    console.error('❌ Sent URL:', fullUrl);
    console.error('❌ ===== END ERROR =====');

    if (response.status === 403) {
      throw new Error(
        `Forbidden: ${
          errorText || 'Token may be invalid or endpoint does not exist'
        }`
      );
    }

    throw new Error(`Error: ${response.status} - ${errorText}`);
  }

  // Proveri da li response ima body
  const text = await response.text();
}
