import { IconButton, IconButtonProps } from '../../Button';

type Props = Omit<IconButtonProps, 'icon' | 'iconKind' | 'type' | 'tooltip'>;

export const FlipBoardIconButton = (props: Props) => (
  <IconButton
    icon="ArrowsUpDownIcon"
    iconKind="outline"
    type="clear"
    size="sm"
    tooltip="Flip Board"
    tooltipPositon="left"
    {...props}
  />
);
