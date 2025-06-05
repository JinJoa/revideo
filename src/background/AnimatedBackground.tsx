import { Rect, RectProps } from '@revideo/2d';
import { PossibleColor, createRef, Reference } from '@revideo/core';
import { all, tween } from '@revideo/core';

export interface AnimatedBackgroundProps extends RectProps {
  colors?: PossibleColor[];
  duration?: number;
  loop?: boolean;
}

export function AnimatedBackground({
  colors = ['#ff0000', '#00ff00', '#0000ff'],
  duration = 3,
  loop = true,
  children,
  ...props
}: AnimatedBackgroundProps) {
  const rectRef: Reference<Rect> = createRef<Rect>();

  return (
    <Rect
      ref={rectRef}
      fill={colors[0]}
      size={'100%'}
      {...props}
    >
      {children}
    </Rect>
  );
} 