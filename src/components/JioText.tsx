import {
  Node,
  NodeProps,
  Txt,
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
} from '@revideo/core';
import { easeInOutQuad } from '@revideo/core/lib/tweening';

// 텍스트 애니메이션 타입 정의
export type TextDisplayType = 'slideIn' | 'typewriter' | 'instant';
export type SlideDirection = 'left' | 'right' | 'up' | 'down';

// Props 인터페이스 정의 - 필수 속성만 유지
export interface JioTextProps extends NodeProps {
  // 텍스트 내용
  text?: SignalValue<string>;
  
  // 기본 스타일 속성들
  fontSize?: SignalValue<number>;
  fontWeight?: SignalValue<number>;
  color?: SignalValue<string>;
  fontFamily?: SignalValue<string>;
  
  // 배경 스타일 속성들
  backgroundColor?: SignalValue<string>;
  backgroundOpacity?: SignalValue<number>;
  backgroundRadius?: SignalValue<number>;
  padding?: SignalValue<number>;
  
  // 타이프라이터 애니메이션 지속 시간
  animationDuration?: SignalValue<number>;
}

// Node를 확장하는 타이프라이터 텍스트 컴포넌트 클래스
export class JioText extends Node {
  // 데코레이터를 사용한 반응형 속성 정의
  @initial('Hello World')
  @signal()
  public declare readonly text: SimpleSignal<string, this>;

  @initial(48)
  @signal()
  public declare readonly fontSize: SimpleSignal<number, this>;

  @initial(600)
  @signal()
  public declare readonly fontWeight: SimpleSignal<number, this>;

  @initial('#ffffff')
  @signal()
  public declare readonly color: SimpleSignal<string, this>;

  @initial('Arial')
  @signal()
  public declare readonly fontFamily: SimpleSignal<string, this>;

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

  // 텍스트와 배경 레퍼런스
  private textRef: Reference<Txt> = createRef<Txt>();
  private backgroundRef: Reference<Rect> = createRef<Rect>();

  public constructor(props?: JioTextProps) {
    super({
      ...props,
    });

    // 배경과 텍스트 요소 추가
    this.add(
      <Rect
        ref={this.backgroundRef}
        fill={() => this.backgroundColor()}
        opacity={() => this.backgroundOpacity()}
        radius={() => this.backgroundRadius()}
        width={() => this.textRef()?.width() + this.padding() * 2 || 100}
        height={() => this.textRef()?.height() + this.padding() * 2 || 50}
      />
    );

    this.add(
      <Txt
        ref={this.textRef}
        text={() => this.text()}
        fontSize={() => this.fontSize()}
        fontWeight={() => this.fontWeight()}
        fill={() => this.color()}
        fontFamily={() => this.fontFamily()}
        textAlign="center"
      />
    );
  }

  // 슬라이드 인 애니메이션
  public *slideInAnimation(
    direction: SlideDirection = 'left',
    duration: number = 0.5
  ) {
    try {
      const slideDistance = 100;
      const textElement = this.textRef();
      const backgroundElement = this.backgroundRef();
      
      if (!textElement || !backgroundElement) {
        return;
      }
      
      // 텍스트 내용을 먼저 설정 (중요!)
      textElement.text(this.text());
      
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
      const originalX = textElement.x();
      const originalY = textElement.y();
      const originalBgX = backgroundElement.x();
      const originalBgY = backgroundElement.y();
      
      // 초기 상태 설정 (오프셋 위치에서 시작, 투명)
      textElement.opacity(0);
      backgroundElement.opacity(0);
      textElement.position([originalX + initialX, originalY + initialY]);
      backgroundElement.position([originalBgX + initialX, originalBgY + initialY]);
      
      // 슬라이드 인 애니메이션 (원래 위치로 이동하면서 나타남)
      yield* all(
        textElement.opacity(1, duration, easeInOutQuad),
        backgroundElement.opacity(this.backgroundOpacity(), duration, easeInOutQuad),
        textElement.position([originalX, originalY], duration, easeInOutQuad),
        backgroundElement.position([originalBgX, originalBgY], duration, easeInOutQuad)
      );
    } catch (error) {
      console.warn('Reference not yet initialized in slideInAnimation()');
      yield* waitFor(duration);
    }
  }

  // 타이프라이터 효과 애니메이션
  public *typewriterAnimation(duration?: number) {
    try {
      const animDuration = duration ?? this.animationDuration();
      const fullText = this.text();
      const textElement = this.textRef();
      const backgroundElement = this.backgroundRef();
      
      if (!textElement || !backgroundElement) {
        return;
      }
      
      // 배경 먼저 표시
      backgroundElement.opacity(this.backgroundOpacity());
      textElement.opacity(1);
      
      const charCount = fullText.length;
      const charDuration = animDuration / charCount;
      
      // 처음에는 빈 텍스트로 시작
      textElement.text('');
      
      // 한 글자씩 타이핑 효과
      for (let i = 0; i <= charCount; i++) {
        textElement.text(fullText.substring(0, i));
        yield* waitFor(charDuration);
      }
    } catch (error) {
      console.warn('Reference not yet initialized in typewriterAnimation()');
      yield* waitFor(duration ?? this.animationDuration());
    }
  }

  // 즉시 표시 애니메이션
  public *instantAnimation() {
    try {
      const textElement = this.textRef();
      const backgroundElement = this.backgroundRef();
      
      if (textElement && backgroundElement) {
        textElement.opacity(1);
        backgroundElement.opacity(this.backgroundOpacity());
      }
      yield* waitFor(0.1); // 최소 대기 시간
    } catch (error) {
      console.warn('Reference not yet initialized in instantAnimation()');
      yield* waitFor(0.1);
    }
  }

  // 텍스트 변경과 함께 타이프라이터 애니메이션 실행
  public *changeTextWithAnimation(newText: string, duration?: number) {
    // 새 텍스트 설정
    this.text(newText);
    
    // 타이프라이터 애니메이션 실행
    yield* this.typewriterAnimation(duration);
  }

  // 텍스트 즉시 표시 (애니메이션 없이)
  public showInstant() {
    try {
      const textElement = this.textRef();
      const backgroundElement = this.backgroundRef();
      if (textElement && backgroundElement) {
        textElement.text(this.text());
        textElement.opacity(1);
        backgroundElement.opacity(this.backgroundOpacity());
      }
    } catch (error) {
      console.warn('Reference not yet initialized in showInstant()');
    }
  }

  // 텍스트 숨기기
  public hide() {
    try {
      const textElement = this.textRef();
      const backgroundElement = this.backgroundRef();
      if (textElement && backgroundElement) {
        textElement.text('');
        textElement.opacity(0);
        backgroundElement.opacity(0);
      }
    } catch (error) {
      console.warn('Reference not yet initialized in hide()');
    }
  }

  // 페이드 인 애니메이션
  public *fadeInAnimation(duration: number = 1.0) {
    try {
      const textElement = this.textRef();
      const backgroundElement = this.backgroundRef();
      
      if (!textElement || !backgroundElement) {
        return;
      }
      
      // 텍스트 내용을 먼저 설정
      textElement.text(this.text());
      
      // 초기 상태: 완전 투명
      textElement.opacity(0);
      backgroundElement.opacity(0);
      
      // 페이드 인 애니메이션
      yield* all(
        textElement.opacity(1, duration, easeInOutQuad),
        backgroundElement.opacity(this.backgroundOpacity(), duration, easeInOutQuad)
      );
    } catch (error) {
      console.warn('Reference not yet initialized in fadeInAnimation()');
      yield* waitFor(duration);
    }
  }

  // 페이드 아웃 애니메이션
  public *fadeOutAnimation(duration: number = 1.0) {
    try {
      const textElement = this.textRef();
      const backgroundElement = this.backgroundRef();
      
      if (!textElement || !backgroundElement) {
        return;
      }
      
      // 페이드 아웃 애니메이션
      yield* all(
        textElement.opacity(0, duration, easeInOutQuad),
        backgroundElement.opacity(0, duration, easeInOutQuad)
      );
    } catch (error) {
      console.warn('Reference not yet initialized in fadeOutAnimation()');
      yield* waitFor(duration);
    }
  }

  // 페이드 인 → 대기 → 페이드 아웃 조합 애니메이션
  public *fadeInOutAnimation(
    fadeInDuration: number = 1.0,
    holdDuration: number = 2.0,
    fadeOutDuration: number = 1.0
  ) {
    // 페이드 인
    yield* this.fadeInAnimation(fadeInDuration);
    
    // 대기
    yield* waitFor(holdDuration);
    
    // 페이드 아웃
    yield* this.fadeOutAnimation(fadeOutDuration);
  }
} 