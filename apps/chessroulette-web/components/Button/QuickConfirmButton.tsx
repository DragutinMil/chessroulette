'use client';

import React, { useRef, useState } from 'react';
import { Button, ButtonProps } from './Button';
import { useOnClickOutside } from '@xmatter/util-kit';

type Props = ButtonProps & {
  confirmationMessage?: string | React.ReactNode;
  confirmationBgcolor?: ButtonProps['bgColor'];
};

export const QuickConfirmButton: React.FC<Props> = ({
  onClick,
  confirmationMessage = 'Confirm?',
  confirmationBgcolor = 'indigo',
  children,
  bgColor,
  ...props
}) => {
  const [show, setShow] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useOnClickOutside(buttonRef, () => {
    setShow(false);
  });

  return (
    <Button 

      {...props}
      ref={buttonRef}
      bgColor={show ? confirmationBgcolor : bgColor}
      className={`${show ? '!text-white' : ''}
      !flex-1 !h-9 !min-w-[40px] !rounded-3xl 
      transition-all duration-200

      `}
      onClick={() => {
        if (!show) {
          setShow(true);
        } else {
          onClick?.();

          setShow(false);
        }
      }}
    >
      {show ? (
        <span className=" text-white">{confirmationMessage}</span>
      ) : (
        children
      )}
    </Button>
  );
};
