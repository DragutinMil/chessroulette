'use client';

import React, { useState } from 'react';
import { Button, ButtonProps } from './Button';
import { IconButton, IconButtonProps } from './IconButton';

export type ConfirmButtonProps = ButtonProps & {
  confirmModalTitle: string;
  confirmModalContent: string | React.ReactNode;
  confirmModalAgreeButtonBgColor?: ButtonProps['bgColor'];
} & (
    | {
        iconButton: true;
        icon: IconButtonProps['icon'];
        iconColor?: IconButtonProps['color'];
        iconClassName?: string;
      }
    | {
        iconButton?: false;
        icon: IconButtonProps['icon'];
        iconColor?: IconButtonProps['color'];
        iconClassName?: string;
      }
  );

export const ConfirmButton: React.FC<ConfirmButtonProps> = ({
  onClick,
  confirmModalTitle,
  confirmModalContent,
  confirmModalAgreeButtonBgColor = 'green',
  iconButton,
  ...props
}) => {
  const [showModal, setShowModal] = useState(false);

  const renderButton = iconButton ? (
    <IconButton {...props} onClick={() => setShowModal(true)} />
  ) : (
    <Button {...props} onClick={() => setShowModal(true)} />
  );

  return (
    <>
      {renderButton}

      {showModal && (
        <>
          <div
            className="justify-center  items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-[70] outline-none focus:outline-none"
            tabIndex={-1}
            aria-hidden="true"
          >
            <div
              style={{
                boxShadow: '0px 0px 10px 0px #07DA6380',
              }}
              className="relative w-auto my-6 mx-auto max-w-3xl"
            >
              <div className="sborder-0 rounded-lg shadow-lg relative flex flex-col w-full bg-green-900 outline-none focus:outline-none">
                {/*header*/}
                <div className="flex flex-1   sitems-start justify-between p-3 rounded-t-lg text-center justify-center content-center items-center">
                  <h3 className="text-xl font-semibold text-center text-white sbg-red-100">
                    {confirmModalTitle}
                  </h3>
                </div>

                {/*body*/}
                {confirmModalContent && (
                  <div className="relative p-4  bg-green-300 flex-auto text-slate-300">
                    {confirmModalContent}
                  </div>
                )}

                {/*footer*/}
                <div className="flex items-center bg-green-300  justify-end p-4 rounded-b ">
                  <Button type="clear" onClick={() => setShowModal(false)}>
                    Close
                  </Button>
                  <Button
                    type="custom"
                    bgColor={confirmModalAgreeButtonBgColor}
                    onClick={() => {
                      setShowModal(false);
                      onClick?.();
                    }}
                  >
                    I'm sure
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div className="opacity-30 fixed inset-0 z-40 bg-black" />
        </>
      )}
    </>
  );
};
