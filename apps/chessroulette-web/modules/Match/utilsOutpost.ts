import Cookies from 'js-cookie';
import { decodeJwt } from 'jose';

export function checkUser() {
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
  if (Cookies.get('token')) {
    const appToken = Cookies.get('token');
    if (appToken) {
      const data = safeDecode(appToken);
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
  }
  //from web check
  else if (Cookies.get('sessionToken')) {
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
  // Pokušaj da uzmeš token iz cookie (mobile app)
  let token = Cookies.get('token');
  
  // Ako nema token cookie, pokušaj sa sessionToken (web)
  if (!token) {
    token = Cookies.get('sessionToken');
  }
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  console.log('🔐 Sending rematch request with token:', token ? 'present' : 'missing');
  console.log('📋 Match ID:', matchId);
  
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
    const errorText = await response.text();
    console.error('❌ Rematch request failed:', response.status, errorText);
    throw new Error(`Error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('✅ Rematch response:', data);
  console.log('🏠 Inside room - rematch accepted');

  return {
    target_url: data.target_url,
    initiator_url: data.initiator_url,
  };
}

export async function newRematchRequestInitiate(matchId: string) {
  let token = Cookies.get('token');
  
  if (!token) {
    token = Cookies.get('sessionToken');
  }
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  if (!matchId || matchId.trim().length === 0) {
    throw new Error('Match ID is required');
  }

  const trimmedMatchId = matchId.trim();
  
  console.log('🔐 ===== REMATCH INITIATE REQUEST DEBUG =====');
  console.log('📋 Match ID:', trimmedMatchId);
  console.log('📋 Match ID type:', typeof trimmedMatchId);
  console.log('📋 Match ID length:', trimmedMatchId.length);
  console.log('🔑 Token present:', !!token);
  
  // Dodaj match_id kao query parametar u URL
  const baseUrl = process.env.NEXT_PUBLIC_API_WEB;
  const endpoint = 'challenge_inivite_rematch';
  const fullUrl = `${baseUrl}${endpoint}?match_id=${encodeURIComponent(trimmedMatchId)}`;
  
  console.log('🔗 Base URL:', baseUrl);
  console.log('🔗 Endpoint:', endpoint);
  console.log('🔗 Full URL:', fullUrl);
  console.log('📦 Query params:', `match_id=${trimmedMatchId}`);

  const response = await fetch(
    fullUrl,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );

  console.log('📡 Response status:', response.status);
  console.log('📡 Response ok:', response.ok);
  
  // Proveri response headers
  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });
  console.log('📡 Response headers:', responseHeaders);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ ===== ERROR RESPONSE =====');
    console.error('❌ Status:', response.status);
    console.error('❌ Status text:', response.statusText);
    console.error('❌ Error body:', errorText);
    
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
      throw new Error(`Forbidden: ${errorText || 'Token may be invalid or endpoint does not exist'}`);
    }
    
    throw new Error(`Error: ${response.status} - ${errorText}`);
  }

  // Proveri da li response ima body
  const text = await response.text();
  
  console.log('✅ ===== SUCCESS RESPONSE =====');
  console.log('✅ Response text length:', text.length);
  console.log('✅ Response text:', text);
  
  // Backend samo šalje socket notifikaciju i ne vraća podatke
  if (!text || text.trim().length === 0) {
    console.log('✅ Rematch initiate successful - notification sent to opponent');
    console.log('📤 Opponent will receive socket notification: challenge_rematch_initiate');
    
    return {
      target_url: undefined,
      initiator_url: undefined,
    };
  }

  // Ako ima body, pokušaj da parsiraš JSON
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      const data = JSON.parse(text);
      console.log('✅ Parsed response:', data);
      
      return {
        target_url: data.target_url,
        initiator_url: data.initiator_url,
      };
    } catch (parseError) {
      console.error('❌ Failed to parse JSON:', parseError, 'Response text:', text);
      throw new Error('Failed to parse response as JSON');
    }
  } else {
    console.log('⚠️ Response is not JSON but request was successful:', text);
    console.log('✅ Rematch initiate successful - notification sent');
    
    return {
      target_url: undefined,
      initiator_url: undefined,
    };
  }
}