'use client';

import useEventListener from '@use-it/event-listener';
import { keyInObject } from '@xmatter/util-kit';
import { useState } from 'react';

type ArrowColorsInOrder = [string, string, string];

// TODO: Don't hardcode here
const outpostColors: ArrowColorsInOrder = [
  '#11c6d1',
  '#f2358d',
  '#6f7381',
  // 4: '#c8a07d',
  // 5: '#ffc695',
];

export const useArrowAndCircleColor = (colors = outpostColors) => {
  const [colorIndex, setColorIndex] = useState(0);
  const [controlKeyPressed, setControlKeyPressed] = useState(false);

  // const [rightClickPressed, setRightClickPressed] =
  // const [rightClickedPressed, setRightClickedPressed] = useState(false);

  useEventListener('keydown', (event: object) => {
    if (!keyInObject(event, 'key')) {
      return;
    }

    // console.log('Key Down:', event.key);

    if (event.key === 'Meta') {
      setColorIndex((prev) => prev + 1);

      // If the ControlKey is already pressed inc once more
      if (controlKeyPressed) {
        setColorIndex((prev) => prev + 1);
      }
    }

    if (event.key === 'Control') {
      setControlKeyPressed(true);

      // If the MetaKey is already change the index
      if (colorIndex === 1) {
        setColorIndex(2);
      }
    }
  });

  useEventListener('keyup', (event: object) => {
    if (!keyInObject(event, 'key')) {
      return;
    }

    if (event.key === 'Meta') {
      setColorIndex(0);
    }

    if (event.key === 'Control') {
      setControlKeyPressed(false);

      if (colorIndex === 2) {
        setColorIndex(1);
      }
    }
  });

  // useEventListener('contextmenu', () => {
  //   setRightClickedPressed(true);
  // });

  // useEventListener('mouseup', () => {
  //   setRightClickedPressed(false);
  // });

  return colors[colorIndex]
};
