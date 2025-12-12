import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from '@app/components/Dialog';
import { ButtonGreen } from '@app/components/Button/ButtonGreen';
import Cookies from 'js-cookie';
import socketUtil from '@app/socketUtil';
import { useRouter } from 'next/navigation';

import { challengeAccept, checkMoney } from './util';


type ChallengeData = {
  ch_uuid: string;
  challenger_name?: string;
  challenger_id?: string;
  time_class?: string;

  time_control?: string;
  ch_amount?: string;
  initiator_name_first?: string;
  initiator_name_last?: string;

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

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [hasInsufficientFunds, setHasInsufficientFunds] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [targetUrl, setTargetUrl] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
useEffect(() => {
    if (!challenge || !challenge.ch_uuid) {
      return;
    }
    setVisible(false);
    setTimeout(() => setVisible(true), 30);
    setHasInsufficientFunds(false);
    setIsChecking(true);
    setTargetUrl(null);

    // Funkcija za proveru sredstava - pokušaj da prihvatiš challenge (bez redirect-a)
    const checkChallenge = async () => {
      let token = Cookies.get('token') || Cookies.get('sessionToken');

      if (!token && typeof window !== 'undefined') {
        token =
          localStorage.getItem('token') || localStorage.getItem('sessionToken');
      }

      if (!token) {
        setIsChecking(false);
        return;
      }

      try {
        let challengeAmount = 0;
        let walletBalance = 0;
        if (
          challenge.ch_amount !== undefined &&
          challenge.ch_amount !== '0' &&
          challenge.ch_amount !== '€0' &&
          challenge.ch_amount !== '' &&
          challenge.ch_amount !== '$0'
        ) {
          const walletResponse = await checkMoney();
          console.log(walletResponse);

          const walletData = await walletResponse.total;
          walletBalance = parseFloat(walletData || '0');

          // Parsiraj ch_amount iz challenge-a

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
        }
        const isFriendlyChallenge =
          !challenge.ch_amount ||
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
        console.log(
          'walletBalance & challengeAmount',
          walletBalance,
          challengeAmount
        );
        // Poredi wallet balance sa challenge amount-om
        if (walletBalance >= challengeAmount) {
          console.log('ide prihvatanje');
          setHasInsufficientFunds(false);
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
    checkChallenge();

    // Automatski decline nakon 10 sekundi
    // timeoutRef.current = setTimeout(() => {
    //   onDecline();
    // }, 10000);

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

    window.location.href = 'https://app.outpostchess.com/wallet';
    onDecline();
  };

  const handleAccept = async () => {
    // Ako već imamo target_url iz provere sredstava, koristi ga
    if (targetUrl) {
      window.open(targetUrl, '_self');
      onAccept(challenge.ch_uuid);
      return;
    }
    const response = await challengeAccept(challenge.ch_uuid);


    const data = await response;
    if (data.target_url) {
      window.open(data.target_url, '_self');
    }
    onAccept(challenge.ch_uuid);
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

  const isFriendly =
    !challenge.ch_amount ||
    challenge.ch_amount === '0' ||
    challenge.ch_amount === '€0' ||
    challenge.ch_amount === '$0' ||
    (typeof challenge.ch_amount === 'string' &&
      parseFloat(challenge.ch_amount.replace(/[€$]/g, '')) < 1);


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

    challengeAmount = Number((challengeAmount / 1.1).toFixed(2));
    return challengeAmount;
  };


  // Responsive stilovi za dugmad
  const isMobile = window.innerWidth <= 640;
  const buttonWidth = isMobile ? '100px' : '130px';
  const buttonHeight = isMobile ? '30px' : '34px';
  const buttonFontSize = isMobile ? '14px' : '16px';
  const buttonMargin = isMobile ? '5px' : '10px';

  const bannerWidth = isMobile ? '90vw' : '500px';
  const bannerLeft = isMobile ? '50%' : '25vw';

  const bannerTop = isMobile ? '50px' : '20px';
  const bannerPadding = isMobile ? '10px 12px' : '20px 15px';
  const textFontSize = isMobile ? '14px' : '15px';

  return (
    <>
      <style jsx>{`
        .banner-base {
          transform: translateY(-100px);
          opacity: 0.3;
          transition: all 0.5s ease;
        }
        .banner-visible {
          transform: translateY(0px);
          opacity: 1;
          transition: all 0.5s ease;
        }
        @media screen and (max-width: 640px) {
          #checkClickChallenge3 {
            width: 90vw !important;
            left: 50% !important;

            margin-left: -45vw !important;

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
        className={`initiate-banner banner-position banner-base ${
          visible ? 'banner-visible' : ''
        }`}
        style={{
          boxShadow: '0px 0px 10px 0px #07DA6380',
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

              {' '}
              for {formatAmount()} {'€'}.
            </>
          )}
        </div>
        <div
          className="flex-center"
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
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
              className="btn_roullete hover:opacity-70"

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

            >
              <b>Go to wallet</b>
            </div>
          ) : (
            // Prikaži "Play" dugme ako ima sredstva

            <div
              className="btn_roullete hover:opacity-70"

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

            >
              <b>Play</b>
            </div>
          )}

          <div
            className="btn_roullete btn_roullete_cancel hover:opacity-70"

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
          >
            Ignore
          </div>
        </div>
      </div>
    </>
  );
};
