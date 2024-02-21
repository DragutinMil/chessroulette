import { Chapter } from '../../activity/reducer';
import { IconButton } from 'apps/chessroulette-web/components/Button';
import { QuickConfirmButton } from 'apps/chessroulette-web/components/Button/QuickConfirmButton';
import { Icon } from 'apps/chessroulette-web/components/Icon';

export type Props = {
  chapter: Chapter;
  isActive?: boolean;
  onLoadClick: () => void;
  onEditClick: () => void;
  onDeleteClick: () => void;
  className?: string;
};

export const ChapterItem = ({
  chapter,
  isActive,
  onLoadClick,
  onEditClick,
  onDeleteClick,
  className,
}: Props) => {
  return (
    <div
      key={chapter.id}
      className={`flex flex-1 gap-2 hover:cursor-pointer hover:bg-slate-600 p-2 py-3 srounded-lg border-b slast:border-0 border-slate-600 ${
        isActive ? 'bg-slate-600 ' : ''
      } ${className}`}
      title={`Load "${chapter.name}"`}
      onClick={onLoadClick}
    >
      <span className="text-sm flex-1 flex items-center"> {chapter.name}</span>

      <div className="flex gap-2">
        <IconButton
          size="sm"
          type="secondary"
          icon="PencilIcon"
          onClick={onEditClick}
          tooltip="Edit Chapter"
          tooltipPositon="bottom"
        />
        <QuickConfirmButton
          size="sm"
          confirmationMessage="Confirm Delete"
          onClick={onDeleteClick}
        >
          <Icon name="TrashIcon" className="w-4 h-4" />
        </QuickConfirmButton>
      </div>
    </div>
  );
};
