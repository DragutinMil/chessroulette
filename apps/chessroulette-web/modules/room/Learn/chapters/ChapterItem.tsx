import { ConfirmButton } from 'apps/chessroulette-web/components/Button/ConfirmButton';
import { Chapter } from '../../activity/reducer';
import { Button } from 'apps/chessroulette-web/components/Button';
import { useState } from 'react';
import { QuickConfirmButton } from 'apps/chessroulette-web/components/Button/QuickConfirmButton';

export type Props = {
  chapter: Chapter;
  onLoadClick: () => void;
  onEditClick: () => void;
  onDeleteClick: () => void;
};

export const ChapterItem = ({
  chapter,
  onLoadClick,
  onEditClick,
  onDeleteClick,
}: Props) => {
  return (
    <div
      key={chapter.id}
      className="flex flex-1 sflex-col gap-2 shover:cursor-pointer shover:bg-slate-600 p-2 py-3 border-b slast:border-0 border-slate-600"
      // onClick={onUse}
    >
      <span className="text-sm flex-1 flex items-center"> {chapter.name}</span>

      <div className="flex gap-2">
        <Button size="sm" type="secondary" onClick={onLoadClick}>
          Load
        </Button>
        <Button
          size="sm"
          type="secondary"
          icon="PencilIcon"
          onClick={onEditClick}
        >
          Edit
        </Button>
        <QuickConfirmButton
          // bgColor="red"
          // type="custom"
          size="sm"
          onClick={onDeleteClick}
        >
          Delete
        </QuickConfirmButton>
      </div>
    </div>
  );
};
