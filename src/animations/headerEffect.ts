import { Txt, View2D, Img, Rect } from '@revideo/2d';
import { Reference, waitFor, tween, all, createRef, Color } from '@revideo/core';
import { easeInOutQuad, easeInQuad, easeOutQuad, easeInBack, easeOutBack, easeInOutBack } from '@revideo/core/lib/tweening';

// 헤더 효과 타입 정의
export type HeaderEffectType =
  | '3d_extrude'      // 3D 돌출 글씨체
  | 'typewriter'      // 타이프라이터 효과
  | 'infinite_typewriter' // 무한 반복 타이프라이터 효과
  | 'punch_zoom'      // 충격 줌 효과
  | 'highlight_words' // 일부 단어 하이라이트
  | 'background_image' // 배경 이미지
  | 'glow_effect'     // 글로우 효과
  | 'bounce_in'       // 바운스 인 효과
  | 'slide_split'     // 슬라이드 분할 효과
  | 'rainbow_text'    // 무지개 텍스트 효과
  | 'shake_emphasis'  // 흔들림 강조 효과

// 헤더 효과 설정 인터페이스
export interface HeaderEffectConfig {
  type: HeaderEffectType;
  duration?: number;
  intensity?: number;
  highlightWords?: string[]; // 하이라이트할 단어들
  highlightColor?: string;   // 하이라이트 색상
  backgroundImage?: string;  // 배경 이미지 경로
  glowColor?: string;       // 글로우 색상
  textColor?: string;       // 기본 텍스트 색상
  strokeColor?: string;     // 테두리 색상
  fontSize?: number;        // 폰트 크기
  fontWeight?: number;      // 폰트 굵기
}

// 헤더 요소 참조 인터페이스
export interface HeaderElementRefs {
  headerRef: Reference<Txt>;
  backgroundRef?: Reference<Rect>;
  backgroundImageRef?: Reference<Img>;
  shadowRef?: Reference<Txt>;
  glowRef?: Reference<Txt>;
  additionalRefs?: any[];
}

/**
 * 3D 돌출 글씨체 효과
 */
export function* apply3DExtrudeEffect(
  headerRef: Reference<Txt>,
  duration: number = 1.0,
  intensity: number = 5
) {
  // 그림자 효과를 위한 다중 레이어 생성
  const shadowLayers: Reference<Txt>[] = [];
  const parent = headerRef().parent();
  
  if (parent) {
    // 여러 개의 그림자 레이어 생성 (3D 돌출 효과)
    for (let i = 1; i <= intensity; i++) {
      const shadowRef = createRef<Txt>();
      const shadowTxt = new Txt({
        text: headerRef().text(),
        fill: Color.lerp('#1E293B', '#000000', i / intensity),
        fontFamily: headerRef().fontFamily(),
        fontSize: headerRef().fontSize(),
        fontWeight: headerRef().fontWeight(),
        x: headerRef().x() + i * 2,
        y: headerRef().y() + i * 2,
        textAlign: headerRef().textAlign(),
        opacity: 0.8 - (i * 0.1),
        zIndex: -i
      });
      shadowRef(shadowTxt);
      parent.add(shadowTxt);
      shadowLayers.push(shadowRef);
    }
  }

  // 메인 텍스트 스타일 설정
  headerRef().fill('#32D74B');
  headerRef().stroke('#FFFFFF');
  headerRef().strokeFirst(true);
  headerRef().lineWidth(2);
  
  // 애니메이션: 3D 효과와 함께 나타남
  yield* all(
    headerRef().opacity(1, duration, easeOutBack),
    headerRef().scale(1.1, duration * 0.3, easeOutBack),
    headerRef().scale(1.0, duration * 0.7, easeInOutQuad)
  );

  return shadowLayers;
}

/**
 * 타이프라이터 효과
 */
export function* applyTypewriterEffect(
  headerRef: Reference<Txt>,
  fullText: string,
  duration: number = 2.0
) {
  headerRef().opacity(1);
  const charCount = fullText.length;
  const charDuration = duration / charCount;
  
  // 커서 효과를 위한 텍스트
  let currentText = '';
  
  for (let i = 0; i <= charCount; i++) {
    currentText = fullText.substring(0, i);
    
    // 타이핑 중일 때는 커서 표시
    if (i < charCount) {
      headerRef().text(currentText + '|');
      yield* waitFor(charDuration * 0.7);
      headerRef().text(currentText);
      yield* waitFor(charDuration * 0.3);
    } else {
      headerRef().text(currentText);
    }
  }
}

/**
 * 무한 반복 타이프라이터 효과
 */
export function* applyInfiniteTypewriterEffect(
  headerRef: Reference<Txt>,
  fullText: string,
  typingDuration: number = 2.0,
  pauseDuration: number = 4.0,
  totalDuration: number = 10.0
) {
  headerRef().opacity(1);
  const charCount = fullText.length;
  const charDuration = typingDuration / charCount;
  
  const cycleTime = typingDuration + pauseDuration;
  const cycles = Math.ceil(totalDuration / cycleTime);
  
  for (let cycle = 0; cycle < cycles; cycle++) {
    // 타이핑 효과
    let currentText = '';
    
    for (let i = 0; i <= charCount; i++) {
      currentText = fullText.substring(0, i);
      
      // 타이핑 중일 때는 커서 표시
      if (i < charCount) {
        headerRef().text(currentText + '|');
        yield* waitFor(charDuration * 0.7);
        headerRef().text(currentText);
        yield* waitFor(charDuration * 0.3);
      } else {
        headerRef().text(currentText);
      }
    }
    
    // 완성된 텍스트 표시 후 잠시 대기
    yield* waitFor(pauseDuration);
    
    // 다음 사이클을 위해 텍스트를 빈 상태로 초기화 (지우기 애니메이션 없이)
    if (cycle < cycles - 1) {
      headerRef().text('');
      yield* waitFor(0.5);
    }
  }
}

/**
 * 충격 줌 (Punch Zoom) 효과
 */
export function* applyPunchZoomEffect(
  headerRef: Reference<Txt>,
  duration: number = 1.5,
  intensity: number = 1.3
) {
  headerRef().opacity(1);
  headerRef().scale(0.8);
  
  // 빠른 확대 후 원래 크기로
  yield* headerRef().scale(intensity, duration * 0.2, easeOutQuad);
  yield* headerRef().scale(1.0, duration * 0.8, easeOutBack);
}

/**
 * 일부 단어 하이라이트 효과
 */
export function* applyHighlightWordsEffect(
  view: View2D,
  headerText: string,
  highlightWords: string[],
  config: HeaderEffectConfig,
  duration: number = 1.0
) {
  const words = headerText.split(' ');
  const wordRefs: Reference<Txt>[] = [];
  const baseY = config.fontSize ? -700 : -700;
  let currentX = -((words.length - 1) * 60); // 단어들을 중앙 정렬하기 위한 시작 X 위치
  
  // 각 단어를 개별 텍스트 요소로 생성
  for (let i = 0; i < words.length; i++) {
    const wordRef = createRef<Txt>();
    const isHighlight = highlightWords.includes(words[i]);
    
    const wordTxt = new Txt({
      text: words[i],
      fill: isHighlight ? (config.highlightColor || '#FF6B6B') : (config.textColor || '#32D74B'),
      fontFamily: 'Arial',
      fontSize: config.fontSize || 110,
      fontWeight: config.fontWeight || 900,
      opacity: 0,
      x: currentX,
      y: baseY,
      textAlign: 'center',
      stroke: config.strokeColor || '#1E293B',
      strokeFirst: true,
      lineWidth: isHighlight ? 5 : 3
    });
    
    // 하이라이트 효과는 색상과 크기로 구현
    
    wordRef(wordTxt);
    view.add(wordTxt);
    wordRefs.push(wordRef);
    currentX += words[i].length * 25 + 40; // 단어 길이에 따른 간격 조정
  }
  
  // 단어들을 순차적으로 나타내기
  for (let i = 0; i < wordRefs.length; i++) {
    const isHighlight = highlightWords.includes(words[i]);
    
    yield* all(
      wordRefs[i]().opacity(1, 0.3, easeOutQuad),
      wordRefs[i]().scale(isHighlight ? 1.2 : 1.0, 0.3, easeOutBack),
      wordRefs[i]().scale(isHighlight ? 1.1 : 1.0, 0.2, easeInOutQuad)
    );
    
    if (i < wordRefs.length - 1) {
      yield* waitFor(0.1);
    }
  }
  
  return wordRefs;
}

/**
 * 배경 이미지 효과
 */
export function* applyBackgroundImageEffect(
  view: View2D,
  headerRef: Reference<Txt>,
  imagePath: string,
  duration: number = 1.0
) {
  const backgroundImageRef = createRef<Img>();
  
  const bgImg = new Img({
    src: imagePath,
    width: 1920,
    height: 1080,
    opacity: 0,
    x: 0,
    y: 0,
    zIndex: -1
  });
  
  bgImg.filters.blur(3);
  bgImg.filters.brightness(0.3);
  
  backgroundImageRef(bgImg);
  view.add(bgImg);
  
  // 배경 이미지 페이드 인
  yield* backgroundImageRef().opacity(0.7, duration, easeInOutQuad);
  
  // 헤더 텍스트 강조
  yield* all(
    headerRef().opacity(1, duration * 0.5, easeOutQuad)
  );
  
  return backgroundImageRef;
}

/**
 * 글로우 효과 (색상 변화로 구현)
 */
export function* applyGlowEffect(
  headerRef: Reference<Txt>,
  glowColor: string = '#32D74B',
  duration: number = 1.0
) {
  headerRef().opacity(1);
  
  // 글로우 효과를 색상 변화와 크기 변화로 구현
  const originalFill = headerRef().fill();
  
  yield* all(
    headerRef().fill(glowColor, duration * 0.3, easeInOutQuad),
    headerRef().scale(1.1, duration * 0.3, easeInOutQuad),
    headerRef().scale(1.0, duration * 0.7, easeInOutQuad)
  );
  
  // 원래 색상으로 복귀
  yield* headerRef().fill(originalFill, 0.3, easeInOutQuad);
}

/**
 * 바운스 인 효과
 */
export function* applyBounceInEffect(
  headerRef: Reference<Txt>,
  duration: number = 1.0
) {
  headerRef().scale(0);
  headerRef().opacity(1);
  
  yield* headerRef().scale(1.0, duration, easeOutBack);
}

/**
 * 슬라이드 분할 효과
 */
export function* applySlideSplitEffect(
  view: View2D,
  headerText: string,
  config: HeaderEffectConfig,
  duration: number = 1.5
) {
  const midPoint = Math.floor(headerText.length / 2);
  const leftText = headerText.substring(0, midPoint);
  const rightText = headerText.substring(midPoint);
  
  const leftRef = createRef<Txt>();
  const rightRef = createRef<Txt>();
  
  const leftTxt = new Txt({
    text: leftText,
    fill: config.textColor || '#32D74B',
    fontFamily: 'Arial',
    fontSize: config.fontSize || 110,
    fontWeight: config.fontWeight || 900,
    opacity: 1,
    x: -400,
    y: -700,
    textAlign: 'right',
    stroke: config.strokeColor || '#1E293B',
    strokeFirst: true,
    lineWidth: 3
  });
  
  const rightTxt = new Txt({
    text: rightText,
    fill: config.textColor || '#32D74B',
    fontFamily: 'Arial',
    fontSize: config.fontSize || 110,
    fontWeight: config.fontWeight || 900,
    opacity: 1,
    x: 400,
    y: -700,
    textAlign: 'left',
    stroke: config.strokeColor || '#1E293B',
    strokeFirst: true,
    lineWidth: 3
  });
  
  leftRef(leftTxt);
  rightRef(rightTxt);
  view.add(leftTxt);
  view.add(rightTxt);
  
  // 중앙으로 슬라이드
  yield* all(
    leftRef().x(-leftText.length * 12, duration, easeOutBack),
    rightRef().x(rightText.length * 12, duration, easeOutBack)
  );
  
  return [leftRef, rightRef];
}

/**
 * 무지개 텍스트 효과
 */
export function* applyRainbowTextEffect(
  headerRef: Reference<Txt>,
  duration: number = 2.0
) {
  const colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];
  headerRef().opacity(1);
  
  // 무지개 색상 순환
  for (let cycle = 0; cycle < 2; cycle++) {
    for (const color of colors) {
      yield* headerRef().fill(color, duration / (colors.length * 2), easeInOutQuad);
    }
  }
  
  // 원래 색상으로 복귀
  yield* headerRef().fill('#32D74B', 0.3, easeInOutQuad);
}

/**
 * 흔들림 강조 효과
 */
export function* applyShakeEmphasisEffect(
  headerRef: Reference<Txt>,
  duration: number = 1.0,
  intensity: number = 10
) {
  headerRef().opacity(1);
  const originalX = headerRef().x();
  const shakeCount = 10;
  const shakeDuration = duration / shakeCount;
  
  for (let i = 0; i < shakeCount; i++) {
    const offset = (Math.random() - 0.5) * intensity;
    yield* headerRef().x(originalX + offset, shakeDuration / 2, easeInOutQuad);
    yield* headerRef().x(originalX, shakeDuration / 2, easeInOutQuad);
  }
}

/**
 * 메인 헤더 효과 적용 함수
 */
export function* applyHeaderEffect(
  view: View2D,
  headerRef: Reference<Txt>,
  headerText: string,
  config: HeaderEffectConfig
): Generator<any, HeaderElementRefs, any> {
  const duration = config.duration || 1.0;
  let additionalRefs: any[] = [];
  
  switch (config.type) {
    case '3d_extrude':
      additionalRefs = yield* apply3DExtrudeEffect(headerRef, duration, config.intensity || 5);
      break;
      
    case 'typewriter':
      yield* applyTypewriterEffect(headerRef, headerText, duration);
      break;
      
    case 'infinite_typewriter':
      yield* applyInfiniteTypewriterEffect(
        headerRef,
        headerText,
        2.0, // 타이핑 시간
        2.0, // 대기 시간
        duration // 총 지속 시간
      );
      break;
      
    case 'punch_zoom':
      yield* applyPunchZoomEffect(headerRef, duration, config.intensity || 1.3);
      break;
      
    case 'highlight_words':
      if (config.highlightWords) {
        additionalRefs = yield* applyHighlightWordsEffect(view, headerText, config.highlightWords, config, duration);
        // 원본 헤더는 숨김
        headerRef().opacity(0);
      }
      break;
      
    case 'background_image':
      if (config.backgroundImage) {
        const bgRef = yield* applyBackgroundImageEffect(view, headerRef, config.backgroundImage, duration);
        additionalRefs = [bgRef];
      }
      break;
      
    case 'glow_effect':
      yield* applyGlowEffect(headerRef, config.glowColor || '#32D74B', duration);
      break;
      
    case 'bounce_in':
      yield* applyBounceInEffect(headerRef, duration);
      break;
      
    case 'slide_split':
      additionalRefs = yield* applySlideSplitEffect(view, headerText, config, duration);
      // 원본 헤더는 숨김
      headerRef().opacity(0);
      break;
      
    case 'rainbow_text':
      yield* applyRainbowTextEffect(headerRef, duration);
      break;
      
    case 'shake_emphasis':
      yield* applyShakeEmphasisEffect(headerRef, duration, config.intensity || 10);
      break;
      
    default:
      // 기본 페이드 인 효과
      yield* headerRef().opacity(1, duration, easeInOutQuad);
      break;
  }
  
  return {
    headerRef,
    additionalRefs
  } as HeaderElementRefs;
}

/**
 * 헤더 효과 정리 함수
 */
export function cleanupHeaderEffect(refs: HeaderElementRefs) {
  if (refs.additionalRefs) {
    refs.additionalRefs.forEach((ref: any) => {
      if (ref && typeof ref === 'object' && 'remove' in ref) {
        ref.remove();
      }
    });
  }
}

/**
 * 미리 정의된 헤더 효과 프리셋
 */
export const HeaderEffectPresets: Record<string, HeaderEffectConfig> = {
  // 기본 3D 효과
  basic3D: {
    type: '3d_extrude',
    duration: 1.0,
    intensity: 3,
    textColor: '#32D74B',
    strokeColor: '#1E293B'
  },
  
  // 타이프라이터 효과
  typewriter: {
    type: 'typewriter',
    duration: 2.0,
    textColor: '#32D74B',
    strokeColor: '#1E293B'
  },
  
  // 강력한 충격 줌
  powerPunch: {
    type: 'punch_zoom',
    duration: 1.2,
    intensity: 1.5,
    textColor: '#FF6B6B',
    strokeColor: '#FFFFFF'
  },
  
  // 하이라이트 단어 (예시)
  highlightDemo: {
    type: 'highlight_words',
    duration: 1.5,
    highlightWords: ['중요한', '핵심', '특별한'],
    highlightColor: '#FFD93D',
    textColor: '#32D74B',
    strokeColor: '#1E293B'
  },
  
  // 글로우 효과
  greenGlow: {
    type: 'glow_effect',
    duration: 1.0,
    glowColor: '#32D74B',
    textColor: '#FFFFFF',
    strokeColor: '#000000'
  },
  
  // 바운스 인
  bounceIn: {
    type: 'bounce_in',
    duration: 1.0,
    textColor: '#32D74B',
    strokeColor: '#1E293B'
  },
  
  // 무지개 텍스트
  rainbow: {
    type: 'rainbow_text',
    duration: 3.0,
    strokeColor: '#000000'
  },
  
  // 흔들림 강조
  shake: {
    type: 'shake_emphasis',
    duration: 1.0,
    intensity: 15,
    textColor: '#FF6B6B',
    strokeColor: '#FFFFFF'
  }
};