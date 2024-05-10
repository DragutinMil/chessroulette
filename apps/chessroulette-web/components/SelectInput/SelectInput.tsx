import React, { useMemo } from 'react';
import Select, { Props as SelectProps } from 'react-select';
import z from 'zod';

const inputOptions = z.object({
  value: z.string(),
  label: z.string(),
});

type InputOptions = z.infer<typeof inputOptions>;

type Props = Omit<SelectProps, 'options'> & {
  className?: string;
  onSelect: (val: InputOptions) => void;
  validationErrors?: boolean;
  options: string[];
};

const createOption = (value: string) => ({
  label: value,
  value,
});

const dot = (color = 'transparent') => ({
  alignItems: 'center',
  display: 'flex',

  ':before': {
    backgroundColor: color,
    borderRadius: 16,
    display: 'block',
  },
});

export const SelectInput: React.FC<Props> = (props) => {
  const optios = useMemo(() => {
    return props.options.map(createOption);
  }, [props.options]);

  return (
    <div className="">
      <Select
        {...props}
        options={optios}
        onChange={(value, actionType) => {
          if (actionType.action === 'select-option') {
            const validValue = inputOptions.safeParse(value);
            if (!validValue.success) {
              return;
            }
            props.onSelect(validValue.data);
          }
        }}
        theme={(theme) => ({
          ...theme,
          overflow: 'hidden',
          borderRadius: 10,
        })}
        styles={{
          control: (styles, state) => ({
            ...styles,
            borderColor: state.isFocused ? 'grey' : 'red',
            border: '0px',
            ...(props.validationErrors && {
              border: '2px solid red',
            }),
          }),
          option: (styles, { isFocused, isSelected }) => ({
            ...styles,
            backgroundColor: isFocused
              ? 'paleturquoise'
              : isSelected
              ? 'blue'
              : 'black',
          }),
          menu: (styles) => ({
            ...styles,
            fontSize: '0.875em',
            backgroundColor: '#000000',
          }),
          input: (styles) => ({
            ...styles,
            fontSize: '0.875em',
            ...dot(),
          }),
          singleValue: (styles) => ({
            ...styles,
            fontSize: '0.875em',
            color: '#000000',
          }),
          placeholder: (styles) => ({ ...styles, ...dot('#000') }),
          indicatorsContainer: (styles) => ({
            ...styles,
            padding: '0px',
          }),
          indicatorSeparator: (styles) => ({
            ...styles,
            width: '0px',
          }),
          valueContainer: (prev) => ({
            ...prev,
            paddingTop: '0px',
            paddingBottom: '0px',
          }),
        }}
      />
    </div>
  );
};
