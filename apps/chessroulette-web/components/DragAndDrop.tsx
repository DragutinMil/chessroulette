import React from 'react';
import { FileUploader } from 'react-drag-drop-files';

export type Props = {
  fileTypes: string[];
  onUpload?: (file: {}) => void;
  children?: React.PropsWithChildren['children'];
  className?: string;
};

// const fileTypes = ["PGN", "TXT"];

export function DragAndDrop(props: Props) {
  return (
    <FileUploader
      handleChange={props.onUpload}
      name="file"
      types={props.fileTypes}
      children={props.children}
      classes={props.className}
    />
  );
}
