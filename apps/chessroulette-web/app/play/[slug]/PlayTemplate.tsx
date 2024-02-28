import { Metadata } from 'next';
import { metadata as roomMetadata } from '../layout';

export const metadata: Metadata = {
  title: `${roomMetadata.title} | Play`,
};

export type Props = {
  mainComponent: React.ReactNode;
  mainContainerClass?: string;
  leftSideComponent?: React.ReactNode;
  rightSideComponent?: React.ReactNode;
  containerClassName?: string;
};

// TODO Not sure if this should be a next template or not

export default function PlayTemplate({
  leftSideComponent,
  mainComponent,
  mainContainerClass = '',
  rightSideComponent,
  containerClassName,
}: Props) {
  return (
    <section
      className={`flex h-full gap-6 ${containerClassName} flex-1 nobg-red-400`}
      style={
        {
          // aspectRatio: 16 / 9,
        }
      }
    >
      {leftSideComponent && (
        <aside
          id="left-side"
          className="grow"
          style={{
            flex: 0.5,
          }}
        >
          {leftSideComponent}
        </aside>
      )}
      <main id="main" className={`flex-1 grow ${mainContainerClass}`}>
        {mainComponent}
      </main>
      {rightSideComponent && (
        <aside id="right-side" className="grow-no">
          {rightSideComponent}
        </aside>
      )}
    </section>
    // <div className="bg-indigo-500 p-2 font-mono">{props.children}</div>
  );
}
