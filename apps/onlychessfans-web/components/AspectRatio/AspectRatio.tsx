import React from 'react';

export type AspectRatioExplicit = {
  width: number;
  height: number;
};

export type AspectRatioProps = React.HTMLProps<HTMLDivElement> & {
  aspectRatio?: AspectRatioExplicit | number;
} & (
    | {
        width?: number | string;
        height?: never;
      }
    | {
        height?: number;
        width?: never;
      }
  ) & {
    contentClassname?: string;
  };

export const AspectRatio: React.FC<AspectRatioProps> = ({
  aspectRatio = {
    width: 16,
    height: 9,
  },
  ...props
}) => {
  const ratio =
    typeof aspectRatio === 'number'
      ? aspectRatio
      : aspectRatio.width / aspectRatio.height;

  return (
    <div
      style={{
        width: props.width,
        height: props.height,
        ...props.style,
      }}
      className={props.className}
    >
      <div
        // className={}
        style={{
          width: '100%',
          position: 'relative',

          paddingBottom: `${100 / ratio}%`,
        }}
      >
        <div
          className={props.contentClassname}
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        >
          {props.children}
        </div>
      </div>
    </div>
  );
};
