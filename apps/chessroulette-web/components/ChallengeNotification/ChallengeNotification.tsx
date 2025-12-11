import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from '@app/components/Dialog';
import { ButtonGreen } from '@app/components/Button/ButtonGreen';
import Cookies from 'js-cookie';
import socketUtil from '@app/socketUtil';
import { useRouter } from 'next/navigation';

type ChallengeData = {
  ch_uuid: string;
  challenger_name?: string;
  challenger_id?: string;
  time_class?: string;
  time_control?: string; // Format kao "3+2"
  ch_amount?: string;
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
  const router = useRouter();
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1920);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [hasInsufficientFunds, setHasInsufficientFunds] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [targetUrl, setTargetUrl] = useState<string | null>(null);

  useEffect(() => {    
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [challenge]);

  // Auto-decline nakon 10 sekundi i slušanje socket event-a za revocation
  useEffect(() => {
    if (!challenge || !challenge.ch_uuid) {
      return;
    }

    setHasInsufficientFunds(false);
    setIsChecking(true);
    setTargetUrl(null);

    // Funkcija za proveru sredstava - pokušaj da prihvatiš challenge (bez redirect-a)
    const checkFunds = async () => {
      let token = Cookies.get('token') || Cookies.get('sessionToken');
      
      if (!token && typeof window !== 'undefined') {
        token = localStorage.getItem('token') || localStorage.getItem('sessionToken');
      }
      
      if (!token) {
        console.error('❌ No token found!');
        setIsChecking(false);
        return;
      }

      try {
        const apiBase = process.env.NEXT_PUBLIC_API_WEB || 'https://api.outpostchess.com/';
        const cleanApiBase = apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase;
        
        const walletEndpoint = cleanApiBase.includes('/api/v2/') 
          ? `${cleanApiBase}/wallet_sum`
          : cleanApiBase.includes('/api/')
          ? `${cleanApiBase}/wallet_sum`
          : `${cleanApiBase}/api/v2/wallet_sum`;
                
        const walletResponse = await fetch(walletEndpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!walletResponse.ok) {
          console.error('❌ Failed to fetch wallet balance:', walletResponse.status);
          setIsChecking(false);
          // U slučaju greške, prikaži "Play" dugme pa neka korisnik proba
          setHasInsufficientFunds(false);
          return;
        }

        const walletData = await walletResponse.json();
        const walletBalance = parseFloat(walletData.total || '0');
        
        // Parsiraj ch_amount iz challenge-a
        let challengeAmount = 0;
        if (challenge.ch_amount) {
          if (typeof challenge.ch_amount === 'string') {
            // Ukloni €, $ i ostale simbole
            challengeAmount = parseFloat(challenge.ch_amount);
          } else if (typeof challenge.ch_amount === 'number') {
            challengeAmount = challenge.ch_amount;
          }
        }
        challengeAmount = Number(challengeAmount.toFixed(2));
        // Proveri da li je friendly challenge (amount je 0 ili nema amount)
        const isFriendlyChallenge = !challenge.ch_amount || 
          challenge.ch_amount === '0' || 
          challenge.ch_amount === '€0' || 
          challenge.ch_amount === '$0' ||
          challengeAmount < 1;

        // Ako je friendly challenge, uvek prikaži "Play" dugme
        if (isFriendlyChallenge) {
          setHasInsufficientFunds(false);
          setIsChecking(false);
          return;
        }

        // Poredi wallet balance sa challenge amount-om
        if (walletBalance >= challengeAmount) {
          setHasInsufficientFunds(false);
          
          // Takođe pozovi challenge_accept da dobiješ target_url za kasnije
          const acceptEndpoint = cleanApiBase.includes('/api/v2/') 
            ? `${cleanApiBase}/challenge_accept/${challenge.ch_uuid}`
            : cleanApiBase.includes('/api/')
            ? `${cleanApiBase}/challenge_accept/${challenge.ch_uuid}`
            : `${cleanApiBase}/api/v2/challenge_accept/${challenge.ch_uuid}`;
          
          try {
            const acceptResponse = await fetch(acceptEndpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({}),
            });

            if (acceptResponse.ok) {
              const acceptData = await acceptResponse.json();
              setTargetUrl(acceptData.target_url || null);
            }
          } catch (error) {
            console.error('Error fetching target_url (non-critical):', error);
          }
        } else {
          setHasInsufficientFunds(true);
        }
      } catch (error) {
        console.error('Error checking funds:', error);
        // U slučaju greške, prikaži "Play" dugme pa neka korisnik proba
        setHasInsufficientFunds(false);
      } finally {
        setIsChecking(false);
      }
    };

    // Proveri sredstva odmah
    checkFunds();

    // Automatski decline nakon 10 sekundi
    timeoutRef.current = setTimeout(() => {
      onDecline();
    }, 10000);

    // Handler za socket event-e koji mogu da označe challenge kao revoke-ovan
    const handleSocketNotification = (data: any) => {
      // Proveri da li je ovo revocation event za naš challenge
      const isOurChallenge = 
        data.ch_uuid === challenge.ch_uuid ||
        data.challenge_uuid === challenge.ch_uuid ||
        data.data?.ch_uuid === challenge.ch_uuid;

      if (isOurChallenge) {
        // Proveri da li je challenge revoke-ovan, otkazan ili istekao
        if (
          data.n_type === 'challenge_revoked' ||
          data.n_type === 'challenge_cancelled' ||
          data.n_type === 'challenge_expired' ||
          data.status === 'revoked' ||
          data.status === 'cancelled' ||
          data.status === 'expired'
        ) {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          onDecline();
        }
      }
    };

    socketUtil.subscribe('tb_notification', handleSocketNotification);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      socketUtil.unsubscribe('tb_notification', handleSocketNotification);
    };
  }, [challenge, onDecline]);

  if (!challenge) {
    return null;
  }

  if (!challenge.ch_uuid) {
    return null;
  }

  const handleGoToWallet = () => {
    router.push('https://app.outpostchess.com/wallet');
    onDecline(); // Zatvori notifikaciju nakon preusmeravanja
  };

  const handleAccept = async () => {
    // Ako već imamo target_url iz provere sredstava, koristi ga
    if (targetUrl) {
      window.open(targetUrl, '_self');
      onAccept(challenge.ch_uuid);
      return;
    }

    // Ako nemamo target_url, pokušaj ponovo (fallback)
    let token = Cookies.get('token') || Cookies.get('sessionToken');
    
    if (!token && typeof window !== 'undefined') {
      token = localStorage.getItem('token') || localStorage.getItem('sessionToken');
    }
    
    if (!token) {
      return;
    }
    
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_WEB || 'https://api.outpostchess.com/';
      const cleanApiBase = apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase;
      
      const endpoint = cleanApiBase.includes('/api/v2/') 
        ? `${cleanApiBase}/challenge_accept/${challenge.ch_uuid}`
        : cleanApiBase.includes('/api/')
        ? `${cleanApiBase}/challenge_accept/${challenge.ch_uuid}`
        : `${cleanApiBase}/api/v2/challenge_accept/${challenge.ch_uuid}`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

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
  const isFriendly = !challenge.ch_amount || 
    challenge.ch_amount === '0' || 
    challenge.ch_amount === '€0' || 
    challenge.ch_amount === '$0' ||
    (typeof challenge.ch_amount === 'string' && parseFloat(challenge.ch_amount.replace(/[€$]/g, '')) < 1);

  // Formatuj amount za prikaz
  const formatAmount = () => {
    let challengeAmount = 0;
    if (challenge.ch_amount) {
      if (typeof challenge.ch_amount === 'string') {
        // Ukloni €, $ i ostale simbole
        challengeAmount = parseFloat(challenge.ch_amount);
      } else if (typeof challenge.ch_amount === 'number') {
        challengeAmount = challenge.ch_amount;
      }
    }
    challengeAmount = Number(challengeAmount.toFixed(2));
    return challengeAmount;
  }

  // Responsive stilovi za dugmad
  const isMobile = windowWidth <= 640;
  const buttonWidth = isMobile ? '100px' : '130px';
  const buttonHeight = isMobile ? '30px' : '34px';
  const buttonFontSize = isMobile ? '14px' : '16px';
  const buttonMargin = isMobile ? '5px' : '10px';
  const bannerWidth = isMobile ? '90vw' : '50vw';
  const bannerLeft = isMobile ? '50%' : '25vw'; 
  const bannerTop = isMobile ? '50px' : '20px';
  const bannerPadding = isMobile ? '10px 12px' : '12px 15px';
  const textFontSize = isMobile ? '14px' : '15px';

  return (
    <>
      <style jsx>{`
        @media screen and (max-width: 640px) {
          #checkClickChallenge3 {
            width: 90vw !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
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
        <div
          className="banner-text"
          style={{
            color: 'white',
            fontSize: textFontSize,
            textAlign: 'center',
            marginBottom: '14px',
          }}
        >
          <span
            className="color-blue hover"
            style={{
              cursor: 'pointer',
              color: 'inherit',
            }}
          >
            {getChallengerName()}
          </span>{' '}
          challenged you to a <span>{formatTimeControl()},</span>{' '}
          {isFriendly ? <span>friendly </span> : null}
          match
          {!isFriendly && formatAmount() && (
            <>
              {' '}for {formatAmount()} {'€'}.
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
          {isChecking ? (
            // Prikaži "Checking..." dok se proveravaju sredstva
            <div 
              className="btn_roullete"
              style={{
                color: '#202122',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #07da63',
                borderRadius: '6px',
                marginTop: '14px',
                fontSize: buttonFontSize,
                cursor: 'wait',
                width: buttonWidth,
                height: buttonHeight,
                marginLeft: buttonMargin,
                marginRight: buttonMargin,
                backgroundColor: '#07da63',
                transition: '0.3s',
                opacity: 0.7,
              }}
            >
              <b>Checking...</b>
            </div>
          ) : hasInsufficientFunds ? (
            // Prikaži "Go to wallet" dugme ako nema dovoljno sredstava
            <div 
              className="btn_roullete"
              onClick={handleGoToWallet}
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
              <b>Go to wallet</b>
            </div>
          ) : (
            // Prikaži "Play" dugme ako ima sredstva
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
          )}
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
