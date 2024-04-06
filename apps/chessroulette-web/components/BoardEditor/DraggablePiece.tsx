import React from 'react';
import { PieceSan } from '@xmatter/util-kit';
import { DraggableItem, DraggableItemProps } from './DraggableItem';

type Props = React.PropsWithChildren &
  DraggableItemProps & {
    pieceSan: PieceSan;
    squareSize: number;
  };

export const DraggablePiece: React.FC<Props> = React.memo(
  ({ squareSize, children, ...props }) => (
    <DraggableItem {...props}>{children}</DraggableItem>
  )
);
