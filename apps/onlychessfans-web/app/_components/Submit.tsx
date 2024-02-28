'use client';

import { useState } from 'react';
import { Button } from './Button';
import { ChessFEN, ChessPGN } from 'apps/onlychessfans-web/lib/util';

type Props = {
  // onSubmit: (pgnOrFen: ChessPGN | ChessFEN) => void;
};

export const Submit = (props: Props) => {
  const [show, setShow] = useState(false);
  const [input, setInput] = useState<ChessFEN | ChessPGN>();

  // const validateInput = () => {
  //   const game
  // }

  const submit = (input: ChessFEN | ChessPGN) => {
    setShow(false);
    setInput(undefined);
  };

  return (
    <div className="pb-10 flex justify-center">
      {/* {show && (
        <div></div>
      )}
      <Button onClick={}>+</Button> */}
      <button
        data-modal-target="default-modal"
        data-modal-toggle="default-modal"
        className="block text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        type="button"
        onClick={() => {
          setShow(true);
        }}
      >
        Add Your Own Position <span className='text-lg'>😍</span>
      </button>

      {show && (
        <div
          // id="default-modal"
          tabIndex={-1}
          aria-hidden="true"
          className="fixed pin z-50 overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center h-screen w-screen bg-black bg-opacity-70 flex"
        >
          <div className="relative p-4 w-full max-w-xl max-h-full">
            <div className="relative bg-white rounded-lg shadow dark:bg-gray-600">
              <button
                type="button"
                className="absolute top-3 end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                data-modal-hide="popup-modal"
                onClick={() => {
                  setShow(false);
                }}
              >
                <svg
                  className="w-3 h-3"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 14 14"
                >
                  <path
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                  />
                </svg>
                <span className="sr-only">Close modal</span>
              </button>
              <div className="p-4 md:p-5 text-center">
                {/* <svg
                  className="mx-auto mb-4 text-gray-400 w-12 h-12 dark:text-gray-200"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 20 20"
                >
                  <path
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg> */}
                <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
                  Let's make history 😎
                </h3>
                <label
                  // for="message"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Paste Your Sexy Game PGN or FEN below 👇
                </label>
                <textarea
                  // id="message"
                  rows={4}
                  className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="Your deepest secrets are safe with me..."
                  value={input}
                  onChange={(e) => {
                    console.log('val', e.target.value);
                    setInput(e.target.value);
                  }}
                />
                <div className="w-full flex justify-end pt-6">
                  <button
                    data-modal-target="default-modal"
                    data-modal-toggle="default-modal"
                    className={`${
                      input
                        ? 'bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700'
                        : 'bg-gray-700'
                    } block text-white focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:focus:ring-blue-800`}
                    type="button"
                    disabled={!input}
                    onClick={() => {
                      if (input) {
                        submit(input);
                      }
                    }}
                  >
                    Post
                  </button>
                  <div className="pr-4" />
                  <button
                    data-modal-hide="popup-modal"
                    type="button"
                    className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600"
                    onClick={() => {
                      setShow(false);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
