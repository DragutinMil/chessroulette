type Props = {
  shortName: string;
  className?: string;
};

export const Avatar = (props: Props) => {
  return (
    <div
      className={`flex relative w-12 h-12 bg-orange-500 justify-center items-center text-xl rounded-full text-white ${props.className}`}
    >
      {props.shortName}
    </div>
  );
};
