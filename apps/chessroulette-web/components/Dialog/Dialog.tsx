import React from 'react';
import { Button, ButtonProps } from '../Button';
import { Icon } from '../Icon';

type Props = {
  title: string;
  content: string | React.ReactNode;
  buttons?: ButtonProps[];
  onClose?: () => void;
  hasCloseButton?: boolean;
};

export const Dialog: React.FC<Props> = (props) => {
  return (
    <div className="flex flex-col gap-4">
      {props.hasCloseButton && (
        <div className="flex flex-row justify-end w-full">
          <div
            onClick={() => props.onClose && props.onClose()}
            className="flex group hover:cursor-pointer"
          >
            <Icon
              name="XCircleIcon"
              className="w-4 h-4 group-hover:text-red-400"
            />
          </div>
        </div>
      )}
      <div className="p-2 gap-4 flex flex-col">
        {props.title && (
          <div className="flex justify-center capitalize">{props.title}</div>
        )}
        <div className="flex flex-col gap-2">{props.content}</div>
        {props.buttons && (
          <div className="flex flex-row justify-center gap-3">
            {props.buttons.map((buttonProps, i) => {
              if (typeof buttonProps !== 'object') {
                return null;
              }

              return <Button key={i} {...buttonProps} />;
            })}
          </div>
        )}
      </div>
    </div>
  );
};
