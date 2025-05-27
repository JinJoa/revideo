import {Txt, View2D} from '@revideo/2d';
import {createRef, Color} from '@revideo/core';

interface SlideHeaderProps {
  header: string;
  view: View2D;
}

export function createSlideHeader({ header, view }: SlideHeaderProps) {
  const headerRef = createRef<Txt>();
  
  // Add header at the top of the video
  view.add(
    <Txt
      ref={headerRef}
      text={header}
      fill="#32D74B"
      fontFamily="Arial"
      fontSize={110}
      fontWeight={900}
      opacity={0}
      x={0}
      y={-700}
      textAlign="center"
      stroke="#1E293B"
      strokeFirst={true}
      lineWidth={3}
    />
  );

  return {
    headerRef,
    // 헤더 표시 애니메이션
    *showHeader() {
      yield* headerRef().opacity(1, 0);
    },
    // 헤더 숨김 애니메이션
    *hideHeader() {
      yield* headerRef().opacity(0, 0.5);
    }
  };
} 