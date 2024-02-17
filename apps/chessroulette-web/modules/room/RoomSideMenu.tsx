'use client';

import { ClipboardCopyButton } from 'apps/chessroulette-web/components/ClipboardCopyButton';
import { useMemo, useState } from 'react';
import { useUrl } from 'nextjs-current-url';
import { useLearnActivitySettings } from './Learn/useLearnActivitySettings';
import { IconButton } from 'apps/chessroulette-web/components/Button';
import { useRouter, usePathname } from 'next/navigation';
import { useUpdateableSearchParams } from 'apps/chessroulette-web/hooks/useSearchParams';
import { generateUserId } from 'apps/chessroulette-web/util';

export const RoomSideMenu = () => {
  const router = useRouter();
  const pathName = usePathname();

  const url = useUrl();
  const [nextUserId, setNextUserId] = useState(generateUserId());
  const inviteUrl = useMemo(() => {
    if (!url) {
      return '';
    }

    // TODO: All of these should be somewhere else
    url.searchParams.set('userId', String(nextUserId));
    url.searchParams.delete('instructor');
    url.searchParams.delete('edit');

    return url.href;
  }, [url, nextUserId]);

  const settings = useLearnActivitySettings();
  const searchParams = useUpdateableSearchParams();

  return (
    <div className="flex flex-col items-center gap-4">
      {settings.isInstructor && (
        <>
          <ClipboardCopyButton
            buttonComponentType="IconButton"
            value={inviteUrl}
            bgColor="green"
            onCopied={() => {
              setNextUserId(generateUserId());
            }}
            type="custom"
            size="sm"
            icon="PaperAirplaneIcon"
            onCopiedIcon="CheckIcon"
            tooltip="Invite Student"
          />
          <IconButton
            tooltip="Edit Board"
            onClick={() => {
              const nextSearchParams = searchParams.set((prev) => ({
                ...prev,
                edit: '1',
              }));

              router.push(`${pathName}?${nextSearchParams}`);
            }}
            size="sm"
            icon="PencilSquareIcon"
          />
        </>
      )}
    </div>
  );
};
