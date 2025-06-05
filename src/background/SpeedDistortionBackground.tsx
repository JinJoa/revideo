import { Rect, RectProps, Line, Node } from '@revideo/2d';
import { 
  PossibleColor, 
  createRef, 
  Reference, 
  Vector2, 
  createSignal,
  SignalValue,
  SimpleSignal
} from '@revideo/core';
import { all, tween, chain, loop, waitFor } from '@revideo/core';

export interface SpeedDistortionBackgroundProps extends RectProps {
  /** 배경 색상 */
  backgroundColor?: PossibleColor;
  /** 선의 개수 */
  lineCount?: number;
  /** 선의 색상 */
  lineColor?: PossibleColor;
  /** 선의 두께 */
  lineStroke?: number;
  /** 속도 왜곡 강도 */
  distortionStrength?: number;
  /** 선의 투명도 */
  lineOpacity?: number;
  /** 선의 최대 길이 */
  maxLineLength?: number;
  /** 선의 최소 길이 */
  minLineLength?: number;
  /** 자동 애니메이션 시작 */
  autoStart?: boolean;
  /** 애니메이션 주기 (초) */
  animationDuration?: number;
}

interface LineData {
  startX: () => number;
  startY: () => number;
  endX: () => number;
  endY: () => number;
  opacity: () => number;
  speed: number;
  angle: number;
  length: number;
  phase: number;
}

export interface SpeedDistortionBackgroundHandle {
  animationProgress: SimpleSignal<number>;
}

export function SpeedDistortionBackground({
  backgroundColor = '#000000',
  lineCount = 50,
  lineColor = '#ffffff',
  lineStroke = 2,
  distortionStrength = 1,
  lineOpacity = 0.8,
  maxLineLength = 150,
  minLineLength = 50,
  autoStart = false,
  animationDuration = 8,
  children,
  ...props
}: SpeedDistortionBackgroundProps) {
  const containerRef: Reference<Rect> = createRef<Rect>();
  const linesRef: Reference<Node> = createRef<Node>();

  // 애니메이션 진행도를 위한 시그널
  const animationProgress = createSignal(0);

  // 자동 애니메이션 시작
  if (autoStart) {
    // 컴포넌트가 마운트된 후 애니메이션 시작
    setTimeout(() => {
      let progress = 0;
      setInterval(() => {
        progress += 0.016 / animationDuration; // 60fps 기준
        if (progress >= 1) progress = 0;
        animationProgress(progress);
      }, 16);
    }, 100);
  }

  // 선들의 데이터 생성
  const lines: LineData[] = [];
  for (let i = 0; i < lineCount; i++) {
    // 중앙에서 바깥으로 뻗어나가는 각도 (균등하게 분배)
    const baseAngle = (i / lineCount) * Math.PI * 2;
    // 약간의 랜덤 요소 추가
    const angle = baseAngle + (Math.random() - 0.5) * 0.3;
    
    const length = minLineLength + Math.random() * (maxLineLength - minLineLength);
    const speed = 0.8 + Math.random() * 0.4; // 속도를 더 일정하게
    const phase = Math.random() * Math.PI * 2;
    
    // 중앙에서의 거리 (일부 선들은 중앙 근처에서 시작)
    const startDistance = Math.random() * 100;
    
    const lineData: LineData = {
      startX: () => {
        const progress = animationProgress() * speed * distortionStrength;
        // 중앙에서 시작하여 바깥으로 이동, 순환
        const distance = (startDistance + progress * 300) % 1000;
        return Math.cos(angle) * distance;
      },
      startY: () => {
        const progress = animationProgress() * speed * distortionStrength;
        const distance = (startDistance + progress * 300) % 1000;
        return Math.sin(angle) * distance;
      },
      endX: () => {
        const progress = animationProgress() * speed * distortionStrength;
        const distance = (startDistance + progress * 300) % 1000;
        return Math.cos(angle) * (distance + length);
      },
      endY: () => {
        const progress = animationProgress() * speed * distortionStrength;
        const distance = (startDistance + progress * 300) % 1000;
        return Math.sin(angle) * (distance + length);
      },
      opacity: () => {
        const progress = animationProgress() * speed;
        const distance = (startDistance + progress * 300) % 1000;
        // 중앙에서 멀어질수록 투명해지다가 다시 나타나는 효과
        const fadeOut = Math.max(0.1, 1 - distance / 600);
        return lineOpacity * fadeOut * (0.7 + Math.sin(progress * 2 + phase) * 0.2);
      },
      speed,
      angle,
      length,
      phase
    };
    
    lines.push(lineData);
  }

  // Handle을 생성하여 컨테이너에 저장
  const handle: SpeedDistortionBackgroundHandle = {
    animationProgress
  };

  return (
    <Rect
      ref={(rect) => {
        containerRef(rect);
        if (rect) {
          // Handle을 rect에 저장하여 외부에서 접근 가능하게 함
          (rect as any).speedDistortionHandle = handle;
        }
      }}
      fill={backgroundColor}
      size={'100%'}
      {...props}
    >
      <Node ref={linesRef}>
        {lines.map((line, index) => (
          <Line
            key={`line-${index}`}
            points={() => [
              new Vector2(line.startX(), line.startY()),
              new Vector2(line.endX(), line.endY())
            ]}
            stroke={lineColor}
            lineWidth={lineStroke}
            opacity={line.opacity}
            lineCap={'round'}
            shadowColor={lineColor}
            shadowBlur={lineStroke * 2}
          />
        ))}
      </Node>
      
      {/* 추가적인 글로우 효과 */}
      <Node opacity={0.3}>
        {lines.map((line, index) => (
          <Line
            key={`glow-${index}`}
            points={() => [
              new Vector2(line.startX(), line.startY()),
              new Vector2(line.endX(), line.endY())
            ]}
            stroke={lineColor}
            lineWidth={lineStroke * 3}
            opacity={() => line.opacity() * 0.3}
            lineCap={'round'}
          />
        ))}
      </Node>
      
      {children}
    </Rect>
  );
}

// 애니메이션을 시작하는 헬퍼 함수
export function* animateSpeedDistortion(
  backgroundRef: Reference<Rect>,
  duration: number = 8
) {
  const background = backgroundRef();
  if (!background) return;
  
  // Handle에서 애니메이션 시그널을 가져옴
  const handle = (background as any).speedDistortionHandle as SpeedDistortionBackgroundHandle;
  
  if (handle && handle.animationProgress) {
    yield* loop(
      duration, 
      () => tween(1, (value) => {
        handle.animationProgress(value);
      })
    );
  }
}

// 더 간단한 사용을 위한 애니메이션 함수
export function* createSpeedDistortionLoop(
  backgroundRef: Reference<Rect>,
  cycleDuration: number = 8
) {
  const background = backgroundRef();
  if (!background) return;
  
  const handle = (background as any).speedDistortionHandle as SpeedDistortionBackgroundHandle;
  
  if (handle && handle.animationProgress) {
    yield* loop(Infinity, () => 
      tween(cycleDuration, (value) => {
        handle.animationProgress(value);
      })
    );
  }
} 