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
  createRef,
  Reference,
  waitFor,
  tween,
  all,
  Color
} from '@revideo/core';
import { easeInOutQuad, easeInQuad, easeOutQuad, easeInBack, easeOutBack, easeInOutBack } from '@revideo/core/lib/tweening';

// 헤더 효과 타입 정의
export type HeaderEffectType =
  | '3d_extrude'  // 3D 돌출 글씨체
  | 'typewriter' // 타이프라이터 효과
  | 'punch_zoom' // 충격 줌 효과
  | 'neon_sign' // 네온사인 효과
  | 'bounce' // 바운스 효과
  | 'rainbow_text' // 무지개 텍스트 효과
  | 'shake_emphasis' // 흔들림 강조 효과

// 헤더 효과 설정 인터페이스
export interface HeaderEffectConfig {
  type: HeaderEffectType;
  duration?: number;
  intensity?: number;
  glowColor?: string;       // 글로우 색상
  textColor?: string;       // 기본 텍스트 색상
  strokeColor?: string;     // 테두리 색상
  fontSize?: number;        // 폰트 크기
  fontWeight?: number;      // 폰트 굵기
}

// 헤더 요소 참조 인터페이스
export interface HeaderElementRefs {
  headerRef: Reference<Txt>;
  backgroundRef?: Reference<any>;
  backgroundImageRef?: Reference<any>;
  shadowRef?: Reference<Txt>;
  glowRef?: Reference<Txt>;
  additionalRefs?: any[];
}

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
        fontFamily="HakgyoansimNadeuri"
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
   * 3D 돌출 글씨체 효과
   */
  private *apply3DExtrudeEffect(
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
    headerRef().stroke('#034D0E');
    headerRef().strokeFirst(true);
    headerRef().lineWidth(10);
    
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
  private *applyInfiniteTypewriterEffect(
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
   * 충격 줌 (Punch Zoom) 효과
   */
  private *applyInfinitePunchZoomEffect(
    headerRef: Reference<Txt>,
    totalDuration: number = 10.0,
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
   * 글로우 효과
   */
  private *applyInfiniteGlowEffect(
    headerRef: Reference<Txt>,
    glowColor: string,
    totalDuration: number = 10.0
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
    headerRef().strokeFirst(true);
    headerRef().lineWidth(2);
    
    // 글로우 나타났다가 사라지기
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
   * 바운스 효과
   */
  private *applyInfiniteBounceEffect(
    headerRef: Reference<Txt>,
    totalDuration: number = 10.0
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
   * 무지개 텍스트 효과
   */
  private *applyInfiniteRainbowTextEffect(
    headerRef: Reference<Txt>,
    totalDuration: number = 10.0
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
   * 흔들림 강조 효과
   */
  private *applyInfiniteShakeEmphasisEffect(
    headerRef: Reference<Txt>,
    totalDuration: number = 10.0,
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
  private *applyHeaderEffect(
    view: View2D,
    headerRef: Reference<Txt>,
    headerText: string,
    config: HeaderEffectConfig
  ): Generator<any, HeaderElementRefs, any> {
    const duration = config.duration || 1.0;
    let additionalRefs: any[] = [];
    
    switch (config.type) {
      case '3d_extrude':
        additionalRefs = yield* this.apply3DExtrudeEffect(headerRef, duration, config.intensity || 5);
        break;
        
      case 'typewriter':
        yield* this.applyInfiniteTypewriterEffect(
          headerRef,
          headerText,
          2.0, // 타이핑 시간
          2.0, // 대기 시간
          duration // 총 지속 시간
        );
        break;
        
      case 'punch_zoom':
        yield* this.applyInfinitePunchZoomEffect(headerRef, duration, config.intensity || 1.3);
        break;
        
      case 'neon_sign':
        additionalRefs = yield* this.applyInfiniteGlowEffect(headerRef, config.glowColor || '#32D74B', duration);
        break;
        
      case 'bounce':
        yield* this.applyInfiniteBounceEffect(headerRef, duration);
        break;
        
      case 'rainbow_text':
        yield* this.applyInfiniteRainbowTextEffect(headerRef, duration);
        break;
        
      case 'shake_emphasis':
        yield* this.applyInfiniteShakeEmphasisEffect(headerRef, duration, config.intensity || 10);
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
  private cleanupHeaderEffect(refs: HeaderElementRefs) {
    if (refs.additionalRefs) {
      refs.additionalRefs.forEach((ref: any) => {
        if (ref && typeof ref === 'object' && 'remove' in ref) {
          ref.remove();
        }
      });
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
      this.headerElementRefs = yield* this.applyHeaderEffect(
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
      this.cleanupHeaderEffect(this.headerElementRefs);
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
