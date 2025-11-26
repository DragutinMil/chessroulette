import React, { useState, useEffect } from 'react';
import { Dialog } from '@app/components/Dialog';
import { ButtonGreen } from '@app/components/Button/ButtonGreen';
import Cookies from 'js-cookie';

type ChallengeData = {
  ch_uuid: string;
  challenger_name?: string;
  challenger_id?: string;
  time_class?: string;
  time_control?: string; // Format kao "3+2"
  amount?: string;
  // Dodajte ostala polja koja dolaze sa socket notifikacijom
};

type Props = {
  challenge: ChallengeData | null;
  onAccept: (challengeUuid: string) => void;
  onDecline: () => void;
};

export const ChallengeNotification: React.FC<Props> = ({
  challenge,
  onAccept,
  onDecline,
}) => {
  if (!challenge) return null;

  const handleAccept = async () => {
    const token = Cookies.get('token') || Cookies.get('sessionToken');
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_WEB || 'https://api.outpostchess.com/'}challenge_accept/${challenge.ch_uuid}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.target_url) {
          window.open(data.target_url, '_self');
        }
        onAccept(challenge.ch_uuid);
      }
    } catch (error) {
      console.error('Error accepting challenge:', error);
    }
  };

  // Formatuj time control (npr. "rapid" -> "3+2" ili koristi time_control ako postoji)
  const formatTimeControl = () => {
    if (challenge.time_control) {
      return challenge.time_control;
    }
    // Možete dodati mapiranje time_class -> time_control format
    // Za sada koristimo time_class ako nema time_control
    return challenge.time_class || '';
  };

  return (
    <div 
      id="checkClickChallenge3" 
      className="initiate-banner banner-position fixed top-0 left-0 right-0 z-50 bg-slate-800/95 backdrop-blur-sm border-b border-slate-700 shadow-lg"
      style={{
        padding: '12px 20px',
      }}
    >
      <div className="banner-text text-white text-center mb-3">
        <span className="color-blue hover:text-blue-400 cursor-pointer font-semibold">
          {challenge.challenger_name || 'Someone'}
        </span>
        {' '}challenged you to a{' '}
        <span>{formatTimeControl()}</span>
        {' '}match
        {challenge.amount && (
          <>
            {' '}<span>for {challenge.amount}.</span>
          </>
        )}
      </div>
      <div className="flex-center flex justify-center gap-3">
        <div 
          className="btn_roullete bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-2 rounded-lg cursor-pointer transition-colors"
          onClick={handleAccept}
        >
          <b>Play</b>
        </div>
        <div 
          className="btn_roullete btn_roullete_cancel bg-gray-600 hover:bg-gray-700 text-white font-bold px-6 py-2 rounded-lg cursor-pointer transition-colors"
          onClick={onDecline}
        >
          Ignore
        </div>
      </div>
    </div>
  );
};