import { useState } from 'react';
import { useKeyboardEventListener } from '../hooks';

export type VariantMenuProps = {
  items: {
    value: string;
    onSelect: () => void;
  }[];
};

export const VariantMenuContainer = ({ items }: VariantMenuProps) => {
  const [show, setShow] = useState(false);
  const [itemIndex, setItemIndex] = useState(0);

  useKeyboardEventListener((k, event) => {
    if (k === 'ArrowRight') {
      setShow(true);
    }

    if (show) {
      event.preventDefault();
      if (k === 'ArrowDown' && itemIndex < items.length - 1) {
        setItemIndex((prev) => prev + 1);
      } else if (k === 'ArrowUp' && itemIndex > 0) {
        setItemIndex((prev) => prev - 1);
      } else if (k === 'Enter') {
        items[itemIndex].onSelect();
      }
    }
  });

  if (!show) {
    return null;
  }

  return (
    <div
      className="hover:cursor-pointer absolute bg-slate-200 p-2 text-black flex flex-col font-normal"
      style={{
        right: 0,
        top: 0,
        zIndex: 9999,
        // bottom: 0,
      }}
    >
      {items.map((v, i) => (
        <div
          key={v.value + i}
          className={`hover:bg-slate-300 ${
            i === itemIndex ? 'bg-slate-400' : ''
          }`}
          onClick={v.onSelect}
        >
          {v.value}
        </div>
      ))}
    </div>
  );
};
