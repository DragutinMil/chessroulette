import { UserAuth } from 'apps/onlychessfans-web/components/UserAuth/UserAuth';
import Link from 'next/link';

type Props = {
  className?: string;
};

export default (props: Props) => {
  return (
    <header
      className={`pt-4 pb-4 text-center ${props.className} flex justfy-between gap-2 pl-[max(env(safe-area-inset-left),1.5rem)] pr-[max(env(safe-area-inset-right),1.5rem)]`}
    >
      <div className="flex-1" />
      <div className="flex-1">
        <Link href="/">
          <h1 className="font-bold text-4xl text-blue-400">
            Only<span className="text-white">Chess</span>
            <span className="text-blue-400">Fans</span>
            {' '}😉
          </h1>
        </Link>
      </div>
      <div className="flex-1 flex justify-end">
        <UserAuth />
      </div>
    </header>
  );
};
