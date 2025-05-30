import {
  Node,
  NodeProps,
  Txt,
  View2D,
  signal,
  initial,
  colorSignal
} from '@revideo/2d';
import {
  SignalValue,
  SimpleSignal,
  ColorSignal,
  PossibleColor,
  createRef
} from '@revideo/core';
import {
  HeaderEffectType,
  HeaderEffectConfig,
  HeaderElementRefs,
  applyHeaderEffect,
  cleanupHeaderEffect,
  HeaderEffectPresets
} from '../animations/headerEffect';

// JinText 컴포넌트의 Props 인터페이스 (필수 속성만)
export interface JinTextProps extends NodeProps {
  // 텍스트 관련 속성
  text?: SignalValue<string>;
  
  // 효과 관련 속성
  effectType?: SignalValue<HeaderEffectType>;
  effectDuration?: SignalValue<number>;
  effectIntensity?: SignalValue<number>;
  
  // 하이라이트 효과 속성
  highlightWords?: SignalValue<string[]>;
  highlightColor?: SignalValue<PossibleColor>;
  
  // 배경 이미지 속성
  backgroundImage?: SignalValue<string>;
  
  // 글로우 효과 속성
  glowColor?: SignalValue<PossibleColor>;
  
  // 텍스트 스타일 속성
  textColor?: SignalValue<PossibleColor>;
  strokeColor?: SignalValue<PossibleColor>;
  textSize?: SignalValue<number>;
  textWeight?: SignalValue<number>;
  
  // 자동 재생 속성
  autoPlay?: SignalValue<boolean>;
  
  // 프리셋 사용
  preset?: SignalValue<keyof typeof HeaderEffectPresets>;
}

export class JinText extends Node {
  // 텍스트 관련 시그널
  @initial('')
  @signal()
  public declare readonly text: SimpleSignal<string, this>;
  
  // 효과 관련 시그널
  @initial('3d_extrude')
  @signal()
  public declare readonly effectType: SimpleSignal<HeaderEffectType, this>;
  
  @initial(1.0)
  @signal()
  public declare readonly effectDuration: SimpleSignal<number, this>;
  
  @initial(5)
  @signal()
  public declare readonly effectIntensity: SimpleSignal<number, this>;
  
  // 하이라이트 효과 시그널
  @initial([])
  @signal()
  public declare readonly highlightWords: SimpleSignal<string[], this>;
  
  @initial('#FFD93D')
  @colorSignal()
  public declare readonly highlightColor: ColorSignal<this>;
  
  // 배경 이미지 시그널
  @initial('')
  @signal()
  public declare readonly backgroundImage: SimpleSignal<string, this>;
  
  // 글로우 효과 시그널
  @initial('#32D74B')
  @colorSignal()
  public declare readonly glowColor: ColorSignal<this>;
  
  // 텍스트 스타일 시그널
  @initial('#32D74B')
  @colorSignal()
  public declare readonly textColor: ColorSignal<this>;
  
  @initial('#1E293B')
  @colorSignal()
  public declare readonly strokeColor: ColorSignal<this>;
  
  @initial(110)
  @signal()
  public declare readonly textSize: SimpleSignal<number, this>;
  
  @initial(900)
  @signal()
  public declare readonly textWeight: SimpleSignal<number, this>;
  
  // 자동 재생 시그널
  @initial(false)
  @signal()
  public declare readonly autoPlay: SimpleSignal<boolean, this>;
  
  // 프리셋 시그널
  @initial(null)
  @signal()
  public declare readonly preset: SimpleSignal<keyof typeof HeaderEffectPresets | null, this>;

  // 내부 참조들
  private readonly headerRef = createRef<Txt>();
  private headerElementRefs: HeaderElementRefs | null = null;
  private isPlaying = false;

  public constructor(props?: JinTextProps) {
    super({
      ...props,
    });

    // 헤더 텍스트 요소 생성
    this.add(
      <Txt
        ref={this.headerRef}
        text={this.text}
        fill={this.textColor}
        fontFamily="Arial"
        fontSize={this.textSize}
        fontWeight={this.textWeight}
        opacity={0}
        textAlign="center"
        stroke={this.strokeColor}
        strokeFirst={true}
        lineWidth={3}
      />
    );

    // 자동 재생이 활성화된 경우 효과 시작
    if (this.autoPlay()) {
      this.playEffect();
    }
  }

  /**
   * 효과 재생
   */
  public *playEffect() {
    if (this.isPlaying) return;
    this.isPlaying = true;

    try {
      // 기존 효과 정리
      this.cleanup();

      // 효과 설정 생성
      const config = this.getEffectConfig();
      
      // View2D 참조 획득
      const view = this.getParentView();
      if (!view) {
        console.warn('JinText: View2D parent not found');
        return;
      }

      // 효과 적용
      this.headerElementRefs = yield* applyHeaderEffect(
        view,
        this.headerRef,
        this.text(),
        config
      );
    } finally {
      this.isPlaying = false;
    }
  }

  /**
   * 효과 중지 및 정리
   */
  public *stopEffect() {
    this.cleanup();
    yield* this.headerRef().opacity(0, 0.3);
  }

  /**
   * 효과 타입 변경
   */
  public *changeEffect(newType: HeaderEffectType, newConfig?: Partial<HeaderEffectConfig>) {
    this.effectType(newType);
    
    if (newConfig) {
      if (newConfig.duration !== undefined) this.effectDuration(newConfig.duration);
      if (newConfig.intensity !== undefined) this.effectIntensity(newConfig.intensity);
      if (newConfig.highlightWords !== undefined) this.highlightWords(newConfig.highlightWords);
      if (newConfig.highlightColor !== undefined) this.highlightColor(newConfig.highlightColor);
      if (newConfig.backgroundImage !== undefined) this.backgroundImage(newConfig.backgroundImage);
      if (newConfig.glowColor !== undefined) this.glowColor(newConfig.glowColor);
      if (newConfig.textColor !== undefined) this.textColor(newConfig.textColor);
      if (newConfig.strokeColor !== undefined) this.strokeColor(newConfig.strokeColor);
      if (newConfig.fontSize !== undefined) this.textSize(newConfig.fontSize);
      if (newConfig.fontWeight !== undefined) this.textWeight(newConfig.fontWeight);
    }
    
    // 효과 재시작
    yield* this.stopEffect();
    yield* this.playEffect();
  }

  /**
   * 프리셋 적용
   */
  public *applyPreset(presetName: keyof typeof HeaderEffectPresets) {
    const preset = HeaderEffectPresets[presetName];
    if (!preset) {
      console.warn(`JinText: Preset '${presetName}' not found`);
      return;
    }

    this.preset(presetName);
    yield* this.changeEffect(preset.type, preset);
  }

  /**
   * 텍스트 변경
   */
  public *changeText(newText: string) {
    this.text(newText);
    this.headerRef().text(newText);
    
    if (this.autoPlay()) {
      yield* this.stopEffect();
      yield* this.playEffect();
    }
  }

  /**
   * 효과 설정 객체 생성 (간소화됨)
   */
  private getEffectConfig(): HeaderEffectConfig {
    const presetName = this.preset();
    const baseConfig: HeaderEffectConfig = {
      type: this.effectType(),
      duration: this.effectDuration(),
      intensity: this.effectIntensity(),
      highlightWords: this.highlightWords(),
      highlightColor: this.highlightColor().toString(),
      backgroundImage: this.backgroundImage() || undefined,
      glowColor: this.glowColor().toString(),
      textColor: this.textColor().toString(),
      strokeColor: this.strokeColor().toString(),
      fontSize: this.textSize(),
      fontWeight: this.textWeight(),
    };

    // 프리셋이 있는 경우 병합
    if (presetName && HeaderEffectPresets[presetName]) {
      const preset = HeaderEffectPresets[presetName];
      return { ...preset, ...baseConfig };
    }

    return baseConfig;
  }

  /**
   * 부모 View2D 찾기 (간소화됨)
   */
  private getParentView(): View2D | null {
    let current = this.parent();
    while (current) {
      if (current instanceof View2D) return current;
      current = current.parent();
    }
    return null;
  }

  /**
   * 효과 정리
   */
  private cleanup() {
    if (this.headerElementRefs) {
      cleanupHeaderEffect(this.headerElementRefs);
      this.headerElementRefs = null;
    }
    
    // 헤더 상태 초기화
    this.headerRef().opacity(0);
    this.headerRef().scale(1.0);
    this.headerRef().rotation(0);
    this.headerRef().fill(this.textColor());
  }

  /**
   * 컴포넌트 제거 시 정리
   */
  public override dispose() {
    this.cleanup();
    super.dispose();
  }
} 