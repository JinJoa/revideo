import {
  Node,
  NodeProps,
  Img,
  Rect,
  initial,
  signal,
} from '@revideo/2d';
import {
  SignalValue,
  SimpleSignal,
  Reference,
  createRef,
  waitFor,
  tween,
  all,
  createSignal,
} from '@revideo/core';
import { easeInOutQuad, easeInOutCubic } from '@revideo/core/lib/tweening';

// 이미지 애니메이션 타입 정의
export type ImageDisplayType = 'slideIn' | 'fadeIn' | 'scaleIn' | 'instant';
export type SlideDirection = 'left' | 'right' | 'up' | 'down';

// Props 인터페이스 정의
export interface JioImageProps extends NodeProps {
  // 이미지 경로
  src?: SignalValue<string>;
  
  // 기본 크기 속성들
  width?: SignalValue<number>;
  height?: SignalValue<number>;
  
  // 비율 유지 옵션
  maintainAspectRatio?: SignalValue<boolean>;
  
  // 배경 스타일 속성들
  backgroundColor?: SignalValue<string>;
  backgroundOpacity?: SignalValue<number>;
  backgroundRadius?: SignalValue<number>;
  padding?: SignalValue<number>;
  
  // 애니메이션 지속 시간
  animationDuration?: SignalValue<number>;
}

// Node를 확장하는 이미지 컴포넌트 클래스
export class JioImage extends Node {
  // 데코레이터를 사용한 반응형 속성 정의
  @initial('')
  @signal()
  public declare readonly src: SimpleSignal<string, this>;

  @initial(1000)
  @signal()
  public declare readonly height: SimpleSignal<number, this>;

  @initial(true)
  @signal()
  public declare readonly maintainAspectRatio: SimpleSignal<boolean, this>;

  @initial('#333333')
  @signal()
  public declare readonly backgroundColor: SimpleSignal<string, this>;

  @initial(0.8)
  @signal()
  public declare readonly backgroundOpacity: SimpleSignal<number, this>;

  @initial(10)
  @signal()
  public declare readonly backgroundRadius: SimpleSignal<number, this>;

  @initial(20)
  @signal()
  public declare readonly padding: SimpleSignal<number, this>;

  @initial(1.0)
  @signal()
  public declare readonly animationDuration: SimpleSignal<number, this>;

  // 이미지와 배경 레퍼런스
  private imageRef: Reference<Img> = createRef<Img>();
  private backgroundRef: Reference<Rect> = createRef<Rect>();
  
  // 계산된 너비를 위한 시그널
  private calculatedWidth = createSignal(400);

  public constructor(props?: JioImageProps) {
    super({
      ...props,
    });

    // 배경과 이미지 요소 추가
    this.add(
      <Rect
        ref={this.backgroundRef}
        fill={() => this.backgroundColor()}
        opacity={() => this.backgroundOpacity()}
        radius={() => this.backgroundRadius()}
        width={() => this.getDisplayWidth() + this.padding() * 2}
        height={() => this.height() + this.padding() * 2}
      />
    );

    this.add(
      <Img
        ref={this.imageRef}
        src={() => this.src()}
        size={() => [this.getDisplayWidth(), this.height()]}
      />
    );
  }

  // 표시할 너비를 계산하는 메서드
  private getDisplayWidth(): number {
    if (!this.maintainAspectRatio()) {
      return this.calculatedWidth();
    }

    try {
      const imageElement = this.imageRef();
      if (!imageElement) {
        return this.calculatedWidth();
      }

      const naturalSize = imageElement.naturalSize();
      if (naturalSize.width === 0 || naturalSize.height === 0) {
        return this.calculatedWidth();
      }

      // 원본 비율을 계산하여 너비 결정
      const aspectRatio = naturalSize.width / naturalSize.height;
      const calculatedWidth = this.height() * aspectRatio;
      
      this.calculatedWidth(calculatedWidth);
      return calculatedWidth;
    } catch (error) {
      return this.calculatedWidth();
    }
  }

  // 수동으로 너비를 설정하는 메서드 (비율 유지를 해제할 때 사용)
  public setWidth(width: number) {
    this.maintainAspectRatio(false);
    this.calculatedWidth(width);
  }

  // 현재 표시되는 너비를 가져오는 메서드
  public getWidth(): number {
    return this.getDisplayWidth();
  }

  // 슬라이드 인 애니메이션
  public *slideInAnimation(
    direction: SlideDirection = 'left',
    duration: number = 0.5
  ) {
    try {
      const slideDistance = 100;
      const imageElement = this.imageRef();
      const backgroundElement = this.backgroundRef();
      
      if (!imageElement || !backgroundElement) {
        return;
      }
      
      // 초기 위치 설정
      let initialX = 0;
      let initialY = 0;
      
      switch (direction) {
        case 'left':
          initialX = -slideDistance;
          break;
        case 'right':
          initialX = slideDistance;
          break;
        case 'up':
          initialY = -slideDistance;
          break;
        case 'down':
          initialY = slideDistance;
          break;
      }
      
      // 현재 위치 저장
      const originalX = imageElement.x();
      const originalY = imageElement.y();
      const originalBgX = backgroundElement.x();
      const originalBgY = backgroundElement.y();
      
      // 초기 상태 설정 (오프셋 위치에서 시작, 투명)
      imageElement.opacity(0);
      backgroundElement.opacity(0);
      imageElement.position([originalX + initialX, originalY + initialY]);
      backgroundElement.position([originalBgX + initialX, originalBgY + initialY]);
      
      // 슬라이드 인 애니메이션 (원래 위치로 이동하면서 나타남)
      yield* all(
        imageElement.opacity(1, duration, easeInOutQuad),
        backgroundElement.opacity(this.backgroundOpacity(), duration, easeInOutQuad),
        imageElement.position([originalX, originalY], duration, easeInOutQuad),
        backgroundElement.position([originalBgX, originalBgY], duration, easeInOutQuad)
      );
    } catch (error) {
      console.warn('Reference not yet initialized in slideInAnimation()');
      yield* waitFor(duration);
    }
  }

  // 페이드 인 애니메이션
  public *fadeInAnimation(duration: number = 1.0) {
    try {
      const imageElement = this.imageRef();
      const backgroundElement = this.backgroundRef();
      
      if (!imageElement || !backgroundElement) {
        return;
      }
      
      // 초기 상태: 투명
      imageElement.opacity(0);
      backgroundElement.opacity(0);
      
      // 페이드 인 애니메이션
      yield* all(
        imageElement.opacity(1, duration, easeInOutQuad),
        backgroundElement.opacity(this.backgroundOpacity(), duration, easeInOutQuad)
      );
    } catch (error) {
      console.warn('Reference not yet initialized in fadeInAnimation()');
      yield* waitFor(duration);
    }
  }

  // 스케일 인 애니메이션
  public *scaleInAnimation(duration: number = 0.5) {
    try {
      const imageElement = this.imageRef();
      const backgroundElement = this.backgroundRef();
      
      if (!imageElement || !backgroundElement) {
        return;
      }
      
      // 초기 상태: 작은 크기에서 시작, 투명
      imageElement.opacity(0);
      backgroundElement.opacity(0);
      imageElement.scale(0.3);
      backgroundElement.scale(0.3);
      
      // 스케일 인 애니메이션
      yield* all(
        imageElement.opacity(1, duration, easeInOutCubic),
        backgroundElement.opacity(this.backgroundOpacity(), duration, easeInOutCubic),
        imageElement.scale(1, duration, easeInOutCubic),
        backgroundElement.scale(1, duration, easeInOutCubic)
      );
    } catch (error) {
      console.warn('Reference not yet initialized in scaleInAnimation()');
      yield* waitFor(duration);
    }
  }

  // 즉시 표시
  public *instantAnimation() {
    try {
      const imageElement = this.imageRef();
      const backgroundElement = this.backgroundRef();
      
      if (!imageElement || !backgroundElement) {
        return;
      }
      
      imageElement.opacity(1);
      backgroundElement.opacity(this.backgroundOpacity());
    } catch (error) {
      console.warn('Reference not yet initialized in instantAnimation()');
    }
  }

  // 이미지 변경 애니메이션
  public *changeImageWithAnimation(newSrc: string, duration?: number) {
    const animDuration = duration ?? this.animationDuration();
    
    yield* this.fadeOutAnimation(animDuration / 2);
    this.src(newSrc);
    yield* this.fadeInAnimation(animDuration / 2);
  }

  // 즉시 표시 (제너레이터 함수가 아닌 버전)
  public showInstant() {
    try {
      const imageElement = this.imageRef();
      const backgroundElement = this.backgroundRef();
      
      if (!imageElement || !backgroundElement) {
        return;
      }
      
      imageElement.opacity(1);
      backgroundElement.opacity(this.backgroundOpacity());
      imageElement.scale(1);
      backgroundElement.scale(1);
    } catch (error) {
      console.warn('Reference not yet initialized in showInstant()');
    }
  }

  // 숨기기
  public hide() {
    try {
      const imageElement = this.imageRef();
      const backgroundElement = this.backgroundRef();
      
      if (!imageElement || !backgroundElement) {
        return;
      }
      
      imageElement.opacity(0);
      backgroundElement.opacity(0);
    } catch (error) {
      console.warn('Reference not yet initialized in hide()');
    }
  }

  // 페이드 아웃 애니메이션
  public *fadeOutAnimation(duration: number = 1.0) {
    try {
      const imageElement = this.imageRef();
      const backgroundElement = this.backgroundRef();
      
      if (!imageElement || !backgroundElement) {
        return;
      }
      
      yield* all(
        imageElement.opacity(0, duration, easeInOutQuad),
        backgroundElement.opacity(0, duration, easeInOutQuad)
      );
    } catch (error) {
      console.warn('Reference not yet initialized in fadeOutAnimation()');
      yield* waitFor(duration);
    }
  }

  // 페이드 인-아웃 애니메이션
  public *fadeInOutAnimation(
    fadeInDuration: number = 1.0,
    holdDuration: number = 2.0,
    fadeOutDuration: number = 1.0
  ) {
    yield* this.fadeInAnimation(fadeInDuration);
    yield* waitFor(holdDuration);
    yield* this.fadeOutAnimation(fadeOutDuration);
  }

  // 스케일 아웃 애니메이션
  public *scaleOutAnimation(duration: number = 0.5) {
    try {
      const imageElement = this.imageRef();
      const backgroundElement = this.backgroundRef();
      
      if (!imageElement || !backgroundElement) {
        return;
      }
      
      yield* all(
        imageElement.opacity(0, duration, easeInOutCubic),
        backgroundElement.opacity(0, duration, easeInOutCubic),
        imageElement.scale(0.3, duration, easeInOutCubic),
        backgroundElement.scale(0.3, duration, easeInOutCubic)
      );
    } catch (error) {
      console.warn('Reference not yet initialized in scaleOutAnimation()');
      yield* waitFor(duration);
    }
  }

  // 회전 애니메이션
  public *rotateAnimation(degrees: number = 360, duration: number = 1.0) {
    try {
      const imageElement = this.imageRef();
      const backgroundElement = this.backgroundRef();
      
      if (!imageElement || !backgroundElement) {
        return;
      }
      
      yield* all(
        imageElement.rotation(degrees, duration, easeInOutQuad),
        backgroundElement.rotation(degrees, duration, easeInOutQuad)
      );
    } catch (error) {
      console.warn('Reference not yet initialized in rotateAnimation()');
      yield* waitFor(duration);
    }
  }

  // 크기 변경 애니메이션
  public *resizeAnimation(
    newHeight: number,
    duration: number = 0.5,
    maintainRatio: boolean = true
  ) {
    if (maintainRatio) {
      // 비율을 유지하면서 높이만 변경
      this.maintainAspectRatio(true);
      yield* this.height(newHeight, duration, easeInOutQuad);
    } else {
      // 비율을 유지하지 않고 너비와 높이 모두 변경 (너비도 제공되어야 함)
      this.maintainAspectRatio(false);
      yield* this.height(newHeight, duration, easeInOutQuad);
    }
  }
  
  // 너비와 높이를 모두 변경하는 애니메이션 (비율 무시)
  public *resizeToExactSize(
    newWidth: number,
    newHeight: number,
    duration: number = 0.5
  ) {
    this.maintainAspectRatio(false);
    this.calculatedWidth(newWidth);
    yield* this.height(newHeight, duration, easeInOutQuad);
  }
} 