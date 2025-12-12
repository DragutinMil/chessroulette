import Cookies from 'js-cookie';

export async function checkMoney() {
  const token = Cookies.get('sessionToken');
  
    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_API_WEB + 'wallet_sum',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('Fetch error', error);
    }
  }

export async function challengeAccept(e:string) {
const token = Cookies.get('sessionToken');
  try {
    const response = await fetch(
     process.env.NEXT_PUBLIC_API_WEB +`challenge_accept/${e}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
       
      }
    );
   
 
    const data = await response.json();
  
    return data
  } catch (error) {
    console.error('Fetch error', error);
  }
}
