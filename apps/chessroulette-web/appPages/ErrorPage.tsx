import { config } from '../config';

type Props = {
  error?: Error & { digest?: string };
};

export const ErrorPage = ({ error }: Props) => {
  console.error('ErrorPage Error', error);

  return (
    <div className="flex flex-1 items-center justify-center h-screen w-screen text-lg divide-x">
      <div className="flex flex-col gap-4 items-center">
        <h2 className="text-2xl">Something went wrong in App Page!</h2>
        <pre>{JSON.stringify(error || { no: 'error' }, null, 2)}</pre>
      </div>
    </div>
  );
};
