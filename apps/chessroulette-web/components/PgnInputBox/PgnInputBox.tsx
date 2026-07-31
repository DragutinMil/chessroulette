import React, { useState, useEffect } from 'react';
import {
  ChessFEN,
  ChessFENBoard,
  ChessPGN,
  isValidPgn,
} from '@xmatter/util-kit';
import { DragAndDrop } from './DragAndDrop';
import { Err, Ok, Result } from 'ts-results';
import useDebouncedEffect from 'use-debounced-effect';

export type ImportedInput =
  | { type: 'FEN'; val: ChessFEN }
  | { type: 'PGN'; val: ChessPGN; position?: [number, number] };

export type PgnInputBoxProps = {
  onChange: (p: ImportedInput) => void;
  value?: string;
  isInvalid?: boolean;
  containerClassName?: string;
  contentClassName?: string;
  compact?: boolean;
};

// Shortest string that can pass ChessFENBoard.validateFenString, e.g. "8/8/8/8/8/8/8/8 w - - 0 1"
const MIN_FEN_LENGTH = 25;

export const PgnInputBox: React.FC<PgnInputBoxProps> = ({
  value = '',
  compact = false,
  ...props
}) => {
  const [input, setInput] = useState<string>();
  const [validType, setValidType] = useState<'FEN' | 'PGN' | null>();
  useEffect(() => {
    const url = new URL(window.location.href);
    const rawPgn = url.searchParams.get('pgn');
    if (rawPgn) {
      props.onChange({ type: 'PGN', val: rawPgn });
    }
  }, []);
  useDebouncedEffect(
    () => {
      if (!input) {
        setValidType(undefined);
        return;
      }

      // Don't attempt (re)validation on every keystroke while the user is
      // still manually typing something shorter than any valid FEN.
      if (input.length < MIN_FEN_LENGTH) {
        setValidType(undefined);
        return;
      }

      const result = isValidFenOrPGN(input || '');

      setValidType(result.ok ? result.val : null);

      // No explicit Import button, so paste (or reaching a valid length
      // while typing) imports automatically.
      if (result.ok) {
        props.onChange({ type: result.val, val: input } as ImportedInput);
        setInput('');
      }
    },
    250,
    [input]
  );

  if (compact) {
    return (
      <div className={`flex flex-col gap-1.5 ${props.containerClassName}`}>
        <textarea
          value={input ?? ''}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste FEN, PGN(s), or drag PGN file"
          rows={2}
          className={`w-full resize-none rounded-md border bg-slate-800 px-3 py-2 text-xs text-gray-300 outline-none ${
            input && validType === null ? 'border-red-400' : 'border-slate-600'
          }`}
        />
        <DragAndDrop
          fileTypes={['PGN', 'FEN', 'TXT']}
          className="shrink-0"
          onUpload={(f: any) => {
            // TODO: Validate PGN

            const fileData = new FileReader();
            fileData.onloadend = (s) => {
              if (s.target && typeof s.target.result === 'string') {
                const uploaded = s.target.result
                  .split('\n')
                  .filter((line) => !line.startsWith('['))
                  .join(' ')
                  .trim();
                if (!uploaded) {
                  return;
                }

                if (ChessFENBoard.validateFenString(uploaded).ok) {
                  props.onChange({ type: 'FEN', val: uploaded });
                } else if (isValidPgn(uploaded)) {
                  props.onChange({ type: 'PGN', val: uploaded });
                }
              }
            };
            fileData.readAsText(f);
          }}
        >
          <div className="rounded-md border border-slate-600 cursor-pointer text-sm px-2 py-1.5 text-center text-gray-300">
            Upload file
          </div>
        </DragAndDrop>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-4 ${props.containerClassName}`}>
      <div className={`flex flex-col gap-1 ${props.contentClassName}`}>
        <label className="text-xs font-semibold text-white">
          Paste PGN/FEN
        </label>
        <textarea
          value={input ?? ''}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste your FEN or PGN here"
          rows={4}
          className={`w-full resize-none rounded-md  bg-[#D9D9D9]/10 px-3 py-2 text-sm text-white outline-none ${
            input && validType === null ? 'border border-red-400' : ''
          }`}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-white">
          Upload or drag PGN
        </label>
        <DragAndDrop
          fileTypes={['PGN', 'FEN', 'TXT']}
          className="shrink-0"
          onUpload={(f: any) => {
            // TODO: Validate PGN

            const fileData = new FileReader();
            fileData.onloadend = (s) => {
              if (s.target && typeof s.target.result === 'string') {
                const uploaded = s.target.result
                  .split('\n')
                  .filter((line) => !line.startsWith('['))
                  .join(' ')
                  .trim();
                if (!uploaded) {
                  return;
                }

                if (ChessFENBoard.validateFenString(uploaded).ok) {
                  props.onChange({ type: 'FEN', val: uploaded });
                } else if (isValidPgn(uploaded)) {
                  props.onChange({ type: 'PGN', val: uploaded });
                }
              }
            };
            fileData.readAsText(f);
          }}
        >
          <div className="border border-dashed border-slate-600 rounded-md cursor-pointer text-sm px-2 py-3 text-center text-gray-300">
            Upload or drop a PGN  file
          </div>
        </DragAndDrop>
      </div>
    </div>
  );
};

const isValidFenOrPGN = (input: string): Result<'FEN' | 'PGN', void> => {
  if (!input) {
    return Err.EMPTY;
  }

  if (ChessFENBoard.validateFenString(input).ok) {
    return new Ok('FEN');
  } else if (isValidPgn(input)) {
    return new Ok('PGN');
  }

  return Err.EMPTY;
};
