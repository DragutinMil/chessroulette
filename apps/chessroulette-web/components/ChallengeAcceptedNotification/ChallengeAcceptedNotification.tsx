import React, { useState, useEffect } from 'react';

type ChallengeAcceptedData = {
  ch_uuid?: string;
  url?: string;
  from_user_object?: {
    name_first?: string;
    name_last?: string;
  };
};

type Props = {
  challenge: ChallengeAcceptedData | null;
  onAccept: () => void;
  onDecline: () => void;
};

export const ChallengeAcceptedNotification: React.FC<Props> = ({
  challenge,
  onAccept,
  onDecline,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!challenge) {
      setVisible(false);
      return;
    }
    setVisible(false);
    setTimeout(() => setVisible(true), 30);
  }, [challenge]);

  if (!challenge || !challenge.from_user_object) {
    return null;
  }

  const getPlayerName = () => {
    const firstName = challenge.from_user_object?.name_first || '';
    const lastName = challenge.from_user_object?.name_last || '';
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    return firstName || lastName || 'Someone';
  };

  const handlePlay = () => {
    if (challenge.url) {
      window.open(challenge.url, '_self');
    }
    onAccept();
  };

  // Responsive stilovi
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 640;
  const buttonWidth = isMobile ? '100px' : '130px';
  const buttonHeight = isMobile ? '30px' : '34px';
  const buttonFontSize = isMobile ? '14px' : '16px';
  const buttonMargin = isMobile ? '5px' : '10px';
  const textFontSize = isMobile ? '16px' : '16px';

  return (
    <>
      <style jsx>{`
        .question-roullette-base {
          transform: translateY(-100px);
          opacity: 0;
          transition: all 0.5s ease;
        }
        .question-roullette-visible {
          transform: translateY(0px);
          opacity: 1;
          transition: all 0.5s ease;
        }
        @media screen and (max-width: 640px) {
          #checkClickChallenge2 {
            width: 80% !important;
            left: 10% !important;
            font-size: 16px !important;
          }
        }
      `}</style>
      <div
        id="checkClickChallenge2"
        className={`question-roullette-base ${
          visible ? 'question-roullette-visible' : ''
        }`}
        style={{
          width: '390px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'center',
          minHeight: '130px',
          left: 'calc(50% - 195px)',
          paddingTop: '50px',
          boxShadow: '0px 0px 10px 0px #07da6380',
          zIndex: 100,
          position: 'fixed',
          top: '40%',
          padding: '24px',
          background: '#01210b',
          color: '#ceceda',
          borderRadius: '8px',
          fontSize: textFontSize,
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <div style={{ marginBottom: '14px' }}>
          {getPlayerName()} is in the Playing room.
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
          <div
            className="btn_roullete"
            onClick={handlePlay}
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
          >
            Ignore
          </div>
        </div>
      </div>
    </>
  );
};
