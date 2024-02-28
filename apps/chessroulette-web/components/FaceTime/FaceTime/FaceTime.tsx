import React, { ReactNode, useState } from 'react';
import { VideoBox, VideoBoxProps } from '../../VideoBox';
import { PeerStreamingConfig } from 'apps/chessroulette-web/providers/PeerToPeerProvider/type';
import { AspectRatio, AspectRatioProps } from '../../AspectRatio';
import { Text } from '../../Text';
import { noop } from '@xmatter/util-kit';

export type FaceTimeProps = Omit<VideoBoxProps, 'stream'> & {
  streamConfig: PeerStreamingConfig;
  streamingOffFallback?: ReactNode;
  loadingFallback?: ReactNode;

  aspectRatio?: AspectRatioProps['aspectRatio'];
  containerClassName?: string;
  label?: string;
  labelClassName?: string;
  labelPosition?: 'bottom-left' | 'bottom-center' | 'bottom-right';

  headerOverlay?: ReactNode;
  mainOverlay?: ReactNode;
  footerOverlay?: ReactNode;

  onReady?: () => void;
};

export const FaceTime: React.FC<FaceTimeProps> = ({
  streamConfig,
  className,
  streamingOffFallback,
  containerClassName,
  label,
  footerOverlay,
  mainOverlay,
  headerOverlay,
  labelClassName = null,
  labelPosition = 'bottom-center',
  aspectRatio = {
    width: 4,
    height: 3,
  },
  loadingFallback = null,
  onReady = noop,
  ...avStreamProps
}) => {
  // const cls = useStyles();
  const [loadingVideo, setLoadingVideo] = useState(true);

  // console.log('avStreamProps', avStreamProps);

  const loader = (
    <div className="absolute flex right-0 top-0 bottom-0 left-0 z-50">
      {
        loadingFallback || null
        // <div className='flex-1 flex text-center'>Loading...</div>
        // <div className={cls.loader}>
        //   {/* <Loader type="line-scale-pulse-out" active innerClassName={cls.loader} /> */}
        // </div>
      }
    </div>
  );

  return (
    <div className={`relative ${containerClassName}`}>
      <AspectRatio aspectRatio={aspectRatio}>
        {streamConfig.on ? (
          <>
            <VideoBox
              stream={streamConfig.stream}
              autoPlay
              className={`w-full h-full object-cover ${className}`}
              {...avStreamProps}
              onCanPlay={() => {
                onReady();
                setLoadingVideo(false);
              }}
            />
            {loadingVideo && loader}
          </>
        ) : (
          streamingOffFallback || loader
        )}

        <div
          // className={cls.overlayedContainer}
          className="absolute inset-0 flex flex-col"
        >
          {/* {headerOverlay && <div className={cls.headerWrapper}>{headerOverlay}</div>} */}
          <div
            // className={cls.mainWrapper}
            className="flex-1"
          >
            {mainOverlay}
          </div>
          <div
          // className={cls.footerWrapper}
          >
            {label && (
              <div
                // className={cx(
                //   cls.labelWrapper,
                //   labelPosition === 'bottom-left' && cls.labelWrapperLeft,
                //   labelPosition === 'bottom-right' && cls.labelWrapperRight
                // )}
                className="relative center z-50"
              >
                <Text
                  // className={cx(cls.label, labelClassName)}
                  //     color: colors.universal.white,
                  //     ...fonts.subtitle1,

                  //     paddingLeft: '12px',
                  //     paddingRight: '12px',
                  //     paddingBottom: '6px',

                  //     ...onlyMobile({
                  //       paddingLeft: '8px',
                  //       paddingBottom: '2px',
                  //     }),
                  className={`px-1 pb-2 ${labelClassName}`}
                >
                  {label}
                </Text>
              </div>
            )}
            {footerOverlay}
          </div>
        </div>
      </AspectRatio>
    </div>
  );
};
