import React, { useState } from 'react';
import { Button, ButtonProps } from './Button';

type Props = ButtonProps & {
  // confirmationContent: React.ReactNode;
  confirmModalTitle?: string;
  confirmModalContent?: string | React.ReactNode;
};

export const ConfirmButton: React.FC<Props> = ({
  onClick,
  confirmModalTitle,
  confirmModalContent,
  ...props
}) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Button {...props} onClick={() => setShowModal(true)} />

      {showModal && (
        <>
          <div
            className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none"
            tabIndex={-1}
            aria-hidden="true"
            // className="fixed pin z-50 overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center h-screen w-screen bg-black bg-opacity-70 flex"
          >
            <div className="relative w-auto my-6 mx-auto max-w-3xl">
              {/*content*/}
              <div className="sborder-0 rounded-lg shadow-lg relative flex flex-col w-full bg-slate-600 outline-none focus:outline-none">
                {/*header*/}
                <div className="flex items-start justify-between p-3 rounded-t">
                  <h3 className="text-xl font-semibold text-center text-slate-400">
                    {confirmModalTitle}
                  </h3>
                  {/* <button
                    className="p-1 ml-auto bg-transparent border-0 text-black opacity-5 float-right text-3xl leading-none font-semibold outline-none focus:outline-none"
                    onClick={() => setShowModal(false)}
                  >
                    <span className="bg-transparent text-black opacity-5 h-6 w-6 text-2xl block outline-none focus:outline-none">
                      ×
                    </span>
                  </button> */}
                </div>
                {/*body*/}
                {confirmModalContent && (
                  <div className="relative p-4 flex-auto">
                    {confirmModalContent}
                  </div>
                )}

                {/*footer*/}
                <div className="flex items-center justify-end p-4 rounded-b">
                  <Button type="clear" onClick={() => setShowModal(false)}>
                    Close
                  </Button>
                  <Button
                    type="custom"
                    bgColor="green"
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
          <div className="opacity-30 fixed inset-0 z-40 bg-black"></div>
        </>
      )}
    </>
  );
};
