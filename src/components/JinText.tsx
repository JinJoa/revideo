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
  cleanupHeaderEffect
} from '../animations/headerEffect';

// JinText 컴포넌트의 Props 인터페이스 (필수 속성만)
export interface JinTextProps extends NodeProps {
  // 텍스트 관련 속성
  text?: SignalValue<string>;
  
  // 효과 관련 속성
  effectType?: SignalValue<HeaderEffectType>;
  effectDuration?: SignalValue<number>;
  effectIntensity?: SignalValue<number>;
  
  // 글로우 효과 속성
  glowColor?: SignalValue<PossibleColor>;
  
  // 텍스트 스타일 속성
  textColor?: SignalValue<PossibleColor>;
  strokeColor?: SignalValue<PossibleColor>;
  textSize?: SignalValue<number>;
  textWeight?: SignalValue<number>;
  
  // 자동 재생 속성
  autoPlay?: SignalValue<boolean>;
  
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
  
  // 글로우 효과 시그널
  @initial('#32D74B')
  @colorSignal()
  public declare readonly glowColor: ColorSignal<this>;
  
  // 텍스트 스타일 시그널
  @initial('#FFFFFF')
  @colorSignal()
  public declare readonly textColor: ColorSignal<this>;
  
  @initial('#FF9603')
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
        opacity={1}
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
  }

  /**
   * 효과 타입 변경
   */
  public *changeEffect(newType: HeaderEffectType, newConfig?: Partial<HeaderEffectConfig>) {
    this.effectType(newType);
    
    if (newConfig) {
      if (newConfig.duration !== undefined) this.effectDuration(newConfig.duration);
      if (newConfig.intensity !== undefined) this.effectIntensity(newConfig.intensity);
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
   * 효과 설정 객체 생성
   */
  private getEffectConfig(): HeaderEffectConfig {
    // const presetName = this.preset();
    const baseConfig: HeaderEffectConfig = {
      type: this.effectType(),
      duration: this.effectDuration(),
      intensity: this.effectIntensity(),
      glowColor: this.glowColor().toString(),
      textColor: this.textColor().toString(),
      strokeColor: this.strokeColor().toString(),
      fontSize: this.textSize(),
      fontWeight: this.textWeight(),
    };


    return baseConfig;
  }

  /**
   * 부모 View2D 찾기
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
    this.headerRef().opacity(1);
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