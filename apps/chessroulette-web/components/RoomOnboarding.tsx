type Props = {
  slots: string[];
  onSubmit: (slot: string) => void;
};

export const RoomOnboarding: React.FC<Props> = ({ slots, onSubmit }) => {
  return (
    <div
      className="fixed nohidden inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex text-slate-900"
      id="my-modal"
    >
      <div className="relative p-8 bg-white w-full max-w-md m-auto flex-col flex rounded-lg">
        <h2 className="text-xl font-bold">Pick a slot</h2>
        <div className="flex flex-row justify-between pt-5">
          {slots.map((s) => (
            <button
              className="text-center group"
              key={s}
              onClick={() => onSubmit(s)}
            >
              <div
                className="rounded-full"
                style={{
                  backgroundColor: s,
                  width: 50,
                  height: 50,
                }}
              />
              <span className="text-md invisible group-hover:visible">{s}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
