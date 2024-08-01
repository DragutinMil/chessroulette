import React from 'react';
import { Ensure } from '@xmatter/util-kit';
import { Icon, IconProps } from '../Icon';
import { Button, ButtonProps, buttonIconClasses } from './Button';
import Link from 'next/link';

export type IconButtonSpecificProps = {
  iconColor?: IconProps['color'];
  iconClassName?: string;
};

export type IconButtonProps = Ensure<
  Omit<ButtonProps, 'children' | 'onClick'>,
  'icon'
> &
  IconButtonSpecificProps &
  (
    | {
        href: string;
        linkClassName?: string;
        onClick?: undefined;
      }
    | {
        href?: undefined;
        linkClassName?: undefined;
        onClick: ButtonProps['onClick'];
      }
  );

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  iconKind,
  iconColor,
  iconClassName = '',
  size = 'md',
  ...props
}) => {
  if (props.href) {
    return (
      <Button {...props} size={size}>
        <Link href={props.href} className={props.linkClassName}>
          <Icon
            name={icon}
            kind={iconKind}
            className={`${buttonIconClasses[size]} ${iconClassName}`}
            color={iconColor}
          />
        </Link>
      </Button>
    );
  }

  return (
    <Button {...props} size={size}>
      <Icon
        name={icon}
        kind={iconKind}
        className={`${buttonIconClasses[size]} ${iconClassName}`}
        color={iconColor}
      />
    </Button>
  );
};
