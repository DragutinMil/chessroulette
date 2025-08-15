import React from 'react';
import { Button, ButtonProps } from '../Button';
import { Icon } from '../Icon/Icon';

type Props = {
  title: React.ReactNode;
  content: string | React.ReactNode;
  buttons?: ButtonProps[];
  onClose?: () => void;
  hasCloseButton?: boolean;
  modalBG?: 'dark' | 'light';
};

export const Dialog: React.FC<Props> = ({ modalBG = 'dark', ...props }) => {
  return (
    <div
      className={`absolute w-full h-full top-0 left-0 z-50 flex justify-center content-center items-center bg-opacity-30 ${
        modalBG === 'dark' ? 'bg-black' : 'bg-white'
      }`}
    >
      <div
        className="flex bg-black rounded-lg p-2 shadow-2xl shadow-black w-[280px]"
        style={{ boxShadow: '0px 0px 30px 0px #07DA6366' }}
      >
        <div className="flex flex-col gap-4 w-full">
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
          <div className="p-2 gap-4 flex flex-col w-full">
            {props.title && (
              <div className="flex justify-center capitalize">
                {props.title}
              </div>
            )}
            <div className="flex flex-col gap-2">{props.content}</div>
            {props.buttons && (
              <div className="flex flex-row justify-center gap-3">
                {props.buttons.map((buttonProps, i) =>
                  buttonProps ? <Button key={i} {...buttonProps} /> : null
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
