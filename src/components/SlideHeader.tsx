import { View2D } from '@revideo/2d';
import { createRef } from '@revideo/core';
import { JinText } from './JinText';
import {
  HeaderEffectType,
  HeaderEffectConfig,
  HeaderEffectPresets
} from '../animations/headerEffect';

interface SlideHeaderProps {
  header: string;
  view: View2D;
  effect?: HeaderEffectType | keyof typeof HeaderEffectPresets;
  effectConfig?: Partial<HeaderEffectConfig>;
  x?: number;
  y?: number;
}

export function createSlideHeader({ 
  header, 
  view, 
  effect, 
  effectConfig,
  x = 0,
  y = -780
}: SlideHeaderProps) {
  const jinTextRef = createRef<JinText>();
  
  // JinText 컴포넌트를 뷰에 추가
  view.add(
    <JinText
      ref={jinTextRef}
      text={header}
      effectType={effect as HeaderEffectType}
      effectDuration={effectConfig?.duration}
      effectIntensity={effectConfig?.intensity}
      highlightWords={effectConfig?.highlightWords}
      highlightColor={effectConfig?.highlightColor}
      backgroundImage={effectConfig?.backgroundImage}
      glowColor={effectConfig?.glowColor}
      textColor={effectConfig?.textColor}
      strokeColor={effectConfig?.strokeColor}
      textSize={effectConfig?.fontSize}
      textWeight={effectConfig?.fontWeight}
      preset={typeof effect === 'string' && effect in HeaderEffectPresets ? effect : null}
      x={x}
      y={y}
    />
  );

  return {
    jinTextRef,
    
    // 헤더 표시 애니메이션 (효과 적용)
    *showHeader() {
      yield* jinTextRef().playEffect();
    },
    
    // 헤더 숨김 애니메이션
    *hideHeader() {
      yield* jinTextRef().stopEffect();
    },
    
    // 헤더 효과 변경
    *changeEffect(newEffect: HeaderEffectType | keyof typeof HeaderEffectPresets, newConfig?: Partial<HeaderEffectConfig>) {
      yield* jinTextRef().changeEffect(newEffect as HeaderEffectType, newConfig);
    },
    
    // 프리셋 적용
    *applyPreset(presetName: keyof typeof HeaderEffectPresets) {
      yield* jinTextRef().applyPreset(presetName);
    },
    
    // 텍스트 변경
    *changeText(newText: string) {
      yield* jinTextRef().changeText(newText);
    }
  };
}

// 간소화된 헬퍼 함수들 (JinText 컴포넌트 활용)
export const HeaderEffects = {
  // 3D 돌출 효과
  create3D: (intensity: number = 3, duration: number = 1.0) => ({
    effect: '3d_extrude' as HeaderEffectType,
    effectConfig: { intensity, duration }
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
  createHighlight: (words: string[], color: string = '#FFD93D', duration: number = 1.5) => ({
    effect: 'highlight_words' as HeaderEffectType,
    effectConfig: { highlightWords: words, highlightColor: color, duration }
  }),
  
  // 배경 이미지 효과
  createWithBackground: (imagePath: string, duration: number = 1.0) => ({
    effect: 'background_image' as HeaderEffectType,
    effectConfig: { backgroundImage: imagePath, duration }
  }),
  
  // 글로우 효과
  createGlow: (color: string = '#32D74B', duration: number = 1.0) => ({
    effect: 'glow_effect' as HeaderEffectType,
    effectConfig: { glowColor: color, duration }
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
  }),

  // 프리셋 사용 헬퍼
  usePreset: (presetName: keyof typeof HeaderEffectPresets) => ({
    effect: presetName,
    effectConfig: {}
  })
};