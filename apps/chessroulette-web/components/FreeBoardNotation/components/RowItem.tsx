import { MouseEvent } from 'react';
import { Text } from '../../Text';
import { ChessMoveSan } from '@xmatter/util-kit';
import { VariantMenuContainer, VariantMenuProps } from './VariantMenu';

type Props = {
  isFocused: boolean;
  san: ChessMoveSan;
  onClick: () => void;
  onContextMenu: (event: MouseEvent) => void;
  variantMenu?: {
    items: VariantMenuProps['items'];
  };
};

export const RowItem = ({
  isFocused,
  variantMenu,
  san,
  onClick,
  onContextMenu,
}: Props) => (
  <div
    className={`relative flex-1 p-1 cursor-pointer hover:bg-slate-500 ${
      isFocused && 'font-black bg-slate-600'
    }`}
    onClick={onClick}
    onContextMenu={onContextMenu}
  >
    <Text>{san}</Text>
    {variantMenu && <VariantMenuContainer {...variantMenu} />}
  </div>
);
