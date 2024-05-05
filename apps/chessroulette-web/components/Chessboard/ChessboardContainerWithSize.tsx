import {
  ChessboardContainer,
  ChessboardContainerProps,
} from './ChessboardContainer';
import { ContainerWithDimensions } from '../ContainerWithDimensions';
import { DistributiveOmit, min } from '@xmatter/util-kit';
import { Props } from '../CameraView';

export type ChessboardContainerWithSizeProps = DistributiveOmit<
  ChessboardContainerProps,
  'sizePx'
> & {
  sizePx?: number;
  overlayComponent?: React.ReactNode;
};

export const ChessboardContainerWithSize = ({
  sizePx = 0,
  ...props
}: ChessboardContainerWithSizeProps) => {
  // console.log('size', sizePx);
  // if (sizePx) {
  return (
    <ChessboardContainer
      sizePx={sizePx}
      {...props}
      containerClassName="w-full h-full"
    />
  );
  // }

  // return (
  //   <ContainerWithDimensions
  //     id="chessboard-container-with-size"
  //     className="w-full h-full bg-blue-100"
  //     render={(d) => (
  //       <ChessboardContainer {...props} sizePx={min(d.width, d.height)} />
  //     )}
  //   />
  // );
};
