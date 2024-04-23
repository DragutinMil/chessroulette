import { IconButton, IconButtonProps } from '../../Button';

type Props = Pick<IconButtonProps, 'onClick' | 'className'>;

export const BoardEditorIconButton = (props: Props) => (
  <IconButton
    icon="PencilSquareIcon"
    iconKind="outline"
    type="clear"
    size="sm"
    tooltip="Board Editor"
    tooltipPositon="left"
    {...props}
  />
);
