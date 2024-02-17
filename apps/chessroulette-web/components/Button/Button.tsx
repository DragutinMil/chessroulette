import React, { PropsWithChildren } from 'react';
import { invoke, isOneOf } from '@xmatter/util-kit';
import { Icon, IconProps } from '../Icon';

type Direction = 'left' | 'right' | 'top' | 'bottom';
const swapDirection = (d: Direction): Direction => {
  if (isOneOf(d, ['left', 'right'])) {
    return d === 'left' ? 'right' : 'left';
  }

  return d === 'bottom' ? 'top' : 'bottom';
};

export type ButtonProps = Omit<
  React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >,
  'type'
> &
  PropsWithChildren<{
    type?: 'primary' | 'secondary' | 'clear' | 'custom';
    onClick?: () => void;
    className?: string;
    disabled?: boolean;
    isActive?: boolean;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    icon?: IconProps['name'];
    iconKind?: IconProps['kind'];
    bgColor?: BgColor;
    tooltip?: string;
    tooltipPositon?: 'left' | 'top' | 'right' | 'bottom';
  }>;

type BgColor =
  | 'purple'
  | 'green'
  | 'blue'
  | 'indigo'
  | 'yellow'
  | 'orange'
  | 'slate'
  | 'gray'
  | 'red'; // Add more colors

const getButtonColors = (color: BgColor, cssProp: 'bg' | 'text' = 'bg') => ({
  initial: `${cssProp}-${color}-500`,
  hover: `${cssProp}-${color}-600`,
  active: `${cssProp}-${color}-800`,
});

const toStringColors = (p: {
  initial: string;
  hover: string;
  active: string;
}) => `${p.initial} hover:${p.hover} active:${p.active}`;

const classes = {
  md: 'p-3 px-5 rounded-xl',
  lg: '',
  sm: 'p-1 px-2 text-sm rounded-lg',
  xs: 'p-1 px-2 text-xs rounded-md',
  primary: `text-white font-bold ${toStringColors(getButtonColors('indigo'))}`,
  clear: `text-gray-300 font-bold hover:text-white`,
  secondary: `${toStringColors(getButtonColors('slate'))}`,
  custom: '',
};

const typeToColors: {
  [k in NonNullable<Exclude<ButtonProps['type'], 'custom'>>]: BgColor;
} = {
  primary: 'indigo',
  secondary: 'slate',
  clear: 'slate',
  // custom: 'slate',
  // custom: '',
};

export const buttonIconClasses = {
  lg: 'h-6 w-6',
  md: 'h-5 w-5',
  sm: 'h-4 w-4',
  xs: 'h-3 w-3',
};

export const Button: React.FC<ButtonProps> = ({
  children,
  type = 'primary',
  disabled,
  isActive,
  onClick,
  className,
  size = 'md',
  icon,
  iconKind,
  bgColor,
  tooltip,
  tooltipPositon = 'left',
  ...props
}) => {
  const isActiveClass = invoke(() => {
    if (isActive && type !== 'custom') {
      const bgColorClass = getButtonColors(
        bgColor || typeToColors[type]
      ).active;
      return `${bgColorClass} hover:${bgColorClass}`;
    }

    return '';
  });

  return (
    <button
      className={`group relative hover:cursor-pointer ${classes[type]} ${
        classes[size]
      } ${
        disabled ? 'bg-slate-400 hover:bg-slate-400' : ''
      } flex items-center justify-center gap-1 ${className} ${
        bgColor ? toStringColors(getButtonColors(bgColor)) : ''
      } ${isActiveClass}`}
      onClick={onClick}
      disabled={disabled === true}
      {...props}
    >
      {icon && (
        <Icon kind={iconKind} name={icon} className={buttonIconClasses[size]} />
      )}

      {children}

      {tooltip && (
        <div
          className="hidden group-hover:block absolute sbg-red-100"
          style={{
            transition: 'all 50ms linear',
            top: '0%',

            [swapDirection(tooltipPositon)]: '120%',

            zIndex: 999,
          }}
        >
          <div
            className="bg-white stext-right text-nowrap   text-xs border rounded-lg p-1 text-black font-normal sbg-opacity-70"
            style={{
              boxShadow: '0 6px 13px rgba(0, 0, 0, .1)',
            }}
          >
            {tooltip}
          </div>
        </div>
      )}
    </button>
  );
};
