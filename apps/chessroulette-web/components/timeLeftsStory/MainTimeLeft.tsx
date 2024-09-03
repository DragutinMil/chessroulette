import { UnknownRecord } from 'movex-core-util';

export type InputRecord = {
  white: number;
  black: number;
  turn: 'white' | 'black';
};

type FieldRenderFn = <TKey extends keyof InputRecord>(
  p: {
    key: TKey;
    val: InputRecord[TKey];
  },
  index: number
) => React.ReactNode;

export type Data = {
  master: InputRecord[];
  white: {
    display: InputRecord[];
    stateTransfomer: InputRecord[];
  };
  black: {
    display: InputRecord[];
    stateTransfomer: InputRecord[];
  };
};

type Props = {
  data: Data;
};

export const MainTimeLeft = ({ data }: Props) => {
  const fieldRender: FieldRenderFn = (p, index) => {
    if (p.key === 'turn') {
      return p.val;
    }

    const key = p.key as 'white' | 'black';
    const val = p.val as number;

    const masterInput = data.master[index];

    const diff = masterInput[key] - val;

    if (diff === 0) {
      return p.val;
    }

    return (
      <div className="bg-red-400">
        {`${p.val} `}
        <span className={diff > 0 ? `bg-green-700` : 'bg-red-700'}>
          ({diff})
        </span>
      </div>
    );
  };

  return (
    <div className="flex gap-10">
      <Tabel name="Master" rows={data.master} />
      <Tabel
        name="White Display"
        rows={data.white.display}
        fieldRender={fieldRender}
      />
      <Tabel
        name="White StateTransfomer"
        rows={data.white.stateTransfomer}
        fieldRender={fieldRender}
      />
      <Tabel
        name="Black Display"
        rows={data.black.display}
        fieldRender={fieldRender}
      />
      <Tabel
        name="Black StateTransfomer"
        rows={data.black.stateTransfomer}
        fieldRender={fieldRender}
      />
    </div>
  );
};

const Tabel = ({
  name,
  rows,
  extraFields,
  containerClassName,
  fieldRender,
}: {
  name: string;
  rows: InputRecord[];
  extraFields?: {
    name: string;
    render: (input: InputRecord, index: number) => React.ReactNode;
  }[];
  fieldRender?: FieldRenderFn;
  containerClassName?: string;
}) => {
  return (
    <div className={containerClassName}>
      <h4 className="font-bold">{name}</h4>
      <table className="table-fixed">
        <thead>
          <tr>
            <th>Turn</th>
            <th>White</th>
            <th>Black</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, input) => (
            <tr className="border">
              <td className="p-1">
                {fieldRender
                  ? fieldRender({ key: 'turn', val: row.turn }, input)
                  : row.turn}
              </td>
              <td className="p-1">
                {fieldRender
                  ? fieldRender({ key: 'white', val: row.white }, input)
                  : row.white}
              </td>
              <td className="p-1">
                {fieldRender
                  ? fieldRender({ key: 'black', val: row.black }, input)
                  : row.black}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const Record = ({
  input,
  extraFields,
}: {
  input: InputRecord;
  extraFields?: ((i: InputRecord) => string)[];
}) => {
  return (
    <div className="flex">
      <div>{input.turn}</div>
      <div>{input.white}</div>
      <div>{input.black}</div>
    </div>
  );
};
