import { UnknownRecord } from 'movex-core-util';

export type InputRecord = {
  white: number;
  black: number;
  turn: 'white' | 'black';
  lastUpdatedAt?: number;
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
    stateTransformer: InputRecord[];
  };
  black: {
    display: InputRecord[];
    stateTransformer: InputRecord[];
  };
};

type Props = {
  data: Data;
};

const displayTimestamp = (n?: number) => Number(String(n || 0).slice(-6));

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
      return <span className="text-sm">{p.val}</span>;
    }

    const sign = diff > 0 ? '+' : '-';

    return (
      <div className="text-sm bg-red-400">
        {`${p.val} `}
        <span className={diff > 0 ? `bg-red-300 text-black` : 'bg-red-700'}>
          {sign}
          {Math.abs(diff)}
        </span>
      </div>
    );
  };

  return (
    <div className="flex gap-4">
      <Tabel
        name="Master"
        rows={data.master}
        fieldRender={(p, i) => {
          const key = p.key;

          if (key === 'turn') {
            return <span className="text-sm font-bold">{p.val}</span>;
          }

          const prev = i > 0 ? data.master[i - 1] : data.master[0];

          return (
            <span className="text-sm font-bold">
              {p.val}{' '}
              <span className="text-xs">
                (+{(prev[key] as number) - (p.val as number)})
              </span>
            </span>
          );
        }}
        extraFields={[
          {
            name: 'updatedAt',
            // render: (row) => (
            //   <span className="font-bold">{row.lastUpdatedAt}</span>
            // ),
            render: (row, i) => {
              const diffFromPrev =
                i > 0
                  ? (row.lastUpdatedAt || 0) -
                    (data.white.display[i - 1].lastUpdatedAt || 0)
                  : 0;

              const sign = diffFromPrev > 0 ? '+' : '-';

              return (
                <span className="text-sm">
                  {row.lastUpdatedAt}
                  <span className="text-xs">(^{`${sign}${diffFromPrev}`})</span>
                </span>
              );
            },
          },
        ]}
      />
      <Tabel
        name="White Display"
        rows={data.white.display}
        fieldRender={fieldRender}
        extraFields={[
          {
            name: 'updatedAt',
            render: (row, i) => {
              const diffFromPrev =
                i > 0
                  ? (row.lastUpdatedAt || 0) -
                    (data.white.display[i - 1].lastUpdatedAt || 0)
                  : 0;

              const sign = diffFromPrev > 0 ? '+' : '-';

              return (
                <span className="text-xs">
                  {fieldRender(
                    { key: 'lastUpdatedAt', val: row.lastUpdatedAt },
                    i
                  )}
                  (^{`${sign}${diffFromPrev}`})
                </span>
              );
            },
          },
        ]}
      />
      <Tabel
        name="White StateTransfomer"
        rows={data.white.stateTransformer}
        fieldRender={fieldRender}
        extraFields={[
          {
            name: 'updatedAt',
            render: (row, i) => {
              const diffFromPrev =
                i > 0
                  ? (row.lastUpdatedAt || 0) -
                    (data.white.display[i - 1].lastUpdatedAt || 0)
                  : 0;

              const sign = diffFromPrev > 0 ? '+' : '-';

              return (
                <span className="text-xs">
                  {fieldRender(
                    { key: 'lastUpdatedAt', val: row.lastUpdatedAt },
                    i
                  )}
                  (^{`${sign}${diffFromPrev}`})
                </span>
              );
            },
          },
        ]}
      />
      <Tabel
        name="Black Display"
        rows={data.black.display}
        fieldRender={fieldRender}
        extraFields={[
          {
            name: 'updatedAt',
            render: (row, i) => {
              const diffFromPrev =
                i > 0
                  ? (row.lastUpdatedAt || 0) -
                    (data.white.display[i - 1].lastUpdatedAt || 0)
                  : 0;

              const sign = diffFromPrev > 0 ? '+' : '-';

              return (
                <span className="text-xs">
                  {fieldRender(
                    { key: 'lastUpdatedAt', val: row.lastUpdatedAt },
                    i
                  )}
                  (^{`${sign}${diffFromPrev}`})
                </span>
              );
            },
          },
        ]}
      />
      <Tabel
        name="Black StateTransfomer"
        rows={data.black.stateTransformer}
        fieldRender={fieldRender}
        extraFields={[
          {
            name: 'updatedAt',
            render: (row, i) => {
              const diffFromPrev =
                i > 0
                  ? (row.lastUpdatedAt || 0) -
                    (data.white.display[i - 1].lastUpdatedAt || 0)
                  : 0;

              const sign = diffFromPrev > 0 ? '+' : '-';

              return (
                <span className="text-xs">
                  {fieldRender(
                    { key: 'lastUpdatedAt', val: row.lastUpdatedAt },
                    i
                  )}
                  (^{`${sign}${diffFromPrev}`})
                </span>
              );
            },
          },
        ]}
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
            <th></th>
            <th>Turn</th>
            <th>White</th>
            <th>Black</th>
            {extraFields?.map((p) => (
              <th>{p.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr className="border">
              <td className="text-slate-400">{index + 1} | </td>
              <td className="p-1">
                {fieldRender
                  ? fieldRender({ key: 'turn', val: row.turn }, index)
                  : row.turn}
              </td>
              <td className="p-1">
                {fieldRender
                  ? fieldRender({ key: 'white', val: row.white }, index)
                  : row.white}
              </td>
              <td className="p-1">
                {fieldRender
                  ? fieldRender({ key: 'black', val: row.black }, index)
                  : row.black}
              </td>
              {extraFields?.map((p) => (
                <td>{p.render(row, index)}</td>
              ))}
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
