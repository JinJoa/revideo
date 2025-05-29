import {Txt, View2D} from '@revideo/2d';
import {createRef, Color} from '@revideo/core';
import {
  HeaderEffectType,
  HeaderEffectConfig,
  HeaderElementRefs,
  applyHeaderEffect,
  cleanupHeaderEffect,
  HeaderEffectPresets
} from '../animations/headerEffect';

interface SlideHeaderProps {
  header: string;
  view: View2D;
  effect?: HeaderEffectType | keyof typeof HeaderEffectPresets;
  effectConfig?: Partial<HeaderEffectConfig>;
}

export function createSlideHeader({ header, view, effect, effectConfig }: SlideHeaderProps) {
  const headerRef = createRef<Txt>();
  let headerElementRefs: HeaderElementRefs | null = null;
  
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
      y={-780}
      textAlign="center"
      stroke="#1E293B"
      strokeFirst={true}
      lineWidth={3}
    />
  );

  return {
    headerRef,
    
    // 헤더 표시 애니메이션 (효과 적용)
    *showHeader() {
      if (effect) {
        let config: HeaderEffectConfig;
        
        // 프리셋 사용 또는 직접 효과 타입 지정
        if (typeof effect === 'string' && effect in HeaderEffectPresets) {
          config = { ...HeaderEffectPresets[effect], ...effectConfig };
        } else {
          config = {
            type: effect as HeaderEffectType,
            duration: 1.0,
            ...effectConfig
          };
        }
        
        // 헤더 효과 적용
        headerElementRefs = yield* applyHeaderEffect(view, headerRef, header, config);
      } else {
        // 기본 페이드 인 효과
        yield* headerRef().opacity(1, 0.5);
      }
    },
    
    // 헤더 숨김 애니메이션
    *hideHeader() {
      yield* headerRef().opacity(0, 0.5);
      
      // 추가 요소들 정리
      if (headerElementRefs) {
        cleanupHeaderEffect(headerElementRefs);
        headerElementRefs = null;
      }
    },
    
    // 헤더 효과 변경
    *changeEffect(newEffect: HeaderEffectType | keyof typeof HeaderEffectPresets, newConfig?: Partial<HeaderEffectConfig>) {
      // 기존 효과 정리
      if (headerElementRefs) {
        cleanupHeaderEffect(headerElementRefs);
      }
      
      // 헤더 초기화
      headerRef().opacity(0);
      headerRef().scale(1.0);
      headerRef().fill('#32D74B');
      
      let config: HeaderEffectConfig;
      
      // 새로운 효과 적용
      if (typeof newEffect === 'string' && newEffect in HeaderEffectPresets) {
        config = { ...HeaderEffectPresets[newEffect], ...newConfig };
      } else {
        config = {
          type: newEffect as HeaderEffectType,
          duration: 1.0,
          ...newConfig
        };
      }
      
      headerElementRefs = yield* applyHeaderEffect(view, headerRef, header, config);
    }
  };
}

// 헤더 효과 사용 예시를 위한 헬퍼 함수들
export const HeaderEffects = {
  // 3D 돌출 효과
  create3D: (intensity: number = 3) => ({
    effect: '3d_extrude' as HeaderEffectType,
    effectConfig: { intensity, duration: 1.0 }
  }),
  
  // 타이프라이터 효과
  createTypewriter: (duration: number = 2.0) => ({
    effect: 'typewriter' as HeaderEffectType,
    effectConfig: { duration }
  }),
  
  // 무한 반복 타이프라이터 효과
  createInfiniteTypewriter: (totalDuration: number = 30.0) => ({
    effect: 'infinite_typewriter' as HeaderEffectType,
    effectConfig: { duration: totalDuration }
  }),
  
  // 충격 줌 효과
  createPunchZoom: (intensity: number = 1.3, duration: number = 1.2) => ({
    effect: 'punch_zoom' as HeaderEffectType,
    effectConfig: { intensity, duration }
  }),
  
  // 하이라이트 단어 효과
  createHighlight: (words: string[], color: string = '#FFD93D') => ({
    effect: 'highlight_words' as HeaderEffectType,
    effectConfig: { highlightWords: words, highlightColor: color, duration: 1.5 }
  }),
  
  // 배경 이미지 효과
  createWithBackground: (imagePath: string) => ({
    effect: 'background_image' as HeaderEffectType,
    effectConfig: { backgroundImage: imagePath, duration: 1.0 }
  }),
  
  // 글로우 효과
  createGlow: (color: string = '#32D74B') => ({
    effect: 'glow_effect' as HeaderEffectType,
    effectConfig: { glowColor: color, duration: 1.0 }
  }),
  
  // 바운스 인 효과
  createBounce: (duration: number = 1.0) => ({
    effect: 'bounce_in' as HeaderEffectType,
    effectConfig: { duration }
  }),
  
  // 슬라이드 분할 효과
  createSlideSplit: (duration: number = 1.5) => ({
    effect: 'slide_split' as HeaderEffectType,
    effectConfig: { duration }
  }),
  
  // 무지개 텍스트 효과
  createRainbow: (duration: number = 3.0) => ({
    effect: 'rainbow_text' as HeaderEffectType,
    effectConfig: { duration }
  }),
  
  // 흔들림 강조 효과
  createShake: (intensity: number = 10, duration: number = 1.0) => ({
    effect: 'shake_emphasis' as HeaderEffectType,
    effectConfig: { intensity, duration }
  })
};