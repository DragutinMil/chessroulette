'use client';

import { useSearchParams } from 'next/navigation';




export const useToken = () => {
  // TODO: This is just temporary as the user ids are passed in the url
  const params = useSearchParams();

  // const foundNeededTheme =
 
  const tokenParam = params.get('sessionToken') || '';
  const token = tokenParam
  
  


  // TODO: Validate colors

  return {
    token
  };
};

