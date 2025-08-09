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
    className={`relative flex-1 p-1 px-2 rounded-md cursor-pointer hover:bg-[#D9D9D9]/30  ${
      isFocused && 'font-black bg-[#D9D9D9]/20 '
    }`}
    onClick={onClick}
    onContextMenu={onContextMenu}
  >
    <Text className={`text-[14px] font-bold `}>{san}</Text>
    {variantMenu && <VariantMenuContainer {...variantMenu} />}
  </div>
);
