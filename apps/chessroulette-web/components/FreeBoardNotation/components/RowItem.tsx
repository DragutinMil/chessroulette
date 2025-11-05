import { MouseEvent } from 'react';
import { Text } from '../../Text';
import { ChessMoveSan } from '@xmatter/util-kit';
import { VariantMenuContainer, VariantMenuProps } from './VariantMenu';
import { isMobile } from '@app/modules/Room/activities/Aichess/util';

type Props = {
  isFocused: boolean;
  san: ChessMoveSan;
  onClick: () => void;
  onContextMenu: (event: MouseEvent) => void;
  tooltip?: string;
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
  tooltip,
}: Props) => (
  <div
    className={`relative flex-1 p-1 px-2 rounded-md cursor-pointer hover:bg-[#D9D9D9]/30   ${
      isFocused && 'font-black bg-[#D9D9D9]/20 '
    }`}
    onClick={onClick}
    onContextMenu={onContextMenu}
  >
    <span className="relative group inline-block">
      <Text className={`text-[14px] font-bold inline-block whitespace-nowrap `}>
        {san}
      </Text>
      {tooltip && (
        <span className="absolute left-[65px] top-1/2 -translate-y-1/2 font-semibold  rounded-md  ml-2 hidden transition-opacity duration-200 md:group-hover:block bg-[#01210b] shadow-md text-wgite text-xs  px-2 py-1 whitespace-nowrap z-50">
          {tooltip}
        </span>
      )}
    </span>

    {variantMenu && <VariantMenuContainer {...variantMenu} />}
  </div>
);
