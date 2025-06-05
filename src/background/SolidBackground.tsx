import { Rect, RectProps } from '@revideo/2d';
import { PossibleColor } from '@revideo/core';

export interface SolidBackgroundProps extends RectProps {
  color?: PossibleColor;
}

export function SolidBackground({
  color = '#000000',
  children,
  ...props
}: SolidBackgroundProps) {
  return (
    <Rect
      fill={color}
      size={'100%'}
      {...props}
    >
      {children}
    </Rect>
  );
} 