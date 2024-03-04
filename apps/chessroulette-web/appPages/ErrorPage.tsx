import { config } from '../config';

type Props = {
  error?: Error & { digest?: string };
};

export const ErrorPage = ({ error }: Props) => (
  <div className="flex flex-1 items-center justify-center h-screen w-screen text-lg divide-x">
    <div className="flex flex-col gap-4 items-center">
      <h2 className="text-2xl">Something went wrong!</h2>
      {config.DEV_MODE && <pre>{JSON.stringify(error, null, 2)}</pre>}
    </div>
  </div>
);
