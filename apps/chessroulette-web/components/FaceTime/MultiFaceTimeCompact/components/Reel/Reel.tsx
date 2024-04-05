import React from 'react';
import { FaceTime } from '../../../FaceTime';
import { PeerUserId, StreamingPeer } from 'apps/chessroulette-web/providers/PeerToPeerProvider/type';
import { MyFaceTime } from '../../../MyFaceTime';

type Props = {
  streamingPeers: StreamingPeer[];
  onClick: (userId: PeerUserId) => void;

  containerClassName?: string;
  itemClassName?: string;
};

const TRANSITION_TIME = 100;

export const Reel: React.FC<Props> = (props) => {
  // const cls = useStyles();

  return (
    <div
      // className={cx(cls.container, props.containerClassName)}
      className={props.containerClassName}
    >
      {props.streamingPeers.map((peer, i) => {
        return (
          // <SwitchTransition mode="out-in" key={i}>
          //   <CSSTransition
          //     key={peer.user.id}
          //     timeout={TRANSITION_TIME}
          //     classNames={{
          //       enter: cls.itemEnter,
          //       enterActive: cls.itemEnterActive,
          //       enterDone: cls.itemEnterDone,
          //       exit: cls.itemExit,
          //     }}
          //   >
          <div
            key={peer.userId}
            className="overflow-hidden relative z-40 mb-2"
            onClick={() => props.onClick(peer.userId)}
          >
            <FaceTime
              streamConfig={peer.connection.channels.streaming}
              // className={cls.smallFacetime}
              className="absolute inset-0 z-50 border border-white"
              aspectRatio={4 / 3}
              // label={getUserDisplayName(peer.user)}
              // label={peer.userId} //TODO: This was taken out for now, as it shows the randomly generate id. Apirl 5th 2024
              // label={'Fix: User Name'}
              // labelClassName={cls.smallFacetimeLabel}
            />
            {/* <div className={cls.smallFacetimeBorder} /> */}
          </div>
          //   {/* </CSSTransition>
          // </SwitchTransition> */}
        );
      })}
      <div
        // className={cx(cls.smallFacetimeWrapper, props.itemClassName)}
        className={`overflow-hidden relative z-40 ${props.itemClassName}`}
      >
        <MyFaceTime
          // className={cls.smallFacetime}
          className="relative z-30 border border-white"
          aspectRatio={{ width: 4, height: 3 }}
        />
        {/* <div className={cls.smallFacetimeBorder} /> */}
      </div>
    </div>
  );
};

// const useStyles = createUseStyles({
//   container: {},
//   faceTimeAsButton: {
//     cursor: 'pointer',
//   },
//   smallFacetimeWrapper: {
//     marginTop: '8%',
//     ...softBorderRadius,
//     overflow: 'hidden',
//     position: 'relative',
//     zIndex: 9,
//   },
//   smallFacetime: {
//     position: 'relative',
//     zIndex: 8,
//   },
//   smallFacetimeBorder: {
//     position: 'absolute',
//     top: 0,
//     bottom: 0,
//     left: 0,
//     right: 0,
//     zIndex: 10,
//     border: '1px solid white',
//     ...softBorderRadius,
//   },
//   smallFacetimeLabel: {
//     ...fonts.small3,
//   },
//   itemEnter: {
//     transform: 'scale(.5)',
//   },
//   itemEnterActive: {
//     transform: 'scale(1)',
//   },
//   itemEnterDone: {},
//   itemExit: {
//     transform: 'scale(.5)',
//     opacity: 0,
//     transitionDuration: `${TRANSITION_TIME}ms`,
//   },
// });
