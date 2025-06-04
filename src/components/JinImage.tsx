import {
  Img,
  ImgProps,
  colorSignal,
  initial,
  signal,
} from '@revideo/2d'
import {
  ColorSignal,
  PossibleColor,
  SignalValue,
  SimpleSignal,
  all,
  createRef,
  tween,
  waitFor,
} from '@revideo/core'
import { easeInOutQuad } from '@revideo/core/lib/tweening'
import {
  ZoomType,
  PanType,
  ShutterType,
  ImageAnimationConfig,
  applyImageAnimationsFromConfig,
  setImageInitialState,
  executeImageAnimations,
} from '../animations/imageAnimations'

/**
 * JinImage 컴포넌트의 프롭스 인터페이스
 */
export interface JinImageProps extends ImgProps {
  // 기본 이미지 속성
  src: SignalValue<string>
  
  // 애니메이션 지속 시간
  animationDuration?: SignalValue<number>
  
  // 이미지 기본 Y 위치
  baseY?: SignalValue<number>
  
  // 간단한 애니메이션 옵션 (하위 호환성)
  zoomType?: SignalValue<ZoomType>
  panType?: SignalValue<PanType>
  shutterType?: SignalValue<ShutterType>
  
  // 구조화된 애니메이션 설정
  animationConfig?: SignalValue<ImageAnimationConfig>
  
  // 자동 애니메이션 시작 여부
  autoPlay?: SignalValue<boolean>
  
  // 줌 강도 (0.1 ~ 1.0)
  zoomIntensity?: SignalValue<number>
  
  // 팬 거리 (픽셀)
  panDistance?: SignalValue<number>
  
  // 셔터 효과 지속 시간
  shutterDuration?: SignalValue<number>
  
  // 깜빡임 횟수 (blink 효과용)
  blinkCount?: SignalValue<number>
  
  // 최대 blur 값 (blur 효과용)
  maxBlur?: SignalValue<number>
  
  // 배경색 (fade 효과용)
  backgroundColor?: SignalValue<PossibleColor>
}

/**
 * JinImage 커스텀 컴포넌트
 * imageAnimations.ts의 모든 애니메이션 효과를 구현한 이미지 컴포넌트
 */
export class JinImage extends Img {
  @initial('')
  @signal()
  public declare readonly src: SimpleSignal<string, this>

  @initial(3.0)
  @signal()
  public declare readonly animationDuration: SimpleSignal<number, this>

  @initial(-50)
  @signal()
  public declare readonly baseY: SimpleSignal<number, this>

  @initial('static')
  @signal()
  public declare readonly zoomType: SimpleSignal<ZoomType, this>

  @initial('none')
  @signal()
  public declare readonly panType: SimpleSignal<PanType, this>

  @initial('none')
  @signal()
  public declare readonly shutterType: SimpleSignal<ShutterType, this>

  @initial(null)
  @signal()
  public declare readonly animationConfig: SimpleSignal<ImageAnimationConfig | null, this>

  @initial(false)
  @signal()
  public declare readonly autoPlay: SimpleSignal<boolean, this>

  @initial(0.15)
  @signal()
  public declare readonly zoomIntensity: SimpleSignal<number, this>

  @initial(100)
  @signal()
  public declare readonly panDistance: SimpleSignal<number, this>

  @initial(0.3)
  @signal()
  public declare readonly shutterDuration: SimpleSignal<number, this>

  @initial(3)
  @signal()
  public declare readonly blinkCount: SimpleSignal<number, this>

  @initial(30)
  @signal()
  public declare readonly maxBlur: SimpleSignal<number, this>

  @initial('#000000')
  @colorSignal()
  public declare readonly backgroundColor: ColorSignal<this>

  // 내부 상태
  private isAnimating = false

  public constructor(props?: JinImageProps) {
    super({
      // 기본 이미지 설정
      size: [800, 600],
      position: [0, -50],
      ...props,
    })

    // 이미지 소스 설정
    if (props?.src) {
      this.src(props.src as string)
    }

    // 초기 상태 설정 (컴포넌트가 완전히 초기화된 후)
    this.setupInitialState()

    // 자동 재생이 활성화된 경우 애니메이션 시작
    if (this.autoPlay()) {
      this.startAnimation()
    }
  }

  /**
   * 초기 상태 설정
   */
  private setupInitialState(): void {
    const config = this.getEffectiveAnimationConfig()
    
    // 애니메이션 설정에 따른 초기 상태 설정
    // this를 imageRef로 사용 (자기 자신을 참조)
    const selfRef = createRef<JinImage>()
    selfRef(this)
    setImageInitialState(selfRef, config, this.baseY())
  }

  /**
   * 효과적인 애니메이션 설정 가져오기
   * 구조화된 설정이 있으면 그것을 사용하고, 없으면 간단한 설정으로 변환
   */
  private getEffectiveAnimationConfig(): ImageAnimationConfig {
    const structuredConfig = this.animationConfig()
    
    if (structuredConfig) {
      return structuredConfig
    }

    // 간단한 설정을 구조화된 설정으로 변환
    return {
      zoom: this.zoomType() !== 'static' ? {
        type: this.zoomType(),
        intensity: this.zoomIntensity(),
      } : undefined,
      pan: this.panType() !== 'none' ? {
        type: this.panType(),
        distance: this.panDistance(),
      } : undefined,
      transition: this.shutterType() !== 'none' ? {
        type: this.shutterType(),
        duration: this.shutterDuration(),
        blinkCount: this.blinkCount(),
      } : undefined,
    }
  }

  /**
   * 애니메이션 시작
   */
  public *startAnimation(): Generator<any, any, any> {
    if (this.isAnimating) {
      return
    }

    this.isAnimating = true
    const config = this.getEffectiveAnimationConfig()

    try {
      // 자기 자신을 참조로 사용
      const selfRef = createRef<JinImage>()
      selfRef(this)

      // 초기 상태 설정
      setImageInitialState(selfRef, config, this.baseY())

      // 애니메이션 실행
      yield* executeImageAnimations(
        selfRef,
        config,
        this.animationDuration(),
        this.baseY()
      )
    } finally {
      this.isAnimating = false
    }
  }

  /**
   * 페이드 인 애니메이션
   */
  public *fadeIn(duration?: number): Generator<any, any, any> {
    const animDuration = duration ?? this.animationDuration()
    const holdTime = animDuration * 0.9
    const fadeTime = animDuration - holdTime

    this.opacity(0)
    
    if (holdTime > 0) {
      yield* waitFor(holdTime)
    }
    
    yield* tween(fadeTime, value => {
      this.opacity(value)
    }, easeInOutQuad)
  }

  /**
   * 페이드 아웃 애니메이션
   */
  public *fadeOut(duration?: number): Generator<any, any, any> {
    const animDuration = duration ?? this.animationDuration()
    const holdTime = animDuration * 0.9
    const fadeTime = animDuration - holdTime
    const startOpacity = this.opacity()

    if (holdTime > 0) {
      yield* waitFor(holdTime)
    }

    yield* tween(fadeTime, value => {
      this.opacity(startOpacity * (1 - value))
    }, easeInOutQuad)
  }

  /**
   * 블러 인 애니메이션
   */
  public *blurIn(duration?: number, maxBlur?: number): Generator<any, any, any> {
    const animDuration = duration ?? this.animationDuration()
    const blurValue = maxBlur ?? this.maxBlur()
    const fadeTime = animDuration * 0.1
    const holdTime = animDuration - fadeTime

    this.filters.blur(blurValue)
    
    yield* tween(fadeTime, value => {
      this.filters.blur(blurValue * (1 - value))
    }, easeInOutQuad)

    if (holdTime > 0) {
      this.filters.blur(0)
      yield* waitFor(holdTime)
    }
  }

  /**
   * 블러 아웃 애니메이션
   */
  public *blurOut(duration?: number, maxBlur?: number): Generator<any, any, any> {
    const animDuration = duration ?? this.animationDuration()
    const blurValue = maxBlur ?? this.maxBlur()
    const holdTime = animDuration * 0.9
    const fadeTime = animDuration - holdTime

    this.filters.blur(0)

    if (holdTime > 0) {
      yield* waitFor(holdTime)
    }

    yield* tween(fadeTime, value => {
      this.filters.blur(value * blurValue)
    }, easeInOutQuad)
  }

  /**
   * 밝기 인 애니메이션
   */
  public *brightnessIn(duration?: number): Generator<any, any, any> {
    const animDuration = duration ?? this.animationDuration()
    const fadeTime = animDuration * 0.1
    const holdTime = animDuration - fadeTime

    this.filters.brightness(0)
    
    yield* tween(fadeTime, value => {
      this.filters.brightness(value)
    }, easeInOutQuad)

    if (holdTime > 0) {
      this.filters.brightness(1)
      yield* waitFor(holdTime)
    }
  }

  /**
   * 밝기 아웃 애니메이션
   */
  public *brightnessOut(duration?: number): Generator<any, any, any> {
    const animDuration = duration ?? this.animationDuration()
    const holdTime = animDuration * 0.9
    const fadeTime = animDuration - holdTime

    this.filters.brightness(1)

    if (holdTime > 0) {
      yield* waitFor(holdTime)
    }

    yield* tween(fadeTime, value => {
      this.filters.brightness(1 - value)
    }, easeInOutQuad)
  }

  /**
   * 줌 인 애니메이션
   */
  public *zoomIn(duration?: number, intensity?: number): Generator<any, any, any> {
    const animDuration = duration ?? this.animationDuration()
    const zoomIntensity = intensity ?? this.zoomIntensity()

    this.scale(1.0)
    yield* tween(animDuration, value => {
      this.scale(1.0 + value * zoomIntensity)
    }, easeInOutQuad)
  }

  /**
   * 줌 아웃 애니메이션
   */
  public *zoomOut(duration?: number, intensity?: number): Generator<any, any, any> {
    const animDuration = duration ?? this.animationDuration()
    const zoomIntensity = intensity ?? this.zoomIntensity()

    this.scale(1.0 + zoomIntensity)
    yield* tween(animDuration, value => {
      this.scale(1.0 + zoomIntensity - value * zoomIntensity)
    }, easeInOutQuad)
  }

  /**
   * 팬 레프트 애니메이션
   */
  public *panLeft(duration?: number, distance?: number): Generator<any, any, any> {
    const animDuration = duration ?? this.animationDuration()
    const panDistance = distance ?? this.panDistance()

    this.x(panDistance / 2)
    yield* tween(animDuration, value => {
      this.x(panDistance / 2 - value * panDistance)
    }, easeInOutQuad)
  }

  /**
   * 팬 라이트 애니메이션
   */
  public *panRight(duration?: number, distance?: number): Generator<any, any, any> {
    const animDuration = duration ?? this.animationDuration()
    const panDistance = distance ?? this.panDistance()

    this.x(-panDistance / 2)
    yield* tween(animDuration, value => {
      this.x(-panDistance / 2 + value * panDistance)
    }, easeInOutQuad)
  }

  /**
   * 플래시 효과
   */
  public *flash(duration?: number): Generator<any, any, any> {
    const animDuration = duration ?? this.shutterDuration()
    
    yield* tween(0.1, value => {
      this.filters.brightness(1 + value * 2)
    })
    yield* tween(0.2, value => {
      this.filters.brightness(3 - value * 2)
    })
    
    if (animDuration > 0.3) {
      yield* waitFor(animDuration - 0.3)
    }
  }

  /**
   * 깜빡임 효과
   */
  public *blink(duration?: number, count?: number): Generator<any, any, any> {
    const animDuration = duration ?? this.shutterDuration()
    const blinkCount = count ?? this.blinkCount()
    const blinkDuration = Math.min(animDuration * 0.4, 0.6) / blinkCount

    for (let i = 0; i < blinkCount; i++) {
      yield* tween(blinkDuration / 2, value => {
        this.opacity(value)
      }, easeInOutQuad)
      yield* tween(blinkDuration / 2, value => {
        this.opacity(1 - value)
      }, easeInOutQuad)
    }

    yield* tween(0.2, value => {
      this.opacity(value)
    }, easeInOutQuad)

    if (animDuration > blinkDuration * blinkCount + 0.2) {
      yield* waitFor(animDuration - blinkDuration * blinkCount - 0.2)
    }
  }

  /**
   * 복합 애니메이션 실행
   */
  public *playAnimation(config?: ImageAnimationConfig): Generator<any, any, any> {
    const effectiveConfig = config ?? this.getEffectiveAnimationConfig()
    
    // 자기 자신을 참조로 사용
    const selfRef = createRef<JinImage>()
    selfRef(this)
    
    // 초기 상태 설정
    setImageInitialState(selfRef, effectiveConfig, this.baseY())

    // 애니메이션 실행
    yield* executeImageAnimations(
      selfRef,
      effectiveConfig,
      this.animationDuration(),
      this.baseY()
    )
  }

  /**
   * 설정 업데이트
   */
  public updateConfig(config: Partial<JinImageProps>): void {
    if (config.animationDuration !== undefined) {
      this.animationDuration(config.animationDuration as number)
    }
    if (config.zoomType !== undefined) {
      this.zoomType(config.zoomType as ZoomType)
    }
    if (config.panType !== undefined) {
      this.panType(config.panType as PanType)
    }
    if (config.shutterType !== undefined) {
      this.shutterType(config.shutterType as ShutterType)
    }
    if (config.animationConfig !== undefined) {
      this.animationConfig(config.animationConfig as ImageAnimationConfig)
    }
  }

  /**
   * 애니메이션 상태 확인
   */
  public isPlayingAnimation(): boolean {
    return this.isAnimating
  }

  /**
   * 모든 애니메이션 정지
   */
  public stopAnimation(): void {
    this.isAnimating = false
  }

  /**
   * 기본 상태로 리셋
   */
  public reset(): void {
    this.scale(1.0)
    this.x(0)
    this.y(this.baseY())
    this.opacity(1)
    this.filters.brightness(1)
    this.filters.blur(0)
    this.isAnimating = false
  }
} 