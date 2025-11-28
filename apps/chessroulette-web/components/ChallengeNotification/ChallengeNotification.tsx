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
  initiator_name_first?:string;
  initiator_name_last?:string;
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
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1920);

  useEffect(() => {
    console.log('🎯 ChallengeNotification render - challenge:', challenge);
    
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [challenge]);

  if (!challenge) {
    console.log('🎯 ChallengeNotification: No challenge, returning null');
    return null;
  }

  if (!challenge.ch_uuid) {
    console.log('🎯 ChallengeNotification: No ch_uuid, returning null');
    return null;
  }

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
    return challenge.time_class || '';
  };

  // Funkcija za formatiranje imena
  const getChallengerName = () => {
    if (challenge.initiator_name_first && challenge.initiator_name_last) {
      return `${challenge.initiator_name_first} ${challenge.initiator_name_last}`;
    }
    if (challenge.initiator_name_first) {
      return challenge.initiator_name_first;
    }
    if (challenge.initiator_name_last) {
      return challenge.initiator_name_last;
    }
    return challenge.challenger_name || 'Someone';
  };

  // Proveri da li je friendly (amount je 0 ili nema amount)
  const isFriendly = !challenge.amount || 
    challenge.amount === '0' || 
    challenge.amount === '€0' || 
    challenge.amount === '$0' ||
    (typeof challenge.amount === 'string' && parseFloat(challenge.amount.replace(/[€$]/g, '')) < 1);

  // Formatuj amount za prikaz
  const formatAmount = () => {
    if (isFriendly) return null;
    // Ako je amount broj, konvertuj u format sa €
    if (typeof challenge.amount === 'string') {
      const numAmount = parseFloat(challenge.amount.replace(/[€$]/g, ''));
      if (!isNaN(numAmount)) {
        // Ako je veći od 0, prikaži sa €
        return `€${Math.round((numAmount * 0.9090909) * 100) / 100}`;
      }
    }
    return challenge.amount;
  };

  // Responsive stilovi za dugmad
  const isMobile = windowWidth <= 640;
  const buttonWidth = isMobile ? '100px' : '130px';
  const buttonHeight = isMobile ? '30px' : '34px';
  const buttonFontSize = isMobile ? '14px' : '16px';
  const buttonMargin = isMobile ? '5px' : '10px';
  const bannerWidth = isMobile ? '90vw' : '50vw';
  const bannerLeft = isMobile ? '5vw' : '25vw';
  const bannerTop = isMobile ? '50px' : '20px';
  const bannerPadding = isMobile ? '10px 12px' : '12px 15px';
  const textFontSize = isMobile ? '14px' : '15px';

  return (
    <>
      <style jsx>{`
        @media screen and (max-width: 640px) {
          #checkClickChallenge3 {
            width: 90vw !important;
            left: 5vw !important;
            top: 50px !important;
            padding: 10px 12px !important;
          }
          #checkClickChallenge3 .banner-text {
            font-size: 14px !important;
          }
          #checkClickChallenge3 .btn_roullete {
            width: 100px !important;
            height: 30px !important;
            font-size: 14px !important;
            margin-left: 5px !important;
            margin-right: 5px !important;
          }
        }
      `}</style>
      <div 
        id="checkClickChallenge3" 
        className="initiate-banner banner-position"
        style={{
          position: 'absolute',
          width: bannerWidth,
          left: bannerLeft,
          top: bannerTop,
          backgroundColor: '#01210b',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '20px',
          padding: bannerPadding,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 100,
          transition: '0.3s',
          marginBottom: '2.813rem',
        }}
      >
        <div className="banner-text" style={{
          color: 'white',
          fontSize: textFontSize,
          textAlign: 'center',
          marginBottom: '14px',
        }}>
          <span 
            className="color-blue hover" 
            style={{
              cursor: 'pointer',
              color: 'inherit',
            }}
          >
            {getChallengerName()}
          </span>
          {' '}challenged you to a{' '}
          <span>{formatTimeControl()},</span>
          {' '}
          {isFriendly ? (
            <span>friendly </span>
          ) : null}
          match
          {!isFriendly && formatAmount() && (
            <>
              {' '}for {formatAmount()}.
            </>
          )}
        </div>
        <div className="flex-center" style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap',
        }}>
          <div 
            className="btn_roullete"
            onClick={handleAccept}
            style={{
              color: '#202122',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #07da63',
              borderRadius: '6px',
              marginTop: '14px',
              fontSize: buttonFontSize,
              cursor: 'pointer',
              width: buttonWidth,
              height: buttonHeight,
              marginLeft: buttonMargin,
              marginRight: buttonMargin,
              backgroundColor: '#07da63',
              transition: '0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.7';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.color = '#202122';
            }}
          >
            <b>Play</b>
          </div>
          <div 
            className="btn_roullete btn_roullete_cancel"
            onClick={onDecline}
            style={{
              color: '#ceceda',
              backgroundColor: 'transparent',
              border: '1px solid transparent',
              borderRadius: '6px',
              marginTop: '14px',
              fontSize: buttonFontSize,
              cursor: 'pointer',
              width: buttonWidth,
              height: buttonHeight,
              marginLeft: buttonMargin,
              marginRight: buttonMargin,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: '0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            Ignore
          </div>
        </div>
      </div>
    </>
  );
};