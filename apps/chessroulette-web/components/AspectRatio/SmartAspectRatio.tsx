'use client';

import React, { useRef } from 'react';
import { AspectRatio, AspectRatioProps } from './AspectRatio';
import {
  ContainerWithDimensions,
  useContainerDimensions,
} from '../ContainerWithDimensions';

type Props = AspectRatioProps;

export const SmartAspectRatio: React.FC<Props> = ({
  aspectRatio = {
    width: 16,
    height: 9,
  },
  children,
  ...props
}) => {
  const targetRef = useRef<HTMLDivElement>(null);
  const containerDimensions = useContainerDimensions(targetRef);

  // <ContainerWithDimensions />
  const givenAspectRatio =
    typeof aspectRatio === 'number'
      ? aspectRatio
      : aspectRatio.width / aspectRatio.height;

  const containerRatio = containerDimensions.width / containerDimensions.height;

  const appliedRatio =
    containerRatio > givenAspectRatio ? containerRatio : givenAspectRatio;

  return (
    <div
      ref={targetRef}
      className="w-full h-full max-h-full sbg-red-500 relative overflow-hidden"
    >
      {/* {props.children} */}
      <div
        className="p-1"
        style={{
          position: 'absolute',
          zIndex: 999,
          top: 0,
          left: 0,
          background: 'rgba(0, 0, 0, .5)',
        }}
      >
        {JSON.stringify(containerDimensions)}
        <br />
        Current Ratio: {containerRatio}
        <br />
        Given Ratio: {givenAspectRatio}
      </div>

      <div className="relative w-full h-full bg-green-100 overflow-hidden">
        {containerRatio > givenAspectRatio ? (
          <div className='flex relative min-w-0 min-h-0 w-full h-full flex-1 sitems-center'>{children}</div>
        ) : (
          <AspectRatio
            aspectRatio={appliedRatio}
            {...props}
            children={children}
          />
        )}
      </div>
    </div>
  );
};
