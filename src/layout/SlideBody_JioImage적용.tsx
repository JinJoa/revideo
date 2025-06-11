import { Rect, RectProps, View2D, Txt, Audio, Layout } from '@revideo/2d'
import { createRef, waitFor, all, Reference, ThreadGenerator } from '@revideo/core'

// executeImageAnimations는 이제 JinImage에서 직접 사용
import { StructuredSlide } from '../types/slide'
import { JioImage, JioImageProps } from '../components/JioImage'
import { ImageAnimationConfig } from '../components/JinImage'

export interface SlideBodyProps extends RectProps {
  slides: StructuredSlide[]
  view: View2D
  imageContainer?: Reference<Layout>
}

export class SlideBody extends Rect {
  private imageRef = createRef<JioImage>();
  private slides: StructuredSlide[];
  private sceneView: View2D;
  private imageContainer?: Reference<Layout>;

  public constructor(props: SlideBodyProps) {
    super(props);
    
    this.slides = props.slides;
    this.sceneView = props.view;
    this.imageContainer = props.imageContainer;

    // 첫 번째 슬라이드의 지속시간을 애니메이션 지속시간으로 사용
    const animationDuration = this.slides[0]?.timing?.duration || 3;

    // 첫 번째 이미지 추가 - imageContainer가 있으면 그곳에, 없으면 view에 추가
    if (this.imageContainer) {
      this.imageContainer().add(
        <Rect
          fill="#00000000"
          width={700}
          height={1000}
          layout
          justifyContent={'center'}
          alignItems={'center'}
          x={0}
          y={0}
        >
          <JioImage
            ref={this.imageRef}
            src={this.slides[0].content.image}
            // 이미지 크기 설정 (Node 기반으로 width/height 사용)
            width={700}
            height={1000}
            maintainAspectRatio={true}
            padding={20}
            // 중앙 정렬을 위해 x, y 값을 명시적으로 0으로 설정
            x={0}
            y={0}
          />
        </Rect>
      );
    } else {
      this.sceneView.add(
        <Rect
          fill="#00000000"
          width={800}
          height={600}
          layout
          justifyContent={'center'}
          alignItems={'center'}
          x={0}
          y={0}
        >
          <JioImage
            ref={this.imageRef}
            src={this.slides[0].content.image}
            // 이미지 크기 설정 (Node 기반으로 width/height 사용)
            width={800}
            height={600}
            maintainAspectRatio={true}
            x={0}
            y={0}
            animationDuration={animationDuration}
          />
        </Rect>
      );
    }
  }

  /**
   * 모든 슬라이드를 순차적으로 재생하는 메서드
   */
  public *playSlides(): ThreadGenerator {
    // Loop through each slide
    for (let i = 0; i < this.slides.length; i++) {
      console.log(`Processing slide ${i + 1}/${this.slides.length}, duration: ${this.slides[i].timing?.duration || 3}s`)

      // Skip the first slide since it's already set up
      if (i > 0) {
        // Change to the next image
        this.imageRef().src(this.slides[i].content.image)
        // 애니메이션 지속시간을 현재 슬라이드 지속시간에 맞춤
        this.imageRef().animationDuration(this.slides[i].timing?.duration || 3)
      }

      // Execute image animations for the exact slide duration - no additional waiting
      const slideDuration = this.slides[i].timing?.duration || 3;
      
      if (this.slides[i].animations?.image) {
        // 애니메이션을 슬라이드 지속시간 동안 실행
        // JioImage는 playAnimation 메서드가 없으므로 fadeInAnimation 사용
        yield* this.imageRef().fadeInAnimation(slideDuration);
      } else {
        // Default animation if none specified - run for exact slide duration
        yield* this.imageRef().instantAnimation();
      }
      
      // No additional waitFor here - the animation should take exactly slideDuration
    }
    
    console.log('All slides completed');
  }

  /**
   * 이미지 참조를 가져오는 메서드
   */
  public getImageRef(): Reference<JioImage> {
    return this.imageRef;
  }

  /**
   * 이미지 애니메이션 설정을 업데이트하는 메서드
   */
  public updateAnimationConfig(index: number, config: ImageAnimationConfig): void {
    if (index >= 0 && index < this.slides.length && this.slides[index].animations) {
      this.slides[index].animations.image = config;
    }
  }

  /**
   * 이미지를 숨기는 메서드
   */
  public hide(): void {
    this.imageRef().hide();
  }

  /**
   * 이미지를 표시하는 메서드
   */
  public show(): void {
    this.imageRef().showInstant();
  }
}

/**
 * SlideBody 인스턴스를 생성하는 팩토리 함수
 * (기존 코드와의 호환성을 위해 유지)
 */
export function createSlideBody(props: SlideBodyProps): { imageRef: Reference<JioImage>; playSlides: () => ThreadGenerator } {
  const slideBody = new SlideBody(props);
  
  return {
    imageRef: slideBody.getImageRef(),
    playSlides: slideBody.playSlides.bind(slideBody)
  };
}

/**
 * 이미지 표시 클래스
 */
export class ImageDisplay extends Rect {
  private imageContainer: Reference<Layout>;
  private images: string[];
  private duration: number;

  public constructor(props: RectProps & {
    imageContainer: Reference<Layout>;
    images: string[];
    duration: number;
  }) {
    super(props);
    
    this.imageContainer = props.imageContainer;
    this.images = props.images;
    this.duration = props.duration;
  }

  /**
   * 이미지를 순차적으로 표시하는 메서드
   */
  public *displayImages(): ThreadGenerator {
    // 각 이미지에 대해 순차적으로 표시
    for (let i = 0; i < this.images.length; i++) {
      const imageRef = createRef<JioImage>();
      
      console.log(`이미지 추가 시도: ${this.images[i]}`);
      
      // 이미지를 이미지 컨테이너에 추가
      this.imageContainer().add(
        <Rect
          fill="#00000000"
          width={700}
          height={1000}
          layout
          justifyContent={'center'}
          alignItems={'center'}
          x={0}
          y={0}
        >
          <JioImage
            ref={imageRef}
            src={this.images[i]}
            width={700} // 컨테이너 가로폭 설정
            height={1000}
            maintainAspectRatio={true}
            // 중앙 정렬을 위해 x, y 값을 명시적으로 0으로 설정
            x={0}
            y={0}
            animationDuration={0.5}
          />
        </Rect>
      );
      
      // 이미지를 먼저 숨긴 상태로 설정
      imageRef().hide();
      
      // 간단한 페이드인 애니메이션
      yield* imageRef().fadeInAnimation(0.5);
      
      // 이미지 표시 시간
      const slideDuration = this.duration / this.images.length;
      yield* waitFor(slideDuration - 1.0); // 페이드 시간 고려
      
      // 페이드아웃 애니메이션
      yield* imageRef().fadeOutAnimation(0.5);
      
      // 이미지 제거
      imageRef().remove();
    }
  }
}

/**
 * 간단한 이미지 슬라이드쇼 표시 함수
 * (기존 코드와의 호환성을 위해 유지)
 */
export function* displayImages({ imageContainer, images, duration }: {
  imageContainer: Reference<Layout>;
  images: string[];
  duration: number;
}): ThreadGenerator {
  const imageDisplay = new ImageDisplay({
    imageContainer,
    images,
    duration
  });
  
  yield* imageDisplay.displayImages();
}
