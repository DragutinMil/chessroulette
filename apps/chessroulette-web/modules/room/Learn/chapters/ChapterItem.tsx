import { ConfirmButton } from 'apps/chessroulette-web/components/Button/ConfirmButton';
import { Chapter } from '../../activity/reducer';
import { Button, IconButton } from 'apps/chessroulette-web/components/Button';
import { useState } from 'react';
import { QuickConfirmButton } from 'apps/chessroulette-web/components/Button/QuickConfirmButton';
import { Icon } from 'apps/chessroulette-web/components/Icon';

export type Props = {
  chapter: Chapter;
  isActive?: boolean;
  onLoadClick: () => void;
  onEditClick: () => void;
  onDeleteClick: () => void;
};

export const ChapterItem = ({
  chapter,
  isActive,
  onLoadClick,
  onEditClick,
  onDeleteClick,
}: Props) => {
  return (
    <div
      key={chapter.id}
      className={`flex flex-1 sflex-col gap-2 hover:cursor-pointer hover:bg-slate-600 p-2 py-3 srounded-lg border-b slast:border-0 border-slate-600 ${
        isActive ? 'bg-slate-600 ' : ''
      }`}
      title='Load Chapter'
      onClick={onLoadClick}
    >
      <span className="text-sm flex-1 flex items-center"> {chapter.name}</span>

      <div className="flex gap-2">
        {/* <Button size="sm" type="secondary" onClick={onLoadClick}>
          Load
        </Button> */}
        <IconButton
          size="sm"
          type="secondary"
          icon="PencilIcon"
          onClick={onEditClick}
          tooltip='Edit Chapter'
          tooltipPositon='bottom'
        />
        <QuickConfirmButton
          // bgColor="red"
          // type="custom"
          size="sm"
          confirmationMessage="Confirm Delete"
          onClick={onDeleteClick}
        >
          <Icon name="TrashIcon" className='w-4 h-4' />
        </QuickConfirmButton>
      </div>
    </div>
  );
};
