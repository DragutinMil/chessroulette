import { Metadata } from 'next';
import { StringRecord } from '@xmatter/util-kit';
import { RoomPage } from '@app/modules/Room/RoomPage';
import { metadata as rootMetadata } from '../../../../page';

export const metadata: Metadata = {
  title: `Room | ${rootMetadata.title}`,
};

export default async function Page(props: {
  params: StringRecord;
  searchParams: Partial<{ theme: string }>;
}) {
  return <RoomPage activity="learn" {...props} />;
}
