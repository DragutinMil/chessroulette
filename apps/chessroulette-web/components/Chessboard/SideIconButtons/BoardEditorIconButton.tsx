import { DistributivePick } from '@xmatter/util-kit';
import {
  IconButton,
  IconButtonProps,
} from '@app/components/Button';

type Props = DistributivePick<
  IconButtonProps,
  'onClick' | 'href' | 'linkClassName' | 'className'
>;

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
