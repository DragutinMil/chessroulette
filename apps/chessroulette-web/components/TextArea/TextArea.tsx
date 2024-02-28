import React, { useState } from 'react';
import { Text } from '../Text/Text';

type Props = React.DetailedHTMLProps<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  HTMLTextAreaElement
> & {
  className?: string;
  containerClassName?: string;
  label?: string;
  validationError?: string;
  hasValidationError?: boolean;
};

export const TextArea: React.FC<Props> = ({
  className = '',
  containerClassName = '',
  label,
  value,
  hasValidationError,
  validationError,
  ...props
}) => {
  // const cls = useStyles();
  // const [isFocused, setIsFocused] = useState(false);
  // const isInvalid = hasValidationError || validationError;

  return (
    <div className={`flex flex-col ${containerClassName}`}>
      {label && <Text size="small2">{label}</Text>}
      <textarea
        value={value}
        className="flex-1 border-none bg-transparent w-full focus:outline-none"
        // onFocus={() => setIsFocused(true)}
        // onBlur={() => setIsFocused(false)}
        {...props}
      />
    </div>
  );
};
