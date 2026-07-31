import React from 'react';
import { Dialog } from '@app/components/Dialog';
import {
  PgnInputBox,
  PgnInputBoxProps,
} from '@app/components/PgnInputBox/PgnInputBox';

type ImportDialogContainerProps = {
  visible: boolean;
  onClose: () => void;
  onImport: PgnInputBoxProps['onChange'];
};

export const ImportDialogContainer: React.FC<ImportDialogContainerProps> = ({
  visible,
  onClose,
  onImport,
}) => {
  if (!visible) {
    return null;
  }

  return (
    <Dialog
      title="Import PGN or FEN"
      hasCloseButton
      onClose={onClose}
      content={
        <PgnInputBox
          onChange={(input) => {
            onImport(input);
            onClose();
          }}
        />
      }
    />
  );
};
