import React, { PropsWithChildren } from 'react';
import { invoke, isOneOf } from '@xmatter/util-kit';
import { Icon, IconProps } from '../Icon/Icon';

type Direction = 'left' | 'right' | 'top' | 'bottom';
const swapDirection = (d: Direction): Direction => {
  if (isOneOf(d, ['left', 'right'])) {
    return d === 'left' ? 'right' : 'left';
  }

  return d === 'bottom' ? 'top' : 'bottom';
};

type NativeButtonProps = React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>;

export type ButtonProps = Omit<NativeButtonProps, 'type' | 'ref'> &
  PropsWithChildren<{
    onClick?: () => void;
    className?: string;
    disabled?: boolean;
    isActive?: boolean;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    icon?: IconProps['name'];
    iconKind?: IconProps['kind'];

    tooltip?: string;
    tooltipPositon?: 'left' | 'top' | 'right' | 'bottom';
    buttonType?: NativeButtonProps['type'];
  }>;

const classes = {
  md: 'p-1 px-2 text-sm rounded-2xl bg-[#07DA63]',
  lg: 'p-1 md:px-2 text-[12px] rounded-2xl   w-24  px-4  :h-8 font-bold  whitespace-nowrap',
  sm: 'p-1 md:px-2 text-[12px] rounded-2xl   md:w-28 w-28  px-4  md:h-8 font-bold h-7 w-18 whitespace-nowrap',
  xs: 'p-1 px-2 text-xs rounded-md',
  custom: '',
};

export const buttonIconClasses = {
  lg: 'h-6 w-6',
  md: 'h-5 w-5',
  sm: 'h-4 w-4',
  xs: 'h-3 w-3',
};

export const ButtonGreen = React.forwardRef<
  HTMLButtonElement | null,
  ButtonProps
>(
  (
    {
      children,
      disabled,
      isActive,
      onClick,
      className,
      size = 'md',
      icon,
      iconKind,

      tooltip,
      tooltipPositon = 'left',
      buttonType = 'button', // This by default doesn't submit forms, unless "submit" type is specified
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={`group  relative bg-[#D9D9D9]/20   duration-200
 } ${classes[size]} ${
          disabled
            ? 'bg-[#D9D9D9]/20 opacity-30   hover:cursor-default '
            : 'bg-[#D9D9D9]/20  hover:cursor-pointer hover:bg-[#07DA63] hover:text-indigo-1300'
        } flex items-center justify-center gap-1 ${className}`}
        onClick={onClick}
        disabled={disabled === true}
        {...props}
      >
        {icon && (
          <Icon
            kind={iconKind}
            name={icon}
            className={buttonIconClasses[size]}
          />
        )}

        {children}

        {tooltip && (
          <div
            className="hidden group-hover:block absolute"
            style={{
              transition: 'all 50ms linear',
              top: '0%',
              [swapDirection(tooltipPositon)]: '120%',
              zIndex: 999,
            }}
          >
            <div
              className="bg-white text-nowrap text-xs border rounded-lg p-1 text-black font-normal"
              style={{ boxShadow: '0 6px 13px rgba(0, 0, 0, .1)' }}
            >
              {tooltip}
            </div>
          </div>
        )}
      </button>
    );
  }
);
