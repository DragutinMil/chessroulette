import { Metadata } from 'next';
import { StringRecord } from '@xmatter/util-kit';
import { metadata as rootMetadata } from '../../../../page';
import { RoomPage } from '@app/modules/Room2/RoomPage';

export const metadata: Metadata = {
  title: `Match | ${rootMetadata.title}`,
};

export default async function Page(props: {
  params: StringRecord;
  searchParams: Partial<{ theme: string }>;
}) {
  return <RoomPage activity="match" {...props} />;
}
