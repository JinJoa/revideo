import { Rect, RectProps } from '@revideo/2d';
import { PossibleColor } from '@revideo/core';

export interface GradientBackgroundProps extends RectProps {
  fromColor?: PossibleColor;
  toColor?: PossibleColor;
  gradientDirection?: 'horizontal' | 'vertical' | 'diagonal';
}

export function GradientBackground({
  fromColor = '#000000',
  toColor = '#ffffff',
  gradientDirection = 'vertical',
  children,
  ...props
}: GradientBackgroundProps) {
  const degrees = gradientDirection === 'horizontal' ? 0 : 
                  gradientDirection === 'vertical' ? 90 : 45;
  
  return (
    <Rect
      fill={`linear-gradient(${degrees}deg, ${fromColor}, ${toColor})`}
      size={'100%'}
      {...props}
    >
      {children}
    </Rect>
  );
} 