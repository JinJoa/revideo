import { View2D } from '@revideo/2d';
import { createRef } from '@revideo/core';
import { 
  JinText,
  HeaderEffectType,
  HeaderEffectConfig
} from '../components/JinText';

interface SlideHeaderProps {
  header: string;
  view: View2D;
  effect?: HeaderEffectType;
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
      glowColor={effectConfig?.glowColor}
      textColor={effectConfig?.textColor}
      strokeColor={effectConfig?.strokeColor}
      textSize={effectConfig?.fontSize}
      textWeight={effectConfig?.fontWeight}
      // preset={typeof effect === 'string' && effect in HeaderEffectPresets ? effect : null}
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
    
    // // 헤더 효과 변경
    // *changeEffect(newEffect: HeaderEffectType | keyof typeof HeaderEffectPresets, newConfig?: Partial<HeaderEffectConfig>) {
    //   yield* jinTextRef().changeEffect(newEffect as HeaderEffectType, newConfig);
    // },
    
    // // 프리셋 적용
    // *applyPreset(presetName: keyof typeof HeaderEffectPresets) {
    //   yield* jinTextRef().applyPreset(presetName);
    // },
    
    // 텍스트 변경
    *changeText(newText: string) {
      yield* jinTextRef().changeText(newText);
    }
  };
}