import {
  Node,
  NodeProps,
  Img,
  Rect,
  View2D,
  initial,
  signal,
} from '@revideo/2d'
import {
  SignalValue,
  SimpleSignal,
  Reference,
  createRef,
  waitFor,
  tween,
  all,
  createSignal,
} from '@revideo/core'
import { easeInOutQuad, easeInQuad, easeOutQuad } from '@revideo/core/lib/tweening'

// ================================
// 타입 정의
// ================================

// 줌 타입 정의
export type ZoomType = 'zoomIn' | 'zoomOut' | 'zoomInOut' | 'static'

// 팬 타입 정의  
export type PanType = 'panLeft' | 'panRight' | 'panUp' | 'panDown' | 'none'

// 셔터 효과 타입 정의
export type ShutterType = 'flash' | 'blink' | 'shutterTransition' | 'fade' | 'none'

// 슬라이드 방향 타입
export type SlideDirection = 'left' | 'right' | 'up' | 'down'

// 이미지 표시 타입
export type ImageDisplayType = 'slideIn' | 'fadeIn' | 'scaleIn' | 'instant'

// 구조화된 애니메이션 설정 인터페이스
export interface ImageAnimationConfig {
  zoom?: {
    type: ZoomType
    intensity?: number
    easing?: string
  }
  pan?: {
    type: PanType
    distance?: number
    easing?: string
  }
  transition?: {
    type: ShutterType
    duration?: number
    blinkCount?: number
  }
}

// 기존 애니메이션 옵션 인터페이스 (하위 호환성)
export interface AnimationOptions {
  zoomType?: ZoomType
  panType?: PanType
  shutterType?: ShutterType
}

// ================================
// Props 인터페이스
// ================================

/**
 * JinImage 컴포넌트의 프롭스 인터페이스
 */
export interface JinImageProps extends NodeProps {
  // 기본 이미지 속성
  src?: SignalValue<string>
  
  // 크기 속성
  width?: SignalValue<number>
  height?: SignalValue<number>
  
  // 비율 유지 옵션
  maintainAspectRatio?: SignalValue<boolean>
  
  // 배경 스타일 속성들
  backgroundColor?: SignalValue<string>
  backgroundOpacity?: SignalValue<number>
  backgroundRadius?: SignalValue<number>
  padding?: SignalValue<number>
  
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
}

// ================================
// JinImage 컴포넌트 클래스
// ================================

/**
 * JinImage 커스텀 컴포넌트
 * imageAnimations.ts의 모든 애니메이션 효과를 구현한 이미지 컴포넌트
 * JioImage 스타일로 Node를 확장하여 구현
 */
export class JinImage extends Node {
  // 데코레이터를 사용한 반응형 속성 정의
  @initial('')
  @signal()
  public declare readonly src: SimpleSignal<string, this>

  @initial(800)
  @signal()
  public declare readonly width: SimpleSignal<number, this>

  @initial(600)
  @signal()
  public declare readonly height: SimpleSignal<number, this>

  @initial(true)
  @signal()
  public declare readonly maintainAspectRatio: SimpleSignal<boolean, this>

  @initial('#000000')
  @signal()
  public declare readonly backgroundColor: SimpleSignal<string, this>

  @initial(0.0)
  @signal()
  public declare readonly backgroundOpacity: SimpleSignal<number, this>

  @initial(0)
  @signal()
  public declare readonly backgroundRadius: SimpleSignal<number, this>

  @initial(0)
  @signal()
  public declare readonly padding: SimpleSignal<number, this>

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

  // 내부 요소 참조
  private imageRef: Reference<Img> = createRef<Img>()
  private backgroundRef: Reference<Rect> = createRef<Rect>()
  
  // 계산된 너비 (일반 변수로 관리)
  private calculatedWidthValue = 800
  
  // 내부 상태
  private isAnimating = false

  public constructor(props?: JinImageProps) {
    super({
      // 기본 설정
      position: [0, -50],
      ...props,
    })

    // calculatedWidthValue 초기화
    if (props?.width && !this.maintainAspectRatio()) {
      this.calculatedWidthValue = props.width as number
    }

    // 배경 요소 추가 (배경 투명도가 0보다 클 때만 표시)
    this.add(
      <Rect
        ref={this.backgroundRef}
        fill={() => this.backgroundColor()}
        opacity={() => this.backgroundOpacity()}
        radius={() => this.backgroundRadius()}
        width={() => this.getDisplayWidth() + this.padding() * 2}
        height={() => this.height() + this.padding() * 2}
        layout
        justifyContent={'center'}
        alignItems={'center'}
      />
    )

    // 이미지 요소 추가 (중앙 정렬)
    this.add(
      <Img
        ref={this.imageRef}
        src={() => this.src()}
        size={() => [this.getDisplayWidth(), this.height()]}
        layout
        justifyContent={'center'}
        alignItems={'center'}
      />
    )

    // 이미지 소스 설정
    if (props?.src) {
      this.src(props.src as string)
    }

    // 초기 상태 설정
    this.setupInitialState()

    // 자동 재생이 활성화된 경우 애니메이션 시작
    if (this.autoPlay()) {
      this.startAnimation()
    }
  }

  // ================================
  // 유틸리티 메서드
  // ================================

  /**
   * 표시할 너비를 계산하는 메서드
   */
  private getDisplayWidth(): number {
    if (!this.maintainAspectRatio()) {
      return this.calculatedWidthValue
    }

    try {
      const imageElement = this.imageRef()
      if (!imageElement) {
        return this.calculatedWidthValue
      }

      const naturalSize = imageElement.naturalSize()
      if (naturalSize.width === 0 || naturalSize.height === 0) {
        return this.calculatedWidthValue
      }

      // 원본 비율을 계산하여 너비 결정
      const aspectRatio = naturalSize.width / naturalSize.height
      const calculatedWidth = this.height() * aspectRatio
      
      this.calculatedWidthValue = calculatedWidth
      return calculatedWidth
    } catch (error) {
      return this.calculatedWidthValue
    }
  }

  /**
   * 수동으로 너비를 설정하는 메서드
   */
  public setWidth(width: number): void {
    this.maintainAspectRatio(false)
    this.calculatedWidthValue = width
  }

  /**
   * 현재 표시되는 너비를 가져오는 메서드
   */
  public getWidth(): number {
    return this.getDisplayWidth()
  }

  /**
   * 초기 상태 설정
   */
  private setupInitialState(): void {
    const config = this.getEffectiveAnimationConfig()
    this.setImageInitialState(config, this.baseY())
  }

  /**
   * 효과적인 애니메이션 설정 가져오기
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
   * 애니메이션 설정에 따라 이미지의 초기 상태를 설정하는 함수
   */
  private setImageInitialState(config: ImageAnimationConfig, baseY: number = -50): void {
    const imageElement = this.imageRef()
    const backgroundElement = this.backgroundRef()
    
    if (!imageElement || !backgroundElement) return

    // 기본 상태 설정
    imageElement.scale(1.0)
    imageElement.x(0)
    imageElement.y(0)
    imageElement.opacity(1)
    imageElement.filters.brightness(1)
    imageElement.filters.blur(0)
    
    backgroundElement.scale(1.0)
    backgroundElement.x(0)
    backgroundElement.y(0)
    
    this.y(baseY)
    
    // 줌 애니메이션이 있는 경우 초기 스케일 설정
    if (config.zoom) {
      const intensity = config.zoom.intensity || 0.15
      const initialScale = config.zoom.type === 'zoomOut' ? 1.0 + intensity : 1.0
      imageElement.scale(initialScale)
      backgroundElement.scale(initialScale)
    }
    
    // 팬 애니메이션이 있는 경우 초기 위치 설정
    if (config.pan) {
      const panDistance = config.pan.distance || 100
      let initialX = 0
      let initialY = 0
      
      switch (config.pan.type) {
        case 'panLeft':
          initialX = panDistance / 2
          break
        case 'panRight':
          initialX = -panDistance / 2
          break
        case 'panUp':
          initialY = -panDistance / 2
          break
        case 'panDown':
          initialY = panDistance / 2
          break
      }
      
      imageElement.x(initialX)
      imageElement.y(initialY)
      backgroundElement.x(initialX)
      backgroundElement.y(initialY)
    }
    
    // 셔터 효과가 있는 경우 초기 상태 설정
    if (config.transition) {
      switch (config.transition.type) {
        case 'blink':
        case 'fade':
          imageElement.opacity(0)
          backgroundElement.opacity(0)
          break
      }
    }
  }

  // ================================
  // 애니메이션 메서드들
  // ================================

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
      // 초기 상태 설정
      this.setImageInitialState(config, this.baseY())

      // 애니메이션 실행
      yield* this.executeImageAnimations(config, this.animationDuration(), this.baseY())
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

    const imageElement = this.imageRef()
    const backgroundElement = this.backgroundRef()
    
    if (!imageElement || !backgroundElement) return

    imageElement.opacity(0)
    backgroundElement.opacity(0)
    
    if (holdTime > 0) {
      yield* waitFor(holdTime)
    }
    
    yield* all(
      imageElement.opacity(1, fadeTime, easeInOutQuad),
      backgroundElement.opacity(this.backgroundOpacity(), fadeTime, easeInOutQuad)
    )
  }

  /**
   * 페이드 아웃 애니메이션
   */
  public *fadeOut(duration?: number): Generator<any, any, any> {
    const animDuration = duration ?? this.animationDuration()
    const holdTime = animDuration * 0.9
    const fadeTime = animDuration - holdTime

    const imageElement = this.imageRef()
    const backgroundElement = this.backgroundRef()
    
    if (!imageElement || !backgroundElement) return

    const startOpacity = imageElement.opacity()
    const startBgOpacity = backgroundElement.opacity()

    if (holdTime > 0) {
      yield* waitFor(holdTime)
    }

    yield* all(
      imageElement.opacity(0, fadeTime, easeInOutQuad),
      backgroundElement.opacity(0, fadeTime, easeInOutQuad)
    )
  }

  /**
   * 슬라이드 인 애니메이션
   */
  public *slideIn(direction: SlideDirection = 'left', duration?: number): Generator<any, any, any> {
    const animDuration = duration ?? 0.5
    const slideDistance = 100

    const imageElement = this.imageRef()
    const backgroundElement = this.backgroundRef()
    
    if (!imageElement || !backgroundElement) return
    
    // 초기 위치 설정
    let initialX = 0
    let initialY = 0
    
    switch (direction) {
      case 'left':
        initialX = -slideDistance
        break
      case 'right':
        initialX = slideDistance
        break
      case 'up':
        initialY = -slideDistance
        break
      case 'down':
        initialY = slideDistance
        break
    }
    
    // 현재 위치 저장
    const originalX = imageElement.x()
    const originalY = imageElement.y()
    
    // 초기 상태 설정
    imageElement.opacity(0)
    backgroundElement.opacity(0)
    imageElement.position([originalX + initialX, originalY + initialY])
    backgroundElement.position([originalX + initialX, originalY + initialY])
    
    // 슬라이드 인 애니메이션
    yield* all(
      imageElement.opacity(1, animDuration, easeInOutQuad),
      backgroundElement.opacity(this.backgroundOpacity(), animDuration, easeInOutQuad),
      imageElement.position([originalX, originalY], animDuration, easeInOutQuad),
      backgroundElement.position([originalX, originalY], animDuration, easeInOutQuad)
    )
  }

  /**
   * 스케일 인 애니메이션
   */
  public *scaleIn(duration?: number): Generator<any, any, any> {
    const animDuration = duration ?? 0.5

    const imageElement = this.imageRef()
    const backgroundElement = this.backgroundRef()
    
    if (!imageElement || !backgroundElement) return
    
    // 초기 상태
    imageElement.opacity(0)
    backgroundElement.opacity(0)
    imageElement.scale(0.3)
    backgroundElement.scale(0.3)
    
    // 스케일 인 애니메이션
    yield* all(
      imageElement.opacity(1, animDuration, easeInOutQuad),
      backgroundElement.opacity(this.backgroundOpacity(), animDuration, easeInOutQuad),
      imageElement.scale(1, animDuration, easeInOutQuad),
      backgroundElement.scale(1, animDuration, easeInOutQuad)
    )
  }

  /**
   * 블러 인 애니메이션
   */
  public *blurIn(duration?: number, maxBlur?: number): Generator<any, any, any> {
    const animDuration = duration ?? this.animationDuration()
    const blurValue = maxBlur ?? this.maxBlur()
    const fadeTime = animDuration * 0.1
    const holdTime = animDuration - fadeTime

    const imageElement = this.imageRef()
    if (!imageElement) return

    imageElement.filters.blur(blurValue)
    
    yield* tween(fadeTime, value => {
      imageElement.filters.blur(blurValue * (1 - value))
    }, easeInOutQuad)

    if (holdTime > 0) {
      imageElement.filters.blur(0)
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

    const imageElement = this.imageRef()
    if (!imageElement) return

    imageElement.filters.blur(0)

    if (holdTime > 0) {
      yield* waitFor(holdTime)
    }

    yield* tween(fadeTime, value => {
      imageElement.filters.blur(value * blurValue)
    }, easeInOutQuad)
  }

  /**
   * 밝기 인 애니메이션
   */
  public *brightnessIn(duration?: number): Generator<any, any, any> {
    const animDuration = duration ?? this.animationDuration()
    const fadeTime = animDuration * 0.1
    const holdTime = animDuration - fadeTime

    const imageElement = this.imageRef()
    if (!imageElement) return

    imageElement.filters.brightness(0)
    
    yield* tween(fadeTime, value => {
      imageElement.filters.brightness(value)
    }, easeInOutQuad)

    if (holdTime > 0) {
      imageElement.filters.brightness(1)
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

    const imageElement = this.imageRef()
    if (!imageElement) return

    imageElement.filters.brightness(1)

    if (holdTime > 0) {
      yield* waitFor(holdTime)
    }

    yield* tween(fadeTime, value => {
      imageElement.filters.brightness(1 - value)
    }, easeInOutQuad)
  }

  /**
   * 줌 인 애니메이션
   */
  public *zoomIn(duration?: number, intensity?: number): Generator<any, any, any> {
    const animDuration = duration ?? this.animationDuration()
    const zoomIntensity = intensity ?? this.zoomIntensity()

    const imageElement = this.imageRef()
    const backgroundElement = this.backgroundRef()
    
    if (!imageElement || !backgroundElement) return

    imageElement.scale(1.0)
    backgroundElement.scale(1.0)
    
    yield* all(
      imageElement.scale(1.0 + zoomIntensity, animDuration, easeInOutQuad),
      backgroundElement.scale(1.0 + zoomIntensity, animDuration, easeInOutQuad)
    )
  }

  /**
   * 줌 아웃 애니메이션
   */
  public *zoomOut(duration?: number, intensity?: number): Generator<any, any, any> {
    const animDuration = duration ?? this.animationDuration()
    const zoomIntensity = intensity ?? this.zoomIntensity()

    const imageElement = this.imageRef()
    const backgroundElement = this.backgroundRef()
    
    if (!imageElement || !backgroundElement) return

    imageElement.scale(1.0 + zoomIntensity)
    backgroundElement.scale(1.0 + zoomIntensity)
    
    yield* all(
      imageElement.scale(1.0, animDuration, easeInOutQuad),
      backgroundElement.scale(1.0, animDuration, easeInOutQuad)
    )
  }

  /**
   * 팬 레프트 애니메이션
   */
  public *panLeft(duration?: number, distance?: number): Generator<any, any, any> {
    const animDuration = duration ?? this.animationDuration()
    const panDistance = distance ?? this.panDistance()

    const imageElement = this.imageRef()
    const backgroundElement = this.backgroundRef()
    
    if (!imageElement || !backgroundElement) return

    imageElement.x(panDistance / 2)
    backgroundElement.x(panDistance / 2)
    
    yield* all(
      imageElement.x(-panDistance / 2, animDuration, easeInOutQuad),
      backgroundElement.x(-panDistance / 2, animDuration, easeInOutQuad)
    )
  }

  /**
   * 팬 라이트 애니메이션
   */
  public *panRight(duration?: number, distance?: number): Generator<any, any, any> {
    const animDuration = duration ?? this.animationDuration()
    const panDistance = distance ?? this.panDistance()

    const imageElement = this.imageRef()
    const backgroundElement = this.backgroundRef()
    
    if (!imageElement || !backgroundElement) return

    imageElement.x(-panDistance / 2)
    backgroundElement.x(-panDistance / 2)
    
    yield* all(
      imageElement.x(panDistance / 2, animDuration, easeInOutQuad),
      backgroundElement.x(panDistance / 2, animDuration, easeInOutQuad)
    )
  }

  /**
   * 플래시 효과
   */
  public *flash(duration?: number): Generator<any, any, any> {
    const animDuration = duration ?? this.shutterDuration()
    
    const imageElement = this.imageRef()
    if (!imageElement) return
    
    yield* tween(0.1, value => {
      imageElement.filters.brightness(1 + value * 2)
    })
    yield* tween(0.2, value => {
      imageElement.filters.brightness(3 - value * 2)
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

    const imageElement = this.imageRef()
    const backgroundElement = this.backgroundRef()
    
    if (!imageElement || !backgroundElement) return

    for (let i = 0; i < blinkCount; i++) {
      yield* all(
        imageElement.opacity(1, blinkDuration / 2, easeInOutQuad),
        backgroundElement.opacity(this.backgroundOpacity(), blinkDuration / 2, easeInOutQuad)
      )
      yield* all(
        imageElement.opacity(0, blinkDuration / 2, easeInOutQuad),
        backgroundElement.opacity(0, blinkDuration / 2, easeInOutQuad)
      )
    }

    yield* all(
      imageElement.opacity(1, 0.2, easeInOutQuad),
      backgroundElement.opacity(this.backgroundOpacity(), 0.2, easeInOutQuad)
    )

    if (animDuration > blinkDuration * blinkCount + 0.2) {
      yield* waitFor(animDuration - blinkDuration * blinkCount - 0.2)
    }
  }

  /**
   * 회전 애니메이션
   */
  public *rotate(degrees: number = 360, duration?: number): Generator<any, any, any> {
    const animDuration = duration ?? 1.0

    const imageElement = this.imageRef()
    const backgroundElement = this.backgroundRef()
    
    if (!imageElement || !backgroundElement) return
    
    yield* all(
      imageElement.rotation(degrees, animDuration, easeInOutQuad),
      backgroundElement.rotation(degrees, animDuration, easeInOutQuad)
    )
  }

  /**
   * 크기 변경 애니메이션
   */
  public *resize(newHeight: number, duration?: number, maintainRatio: boolean = true): Generator<any, any, any> {
    const animDuration = duration ?? 0.5
    
    if (maintainRatio) {
      this.maintainAspectRatio(true)
      yield* this.height(newHeight, animDuration, easeInOutQuad)
    } else {
      this.maintainAspectRatio(false)
      yield* this.height(newHeight, animDuration, easeInOutQuad)
    }
  }

  /**
   * 정확한 크기로 변경하는 애니메이션
   */
  public *resizeToExactSize(newWidth: number, newHeight: number, duration?: number): Generator<any, any, any> {
    const animDuration = duration ?? 0.5
    
    this.maintainAspectRatio(false)
    this.calculatedWidthValue = newWidth
    yield* this.height(newHeight, animDuration, easeInOutQuad)
  }

  /**
   * 이미지 변경 애니메이션
   */
  public *changeImageWithAnimation(newSrc: string, duration?: number): Generator<any, any, any> {
    const animDuration = duration ?? this.animationDuration()
    
    yield* this.fadeOut(animDuration / 2)
    this.src(newSrc)
    yield* this.fadeIn(animDuration / 2)
  }

  /**
   * 복합 애니메이션 실행
   */
  public *playAnimation(config?: ImageAnimationConfig): Generator<any, any, any> {
    const effectiveConfig = config ?? this.getEffectiveAnimationConfig()
    
    // 초기 상태 설정
    this.setImageInitialState(effectiveConfig, this.baseY())

    // 애니메이션 실행
    yield* this.executeImageAnimations(effectiveConfig, this.animationDuration(), this.baseY())
  }

  /**
   * 이미지 애니메이션 실행 함수
   */
  private *executeImageAnimations(
    config: ImageAnimationConfig,
    duration: number,
    baseY: number = -50
  ): Generator<any, any, any> {
    const animations: Generator<any, any, any>[] = []
    
    if (config.zoom) {
      animations.push(this.applyZoomAnimationFromConfig(config.zoom, duration))
    }
    
    if (config.pan) {
      animations.push(this.applyPanAnimationFromConfig(config.pan, duration, baseY))
    }
    
    if (config.transition && config.transition.type !== 'shutterTransition') {
      animations.push(this.applyShutterEffectFromConfig(config.transition, duration, baseY))
    }
    
    if (animations.length > 0) {
      yield* all(...animations)
    } else {
      yield* waitFor(duration)
    }
  }

  /**
   * 구조화된 설정에서 줌 애니메이션을 적용하는 함수
   */
  private *applyZoomAnimationFromConfig(
    zoomConfig: NonNullable<ImageAnimationConfig['zoom']>, 
    duration: number
  ): Generator<any, any, any> {
    const intensity = zoomConfig.intensity || 0.15
    
    switch (zoomConfig.type) {
      case 'zoomIn':
        yield* this.zoomIn(duration, intensity)
        break
      case 'zoomOut':
        yield* this.zoomOut(duration, intensity)
        break
      case 'zoomInOut':
        yield* this.zoomIn(duration * 0.6, intensity)
        yield* this.zoomOut(duration * 0.4, intensity)
        break
      case 'static':
      default:
        yield* waitFor(duration)
        break
    }
  }

  /**
   * 구조화된 설정에서 팬 애니메이션을 적용하는 함수
   */
  private *applyPanAnimationFromConfig(
    panConfig: NonNullable<ImageAnimationConfig['pan']>, 
    duration: number,
    baseY: number = -50
  ): Generator<any, any, any> {
    const panDistance = panConfig.distance || 100
    
    switch (panConfig.type) {
      case 'panLeft':
        yield* this.panLeft(duration, panDistance)
        break
      case 'panRight':
        yield* this.panRight(duration, panDistance)
        break
      case 'panUp':
        // panUp은 Y 축 이동이므로 별도 구현 필요
        const imageElement = this.imageRef()
        const backgroundElement = this.backgroundRef()
        if (imageElement && backgroundElement) {
          imageElement.y(panDistance / 2)
          backgroundElement.y(panDistance / 2)
          yield* all(
            imageElement.y(-panDistance / 2, duration, easeInOutQuad),
            backgroundElement.y(-panDistance / 2, duration, easeInOutQuad)
          )
        }
        break
      case 'panDown':
        // panDown은 Y 축 이동이므로 별도 구현 필요
        const imageEl = this.imageRef()
        const backgroundEl = this.backgroundRef()
        if (imageEl && backgroundEl) {
          imageEl.y(-panDistance / 2)
          backgroundEl.y(-panDistance / 2)
          yield* all(
            imageEl.y(panDistance / 2, duration, easeInOutQuad),
            backgroundEl.y(panDistance / 2, duration, easeInOutQuad)
          )
        }
        break
      case 'none':
      default:
        yield* waitFor(duration)
        break
    }
  }

  /**
   * 구조화된 설정에서 셔터 효과를 적용하는 함수
   */
  private *applyShutterEffectFromConfig(
    transitionConfig: NonNullable<ImageAnimationConfig['transition']>,
    duration: number,
    baseY: number = -50
  ): Generator<any, any, any> {
    switch (transitionConfig.type) {
      case 'flash':
        yield* this.flash(transitionConfig.duration || 0.3)
        yield* waitFor(duration - (transitionConfig.duration || 0.3))
        break
      case 'blink':
        yield* this.blink(transitionConfig.duration || 0.3, transitionConfig.blinkCount || 3)
        yield* waitFor(duration - (transitionConfig.duration || 0.3))
        break
      case 'fade':
        yield* this.fadeIn(duration)
        break
      case 'none':
      default:
        yield* waitFor(duration)
        break
    }
  }

  // ================================
  // 유틸리티 메서드들
  // ================================

  /**
   * 즉시 표시
   */
  public showInstant(): void {
    const imageElement = this.imageRef()
    const backgroundElement = this.backgroundRef()
    
    if (!imageElement || !backgroundElement) return
    
    imageElement.opacity(1)
    backgroundElement.opacity(this.backgroundOpacity())
    imageElement.scale(1)
    backgroundElement.scale(1)
  }

  /**
   * 숨기기
   */
  public hide(): void {
    const imageElement = this.imageRef()
    const backgroundElement = this.backgroundRef()
    
    if (!imageElement || !backgroundElement) return
    
    imageElement.opacity(0)
    backgroundElement.opacity(0)
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
    const imageElement = this.imageRef()
    const backgroundElement = this.backgroundRef()
    
    if (!imageElement || !backgroundElement) return
    
    imageElement.scale(1.0)
    imageElement.x(0)
    imageElement.y(0)
    imageElement.opacity(1)
    imageElement.filters.brightness(1)
    imageElement.filters.blur(0)
    imageElement.rotation(0)
    
    backgroundElement.scale(1.0)
    backgroundElement.x(0)
    backgroundElement.y(0)
    backgroundElement.opacity(this.backgroundOpacity())
    backgroundElement.rotation(0)
    
    this.y(this.baseY())
    this.isAnimating = false
  }
}

// ================================
// 외부 함수들 (하위 호환성을 위해 유지)
// ================================

/**
 * 애니메이션 설정에 따라 이미지의 초기 상태를 설정하는 함수
 */
export function setImageInitialState(
  imageRef: Reference<JinImage>,
  config: ImageAnimationConfig,
  baseY: number = -50
) {
  const jinImage = imageRef()
  if (jinImage) {
    jinImage['setImageInitialState'](config, baseY)
  }
}

/**
 * 이미지 애니메이션 실행 함수
 */
export function* executeImageAnimations(
  imageRef: Reference<JinImage>,
  config: ImageAnimationConfig,
  duration: number,
  baseY: number = -50
) {
  const jinImage = imageRef()
  if (jinImage) {
    yield* jinImage.playAnimation(config)
  } else {
    yield* waitFor(duration)
  }
}

/**
 * 셔터 전환 효과를 적용하는 함수 (화면 전체를 덮는 셔터)
 */
export function* applyShutterTransition(
  view: View2D,
  onTransition: () => void,
  duration: number = 1.0
) {
  const shutterDuration = duration / 3
  
  const topShutter = new Rect({
    width: '100%',
    height: '50%',
    fill: '#000000',
    x: 0,
    y: -960,
    zIndex: 1000
  })
  
  const bottomShutter = new Rect({
    width: '100%',
    height: '50%',
    fill: '#000000',
    x: 0,
    y: 960,
    zIndex: 1000
  })
  
  view.add(topShutter)
  view.add(bottomShutter)
  
  yield* all(
    topShutter.y(-480, shutterDuration),
    bottomShutter.y(480, shutterDuration)
  )
  
  onTransition()
  yield* waitFor(shutterDuration)
  
  yield* all(
    topShutter.y(-960, shutterDuration),
    bottomShutter.y(960, shutterDuration)
  )
  
  topShutter.remove()
  bottomShutter.remove()
} 