import { Txt, View2D, Rect } from '@revideo/2d';
import { Reference, waitFor, tween, all, createRef, Color } from '@revideo/core';
import { easeInOutQuad, easeInQuad, easeOutQuad, easeInBack, easeOutBack, easeInOutBack } from '@revideo/core/lib/tweening';
import { JinImage } from '../components/JinImage';

// 헤더 효과 타입 정의
export type HeaderEffectType =
  | '3d_extrude'      // 3D 돌출 글씨체
  | 'infinite_typewriter' // 무한 반복 타이프라이터 효과
  | 'infinite_punch_zoom' // 무한 반복 충격 줌 효과
  | 'highlight_words' // 일부 단어 하이라이트
  | 'background_image' // 배경 이미지
  | 'infinite_glow_effect' // 무한 반복 글로우 효과
  | 'infinite_bounce' // 무한 반복 바운스 효과
  | 'infinite_rainbow_text' // 무한 반복 무지개 텍스트 효과
  | 'infinite_shake_emphasis' // 무한 반복 흔들림 강조 효과

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
  backgroundImageRef?: Reference<JinImage>;
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
  let elapsedTime = 0;
  let cycle = 0;
  
  console.log(`Infinite typewriter: totalDuration=${totalDuration}s, cycleTime=${cycleTime}s`);
  
  while (elapsedTime < totalDuration) {
    const remainingTime = totalDuration - elapsedTime;
    
    // 남은 시간이 한 사이클보다 적으면 중단
    if (remainingTime < typingDuration) {
      console.log(`Breaking early: remainingTime=${remainingTime}s < typingDuration=${typingDuration}s`);
      break;
    }
    
    console.log(`Starting cycle ${cycle + 1}, elapsedTime=${elapsedTime}s`);
    
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
    
    elapsedTime += typingDuration;
    
    // 완성된 텍스트 표시 후 잠시 대기 (남은 시간 확인)
    const remainingTimeAfterTyping = totalDuration - elapsedTime;
    if (remainingTimeAfterTyping > 0) {
      const actualPauseTime = Math.min(pauseDuration, remainingTimeAfterTyping);
      yield* waitFor(actualPauseTime);
      elapsedTime += actualPauseTime;
      
      // 텍스트 초기화 (다음 사이클이 있을 경우만)
      if (remainingTimeAfterTyping > actualPauseTime) {
        headerRef().text('');
        const clearTime = Math.min(0.5, totalDuration - elapsedTime);
        if (clearTime > 0) {
          yield* waitFor(clearTime);
          elapsedTime += clearTime;
        }
      }
    }
    
    cycle++;
  }
  
  console.log(`Infinite typewriter completed: ${cycle} cycles, finalElapsedTime=${elapsedTime}s`);
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
 * 무한 반복 충격 줌 (Punch Zoom) 효과
 */
export function* applyInfinitePunchZoomEffect(
  headerRef: Reference<Txt>,
  totalDuration: number = 30.0,
  intensity: number = 1.3
) {
  headerRef().opacity(1);
  headerRef().scale(1.0);
  
  const cycleTime = 2.5; // 각 펀치 사이클 시간
  let elapsedTime = 0;
  let cycle = 0;
  
  while (elapsedTime < totalDuration) {
    const remainingTime = totalDuration - elapsedTime;
    
    if (remainingTime < cycleTime) {
      break;
    }
    
    // 펀치 줌 효과
    yield* all(
      headerRef().scale(0.9, 0.1, easeInQuad),
      headerRef().scale(intensity, 0.4, easeOutQuad),
      headerRef().scale(1.0, 1.0, easeOutBack)
    );
    
    elapsedTime += 1.5;
    
    // 다음 사이클까지 대기
    if (remainingTime > 1.5) {
      yield* waitFor(1.0);
      elapsedTime += 1.0;
    }
    
    cycle++;
  }
}

/**
 * 무한 반복 글로우 효과
 */
export function* applyInfiniteGlowEffect(
  headerRef: Reference<Txt>,
  glowColor: string = '#dbfffe',
  totalDuration: number = 30.0
) {
  headerRef().opacity(1);
  
  const parent = headerRef().parent();
  if (!parent) return;

  // 글로우 레이어들 생성
  const glowLayers: Reference<Txt>[] = [];
  
  for (let i = 1; i <= 3; i++) {
    const glowRef = createRef<Txt>();
    const glowTxt = new Txt({
      text: headerRef().text(),
      fill: glowColor,
      fontFamily: headerRef().fontFamily(),
      fontSize: headerRef().fontSize(),
      fontWeight: headerRef().fontWeight(),
      x: headerRef().x(),
      y: headerRef().y(),
      textAlign: headerRef().textAlign(),
      opacity: 0, // 처음에는 보이지 않음
      zIndex: -i,
      lineWidth: i * 8,
      stroke: glowColor,
      strokeFirst: false
    });
    
    glowTxt.filters.blur(i * 4);
    glowRef(glowTxt);
    parent.add(glowTxt);
    glowLayers.push(glowRef);
  }
  
  // 메인 텍스트 스타일 설정
  headerRef().fill('#FFFFFF');
  headerRef().stroke(glowColor);
  headerRef().strokeFirst(true);
  headerRef().lineWidth(2);
  
  // 무한 반복 글로우 나타났다가 사라지기
  const cycleTime = 3.0; // 한 사이클 시간 (나타나고 사라지는 시간)
  let elapsedTime = 0;
  
  while (elapsedTime < totalDuration) {
    if (totalDuration - elapsedTime < cycleTime) break;
    
    // 글로우 나타나기 (페이드 인)
    yield* all(
      ...glowLayers.map((layer, i) => 
        layer().opacity(0.9 - (i * 0.2), 1.0, easeInOutQuad) // 강한 글로우로 나타남
      )
    );
    
    elapsedTime += 1.0;
    
    // 잠깐 유지
    if (totalDuration - elapsedTime > 0.5) {
      yield* waitFor(0.5);
      elapsedTime += 0.5;
    }
    
    // 글로우 사라지기 (페이드 아웃)
    if (totalDuration - elapsedTime > 1.0) {
      yield* all(
        ...glowLayers.map((layer) => 
          layer().opacity(0, 1.0, easeInOutQuad) // 완전히 사라짐
        )
      );
      
      elapsedTime += 1.0;
    }
    
    // 다음 사이클까지 대기
    if (totalDuration - elapsedTime > 0.5) {
      yield* waitFor(0.5);
      elapsedTime += 0.5;
    }
  }
  
  return glowLayers;
}

/**
 * 무한 반복 바운스 효과
 */
export function* applyInfiniteBounceEffect(
  headerRef: Reference<Txt>,
  totalDuration: number = 30.0
) {
  headerRef().opacity(1);
  headerRef().scale(1.0);
  
  const cycleTime = 1.5;
  let elapsedTime = 0;
  
  while (elapsedTime < totalDuration) {
    if (totalDuration - elapsedTime < cycleTime) break;
    
    yield* all(
      headerRef().scale(0.95, 0.2, easeInQuad),
      headerRef().scale(1.1, 0.5, easeOutBack),
      headerRef().scale(1.0, 0.8, easeInOutQuad)
    );
    
    elapsedTime += cycleTime;
    
    if (totalDuration - elapsedTime > 0.5) {
      yield* waitFor(0.5);
      elapsedTime += 0.5;
    }
  }
}

/**
 * 무한 반복 무지개 텍스트 효과
 */
export function* applyInfiniteRainbowTextEffect(
  headerRef: Reference<Txt>,
  totalDuration: number = 30.0
) {
  headerRef().opacity(1);
  headerRef().fill('#FFFFFF');
  headerRef().stroke('#FFFFFF');
  headerRef().strokeFirst(true);
  headerRef().lineWidth(2);
  
  const colors = ['#FF0000', '#FF8800', '#FFFF00', '#00FF00', '#0000FF', '#8800FF', '#FF00FF'];
  const colorDuration = 0.4;
  const resetDuration = 0.2;
  const waitDuration = 0.5;
  const cycleDuration = colors.length * colorDuration + resetDuration + waitDuration;
  
  let elapsedTime = 0;

  while (elapsedTime + cycleDuration <= totalDuration) {
    // 색상 순환
    for (const color of colors) {
      yield* headerRef().fill(color, colorDuration, easeInOutQuad);
    }

    // 원래 색으로 복귀
    yield* headerRef().fill('#FFFFFF', resetDuration, easeInOutQuad);
    yield* waitFor(waitDuration);

    elapsedTime += cycleDuration;
  }
}

/**
 * 무한 반복 흔들림 강조 효과
 */
export function* applyInfiniteShakeEmphasisEffect(
  headerRef: Reference<Txt>,
  totalDuration: number = 30.0,
  intensity: number = 10
) {
  headerRef().opacity(1);
  const originalX = headerRef().x();
  
  const cycleTime = 1.5;
  let elapsedTime = 0;
  
  while (elapsedTime < totalDuration) {
    if (totalDuration - elapsedTime < cycleTime) break;
    
    const shakeCount = 6;
    const shakeDuration = 1.0 / shakeCount;
    
    for (let i = 0; i < shakeCount; i++) {
      if (totalDuration - elapsedTime < shakeDuration) break;
      
      const offset = (Math.random() - 0.5) * intensity;
      yield* headerRef().x(originalX + offset, shakeDuration / 2, easeInOutQuad);
      yield* headerRef().x(originalX, shakeDuration / 2, easeInOutQuad);
      elapsedTime += shakeDuration;
    }
    
    if (totalDuration - elapsedTime > 0.5) {
      yield* waitFor(0.5);
      elapsedTime += 0.5;
    }
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
      
    case 'infinite_typewriter':
      yield* applyInfiniteTypewriterEffect(
        headerRef,
        headerText,
        2.0, // 타이핑 시간
        2.0, // 대기 시간
        duration // 총 지속 시간
      );
      break;
      
    case 'infinite_punch_zoom':
      yield* applyInfinitePunchZoomEffect(headerRef, duration, config.intensity || 1.3);
      break;
      
    case 'highlight_words':
      if (config.highlightWords) {
        additionalRefs = yield* applyHighlightWordsEffect(view, headerText, config.highlightWords, config, duration);
        // 원본 헤더는 숨김
        headerRef().opacity(0);
      }
      break;
      
    // case 'background_image':
    //   if (config.backgroundImage) {
    //     const bgRef = yield* applyBackgroundImageEffect(view, headerRef, config.backgroundImage, duration);
    //     additionalRefs = [bgRef];
    //   }
    //   break;
      
    case 'infinite_glow_effect':
      additionalRefs = yield* applyInfiniteGlowEffect(headerRef, config.glowColor || '#32D74B', duration);
      break;
      
    case 'infinite_bounce':
      yield* applyInfiniteBounceEffect(headerRef, duration);
      break;
      
    case 'infinite_rainbow_text':
      yield* applyInfiniteRainbowTextEffect(headerRef, duration);
      break;
      
    case 'infinite_shake_emphasis':
      yield* applyInfiniteShakeEmphasisEffect(headerRef, duration, config.intensity || 10);
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
    strokeColor: '#1d8505'
  },
  
  // 무한 타이프라이터 효과
  infiniteTypewriter: {
    type: 'infinite_typewriter',
    duration: 30.0,
    textColor: '#32D74B',
    strokeColor: '#1E293B'
  },
  
  // 강력한 무한 충격 줌
  infinitePowerPunch: {
    type: 'infinite_punch_zoom',
    duration: 30.0,
    intensity: 1.5,
    textColor: '#FF6B6B',
    strokeColor: '#FFFFFF'
  },
  
  // 하이라이트 단어 (예시)
  highlightDemo: {
    type: 'highlight_words',
    duration: 1.5,
    highlightWords: ['탈모'],
    highlightColor: '#FFD93D',
    textColor: '#32D74B',
    strokeColor: '#1E293B'
  },
  
  // 무한 글로우 효과
  infiniteGreenGlow: {
    type: 'infinite_glow_effect',
    duration: 30.0,
    glowColor: '#32D74B',
    textColor: '#FFFFFF',
    strokeColor: '#000000'
  },
  
  // 무한 바운스
  infiniteBounceIn: {
    type: 'infinite_bounce',
    duration: 30.0,
    textColor: '#32D74B',
    strokeColor: '#1E293B'
  },
  
  // 무한 무지개 텍스트
  infiniteRainbow: {
    type: 'infinite_rainbow_text',
    duration: 30.0,
    textColor: '#FFFFFF',
    strokeColor: '#FFFFFF'
  },
  
  // 무한 흔들림 강조
  infiniteShake: {
    type: 'infinite_shake_emphasis',
    duration: 30.0,
    intensity: 15,
    textColor: '#FF6B6B',
    strokeColor: '#FFFFFF'
  }
};