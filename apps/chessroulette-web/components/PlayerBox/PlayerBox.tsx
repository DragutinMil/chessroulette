import { CameraView } from '../CameraView';

type Props = {};

export const PlayerBox = (props: Props) => {
  return (
    <div className="w-full aspect-ratio">
      <div className="aspect-video bg-slate-300">
        <CameraView />
      </div>
    </div>
  );
};
